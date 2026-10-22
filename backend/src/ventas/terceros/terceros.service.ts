import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
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
    let cleanVendedorId: number | null = null
    if (dto.vendedorAsignadoId && Number(dto.vendedorAsignadoId) > 0) {
      const vend = await this.prisma.tercero.findFirst({
        where: { id: Number(dto.vendedorAsignadoId), empresaId, activo: true }
      })
      if (!vend) {
        throw new BadRequestException('El vendedor asignado no pertenece a su empresa o no está activo')
      }
      cleanVendedorId = vend.id
    }

    const exists = await this.prisma.tercero.findUnique({
      where: {
        empresaId_tipoDocumento_numeroDocumento: {
          empresaId,
          tipoDocumento: dto.tipoDocumento || 'NIT',
          numeroDocumento: dto.numeroDocumento,
        }
      }
    })

    const { sucursales, vendedorAsignadoId, ...rest } = dto
    const payloadData: any = {
      ...rest,
      vendedorAsignadoId: cleanVendedorId,
      empresaId,
    }

    if (exists) {
      // Si ya existía con el mismo rol activo que se está intentando crear
      if (dto.esCliente && exists.esCliente) {
        throw new ConflictException(`Ya existe un cliente registrado con ${dto.tipoDocumento || 'NIT'} ${dto.numeroDocumento} (${exists.nombre})`)
      }
      if (dto.esProveedor && exists.esProveedor && !dto.esCliente) {
        throw new ConflictException(`Ya existe un proveedor registrado con ${dto.tipoDocumento || 'NIT'} ${dto.numeroDocumento} (${exists.nombre})`)
      }

      // Si existía con otro rol o inactivo, lo actualizamos incorporando el nuevo rol y datos
      return this.prisma.$transaction(async (tx) => {
        if (sucursales && sucursales.length > 0) {
          await tx.sucursalTercero.deleteMany({
            where: { terceroId: exists.id, empresaId }
          })
        }

        return tx.tercero.update({
          where: { id: exists.id },
          data: {
            ...payloadData,
            activo: true,
            esCliente: dto.esCliente !== undefined ? !!dto.esCliente : exists.esCliente,
            esProveedor: dto.esProveedor !== undefined ? !!dto.esProveedor : exists.esProveedor,
            esColaborador: dto.esColaborador !== undefined ? !!dto.esColaborador : exists.esColaborador,
            esVendedor: dto.esVendedor !== undefined ? !!dto.esVendedor : exists.esVendedor,
            sucursales: sucursales && sucursales.length > 0 ? {
              create: sucursales.map((s: any) => ({
                empresaId,
                codigo: s.codigo,
                descripcion: s.descripcion,
                direccion: s.direccion || '',
                telefono: s.telefono || '',
                ciudad: s.ciudad || '',
                departamento: s.departamento || '',
                pais: s.pais || 'COLOMBIA',
                contacto: s.contacto || '',
                cargo: s.cargo || '',
              }))
            } : undefined
          },
          include: { sucursales: true }
        })
      })
    }

    return this.prisma.tercero.create({
      data: {
        ...payloadData,
        sucursales: sucursales && sucursales.length > 0 ? {
          create: sucursales.map((s: any) => ({
            empresaId,
            codigo: s.codigo,
            descripcion: s.descripcion,
            direccion: s.direccion || '',
            telefono: s.telefono || '',
            ciudad: s.ciudad || '',
            departamento: s.departamento || '',
            pais: s.pais || 'COLOMBIA',
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

    let cleanVendedorId: number | null = null
    if (dto.vendedorAsignadoId && Number(dto.vendedorAsignadoId) > 0) {
      const vend = await this.prisma.tercero.findFirst({
        where: { id: Number(dto.vendedorAsignadoId), empresaId, activo: true }
      })
      if (!vend) {
        throw new BadRequestException('El vendedor asignado no pertenece a su empresa o no está activo')
      }
      cleanVendedorId = vend.id
    }

    const { sucursales, vendedorAsignadoId, ...rest } = dto

    return this.prisma.$transaction(async (tx) => {
      // Eliminar sucursales anteriores si se pasaron sucursales
      if (sucursales !== undefined) {
        await tx.sucursalTercero.deleteMany({
          where: { terceroId: id, empresaId }
        })
      }

      // Actualizar tercero y crear nuevas sucursales
      return tx.tercero.update({
        where: { id },
        data: {
          ...rest,
          vendedorAsignadoId: cleanVendedorId,
          sucursales: sucursales && sucursales.length > 0 ? {
            create: sucursales.map((s: any) => ({
              empresaId,
              codigo: s.codigo,
              descripcion: s.descripcion,
              direccion: s.direccion || '',
              telefono: s.telefono || '',
              ciudad: s.ciudad || '',
              departamento: s.departamento || '',
              pais: s.pais || 'COLOMBIA',
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
            proveedoresRel: true,
            cajasPosDefault: true,
            clientesAsignados: true,
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
        message: 'El tercero tiene historial de transacciones o relaciones vinculadas y no se puede eliminar físicamente. Ha sido desactivado automáticamente.',
        softDeleted: true
      }
    }

    // Hard delete seguro dentro de transacción
    await this.prisma.$transaction(async (tx) => {
      await tx.sucursalTercero.deleteMany({ where: { terceroId: id, empresaId } })
      await tx.tercero.delete({ where: { id } })
    })

    return {
      message: 'Tercero eliminado exitosamente.',
      softDeleted: false
    }
  }
}
