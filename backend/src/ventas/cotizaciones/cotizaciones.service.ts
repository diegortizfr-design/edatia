import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCotizacionDto, UpdateCotizacionDto } from './dto/cotizacion.dto'

const IVA_PCT: Record<string, number> = { IVA_19: 0.19, IVA_5: 0.05, IVA_0: 0, EXCLUIDO: 0 }

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, params?: { clienteId?: number; estado?: string }) {
    return this.prisma.cotizacion.findMany({
      where: {
        empresaId,
        ...(params?.clienteId ? { clienteId: params.clienteId } : {}),
        ...(params?.estado ? { estado: params.estado } : {}),
      },
      include: {
        cliente: { select: { nombre: true, numeroDocumento: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const c = await this.prisma.cotizacion.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        items: { include: { producto: { select: { sku: true, nombre: true, unidadMedida: true } } }, orderBy: { orden: 'asc' } },
      },
    })
    if (!c) throw new NotFoundException('Cotización no encontrada')
    return c
  }

  async create(dto: CreateCotizacionDto, empresaId: number, usuarioId: number) {
    const totales = calcularTotales(dto.items)
    const numero = await this.generarNumero(empresaId)

    return this.prisma.cotizacion.create({
      data: {
        empresaId,
        numero,
        clienteId: dto.clienteId,
        bodegaId: dto.bodegaId,
        fecha: new Date(dto.fecha),
        fechaVencimiento: new Date(dto.fechaVencimiento),
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

  async update(id: number, dto: UpdateCotizacionDto, empresaId: number) {
    await this.findOne(id, empresaId)
    return this.prisma.cotizacion.update({ where: { id }, data: dto })
  }

  async cambiarEstado(id: number, estado: string, empresaId: number) {
    const cot = await this.findOne(id, empresaId)
    if (cot.estado === 'FACTURADA') throw new BadRequestException('La cotización ya fue facturada')
    return this.prisma.cotizacion.update({ where: { id }, data: { estado } })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.cotizacion.findFirst({
      where: { empresaId },
      orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `COT-${year}-${String(seq).padStart(5, '0')}`
  }
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

export function calcularItem(item: any) {
  const bruto = Number(item.cantidad) * Number(item.precioUnitario)
  const pctDesc = Number(item.descuentoPct ?? 0) / 100
  const descuentoValor = bruto * pctDesc
  const subtotal = bruto - descuentoValor
  const pctIva = IVA_PCT[item.tipoIva] ?? 0.19
  const baseIva = ['IVA_19', 'IVA_5'].includes(item.tipoIva) ? subtotal : 0
  const ivaValor = baseIva * pctIva
  const total = subtotal + ivaValor
  return { bruto, descuentoValor, subtotal, baseIva, ivaValor, total }
}

export function calcularTotales(items: any[]) {
  let subtotal = 0, descuento = 0, baseIva19 = 0, iva19 = 0, baseIva5 = 0, iva5 = 0
  for (const item of items) {
    const r = calcularItem(item)
    subtotal  += r.bruto
    descuento += r.descuentoValor
    if (item.tipoIva === 'IVA_19') { baseIva19 += r.baseIva; iva19 += r.ivaValor }
    if (item.tipoIva === 'IVA_5')  { baseIva5  += r.baseIva; iva5  += r.ivaValor }
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    descuento: Math.round(descuento * 100) / 100,
    baseIva19: Math.round(baseIva19 * 100) / 100,
    iva19: Math.round(iva19 * 100) / 100,
    baseIva5: Math.round(baseIva5 * 100) / 100,
    iva5: Math.round(iva5 * 100) / 100,
    total: Math.round((subtotal - descuento + iva19 + iva5) * 100) / 100,
  }
}
