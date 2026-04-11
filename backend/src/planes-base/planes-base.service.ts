import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanBaseDto, UpdatePlanBaseDto } from './dto/plan-base.dto';

@Injectable()
export class PlanesBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const planes = await (this.prisma as any).planBase.findMany({
      include: {
        _count: { select: { clientes: true } },
      },
      orderBy: { precioBase: 'asc' },
    });

    return planes.map((p: any) => ({
      ...p,
      precioBase: Number(p.precioBase),
    }));
  }

  async findOne(id: number) {
    const plan = await (this.prisma as any).planBase.findUnique({
      where: { id },
      include: {
        _count: { select: { clientes: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan base #${id} no encontrado`);
    }

    return { ...plan, precioBase: Number(plan.precioBase) };
  }

  async create(dto: CreatePlanBaseDto) {
    const existing = await (this.prisma as any).planBase.findFirst({
      where: { nombre: dto.nombre },
    });

    if (existing) {
      throw new ConflictException('Ya existe un plan con ese nombre');
    }

    const data: Record<string, unknown> = {
      nombre: dto.nombre,
      precioBase: dto.precioBase,
    };

    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.limiteUsuarios !== undefined) data.limiteUsuarios = dto.limiteUsuarios;

    const plan = await (this.prisma as any).planBase.create({ data });

    return { ...plan, precioBase: Number(plan.precioBase) };
  }

  async update(id: number, dto: UpdatePlanBaseDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.precioBase !== undefined) data.precioBase = dto.precioBase;
    if (dto.limiteUsuarios !== undefined) data.limiteUsuarios = dto.limiteUsuarios;

    const plan = await (this.prisma as any).planBase.update({
      where: { id },
      data,
    });

    return { ...plan, precioBase: Number(plan.precioBase) };
  }

  async remove(id: number) {
    const plan = await (this.prisma as any).planBase.findUnique({
      where: { id },
      include: {
        _count: { select: { clientes: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan base #${id} no encontrado`);
    }

    if (plan._count.clientes > 0) {
      throw new ConflictException(
        `No se puede eliminar el plan: tiene ${plan._count.clientes} cliente(s) asignado(s)`,
      );
    }

    return (this.prisma as any).planBase.delete({ where: { id } });
  }
}
