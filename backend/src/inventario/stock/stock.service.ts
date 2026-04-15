import { Injectable } from '@nestjs/common';
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
}
