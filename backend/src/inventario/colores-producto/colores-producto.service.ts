import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColorProductoDto, UpdateColorProductoDto } from './dto/color-producto.dto';

@Injectable()
export class ColoresProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.colorProducto.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(empresaId: number, dto: CreateColorProductoDto) {
    return this.prisma.colorProducto.create({
      data: {
        nombre: dto.nombre,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateColorProductoDto) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.colorProducto.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.colorProducto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const color = await this.prisma.colorProducto.findFirst({
      where: { id, empresaId },
    });
    if (!color) {
      throw new NotFoundException(`Color no encontrado`);
    }
    return color;
  }
}
