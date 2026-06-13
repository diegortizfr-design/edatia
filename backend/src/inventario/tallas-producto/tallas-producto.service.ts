import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTallaProductoDto, UpdateTallaProductoDto } from './dto/talla-producto.dto';

@Injectable()
export class TallasProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.tallaProducto.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(empresaId: number, dto: CreateTallaProductoDto) {
    return this.prisma.tallaProducto.create({
      data: {
        nombre: dto.nombre,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateTallaProductoDto) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.tallaProducto.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);
    return this.prisma.tallaProducto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const talla = await this.prisma.tallaProducto.findFirst({
      where: { id, empresaId },
    });
    if (!talla) {
      throw new NotFoundException(`Talla no encontrada`);
    }
    return talla;
  }
}
