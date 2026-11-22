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
    let slug = dto.slug || slugify(dto.nombre);
    const exists = await (this.prisma as any).categoria.findUnique({
      where: { empresaId_slug: { empresaId, slug } },
    });
    if (exists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    return (this.prisma as any).categoria.create({
      data: { ...dto, slug, empresaId },
    });
  }

  async update(id: number, dto: UpdateCategoriaDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.parentId && Number(dto.parentId) === Number(id)) {
      throw new ConflictException('Una categoría no puede ser subcategoría de sí misma');
    }
    let slug = dto.slug || (dto.nombre ? slugify(dto.nombre) : undefined);
    if (slug) {
      const conflict = await (this.prisma as any).categoria.findFirst({
        where: { empresaId, slug, NOT: { id } },
      });
      if (conflict) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      dto.slug = slug;
    }
    return (this.prisma as any).categoria.update({ where: { id }, data: dto });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);

    // Validar si tiene subcategorías vinculadas
    const hijosCount = await (this.prisma as any).categoria.count({
      where: { parentId: id, empresaId, activo: true },
    });
    if (hijosCount > 0) {
      throw new ConflictException('No se puede eliminar la categoría porque contiene subcategorías asociadas.');
    }

    // Validar si tiene productos asociados
    const prodsCount = await (this.prisma as any).producto.count({
      where: { categoriaId: id, empresaId },
    });
    if (prodsCount > 0) {
      // Soft-delete si tiene productos asociados
      return (this.prisma as any).categoria.update({
        where: { id },
        data: { activo: false },
      });
    }

    // Eliminación física si no tiene referencias
    return (this.prisma as any).categoria.delete({
      where: { id },
    });
  }
}
