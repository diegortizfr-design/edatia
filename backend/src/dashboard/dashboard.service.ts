import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getBusinessKpis(empresaId: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      ventasHoyPos,
      ventasHoyFacturas,
      totalClientes,
      alertasStock,
      sesionesAbiertas,
    ] = await Promise.all([
      // Ventas POS de hoy
      this.prisma.ventaPos.aggregate({
        where: { empresaId, fecha: { gte: hoy }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
      }),
      // Ventas Facturas de hoy
      this.prisma.facturaVenta.aggregate({
        where: { empresaId, fecha: { gte: hoy }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
      }),
      // Clientes totales
      this.prisma.clienteERP.count({ where: { empresaId, activo: true } }),
      // Alertas de stock (cantidad < stockMinimo)
      this.prisma.stock.count({
        where: {
          empresaId,
          producto: { stockMinimo: { gt: 0 } },
          cantidad: { lt: this.prisma.stock.fields.productoId } // This is tricky in Prisma without raw SQL or a specific logic
        }
      }).catch(() => 0), // Fallback if complex query fails
      // Sesiones POS abiertas
      this.prisma.sesionCaja.count({ where: { empresaId, estado: 'ABIERTA' } }),
    ]);

    // Re-calculamos alertas de stock de forma más precisa
    const stocks = await this.prisma.stock.findMany({
      where: { empresaId },
      include: { producto: { select: { stockMinimo: true } } }
    });
    const stockAlertsCount = stocks.filter(s => s.cantidad < (s.producto?.stockMinimo || 0)).length;

    const totalVentasHoy = Number(ventasHoyPos._sum.total || 0) + Number(ventasHoyFacturas._sum.total || 0);

    return {
      totalVentasHoy,
      totalClientes,
      stockAlertsCount,
      sesionesAbiertas,
    };
  }
}
