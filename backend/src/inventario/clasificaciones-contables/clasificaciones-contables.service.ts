import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClasificacionContableDto, UpdateClasificacionContableDto } from './dto/clasificacion-contable.dto';

@Injectable()
export class ClasificacionesContablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.clasificacionContable.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(empresaId: number, dto: CreateClasificacionContableDto) {
    return this.prisma.clasificacionContable.create({
      data: {
        nombre: dto.nombre,
        pucCuenta: dto.pucCuenta,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateClasificacionContableDto) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.clasificacionContable.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.clasificacionContable.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const clasif = await this.prisma.clasificacionContable.findFirst({
      where: { id, empresaId },
    });
    if (!clasif) {
      throw new NotFoundException(`Clasificación contable no encontrada`);
    }
    return clasif;
  }
}
