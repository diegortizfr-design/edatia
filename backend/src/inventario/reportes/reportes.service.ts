import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Reporte de stock valorado — todos los productos con existencias */
  async getReporteStock(empresaId: number) {
    const stocks = await (this.prisma as any).stock.findMany({
      where: { empresaId },
      include: {
        producto: {
          include: {
            categoria: { select: { nombre: true } },
            marca: { select: { nombre: true } },
            unidadMedida: { select: { abreviatura: true } },
          },
        },
        bodega: { select: { nombre: true, codigo: true } },
      },
      orderBy: [{ producto: { nombre: 'asc' } }, { bodega: { nombre: 'asc' } }],
    });

    const rows = stocks.map((s: any) => {
      const cantidad = parseFloat(s.cantidad);
      const reservada = parseFloat(s.cantidadReservada ?? 0);
      const disponible = cantidad - reservada;
      const costo = parseFloat(s.producto.costoPromedio);
      return {
        sku: s.producto.sku,
        nombre: s.producto.nombre,
        categoria: s.producto.categoria?.nombre ?? '—',
        marca: s.producto.marca?.nombre ?? '—',
        unidad: s.producto.unidadMedida?.abreviatura ?? '—',
        bodega: s.bodega.nombre,
        codigoBodega: s.bodega.codigo,
        cantidad,
        cantidadReservada: reservada,
        disponible,
        costoPromedio: costo,
        valorTotal: disponible * costo,
        puntoReorden: parseFloat(s.producto.puntoReorden),
        claseAbc: s.producto.claseAbc ?? '—',
        alerta: disponible <= parseFloat(s.producto.puntoReorden) ? (cantidad <= 0 ? 'CRITICO' : 'BAJO') : 'OK',
      };
    });

    const resumen = {
      totalRegistros: rows.length,
      valorTotalInventario: rows.reduce((a: number, r: any) => a + r.valorTotal, 0),
      productosEnAlerta: rows.filter((r: any) => r.alerta !== 'OK').length,
      productosCriticos: rows.filter((r: any) => r.alerta === 'CRITICO').length,
    };

    return { resumen, filas: rows };
  }

  /** Reporte de movimientos por rango de fechas */
  async getReporteMovimientos(
    empresaId: number,
    params: { desde?: string; hasta?: string; tipo?: string; bodegaId?: number },
  ) {
    const where: any = { empresaId };

    if (params.desde || params.hasta) {
      where.fechaMovimiento = {};
      if (params.desde) where.fechaMovimiento.gte = new Date(params.desde);
      if (params.hasta) {
        const hasta = new Date(params.hasta);
        hasta.setHours(23, 59, 59, 999);
        where.fechaMovimiento.lte = hasta;
      }
    }
    if (params.tipo) where.tipo = params.tipo;
    if (params.bodegaId) {
      where.OR = [
        { bodegaOrigenId: params.bodegaId },
        { bodegaDestinoId: params.bodegaId },
      ];
    }

    const movimientos = await (this.prisma as any).movimientoInventario.findMany({
      where,
      include: {
        producto: { select: { nombre: true, sku: true } },
        bodegaOrigen: { select: { nombre: true, codigo: true } },
        bodegaDestino: { select: { nombre: true, codigo: true } },
      },
      orderBy: { fechaMovimiento: 'desc' },
    });

    const filas = movimientos.map((m: any) => ({
      numero: m.numero,
      fecha: m.fechaMovimiento,
      tipo: m.tipo,
      concepto: m.concepto,
      sku: m.producto.sku,
      producto: m.producto.nombre,
      bodegaOrigen: m.bodegaOrigen?.nombre ?? '—',
      bodegaDestino: m.bodegaDestino?.nombre ?? '—',
      cantidad: parseFloat(m.cantidad),
      costoUnitario: parseFloat(m.costoUnitario),
      costoTotal: parseFloat(m.costoTotal),
      saldoCantidad: parseFloat(m.saldoCantidad),
      saldoCpp: parseFloat(m.saldoCpp),
      saldoCostoTotal: parseFloat(m.saldoCostoTotal),
    }));

    // Totales por tipo
    const totalesPorTipo: Record<string, { cantidad: number; costoTotal: number }> = {};
    filas.forEach((f: any) => {
      if (!totalesPorTipo[f.tipo]) totalesPorTipo[f.tipo] = { cantidad: 0, costoTotal: 0 };
      totalesPorTipo[f.tipo].cantidad += f.cantidad;
      totalesPorTipo[f.tipo].costoTotal += f.costoTotal;
    });

    return {
      resumen: {
        totalMovimientos: filas.length,
        totalesPorTipo,
      },
      filas,
    };
  }

  /** Reporte clasificación ABC */
  async getReporteAbc(empresaId: number) {
    const stocks = await (this.prisma as any).stock.findMany({
      where: { empresaId },
      include: {
        producto: {
          select: {
            id: true, sku: true, nombre: true, costoPromedio: true,
            claseAbc: true, diasRotacion: true,
            categoria: { select: { nombre: true } },
          },
        },
      },
    });

    const items = stocks.map((s: any) => ({
      id: s.producto.id,
      sku: s.producto.sku,
      nombre: s.producto.nombre,
      categoria: s.producto.categoria?.nombre ?? '—',
      cantidad: parseFloat(s.cantidad),
      costoPromedio: parseFloat(s.producto.costoPromedio),
      valorInventario: parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio),
      claseAbc: s.producto.claseAbc ?? '—',
      diasRotacion: s.producto.diasRotacion ?? 0,
    })).sort((a: any, b: any) => b.valorInventario - a.valorInventario);

    const valorTotal = items.reduce((a: number, i: any) => a + i.valorInventario, 0);
    let acumulado = 0;
    const filas = items.map((item: any) => {
      acumulado += item.valorInventario;
      const pctAcumulado = valorTotal > 0 ? (acumulado / valorTotal) * 100 : 0;
      return { ...item, pctDelTotal: valorTotal > 0 ? (item.valorInventario / valorTotal) * 100 : 0, pctAcumulado };
    });

    const distribucion = {
      A: filas.filter((f: any) => f.claseAbc === 'A').length,
      B: filas.filter((f: any) => f.claseAbc === 'B').length,
      C: filas.filter((f: any) => f.claseAbc === 'C').length,
      sinClase: filas.filter((f: any) => f.claseAbc === '—').length,
    };

    return { valorTotal, distribucion, filas };
  }
}
