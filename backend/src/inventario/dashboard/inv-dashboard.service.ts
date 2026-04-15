import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(empresaId: number) {
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

    const [
      totalProductos,
      totalBodegas,
      movimientosRecientes,
      stocks,
    ] = await Promise.all([
      (this.prisma as any).producto.count({ where: { empresaId, activo: true } }),
      (this.prisma as any).bodega.count({ where: { empresaId, activo: true } }),
      (this.prisma as any).movimientoInventario.count({
        where: { empresaId, fechaMovimiento: { gte: haceUnaSemana } },
      }),
      (this.prisma as any).stock.findMany({
        where: { empresaId },
        include: { producto: { select: { costoPromedio: true, puntoReorden: true, nombre: true, sku: true } } },
      }),
    ]);

    // Valor total inventario
    const valorTotal = stocks.reduce((acc: number, s: any) => {
      return acc + parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio);
    }, 0);

    // Productos bajo punto de reorden
    const productosAlertas = stocks.filter((s: any) => {
      const disponible = parseFloat(s.cantidad) - parseFloat(s.cantidadReservada ?? 0);
      return disponible <= parseFloat(s.producto.puntoReorden);
    }).length;

    // Top 5 productos por valor
    const topProductos = stocks
      .map((s: any) => ({
        productoId: s.productoId,
        nombre: s.producto.nombre,
        sku: s.producto.sku,
        cantidad: parseFloat(s.cantidad),
        valor: parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio),
      }))
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 5);

    // Alertas críticas (stock = 0 o negativo)
    const alertasCriticas = stocks
      .filter((s: any) => parseFloat(s.cantidad) <= 0)
      .slice(0, 5);

    return {
      totalProductos,
      totalBodegas,
      movimientosRecientes,
      valorTotal,
      productosAlertas,
      topProductos,
      alertasCriticas,
    };
  }
}
