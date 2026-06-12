import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateTerceroDto, UpdateTerceroDto } from './dto/tercero.dto'

@Injectable()
export class TercerosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, q?: string) {
    const where: any = { empresaId }
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { nombreComercial: { contains: q, mode: 'insensitive' } },
        { numeroDocumento: { contains: q } },
      ]
    }
    return this.prisma.tercero.findMany({
      where,
      include: {
        sucursales: true,
        _count: {
          select: {
            facturasVenta: true,
            ordenesCompra: true,
            pedidos: true,
          }
        }
      },
      orderBy: { nombre: 'asc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const t = await this.prisma.tercero.findFirst({
      where: { id, empresaId },
      include: {
        sucursales: true,
        facturasVenta: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, numero: true, fecha: true, total: true, saldo: true, estado: true },
        },
        ordenesCompra: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, numero: true, fechaEmision: true, total: true, estado: true },
        }
      },
    })
    if (!t) throw new NotFoundException('Tercero no encontrado')
    return t
  }

  async create(dto: CreateTerceroDto, empresaId: number) {
    const exists = await this.prisma.tercero.findUnique({
      where: {
        empresaId_tipoDocumento_numeroDocumento: {
          empresaId,
          tipoDocumento: dto.tipoDocumento || 'NIT',
          numeroDocumento: dto.numeroDocumento,
        }
      }
    })
    if (exists) {
      throw new ConflictException('Ya existe un tercero registrado con este tipo y número de documento')
    }

    const { sucursales, ...rest } = dto

    return this.prisma.tercero.create({
      data: {
        ...rest,
        empresaId,
        sucursales: sucursales && sucursales.length > 0 ? {
          create: sucursales.map((s: any) => ({
            empresaId,
            codigo: s.codigo,
            descripcion: s.descripcion,
            direccion: s.direccion || '',
            telefono: s.telefono || '',
            ciudad: s.ciudad || '',
            departamento: s.departamento || '',
            contacto: s.contacto || '',
            cargo: s.cargo || '',
          }))
        } : undefined
      },
      include: { sucursales: true }
    })
  }

  async update(id: number, dto: UpdateTerceroDto, empresaId: number) {
    await this.findOne(id, empresaId)

    const { sucursales, ...rest } = dto

    return this.prisma.$transaction(async (tx) => {
      // Eliminar sucursales anteriores
      await tx.sucursalTercero.deleteMany({
        where: { terceroId: id, empresaId }
      })

      // Actualizar tercero y crear nuevas sucursales
      return tx.tercero.update({
        where: { id },
        data: {
          ...rest,
          sucursales: sucursales && sucursales.length > 0 ? {
            create: sucursales.map((s: any) => ({
              empresaId,
              codigo: s.codigo,
              descripcion: s.descripcion,
              direccion: s.direccion || '',
              telefono: s.telefono || '',
              ciudad: s.ciudad || '',
              departamento: s.departamento || '',
              contacto: s.contacto || '',
              cargo: s.cargo || '',
            }))
          } : undefined
        },
        include: { sucursales: true }
      })
    })
  }

  async remove(id: number, empresaId: number) {
    const tercero = await this.prisma.tercero.findFirst({
      where: { id, empresaId },
      include: {
        _count: {
          select: {
            cotizaciones: true,
            pedidos: true,
            facturasVenta: true,
            notasCredito: true,
            recibos: true,
            ventasPos: true,
            ordenesCompra: true,
            facturasCompra: true,
          }
        }
      }
    })

    if (!tercero) throw new NotFoundException('Tercero no encontrado')

    const count = tercero._count
    const hasTransactions = Object.values(count).some(c => c > 0)

    if (hasTransactions) {
      // Soft delete: desactivar
      await this.prisma.tercero.update({
        where: { id },
        data: { activo: false }
      })
      return {
        message: 'El tercero tiene historial de transacciones y no se puede eliminar físicamente. Ha sido desactivado automáticamente.',
        softDeleted: true
      }
    }

    // Hard delete
    await this.prisma.tercero.delete({
      where: { id }
    })
    return {
      message: 'Tercero eliminado exitosamente.',
      softDeleted: false
    }
  }
}
