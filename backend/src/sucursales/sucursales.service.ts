import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto'

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).sucursal.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const suc = await (this.prisma as any).sucursal.findFirst({
      where: { id, empresaId, deletedAt: null },
    })
    if (!suc) throw new NotFoundException('Sucursal no encontrada')
    return suc
  }

  async create(dto: CreateSucursalDto, empresaId: number) {
    const exists = await (this.prisma as any).sucursal.findFirst({
      where: { empresaId, codigo: dto.codigo, deletedAt: null },
    })
    if (exists) throw new ConflictException(`Ya existe una sucursal con código "${dto.codigo}"`)

    return (this.prisma as any).sucursal.create({
      data: { ...dto, empresaId },
    })
  }

  async update(id: number, dto: UpdateSucursalDto, empresaId: number) {
    await this.findOne(id, empresaId)

    if (dto.codigo) {
      const conflict = await (this.prisma as any).sucursal.findFirst({
        where: { empresaId, codigo: dto.codigo, deletedAt: null, NOT: { id } },
      })
      if (conflict) throw new ConflictException(`Ya existe una sucursal con código "${dto.codigo}"`)
    }

    return (this.prisma as any).sucursal.update({
      where: { id },
      data: dto,
    })
  }

  async softDelete(id: number, empresaId: number, codigoAutorizacion: string, userId?: number) {
    // Verificar que existe
    await this.findOne(id, empresaId)

    // Verificar código de autorización contra la BD
    const config = await (this.prisma as any).configuracionERP.findUnique({
      where: { empresaId },
    })
    const codigoCorrecto = config?.codeEliminarSucursal ?? 'SUCURSAL123'

    if (codigoAutorizacion !== codigoCorrecto) {
      throw new ForbiddenException('Código de autorización incorrecto')
    }

    // Soft delete
    return (this.prisma as any).sucursal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId ?? null,
      },
    })
  }

  // Recuperar sucursales eliminadas (para auditoría)
  async findDeleted(empresaId: number) {
    return (this.prisma as any).sucursal.findMany({
      where: { empresaId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    })
  }
}
