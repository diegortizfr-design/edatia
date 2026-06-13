import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

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
    const slug = dto.slug || slugify(dto.nombre);
    const exists = await (this.prisma as any).categoria.findUnique({
      where: { empresaId_slug: { empresaId, slug } },
    });
    if (exists) throw new ConflictException(`Ya existe una categoría con el slug "${slug}"`);
    return (this.prisma as any).categoria.create({
      data: { ...dto, slug, empresaId },
    });
  }

  async update(id: number, dto: UpdateCategoriaDto, empresaId: number) {
    await this.findOne(id, empresaId);
    const slug = dto.slug || (dto.nombre ? slugify(dto.nombre) : undefined);
    if (slug) {
      const conflict = await (this.prisma as any).categoria.findFirst({
        where: { empresaId, slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe una categoría con el slug "${slug}"`);
      dto.slug = slug;
    }
    return (this.prisma as any).categoria.update({ where: { id }, data: dto });
  }
}
