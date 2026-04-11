import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, AsignarModuloDto } from './dto/cliente.dto';

const ESTADOS = ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] as const;

@Injectable()
export class ClientesManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { estado?: string; asesorId?: number }) {
    const where: Record<string, unknown> = {};

    if (filters?.estado) {
      where['estado'] = filters.estado;
    }

    if (filters?.asesorId) {
      where['asesorId'] = filters.asesorId;
    }

    const clientes = await (this.prisma as any).clienteManager.findMany({
      where,
      include: {
        planBase: true,
        asesor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        modulosActivos: {
          include: { modulo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clientes.map((c: any) => ({
      ...c,
      planBase: c.planBase
        ? { ...c.planBase, precioBase: Number(c.planBase.precioBase) }
        : null,
      modulosActivos: c.modulosActivos.map((ma: any) => ({
        ...ma,
        precioNegociado: ma.precioNegociado !== null ? Number(ma.precioNegociado) : null,
        modulo: { ...ma.modulo, precioAnual: Number(ma.modulo.precioAnual) },
      })),
    }));
  }

  async findOne(id: number) {
    const cliente = await (this.prisma as any).clienteManager.findUnique({
      where: { id },
      include: {
        planBase: true,
        asesor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        modulosActivos: {
          include: { modulo: true },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente #${id} no encontrado`);
    }

    return {
      ...cliente,
      planBase: cliente.planBase
        ? { ...cliente.planBase, precioBase: Number(cliente.planBase.precioBase) }
        : null,
      modulosActivos: cliente.modulosActivos.map((ma: any) => ({
        ...ma,
        precioNegociado: ma.precioNegociado !== null ? Number(ma.precioNegociado) : null,
        modulo: { ...ma.modulo, precioAnual: Number(ma.modulo.precioAnual) },
      })),
    };
  }

  async create(dto: CreateClienteDto) {
    const existing = await (this.prisma as any).clienteManager.findFirst({
      where: { nit: dto.nit },
    });

    if (existing) {
      throw new ConflictException('Ya existe un cliente con ese NIT');
    }

    const data: Record<string, unknown> = {
      nit: dto.nit,
      nombre: dto.nombre,
      estado: dto.estado ?? 'PROSPECTO',
    };

    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad;
    if (dto.contacto !== undefined) data.contacto = dto.contacto;
    if (dto.planBaseId !== undefined) data.planBaseId = dto.planBaseId;
    if (dto.asesorId !== undefined) data.asesorId = dto.asesorId;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return (this.prisma as any).clienteManager.create({ data });
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad;
    if (dto.contacto !== undefined) data.contacto = dto.contacto;
    if (dto.estado !== undefined) data.estado = dto.estado;
    if (dto.planBaseId !== undefined) data.planBaseId = dto.planBaseId;
    if (dto.asesorId !== undefined) data.asesorId = dto.asesorId;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return (this.prisma as any).clienteManager.update({ where: { id }, data });
  }

  async stats() {
    const total = await (this.prisma as any).clienteManager.count();

    const porEstadoRaw = await (this.prisma as any).clienteManager.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });

    const porEstado: Record<string, number> = {
      PROSPECTO: 0,
      ACTIVO: 0,
      SUSPENDIDO: 0,
      CANCELADO: 0,
    };

    for (const item of porEstadoRaw) {
      porEstado[item.estado] = item._count.estado;
    }

    // Ingresos mensuales = sum(precioNegociado ?? modulo.precioAnual) / 12
    const planesActivos = await (this.prisma as any).planCliente.findMany({
      where: { activo: true },
      include: { modulo: { select: { precioAnual: true } } },
    });

    const ingresosMensuales = planesActivos.reduce((acc: number, plan: any) => {
      const precio =
        plan.precioNegociado !== null
          ? Number(plan.precioNegociado)
          : Number(plan.modulo.precioAnual);
      return acc + precio / 12;
    }, 0);

    return {
      total,
      porEstado,
      ingresosMensuales: Math.round(ingresosMensuales),
    };
  }

  async asignarModulo(clienteId: number, dto: AsignarModuloDto) {
    await this.findOne(clienteId);

    const existingPlan = await (this.prisma as any).planCliente.findFirst({
      where: {
        clienteId,
        moduloId: dto.moduloId,
        activo: true,
      },
    });

    if (existingPlan) {
      throw new ConflictException('El módulo ya está activo para este cliente');
    }

    const data: Record<string, unknown> = {
      clienteId,
      moduloId: dto.moduloId,
      activo: true,
    };

    if (dto.precioNegociado !== undefined) {
      data.precioNegociado = dto.precioNegociado;
    }

    const plan = await (this.prisma as any).planCliente.create({
      data,
      include: { modulo: true },
    });

    return {
      ...plan,
      precioNegociado: plan.precioNegociado !== null ? Number(plan.precioNegociado) : null,
      modulo: { ...plan.modulo, precioAnual: Number(plan.modulo.precioAnual) },
    };
  }

  async desactivarModulo(clienteId: number, moduloId: number) {
    await this.findOne(clienteId);

    const plan = await (this.prisma as any).planCliente.findFirst({
      where: { clienteId, moduloId, activo: true },
    });

    if (!plan) {
      throw new NotFoundException('El módulo no está activo para este cliente');
    }

    return (this.prisma as any).planCliente.update({
      where: { id: plan.id },
      data: { activo: false },
    });
  }
}
