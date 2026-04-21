import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ContReportesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Balance de Comprobación (Trial Balance)
   * Suma de débitos y créditos por cuenta en el período dado
   */
  async balanceComprobacion(empresaId: number, desde: string, hasta: string) {
    const lineas = await this.prisma.comprobanteLinea.groupBy({
      by: ['cuentaId'],
      where: {
        comprobante: {
          empresaId,
          estado: 'APROBADO',
          fecha: { gte: new Date(desde), lte: new Date(hasta) },
        },
      },
      _sum: { debito: true, credito: true },
    })

    const cuentaIds = lineas.map(l => l.cuentaId)
    const cuentas = await this.prisma.cuentaPUC.findMany({
      where: { id: { in: cuentaIds } },
      orderBy: { codigo: 'asc' },
    })

    return cuentas.map(c => {
      const mov = lineas.find(l => l.cuentaId === c.id)!
      const db = Number(mov._sum.debito ?? 0)
      const cr = Number(mov._sum.credito ?? 0)
      const saldo = c.naturaleza === 'DEBITO' ? db - cr : cr - db
      return {
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        naturaleza: c.naturaleza,
        debitos: db,
        creditos: cr,
        saldo,
        saldoDebito: saldo > 0 && c.naturaleza === 'DEBITO' ? saldo : 0,
        saldoCredito: saldo > 0 && c.naturaleza === 'CREDITO' ? saldo : 0,
      }
    })
  }

  /**
   * Estado de Resultados (P&L)
   * Ingresos - Costos - Gastos = Utilidad/Pérdida
   */
  async estadoResultados(empresaId: number, desde: string, hasta: string) {
    const balance = await this.balanceComprobacion(empresaId, desde, hasta)

    const ingresos = balance.filter(c => c.tipo === 'INGRESO')
    const costos   = balance.filter(c => c.tipo === 'COSTO')
    const gastos   = balance.filter(c => c.tipo === 'GASTO')

    const totalIngresos = ingresos.reduce((a, c) => a + c.saldo, 0)
    const totalCostos   = costos.reduce((a, c) => a + c.saldo, 0)
    const totalGastos   = gastos.reduce((a, c) => a + c.saldo, 0)
    const utilidadBruta = totalIngresos - totalCostos
    const utilidadNeta  = utilidadBruta - totalGastos

    return {
      periodo: { desde, hasta },
      ingresos,
      costos,
      gastos,
      totalIngresos,
      totalCostos,
      utilidadBruta,
      totalGastos,
      utilidadNeta,
    }
  }

  /**
   * Balance General (Balance Sheet)
   * Activos = Pasivos + Patrimonio
   */
  async balanceGeneral(empresaId: number, hasta: string) {
    const balance = await this.balanceComprobacion(empresaId, '2000-01-01', hasta)

    const activos    = balance.filter(c => c.tipo === 'ACTIVO')
    const pasivos    = balance.filter(c => c.tipo === 'PASIVO')
    const patrimonio = balance.filter(c => c.tipo === 'PATRIMONIO')

    const totalActivos    = activos.reduce((a, c) => a + c.saldo, 0)
    const totalPasivos    = pasivos.reduce((a, c) => a + c.saldo, 0)
    const totalPatrimonio = patrimonio.reduce((a, c) => a + c.saldo, 0)

    return {
      fecha: hasta,
      activos,
      pasivos,
      patrimonio,
      totalActivos,
      totalPasivos,
      totalPatrimonio,
      cuadra: Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 1,
    }
  }

  /**
   * Períodos disponibles
   */
  periodos(empresaId: number) {
    return this.prisma.periodoContable.findMany({
      where: { empresaId },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    })
  }

  async cerrarPeriodo(empresaId: number, anio: number, mes: number) {
    return this.prisma.periodoContable.update({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      data: { estado: 'CERRADO', fechaCierre: new Date() },
    })
  }
}
