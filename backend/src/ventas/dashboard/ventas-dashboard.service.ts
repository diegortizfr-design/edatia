import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class VentasDashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(empresaId: number) {
    const hoy = new Date()
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalClientes,
      facturasMes,
      porCobrar,
      vencidas,
      topClientes,
      ultimasFacturas,
      porEstado,
    ] = await Promise.all([
      // Clientes activos
      this.prisma.clienteERP.count({ where: { empresaId, activo: true } }),

      // Ventas del mes
      this.prisma.facturaVenta.aggregate({
        where: { empresaId, fecha: { gte: inicio, lte: fin }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Total cartera por cobrar
      this.prisma.facturaVenta.aggregate({
        where: { empresaId, estado: { in: ['EMITIDA', 'PARCIAL'] } },
        _sum: { saldo: true },
      }),

      // Facturas vencidas (fecha vencimiento pasada y sin pagar)
      this.prisma.facturaVenta.count({
        where: {
          empresaId,
          estado: { in: ['EMITIDA', 'PARCIAL'] },
          fechaVencimiento: { lt: hoy },
        },
      }),

      // Top 5 clientes por ventas (todo el tiempo)
      this.prisma.facturaVenta.groupBy({
        by: ['clienteId'],
        where: { empresaId, estado: { not: 'ANULADA' } },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),

      // Últimas 8 facturas
      this.prisma.facturaVenta.findMany({
        where: { empresaId },
        include: { cliente: { select: { nombre: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),

      // Distribución por estado
      this.prisma.facturaVenta.groupBy({
        by: ['estado'],
        where: { empresaId },
        _count: { id: true },
        _sum: { total: true },
      }),
    ])

    // Enriquecer top clientes
    const clienteIds = topClientes.map(t => t.clienteId)
    const clientes = await this.prisma.clienteERP.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nombre: true, numeroDocumento: true },
    })

    return {
      totalClientes,
      ventasMes: {
        total: facturasMes._sum.total ?? 0,
        cantidad: facturasMes._count.id,
      },
      carteraPorCobrar: porCobrar._sum.saldo ?? 0,
      facturasvencidas: vencidas,
      topClientes: topClientes.map(t => ({
        ...clientes.find(c => c.id === t.clienteId),
        total: t._sum.total,
      })),
      ultimasFacturas,
      porEstado,
    }
  }
}
