import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarcaDto, UpdateMarcaDto } from './dto/marca.dto';

@Injectable()
export class MarcasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).marca.findMany({
      where: { empresaId },
      include: { _count: { select: { productos: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const marca = await (this.prisma as any).marca.findFirst({ where: { id, empresaId } });
    if (!marca) throw new NotFoundException('Marca no encontrada');
    return marca;
  }

  async create(dto: CreateMarcaDto, empresaId: number) {
    const exists = await (this.prisma as any).marca.findUnique({
      where: { empresaId_nombre: { empresaId, nombre: dto.nombre } },
    });
    if (exists) throw new ConflictException(`Ya existe la marca "${dto.nombre}"`);
    return (this.prisma as any).marca.create({ data: { ...dto, empresaId } });
  }

  async update(id: number, dto: UpdateMarcaDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.nombre) {
      const conflict = await (this.prisma as any).marca.findFirst({
        where: { empresaId, nombre: dto.nombre, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe la marca "${dto.nombre}"`);
    }
    return (this.prisma as any).marca.update({ where: { id }, data: dto });
  }
}
