import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagProductoDto, UpdateTagProductoDto } from './dto/tag-producto.dto';

@Injectable()
export class TagsProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.tagProducto.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(empresaId: number, dto: CreateTagProductoDto) {
    return this.prisma.tagProducto.create({
      data: {
        nombre: dto.nombre,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateTagProductoDto) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.tagProducto.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.tagProducto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const tag = await this.prisma.tagProducto.findFirst({
      where: { id, empresaId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag no encontrado`);
    }
    return tag;
  }
}
