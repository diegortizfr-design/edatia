import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { UpsertConfigDianDto, CreateResolucionDto } from './dto/config-dian.dto'

@Injectable()
export class ConfigDianService {
  constructor(private prisma: PrismaService) {}

  async getConfig(empresaId: number) {
    return this.prisma.configuracionDIAN.findUnique({
      where: { empresaId },
      include: { resoluciones: { orderBy: { id: 'desc' } } },
    })
  }

  async upsert(dto: UpsertConfigDianDto, empresaId: number) {
    return this.prisma.configuracionDIAN.upsert({
      where: { empresaId },
      create: { ...dto, empresaId },
      update: dto,
    })
  }

  async addResolucion(dto: CreateResolucionDto, empresaId: number) {
    const config = await this.prisma.configuracionDIAN.findUnique({ where: { empresaId } })
    if (!config) throw new NotFoundException('Configure primero los datos DIAN')

    return this.prisma.resolucionDIAN.create({
      data: {
        ...dto,
        numeroCurrent: dto.numeroInicial - 1,
        fechaResolucion: new Date(dto.fechaResolucion),
        fechaVigencia: new Date(dto.fechaVigencia),
        configId: config.id,
      },
    })
  }

  async getResolucionActiva(empresaId: number, tipoDocumento = '01') {
    const config = await this.prisma.configuracionDIAN.findUnique({ where: { empresaId } })
    if (!config) return null

    return this.prisma.resolucionDIAN.findFirst({
      where: {
        configId: config.id,
        tipoDocumento,
        activo: true,
        fechaVigencia: { gte: new Date() },
        numeroCurrent: { lt: this.prisma.resolucionDIAN.fields.numeroFinal as any },
      },
      orderBy: { id: 'desc' },
    })
  }

  async incrementarNumero(resolucionId: number) {
    return this.prisma.resolucionDIAN.update({
      where: { id: resolucionId },
      data: { numeroCurrent: { increment: 1 } },
    })
  }

  async toggleResolucion(id: number) {
    const r = await this.prisma.resolucionDIAN.findUnique({ where: { id } })
    if (!r) throw new NotFoundException('Resolución no encontrada')
    return this.prisma.resolucionDIAN.update({ where: { id }, data: { activo: !r.activo } })
  }
}
