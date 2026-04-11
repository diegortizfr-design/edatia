import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColaboradorDto, UpdateColaboradorDto } from './dto/colaborador.dto';

const ROLES = ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] as const;

@Injectable()
export class ColaboradoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).colaborador.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        perfilCargo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        perfilCargo: true,
      },
    });

    if (!colaborador) {
      throw new NotFoundException(`Colaborador #${id} no encontrado`);
    }

    return colaborador;
  }

  async create(dto: CreateColaboradorDto) {
    const existing = await (this.prisma as any).colaborador.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un colaborador con ese email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return (this.prisma as any).colaborador.create({
      data: {
        email: dto.email,
        nombre: dto.nombre,
        password: hashedPassword,
        rol: dto.rol,
        ...(dto.perfilCargoId ? { perfilCargoId: dto.perfilCargoId } : {}),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        perfilCargo: true,
      },
    });
  }

  async update(id: number, dto: UpdateColaboradorDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.perfilCargoId !== undefined) data.perfilCargoId = dto.perfilCargoId;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return (this.prisma as any).colaborador.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        updatedAt: true,
        perfilCargo: true,
      },
    });
  }

  async toggleActivo(id: number) {
    const colaborador = await this.findOne(id);

    return (this.prisma as any).colaborador.update({
      where: { id },
      data: { activo: !colaborador.activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });
  }

  async stats() {
    const total = await (this.prisma as any).colaborador.count();

    const porRolRaw = await (this.prisma as any).colaborador.groupBy({
      by: ['rol'],
      _count: { rol: true },
    });

    const porRol: Record<string, number> = {
      ADMIN: 0,
      COMERCIAL: 0,
      COORDINACION: 0,
      OPERACION: 0,
    };

    for (const item of porRolRaw) {
      porRol[item.rol] = item._count.rol;
    }

    const activos = await (this.prisma as any).colaborador.count({
      where: { activo: true },
    });

    return { total, activos, porRol };
  }
}
