import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateNotaCreditoDto } from './dto/nota-credito.dto'
import { calcularItem } from '../cotizaciones/cotizaciones.service'

@Injectable()
export class NotasCreditoService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, facturaId?: number) {
    return this.prisma.notaCredito.findMany({
      where: { empresaId, ...(facturaId ? { facturaId } : {}) },
      include: {
        cliente: { select: { nombre: true } },
        factura: { select: { numero: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const nc = await this.prisma.notaCredito.findFirst({
      where: { id, empresaId },
      include: { cliente: true, factura: true, items: true, empresa: true },
    })
    if (!nc) throw new NotFoundException('Nota crédito no encontrada')
    return nc
  }

  async create(dto: CreateNotaCreditoDto, empresaId: number, usuarioId: number) {
    let clienteId: number
    if (dto.facturaId) {
      const factura = await this.prisma.facturaVenta.findFirst({
        where: { id: dto.facturaId, empresaId },
      })
      if (!factura) throw new NotFoundException('Factura no encontrada')
      if (factura.estado === 'ANULADA') throw new BadRequestException('La factura está anulada')
      clienteId = factura.clienteId
    } else {
      if (!dto.clienteId) throw new BadRequestException('Debe proporcionar un cliente para la nota crédito')
      const cliente = await this.prisma.tercero.findFirst({
        where: { id: dto.clienteId, empresaId },
      })
      if (!cliente) throw new NotFoundException('Cliente no encontrado')
      clienteId = dto.clienteId
    }

    let subtotal = 0, iva = 0
    const itemsData = dto.items.map(item => {
      const r = calcularItem(item)
      subtotal += r.subtotal
      iva += r.ivaValor
      return {
        productoId: item.productoId ?? null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        tipoIva: item.tipoIva,
        ivaValor: r.ivaValor,
        subtotal: r.subtotal,
        total: r.total,
      }
    })
    const total = subtotal + iva
    const numero = dto.numero || await this.generarNumero(empresaId)

    const nc = await this.prisma.notaCredito.create({
      data: {
        empresaId,
        numero,
        facturaId: dto.facturaId ?? null,
        clienteId,
        motivo: dto.motivo,
        descripcion: dto.descripcion,
        subtotal,
        iva,
        total,
        estado: 'BORRADOR',
        estadoDIAN: 'PENDIENTE',
        usuarioId,
        items: { create: itemsData },
      },
      include: { items: true, cliente: true, factura: true },
    })

    return nc
  }

  async emitir(id: number, empresaId: number, usuarioId: number) {
    const nc = await this.findOne(id, empresaId)
    if (nc.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden emitir notas crédito en estado BORRADOR')
    }

    if (nc.facturaId) {
      const factura = await this.prisma.facturaVenta.findFirst({
        where: { id: nc.facturaId, empresaId },
      })
      if (!factura) throw new NotFoundException('Factura de referencia no encontrada')
      if (factura.estado === 'ANULADA') throw new BadRequestException('La factura de referencia está anulada')

      const total = Number(nc.total)
      const nuevoSaldo = Math.max(0, Number(factura.saldo) - total)
      const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : factura.estado

      await this.prisma.facturaVenta.update({
        where: { id: nc.facturaId },
        data: {
          saldo: nuevoSaldo,
          estado: nuevoEstado,
          totalPagado: { increment: total },
        },
      })
    }

    return this.prisma.notaCredito.update({
      where: { id },
      data: {
        estado: 'EMITIDA',
        estadoDIAN: 'ACEPTADA',
      },
      include: { items: true, cliente: true, factura: true },
    })
  }

  async anular(id: number, empresaId: number) {
    const nc = await this.findOne(id, empresaId)
    if (nc.estado === 'ANULADA') throw new BadRequestException('La nota crédito ya está anulada')
    if (nc.estado === 'EMITIDA') {
      throw new BadRequestException('No se puede anular/revertir una nota crédito ya emitida electrónicamente')
    }

    return this.prisma.notaCredito.update({
      where: { id },
      data: { estado: 'ANULADA' },
      include: { items: true, cliente: true, factura: true },
    })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.notaCredito.findFirst({
      where: { empresaId }, orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `NC-${year}-${String(seq).padStart(5, '0')}`
  }
}
