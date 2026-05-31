import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePedidoVentaDto, UpdatePedidoVentaDto } from './dto/pedido.dto'
import { calcularItem, calcularTotales } from '../cotizaciones/cotizaciones.service'

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, params?: { clienteId?: number; estado?: string }) {
    return this.prisma.pedidoVenta.findMany({
      where: {
        empresaId,
        ...(params?.clienteId ? { clienteId: params.clienteId } : {}),
        ...(params?.estado ? { estado: params.estado } : {}),
      },
      include: {
        cliente: { select: { id: true, nombre: true, numeroDocumento: true, plazoCredito: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const p = await this.prisma.pedidoVenta.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        items: { include: { producto: { select: { sku: true, nombre: true, precioBase: true } } }, orderBy: { orden: 'asc' } },
      },
    })
    if (!p) throw new NotFoundException('Pedido de venta no encontrado')
    return p
  }

  async create(dto: CreatePedidoVentaDto, empresaId: number, usuarioId: number) {
    const totales = calcularTotales(dto.items)
    const numero = dto.numero || await this.generarNumero(empresaId)

    return this.prisma.pedidoVenta.create({
      data: {
        empresaId,
        numero,
        clienteId: dto.clienteId,
        bodegaId: dto.bodegaId,
        fecha: new Date(dto.fecha),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        notas: dto.notas,
        condicionesPago: dto.condicionesPago,
        usuarioId,
        ...totales,
        items: {
          create: dto.items.map((item, idx) => {
            const { subtotal, descuentoValor, baseIva, ivaValor, total } = calcularItem(item)
            return {
              productoId: item.productoId,
              descripcion: item.descripcion,
              unidad: item.unidad ?? 'UND',
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuentoPct: item.descuentoPct ?? 0,
              descuentoValor,
              tipoIva: item.tipoIva,
              baseIva,
              ivaValor,
              subtotal,
              total,
              orden: item.orden ?? idx,
            }
          }),
        },
      },
      include: { items: true, cliente: true },
    })
  }

  async update(id: number, dto: UpdatePedidoVentaDto, empresaId: number) {
    await this.findOne(id, empresaId)
    return this.prisma.pedidoVenta.update({ where: { id }, data: dto })
  }

  async cambiarEstado(id: number, estado: string, empresaId: number) {
    const ped = await this.findOne(id, empresaId)
    if (ped.estado === 'FACTURADO') throw new BadRequestException('El pedido ya fue facturado y no se puede modificar')
    return this.prisma.pedidoVenta.update({ where: { id }, data: { estado } })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.pedidoVenta.findFirst({
      where: { empresaId },
      orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `PV-${year}-${String(seq).padStart(5, '0')}`
  }
}
