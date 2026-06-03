import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoProductoDto } from './dto/create-grupo-producto.dto';
import { UpdateGrupoProductoDto } from './dto/update-grupo-producto.dto';

@Injectable()
export class GruposProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.grupoProducto.findMany({
      where: {
        empresaId,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async create(empresaId: number, dto: CreateGrupoProductoDto) {
    return this.prisma.grupoProducto.create({
      data: {
        ...dto,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateGrupoProductoDto) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.grupoProducto.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.grupoProducto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const grupoProducto = await this.prisma.grupoProducto.findFirst({
      where: { id, empresaId },
    });

    if (!grupoProducto) {
      throw new NotFoundException(
        `Grupo de producto con id ${id} no encontrado`,
      );
    }

    return grupoProducto;
  }
}
