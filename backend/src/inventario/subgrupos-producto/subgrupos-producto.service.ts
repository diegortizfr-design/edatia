import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubgrupoProductoDto, UpdateSubgrupoProductoDto } from './dto/subgrupo-producto.dto';

@Injectable()
export class SubgruposProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.subgrupoProducto.findMany({
      where: { empresaId },
      include: {
        grupo: { select: { nombre: true } }
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(empresaId: number, dto: CreateSubgrupoProductoDto) {
    return this.prisma.subgrupoProducto.create({
      data: {
        nombre: dto.nombre,
        activo: dto.activo ?? true,
        grupoId: dto.grupoId,
        empresaId,
      },
      include: {
        grupo: { select: { nombre: true } }
      }
    });
  }

  async update(id: number, empresaId: number, dto: UpdateSubgrupoProductoDto) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.subgrupoProducto.update({
      where: { id },
      data: { ...dto },
      include: {
        grupo: { select: { nombre: true } }
      }
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.subgrupoProducto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const subgrupo = await this.prisma.subgrupoProducto.findFirst({
      where: { id, empresaId },
    });
    if (!subgrupo) {
      throw new NotFoundException(`Subgrupo no encontrado`);
    }
    return subgrupo;
  }
}
