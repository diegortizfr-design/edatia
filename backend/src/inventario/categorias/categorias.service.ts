import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).categoria.findMany({
      where: { empresaId },
      include: {
        parent: { select: { id: true, nombre: true } },
        _count: { select: { hijos: true, productos: true } },
      },
      orderBy: [{ parentId: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number, empresaId: number) {
    const cat = await (this.prisma as any).categoria.findFirst({
      where: { id, empresaId },
      include: {
        parent: { select: { id: true, nombre: true } },
        hijos: { select: { id: true, nombre: true, activo: true } },
        _count: { select: { productos: true } },
      },
    });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoriaDto, empresaId: number) {
    const exists = await (this.prisma as any).categoria.findUnique({
      where: { empresaId_slug: { empresaId, slug: dto.slug } },
    });
    if (exists) throw new ConflictException(`Ya existe una categoría con el slug "${dto.slug}"`);
    return (this.prisma as any).categoria.create({
      data: { ...dto, empresaId },
    });
  }

  async update(id: number, dto: UpdateCategoriaDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.slug) {
      const conflict = await (this.prisma as any).categoria.findFirst({
        where: { empresaId, slug: dto.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe una categoría con el slug "${dto.slug}"`);
    }
    return (this.prisma as any).categoria.update({ where: { id }, data: dto });
  }
}
