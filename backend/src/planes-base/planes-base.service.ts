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
        modulos: {
          include: { modulo: true }
        }
      },
      orderBy: { precioBase: 'asc' },
    });

    return planes.map((p: any) => ({
      ...p,
      precioBase: Number(p.precioBase),
      descuentoDefinitivo: Number(p.descuentoDefinitivo),
      descuentoParcial: Number(p.descuentoParcial),
      precioAnualFinal: Number(p.precioAnualFinal),
      precioMensualFinal: Number(p.precioMensualFinal),
    }));
  }

  async findOne(id: number) {
    const plan = await (this.prisma as any).planBase.findUnique({
      where: { id },
      include: {
        _count: { select: { clientes: true } },
        modulos: {
          include: { modulo: true }
        }
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan base #${id} no encontrado`);
    }

    return { 
      ...plan, 
      precioBase: Number(plan.precioBase),
      descuentoDefinitivo: Number(plan.descuentoDefinitivo),
      descuentoParcial: Number(plan.descuentoParcial),
      precioAnualFinal: Number(plan.precioAnualFinal),
      precioMensualFinal: Number(plan.precioMensualFinal),
    };
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
      descuentoDefinitivo: dto.descuentoDefinitivo ?? 0,
      descuentoParcial: dto.descuentoParcial ?? 0,
      mesesDescuentoParcial: dto.mesesDescuentoParcial ?? 0,
      precioAnualFinal: dto.precioAnualFinal ?? 0,
      precioMensualFinal: dto.precioMensualFinal ?? dto.precioBase,
    };

    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.limiteUsuarios !== undefined) data.limiteUsuarios = dto.limiteUsuarios;

    if (dto.moduloIds && dto.moduloIds.length > 0) {
      data.modulos = {
        create: dto.moduloIds.map((id) => ({
          modulo: { connect: { id } }
        }))
      };
    }

    const plan = await (this.prisma as any).planBase.create({ 
      data,
      include: { modulos: { include: { modulo: true } } }
    });

    return { 
      ...plan, 
      precioBase: Number(plan.precioBase),
      descuentoDefinitivo: Number(plan.descuentoDefinitivo),
      descuentoParcial: Number(plan.descuentoParcial),
      precioAnualFinal: Number(plan.precioAnualFinal),
      precioMensualFinal: Number(plan.precioMensualFinal),
    };
  }

  async update(id: number, dto: UpdatePlanBaseDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.precioBase !== undefined) data.precioBase = dto.precioBase;
    if (dto.limiteUsuarios !== undefined) data.limiteUsuarios = dto.limiteUsuarios;
    if (dto.descuentoDefinitivo !== undefined) data.descuentoDefinitivo = dto.descuentoDefinitivo;
    if (dto.descuentoParcial !== undefined) data.descuentoParcial = dto.descuentoParcial;
    if (dto.mesesDescuentoParcial !== undefined) data.mesesDescuentoParcial = dto.mesesDescuentoParcial;
    if (dto.precioAnualFinal !== undefined) data.precioAnualFinal = dto.precioAnualFinal;
    if (dto.precioMensualFinal !== undefined) data.precioMensualFinal = dto.precioMensualFinal;

    if (dto.moduloIds !== undefined) {
      // First delete existing
      await (this.prisma as any).planBaseModulo.deleteMany({ where: { planBaseId: id } });
      
      if (dto.moduloIds.length > 0) {
        data.modulos = {
          create: dto.moduloIds.map((modId) => ({
            modulo: { connect: { id: modId } }
          }))
        };
      }
    }

    const plan = await (this.prisma as any).planBase.update({
      where: { id },
      data,
      include: { modulos: { include: { modulo: true } } }
    });

    return { 
      ...plan, 
      precioBase: Number(plan.precioBase),
      descuentoDefinitivo: Number(plan.descuentoDefinitivo),
      descuentoParcial: Number(plan.descuentoParcial),
      precioAnualFinal: Number(plan.precioAnualFinal),
      precioMensualFinal: Number(plan.precioMensualFinal),
    };
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
