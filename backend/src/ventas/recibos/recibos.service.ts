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

    const recibo = await this.prisma.reciboCaja.create({
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

    // Actualizar saldo de facturas
    if (dto.aplicaciones?.length) {
      for (const ap of dto.aplicaciones) {
        const f = await this.prisma.facturaVenta.findUnique({ where: { id: ap.facturaId } })
        const nuevoSaldo = Math.max(0, Number(f!.saldo) - ap.valor)
        const nuevoTotalPagado = Number(f!.totalPagado) + ap.valor
        const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL'
        await this.prisma.facturaVenta.update({
          where: { id: ap.facturaId },
          data: { saldo: nuevoSaldo, totalPagado: nuevoTotalPagado, estado: nuevoEstado },
        })
      }
    }

    return recibo
  }

  async anular(id: number, empresaId: number) {
    const r = await this.findOne(id, empresaId)
    if (r.estado === 'ANULADO') throw new BadRequestException('Ya está anulado')

    // Revertir aplicaciones en facturas
    for (const ap of r.aplicaciones) {
      const f = ap.factura as any
      await this.prisma.facturaVenta.update({
        where: { id: ap.facturaId },
        data: {
          saldo: { increment: Number(ap.valor) },
          totalPagado: { decrement: Number(ap.valor) },
          estado: 'EMITIDA',
        },
      })
    }

    return this.prisma.reciboCaja.update({ where: { id }, data: { estado: 'ANULADO' } })
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
}
