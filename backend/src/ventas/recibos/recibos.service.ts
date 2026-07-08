import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface CreateReciboDto {
  clienteId: number
  valor: number
  medioPago: string
  referencia?: string
  concepto?: string
  aplicaciones?: Array<{ facturaId: number; valor: number }>
}

@Injectable()
export class RecibosService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, clienteId?: number) {
    return this.prisma.reciboCaja.findMany({
      where: { empresaId, ...(clienteId ? { clienteId } : {}) },
      include: {
        cliente: { select: { nombre: true } },
        aplicaciones: {
          include: { factura: { select: { numero: true, total: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const r = await this.prisma.reciboCaja.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        aplicaciones: { include: { factura: true } },
      },
    })
    if (!r) throw new NotFoundException('Recibo no encontrado')
    return r
  }

  async create(dto: CreateReciboDto, empresaId: number, usuarioId: number) {
    // Validar que las aplicaciones no superen el saldo de cada factura
    if (dto.aplicaciones?.length) {
      for (const ap of dto.aplicaciones) {
        const f = await this.prisma.facturaVenta.findFirst({
          where: { id: ap.facturaId, empresaId },
        })
        if (!f) throw new NotFoundException(`Factura ${ap.facturaId} no encontrada`)
        if (Number(f.saldo) < ap.valor) {
          throw new BadRequestException(`El valor a aplicar supera el saldo de la factura ${f.numero}`)
        }
      }
    }

    const numero = await this.generarNumero(empresaId)

    const recibo = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el recibo de caja
      const r = await tx.reciboCaja.create({
        data: {
          empresaId,
          numero,
          clienteId: dto.clienteId,
          valor: dto.valor,
          medioPago: dto.medioPago,
          referencia: dto.referencia,
          concepto: dto.concepto ?? 'Recibo de caja',
          usuarioId,
          aplicaciones: dto.aplicaciones ? {
            create: dto.aplicaciones.map(ap => ({
              facturaId: ap.facturaId,
              valor: ap.valor,
            })),
          } : undefined,
        },
        include: { aplicaciones: true, cliente: true },
      })

      // 2. Actualizar saldo de facturas
      if (dto.aplicaciones?.length) {
        for (const ap of dto.aplicaciones) {
          const f = await tx.facturaVenta.findUnique({ where: { id: ap.facturaId } })
          const nuevoSaldo = Math.max(0, Number(f!.saldo) - ap.valor)
          const nuevoTotalPagado = Number(f!.totalPagado) + ap.valor
          const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL'
          await tx.facturaVenta.update({
            where: { id: ap.facturaId },
            data: { saldo: nuevoSaldo, totalPagado: nuevoTotalPagado, estado: nuevoEstado },
          })
        }
      }

      // 3. Crear Asiento Contable Automático
      await this.crearAsientoRecibo(tx, r, empresaId, usuarioId)

      return r
    })

    return recibo
  }

  async anular(id: number, empresaId: number) {
    const r = await this.findOne(id, empresaId)
    if (r.estado === 'ANULADO') throw new BadRequestException('Ya está anulado')

    return this.prisma.$transaction(async (tx) => {
      // Revertir aplicaciones en facturas
      for (const ap of r.aplicaciones) {
        const f = await tx.facturaVenta.findUnique({ where: { id: ap.facturaId } })
        if (f) {
          const totalVolver = Number(ap.valor)
          const nuevoSaldo = Number(f.saldo) + totalVolver
          const nuevoTotalPagado = Math.max(0, Number(f.totalPagado) - totalVolver)
          const nuevoEstado = nuevoSaldo === Number(f.total) ? 'EMITIDA' : 'PARCIAL'

          await tx.facturaVenta.update({
            where: { id: ap.facturaId },
            data: {
              saldo: nuevoSaldo,
              totalPagado: nuevoTotalPagado,
              estado: nuevoEstado,
            },
          })
        }
      }

      // Anular comprobante contable si existe
      const comprobante = await tx.comprobante.findFirst({
        where: { empresaId, referenciaId: r.id, referenciaTipo: 'RECIBO_CAJA' }
      })
      if (comprobante) {
        await tx.comprobante.update({
          where: { id: comprobante.id },
          data: { estado: 'ANULADO' }
        })
      }

      return tx.reciboCaja.update({ where: { id }, data: { estado: 'ANULADO' } })
    })
  }

  // Facturas pendientes de cobro de un cliente
  async facturasPendientes(empresaId: number, clienteId: number) {
    return this.prisma.facturaVenta.findMany({
      where: { empresaId, clienteId, estado: { in: ['EMITIDA', 'PARCIAL'] } },
      select: { id: true, numero: true, fecha: true, fechaVencimiento: true, total: true, saldo: true, estado: true },
      orderBy: { fecha: 'asc' },
    })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.reciboCaja.findFirst({
      where: { empresaId }, orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `RC-${year}-${String(seq).padStart(5, '0')}`
  }

  private async crearAsientoRecibo(tx: any, recibo: any, empresaId: number, usuarioId: number) {
    // 1. Obtener códigos contables básicos
    const codigos = ['1105', '1110', '1305']
    const cuentas = await tx.cuentaPUC.findMany({
      where: { empresaId, codigo: { in: codigos }, activo: true },
      select: { id: true, codigo: true },
    })
    const byCode = new Map<string, number>(cuentas.map((c: any) => [c.codigo as string, c.id as number]))

    // 2. Determinar cuenta de cargo (Caja o Banco) desde el Medio de Pago
    const mp = await tx.medioPago.findFirst({
      where: { empresaId, codigo: recibo.medioPago },
      include: { cajaBanco: true }
    })
    let cCajaBancoId = mp?.cajaBanco?.cuentaPUCId

    if (!cCajaBancoId) {
      const fallbackCode = recibo.medioPago === 'EFECTIVO' ? '1105' : '1110'
      cCajaBancoId = byCode.get(fallbackCode) || byCode.get('1105')
    }

    const cClientes = byCode.get('1305')

    if (!cCajaBancoId || !cClientes) return // Sin parametrización contable básica, omitir

    const lineas = []
    const desc = `Recibo de Caja ${recibo.numero}`

    // Débito a Caja/Banco
    lineas.push({
      cuentaId: cCajaBancoId,
      descripcion: `${desc} - Ingreso ${recibo.medioPago}`,
      debito: Number(recibo.valor),
      credito: 0,
      terceroNit: recibo.cliente?.nit || null,
      terceroNombre: recibo.cliente?.nombre || null,
    })

    // Crédito a Clientes/Cartera
    lineas.push({
      cuentaId: cClientes,
      descripcion: `${desc} - Abono de cartera`,
      debito: 0,
      credito: Number(recibo.valor),
      terceroNit: recibo.cliente?.nit || null,
      terceroNombre: recibo.cliente?.nombre || null,
    })

    // Validar partida doble
    const totalDb = lineas.reduce((acc, l) => acc + l.debito, 0)
    const totalCr = lineas.reduce((acc, l) => acc + l.credito, 0)
    if (Math.abs(totalDb - totalCr) > 0.1) return

    const fecha = new Date(recibo.createdAt)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const periodo = await tx.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTO' },
      update: {},
    })

    const ultimo = await tx.comprobante.findFirst({
      where: { empresaId, tipo: 'RC' },
      orderBy: { id: 'desc' },
      select: { numero: true },
    })
    const seq = ultimo ? parseInt(ultimo.numero.split('-').pop() ?? '0') + 1 : 1
    const numeroComp = `RC-${anio}-${String(seq).padStart(5, '0')}`

    await tx.comprobante.create({
      data: {
        empresaId,
        tipo: 'RC',
        numero: numeroComp,
        fecha,
        concepto: `Recibo de Caja ${recibo.numero} - ${recibo.cliente?.nombre}`,
        estado: 'ACTIVO',
        periodoId: periodo.id,
        usuarioId,
        referenciaId: recibo.id,
        referenciaTipo: 'RECIBO_CAJA',
        lineas: {
          create: lineas.map((l, idx) => ({ ...l, orden: idx })),
        },
      },
    })
  }
}
