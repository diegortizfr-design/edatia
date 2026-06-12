import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto'

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, q?: string) {
    return this.prisma.tercero.findMany({
      where: {
        empresaId,
        esCliente: true,
        activo: true,
        ...(q ? {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { nombreComercial: { contains: q, mode: 'insensitive' } },
            { numeroDocumento: { contains: q } },
          ],
        } : {}),
      },
      include: {
        sucursales: true,
        _count: { select: { facturasVenta: true, cotizaciones: true } }
      },
      orderBy: { nombre: 'asc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const c = await this.prisma.tercero.findFirst({
      where: { id, empresaId, esCliente: true },
      include: {
        sucursales: true,
        facturasVenta: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, numero: true, fecha: true, total: true, saldo: true, estado: true },
        },
      },
    })
    if (!c) throw new NotFoundException('Cliente no encontrado')

    // Calcular pago promedio
    const aplicaciones = await this.prisma.reciboCajaFactura.findMany({
      where: { factura: { clienteId: id, empresaId } },
      select: {
        recibo: { select: { fecha: true } },
        factura: { select: { fecha: true } },
      },
    })

    let promedioDias = 0
    if (aplicaciones.length > 0) {
      const diffs = aplicaciones.map(ap => {
        const fRecibo = new Date(ap.recibo.fecha).getTime()
        const fFactura = new Date(ap.factura.fecha).getTime()
        const diffMs = fRecibo - fFactura
        const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24))
        return diffDays
      })
      const sum = diffs.reduce((acc, d) => acc + d, 0)
      promedioDias = Math.round(sum / aplicaciones.length)
    }

    return {
      ...c,
      pagoPromedioDias: promedioDias,
    }
  }

  async create(dto: CreateClienteDto, empresaId: number) {
    // Buscar si ya existe un Tercero con ese documento
    let tercero = await this.prisma.tercero.findUnique({
      where: {
        empresaId_tipoDocumento_numeroDocumento: {
          empresaId,
          tipoDocumento: dto.tipoDocumento || 'NIT',
          numeroDocumento: dto.numeroDocumento,
        }
      }
    })

    if (tercero) {
      if (tercero.esCliente) {
        throw new ConflictException('Ya existe un cliente con ese documento')
      }
      
      // Si existe pero no era cliente, lo actualizamos para que sea cliente y le añadimos los campos de cliente
      const { sucursales, ...rest } = dto
      return this.prisma.$transaction(async (tx) => {
        // Eliminar sucursales viejas y recrear
        await tx.sucursalTercero.deleteMany({ where: { terceroId: tercero!.id, empresaId } })
        
        return tx.tercero.update({
          where: { id: tercero!.id },
          data: {
            ...rest,
            esCliente: true,
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

    const { sucursales, ...rest } = dto
    return this.prisma.tercero.create({
      data: {
        ...rest,
        empresaId,
        esCliente: true,
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

  async update(id: number, dto: UpdateClienteDto, empresaId: number) {
    await this.findOne(id, empresaId)
    const { sucursales, ...rest } = dto

    return this.prisma.$transaction(async (tx) => {
      await tx.sucursalTercero.deleteMany({
        where: { terceroId: id, empresaId }
      })

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

  async toggle(id: number, empresaId: number) {
    const c = await this.findOne(id, empresaId)
    return this.prisma.tercero.update({
      where: { id },
      data: { activo: !c.activo },
    })
  }

  async remove(id: number, empresaId: number) {
    const c = await this.findOne(id, empresaId)
    
    // Verificación inteligente de transacciones
    const count = await this.prisma.tercero.findFirst({
      where: { id, empresaId },
      select: {
        _count: {
          select: {
            cotizaciones: true,
            pedidos: true,
            facturasVenta: true,
            notasCredito: true,
            recibos: true,
            ventasPos: true,
          }
        }
      }
    })

    const hasTransactions = count ? Object.values(count._count).some(v => v > 0) : false

    if (hasTransactions) {
      await this.prisma.tercero.update({
        where: { id },
        data: { activo: false }
      })
      return { message: 'El cliente tiene historial y ha sido desactivado automáticamente.', softDeleted: true }
    }

    await this.prisma.tercero.delete({
      where: { id },
    })
    return { message: 'Cliente eliminado exitosamente.', softDeleted: false }
  }

  async saldos(empresaId: number) {
    const facturas = await this.prisma.facturaVenta.groupBy({
      by: ['clienteId'],
      where: { empresaId, estado: { in: ['EMITIDA', 'PARCIAL'] } },
      _sum: { saldo: true, total: true },
    })
    const clienteIds = facturas.map(f => f.clienteId)
    const clientes = await this.prisma.tercero.findMany({
      where: { id: { in: clienteIds }, esCliente: true },
      select: { id: true, nombre: true, numeroDocumento: true },
    })
    return facturas.map(f => ({
      ...clientes.find(c => c.id === f.clienteId),
      totalFacturado: f._sum.total,
      saldo: f._sum.saldo,
    }))
  }
}
