import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';

@Injectable()
export class VendedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return this.prisma.vendedor.findMany({
      where: {
        empresaId,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async create(empresaId: number, dto: CreateVendedorDto) {
    return this.prisma.vendedor.create({
      data: {
        ...dto,
        comisionPct: dto.comisionPct ?? 0,
        activo: dto.activo ?? true,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateVendedorDto) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.vendedor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.vendedor.update({
      where: { id },
      data: { activo: false },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const vendedor = await this.prisma.vendedor.findFirst({
      where: { id, empresaId },
    });

    if (!vendedor) {
      throw new NotFoundException(`Vendedor con id ${id} no encontrado`);
    }

    return vendedor;
  }
}
