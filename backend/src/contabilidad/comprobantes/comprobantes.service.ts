import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PucService } from '../puc/puc.service'

export interface LineaComprobanteDto {
  cuentaId: number
  descripcion: string
  debito?: number
  credito?: number
  terceroNit?: string
  terceroNombre?: string
  centroCosto?: string
  orden?: number
}

export interface CreateComprobanteDto {
  tipo: string
  concepto: string
  fecha: string
  lineas: LineaComprobanteDto[]
  referenciaId?: number
  referenciaTipo?: string
}

@Injectable()
export class ComprobantesService {
  constructor(private prisma: PrismaService, private puc: PucService) {}

  findAll(empresaId: number, params?: { tipo?: string; desde?: string; hasta?: string }) {
    return this.prisma.comprobante.findMany({
      where: {
        empresaId,
        ...(params?.tipo ? { tipo: params.tipo } : {}),
        ...(params?.desde || params?.hasta ? {
          fecha: {
            ...(params?.desde ? { gte: new Date(params.desde) } : {}),
            ...(params?.hasta ? { lte: new Date(params.hasta) } : {}),
          },
        } : {}),
      },
      include: {
        lineas: { include: { cuenta: { select: { codigo: true, nombre: true } } }, orderBy: { orden: 'asc' } },
        periodo: { select: { anio: true, mes: true } },
      },
      orderBy: { fecha: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const c = await this.prisma.comprobante.findFirst({
      where: { id, empresaId },
      include: {
        lineas: { include: { cuenta: true }, orderBy: { orden: 'asc' } },
        periodo: true,
      },
    })
    if (!c) throw new NotFoundException('Comprobante no encontrado')
    return c
  }

  async create(dto: CreateComprobanteDto, empresaId: number, usuarioId?: number) {
    // Validar partida doble
    const totalDB = dto.lineas.reduce((a, l) => a + (l.debito ?? 0), 0)
    const totalCR = dto.lineas.reduce((a, l) => a + (l.credito ?? 0), 0)
    if (Math.abs(totalDB - totalCR) > 0.01) {
      throw new BadRequestException(
        `El comprobante no cuadra: débitos=${totalDB.toFixed(2)}, créditos=${totalCR.toFixed(2)}`
      )
    }

    // Obtener o crear período
    const fecha = new Date(dto.fecha)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1
    const periodo = await this.prisma.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes },
      update: {},
    })

    if (periodo.estado === 'CERRADO') {
      throw new BadRequestException(`El período ${mes}/${anio} está cerrado`)
    }

    const numero = await this.generarNumero(empresaId, dto.tipo)

    return this.prisma.comprobante.create({
      data: {
        empresaId,
        numero,
        tipo: dto.tipo,
        concepto: dto.concepto,
        fecha,
        periodoId: periodo.id,
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaTipo,
        usuarioId,
        lineas: {
          create: dto.lineas.map((l, idx) => ({
            cuentaId: l.cuentaId,
            descripcion: l.descripcion,
            debito: l.debito ?? 0,
            credito: l.credito ?? 0,
            terceroNit: l.terceroNit,
            terceroNombre: l.terceroNombre,
            centroCosto: l.centroCosto,
            orden: l.orden ?? idx,
          })),
        },
      },
      include: { lineas: { include: { cuenta: true } }, periodo: true },
    })
  }

  async anular(id: number, empresaId: number) {
    const c = await this.findOne(id, empresaId)
    if (c.estado === 'ANULADO') throw new BadRequestException('Ya está anulado')
    if (c.periodo.estado === 'CERRADO') throw new BadRequestException('El período está cerrado')
    return this.prisma.comprobante.update({ where: { id }, data: { estado: 'ANULADO' } })
  }

  private async generarNumero(empresaId: number, tipo: string): Promise<string> {
    const last = await this.prisma.comprobante.findFirst({
      where: { empresaId, tipo },
      orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `${tipo}-${year}-${String(seq).padStart(5, '0')}`
  }

  // ── Libro Mayor de una cuenta ──────────────────────────────────────────────
  async libroMayor(empresaId: number, cuentaId: number, desde?: string, hasta?: string) {
    const lineas = await this.prisma.comprobanteLinea.findMany({
      where: {
        cuentaId,
        comprobante: {
          empresaId,
          estado: 'APROBADO',
          ...(desde || hasta ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          } : {}),
        },
      },
      include: {
        comprobante: { select: { numero: true, fecha: true, concepto: true, tipo: true } },
      },
      orderBy: [{ comprobante: { fecha: 'asc' } }, { id: 'asc' }],
    })

    // Calcular saldo corrido
    let saldo = 0
    const cuenta = await this.prisma.cuentaPUC.findUnique({ where: { id: cuentaId } })
    const esDebito = cuenta?.naturaleza === 'DEBITO'

    return lineas.map(l => {
      const db = Number(l.debito)
      const cr = Number(l.credito)
      saldo += esDebito ? (db - cr) : (cr - db)
      return { ...l, saldo }
    })
  }
}
