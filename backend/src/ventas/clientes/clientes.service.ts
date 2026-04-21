import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto'

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, q?: string) {
    return this.prisma.clienteERP.findMany({
      where: {
        empresaId,
        activo: true,
        ...(q ? {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { nombreComercial: { contains: q, mode: 'insensitive' } },
            { numeroDocumento: { contains: q } },
          ],
        } : {}),
      },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { facturas: true, cotizaciones: true } } },
    })
  }

  async findOne(id: number, empresaId: number) {
    const c = await this.prisma.clienteERP.findFirst({
      where: { id, empresaId },
      include: {
        facturas: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, numero: true, fecha: true, total: true, saldo: true, estado: true },
        },
      },
    })
    if (!c) throw new NotFoundException('Cliente no encontrado')
    return c
  }

  async create(dto: CreateClienteDto, empresaId: number) {
    const exists = await this.prisma.clienteERP.findUnique({
      where: { empresaId_tipoDocumento_numeroDocumento: {
        empresaId, tipoDocumento: dto.tipoDocumento, numeroDocumento: dto.numeroDocumento,
      }},
    })
    if (exists) throw new ConflictException('Ya existe un cliente con ese documento')

    return this.prisma.clienteERP.create({
      data: { ...dto, empresaId },
    })
  }

  async update(id: number, dto: UpdateClienteDto, empresaId: number) {
    await this.findOne(id, empresaId)
    return this.prisma.clienteERP.update({ where: { id }, data: dto })
  }

  async toggle(id: number, empresaId: number) {
    const c = await this.findOne(id, empresaId)
    return this.prisma.clienteERP.update({
      where: { id },
      data: { activo: !c.activo },
    })
  }

  // Resumen de cartera por cliente
  async saldos(empresaId: number) {
    const facturas = await this.prisma.facturaVenta.groupBy({
      by: ['clienteId'],
      where: { empresaId, estado: { in: ['EMITIDA', 'PARCIAL'] } },
      _sum: { saldo: true, total: true },
    })
    const clienteIds = facturas.map(f => f.clienteId)
    const clientes = await this.prisma.clienteERP.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nombre: true, numeroDocumento: true },
    })
    return facturas.map(f => ({
      ...clientes.find(c => c.id === f.clienteId),
      totalFacturado: f._sum.total,
      saldo: f._sum.saldo,
    }))
  }
}
