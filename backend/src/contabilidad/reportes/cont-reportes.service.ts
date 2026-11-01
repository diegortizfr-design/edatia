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

    // Filtro resiliente por tipo o por clase PUC estándar (4=Ingresos, 5=Gastos, 6/7=Costos)
    const ingresos = balance.filter(c => c.tipo?.toUpperCase().startsWith('INGRES') || c.codigo.startsWith('4'))
    const costos   = balance.filter(c => c.tipo?.toUpperCase().startsWith('COST') || c.codigo.startsWith('6') || c.codigo.startsWith('7'))
    const gastos   = balance.filter(c => c.tipo?.toUpperCase().startsWith('GAST') || c.codigo.startsWith('5'))

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
   * Activos = Pasivos + Patrimonio (incluyendo Resultado del Ejercicio en curso)
   */
  async balanceGeneral(empresaId: number, hasta: string) {
    const balance = await this.balanceComprobacion(empresaId, '2000-01-01', hasta)

    const activos    = balance.filter(c => c.tipo === 'ACTIVO' || c.codigo.startsWith('1'))
    const pasivos    = balance.filter(c => c.tipo === 'PASIVO' || c.codigo.startsWith('2'))
    const patrimonio = balance.filter(c => c.tipo === 'PATRIMONIO' || c.codigo.startsWith('3'))

    // Cuentas de resultados acumuladas para integrar Utilidad/Pérdida en curso en Patrimonio
    const ingresos = balance.filter(c => c.tipo?.toUpperCase().startsWith('INGRES') || c.codigo.startsWith('4'))
    const costos   = balance.filter(c => c.tipo?.toUpperCase().startsWith('COST') || c.codigo.startsWith('6') || c.codigo.startsWith('7'))
    const gastos   = balance.filter(c => c.tipo?.toUpperCase().startsWith('GAST') || c.codigo.startsWith('5'))

    const totalIngresos = ingresos.reduce((a, c) => a + c.saldo, 0)
    const totalCostos   = costos.reduce((a, c) => a + c.saldo, 0)
    const totalGastos   = gastos.reduce((a, c) => a + c.saldo, 0)
    const utilidadEjercicio = totalIngresos - totalCostos - totalGastos

    // Agregar la línea del resultado del ejercicio al patrimonio para balancear el Balance General
    const patrimonioConResultado = [...patrimonio]
    if (Math.abs(utilidadEjercicio) > 0.001) {
      patrimonioConResultado.push({
        codigo: '3605',
        nombre: 'Resultado del Ejercicio (Utilidad / Pérdida en curso)',
        tipo: 'PATRIMONIO',
        naturaleza: utilidadEjercicio >= 0 ? 'CREDITO' : 'DEBITO',
        debitos: 0,
        creditos: 0,
        saldo: utilidadEjercicio,
        saldoDebito: utilidadEjercicio < 0 ? Math.abs(utilidadEjercicio) : 0,
        saldoCredito: utilidadEjercicio >= 0 ? utilidadEjercicio : 0,
      })
    }

    const totalActivos    = activos.reduce((a, c) => a + c.saldo, 0)
    const totalPasivos    = pasivos.reduce((a, c) => a + c.saldo, 0)
    const totalPatrimonio = patrimonioConResultado.reduce((a, c) => a + c.saldo, 0)

    return {
      fecha: hasta,
      activos,
      pasivos,
      patrimonio: patrimonioConResultado,
      utilidadEjercicio,
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
