import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stock general con filtros — para tabla de inventario actual */
  async findAll(empresaId: number, filters?: { bodegaId?: number; categoriaId?: number; soloAlertas?: boolean }) {
    const where: any = { empresaId };
    if (filters?.bodegaId) where.bodegaId = filters.bodegaId;

    const stock = await (this.prisma as any).stock.findMany({
      where,
      include: {
        producto: {
          include: {
            categoria: { select: { id: true, nombre: true } },
            marca: { select: { id: true, nombre: true } },
            unidadMedida: { select: { abreviatura: true } },
          },
        },
        bodega: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: { producto: { nombre: 'asc' } },
    });

    if (filters?.soloAlertas) {
      return stock.filter((s: any) => {
        const disponible = parseFloat(s.cantidad) - parseFloat(s.cantidadReservada);
        return disponible <= parseFloat(s.producto.puntoReorden);
      });
    }

    return stock;
  }

  /** Stock de un producto en todas sus bodegas */
  async findByProducto(productoId: number, empresaId: number) {
    return (this.prisma as any).stock.findMany({
      where: { productoId, empresaId },
      include: { bodega: true },
    });
  }

  /** Valoración total del inventario de la empresa */
  async getValoracion(empresaId: number) {
    const stocks = await (this.prisma as any).stock.findMany({
      where: { empresaId },
      include: { producto: { select: { costoPromedio: true, nombre: true } } },
    });

    const total = stocks.reduce((acc: number, s: any) => {
      return acc + parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio);
    }, 0);

    return { valorTotal: total, cantidadRegistros: stocks.length };
  }

  /** Alertas: productos en o debajo del punto de reorden */
  async getAlertas(empresaId: number) {
    const stocks = await (this.prisma as any).stock.findMany({
      where: { empresaId },
      include: {
        producto: {
          select: { id: true, nombre: true, sku: true, puntoReorden: true, stockMinimo: true, costoPromedio: true },
        },
        bodega: { select: { id: true, nombre: true, codigo: true } },
      },
    });

    return stocks
      .filter((s: any) => {
        const disponible = parseFloat(s.cantidad) - parseFloat(s.cantidadReservada ?? 0);
        return disponible <= parseFloat(s.producto.puntoReorden);
      })
      .map((s: any) => ({
        ...s,
        disponible: parseFloat(s.cantidad) - parseFloat(s.cantidadReservada ?? 0),
        nivelAlerta: parseFloat(s.cantidad) <= 0 ? 'CRITICO' : 'BAJO',
      }))
      .sort((a: any, b: any) => a.disponible - b.disponible);
  }

  /** Acomodar o vincular producto a una bodega con ubicación física opcional y stock inicial */
  async acomodarProducto(
    empresaId: number,
    usuarioId: number,
    dto: {
      productoId: number;
      bodegaId: number;
      ubicacion1?: string;
      ubicacion2?: string;
      cantidadInicial?: number;
      costoUnitario?: number;
      notas?: string;
    },
  ) {
    // 1. Validar producto y bodega
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: dto.productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const bodega = await (this.prisma as any).bodega.findFirst({
      where: { id: dto.bodegaId, empresaId },
    });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    // 2. Si se suministran ubicaciones físicas, actualizar en el producto
    if (dto.ubicacion1 !== undefined || dto.ubicacion2 !== undefined) {
      await (this.prisma as any).producto.update({
        where: { id: dto.productoId },
        data: {
          ...(dto.ubicacion1 !== undefined ? { ubicacion1: dto.ubicacion1 } : {}),
          ...(dto.ubicacion2 !== undefined ? { ubicacion2: dto.ubicacion2 } : {}),
        },
      });
    }

    // 3. Obtener o crear el registro en Stock
    let stockItem = await (this.prisma as any).stock.findUnique({
      where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
    });

    const cantidadAIngresar = dto.cantidadInicial && dto.cantidadInicial > 0 ? Number(dto.cantidadInicial) : 0;

    if (!stockItem) {
      stockItem = await (this.prisma as any).stock.create({
        data: {
          empresaId,
          productoId: dto.productoId,
          bodegaId: dto.bodegaId,
          cantidad: cantidadAIngresar,
          cantidadReservada: 0,
        },
      });
    } else if (cantidadAIngresar > 0) {
      stockItem = await (this.prisma as any).stock.update({
        where: { id: stockItem.id },
        data: {
          cantidad: { increment: cantidadAIngresar },
        },
      });
    }

    // 4. Si se ingresó cantidad > 0, registrar el movimiento de inventario para trazabilidad de Kardex
    if (cantidadAIngresar > 0) {
      const costo = dto.costoUnitario ?? Number(producto.costoPromedio) ?? 0;
      const numero = `AC-${Date.now().toString().slice(-6)}`;
      await (this.prisma as any).movimientoInventario.create({
        data: {
          empresaId,
          numero,
          tipo: 'ENTRADA',
          concepto: 'APERTURA',
          productoId: dto.productoId,
          bodegaDestinoId: dto.bodegaId,
          cantidad: cantidadAIngresar,
          costoUnitario: costo,
          costoTotal: cantidadAIngresar * costo,
          saldoCantidad: Number(stockItem.cantidad),
          saldoCostoTotal: Number(stockItem.cantidad) * costo,
          saldoCpp: costo,
          usuarioId,
          notas: dto.notas || `Acomodo inicial en ${bodega.nombre}${dto.ubicacion1 ? ` (Ubicación: ${dto.ubicacion1})` : ''}`,
          referenciaTipo: 'AcomodoBodega',
        },
      });
    }

    return {
      mensaje: 'Producto acomodado correctamente en la bodega',
      stock: stockItem,
      bodega: { id: bodega.id, nombre: bodega.nombre, codigo: bodega.codigo },
    };
  }
}
