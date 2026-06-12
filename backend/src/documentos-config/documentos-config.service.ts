import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDocumentoConfigDto, UpdateDocumentoConfigDto } from './dto/documento-config.dto'

@Injectable()
export class DocumentosConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).documentoConfig.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const doc = await (this.prisma as any).documentoConfig.findFirst({
      where: { id, empresaId, deletedAt: null },
    })
    if (!doc) throw new NotFoundException('Documento de configuración no encontrado')
    return doc
  }

  async create(dto: CreateDocumentoConfigDto, empresaId: number) {
    // Verificar prefijo único activo
    const exists = await (this.prisma as any).documentoConfig.findFirst({
      where: { empresaId, prefijo: dto.prefijo, deletedAt: null },
    })
    if (exists) throw new ConflictException(`Ya existe un documento con prefijo "${dto.prefijo}"`)

    const data: any = { ...dto, empresaId }

    // Convertir fecha si viene como string
    if (dto.fechaResolucion) {
      data.fechaResolucion = new Date(dto.fechaResolucion)
    }

    // El consecutivoSiguiente debe arrancar igual al inicial
    if (dto.consecutivoInicial && !dto.consecutivoSiguiente) {
      data.consecutivoSiguiente = dto.consecutivoInicial
    }

    return (this.prisma as any).documentoConfig.create({ data })
  }

  async update(id: number, dto: UpdateDocumentoConfigDto, empresaId: number) {
    await this.findOne(id, empresaId)

    // Verificar prefijo único activo si se está actualizando
    if (dto.prefijo) {
      const exists = await (this.prisma as any).documentoConfig.findFirst({
        where: {
          empresaId,
          prefijo: dto.prefijo,
          id: { not: id },
          deletedAt: null,
        },
      })
      if (exists) throw new ConflictException(`Ya existe un documento con prefijo "${dto.prefijo}"`)
    }

    const data: any = { ...dto }
    if (dto.fechaResolucion) {
      data.fechaResolucion = new Date(dto.fechaResolucion)
    }

    return (this.prisma as any).documentoConfig.update({
      where: { id },
      data,
    })
  }

  // Incrementar consecutivo cuando se emite un documento
  async incrementarConsecutivo(id: number, empresaId: number) {
    await this.findOne(id, empresaId)
    return (this.prisma as any).documentoConfig.update({
      where: { id },
      data: { consecutivoSiguiente: { increment: 1 } },
    })
  }

  async softDelete(id: number, empresaId: number, codigoAutorizacion: string, userId?: number) {
    await this.findOne(id, empresaId)

    const config = await (this.prisma as any).configuracionERP.findUnique({
      where: { empresaId },
    })
    const codigoCorrecto = config?.codeEliminarDocumento ?? 'EDATIA123'

    if (codigoAutorizacion !== codigoCorrecto) {
      throw new ForbiddenException('Código de autorización incorrecto')
    }

    return (this.prisma as any).documentoConfig.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId ?? null },
    })
  }

  async findDeleted(empresaId: number) {
    return (this.prisma as any).documentoConfig.findMany({
      where: { empresaId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    })
  }
}
