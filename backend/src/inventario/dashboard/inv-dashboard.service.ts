import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(empresaId: number) {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const hace30Dias = new Date(ahora);
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const [
      totalProductos,
      totalBodegas,
      totalProveedores,
      movimientosDelMes,
      stocks,
      ocResumen,
      movimientosPorTipo,
      ultimosMovimientos,
    ] = await Promise.all([
      (this.prisma as any).producto.count({ where: { empresaId, activo: true } }),
      (this.prisma as any).bodega.count({ where: { empresaId, activo: true } }),
      (this.prisma as any).proveedor.count({ where: { empresaId, activo: true } }),
      (this.prisma as any).movimientoInventario.count({
        where: { empresaId, fechaMovimiento: { gte: inicioMes } },
      }),
      (this.prisma as any).stock.findMany({
        where: { empresaId },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              sku: true,
              costoPromedio: true,
              puntoReorden: true,
              claseAbc: true,
            },
          },
          bodega: { select: { id: true, nombre: true, codigo: true } },
        },
      }),
      (this.prisma as any).ordenCompra.groupBy({
        by: ['estado'],
        where: { empresaId },
        _count: { id: true },
      }),
      (this.prisma as any).movimientoInventario.groupBy({
        by: ['tipo'],
        where: { empresaId, fechaMovimiento: { gte: hace30Dias } },
        _count: { id: true },
        _sum: { costoTotal: true },
      }),
      (this.prisma as any).movimientoInventario.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          producto: { select: { nombre: true, sku: true } },
          bodegaOrigen: { select: { nombre: true } },
          bodegaDestino: { select: { nombre: true } },
        },
      }),
    ]);

    // ── Valor total inventario ─────────────────────────────────────────────
    const valorTotal = stocks.reduce((acc: number, s: any) => {
      return acc + parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio);
    }, 0);

    // ── Alertas ────────────────────────────────────────────────────────────
    const productosAlertas = stocks.filter((s: any) => {
      const disponible = parseFloat(s.cantidad) - parseFloat(s.cantidadReservada ?? 0);
      return disponible <= parseFloat(s.producto.puntoReorden);
    }).length;

    // ── Top 5 por valor ────────────────────────────────────────────────────
    const topProductos = stocks
      .map((s: any) => ({
        productoId: s.productoId,
        nombre: s.producto.nombre,
        sku: s.producto.sku,
        cantidad: parseFloat(s.cantidad),
        valor: parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio),
        claseAbc: s.producto.claseAbc,
      }))
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 5);

    // ── Alertas críticas (stock = 0 o negativo) ────────────────────────────
    const alertasCriticas = stocks
      .filter((s: any) => parseFloat(s.cantidad) <= 0)
      .slice(0, 5);

    // ── Distribución ABC ───────────────────────────────────────────────────
    const claseAbcDistribucion = { A: 0, B: 0, C: 0, sinClase: 0 };
    stocks.forEach((s: any) => {
      const clase = s.producto.claseAbc;
      if (clase === 'A') claseAbcDistribucion.A++;
      else if (clase === 'B') claseAbcDistribucion.B++;
      else if (clase === 'C') claseAbcDistribucion.C++;
      else claseAbcDistribucion.sinClase++;
    });

    // ── OC por estado ──────────────────────────────────────────────────────
    const ocPorEstado: Record<string, number> = {
      BORRADOR: 0, APROBADA: 0, RECIBIDA_PARCIAL: 0, RECIBIDA: 0, ANULADA: 0,
    };
    ocResumen.forEach((r: any) => { ocPorEstado[r.estado] = r._count.id; });

    // ── Movimientos por tipo (últimos 30 días) ─────────────────────────────
    const movsPorTipo = movimientosPorTipo.map((m: any) => ({
      tipo: m.tipo,
      cantidad: m._count.id,
      total: parseFloat(m._sum.costoTotal ?? 0),
    }));

    return {
      // KPIs base
      totalProductos,
      totalBodegas,
      totalProveedores,
      movimientosDelMes,
      valorTotal,
      productosAlertas,
      // Listas
      topProductos,
      alertasCriticas,
      ultimosMovimientos,
      // Análisis
      claseAbcDistribucion,
      ocPorEstado,
      movimientosPorTipo: movsPorTipo,
    };
  }
}
