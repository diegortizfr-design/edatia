import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

const PRODUCTO_INCLUDE = {
  categoria: { select: { id: true, nombre: true } },
  marca: { select: { id: true, nombre: true } },
  unidadMedida: { select: { id: true, nombre: true, abreviatura: true } },
  stock: {
    include: { bodega: { select: { id: true, nombre: true, codigo: true } } },
  },
};

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, query?: { q?: string; categoriaId?: number; marcaId?: number; activo?: boolean }) {
    const where: any = { empresaId };
    if (query?.activo !== undefined) where.activo = query.activo;
    if (query?.categoriaId) where.categoriaId = query.categoriaId;
    if (query?.marcaId) where.marcaId = query.marcaId;
    if (query?.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { codigoBarras: { contains: query.q, mode: 'insensitive' } },
        { referencia: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return (this.prisma as any).producto.findMany({
      where,
      include: PRODUCTO_INCLUDE,
      orderBy: { nombre: 'asc' },
    });
  }

  async buscar(q: string, empresaId: number) {
    if (!q || q.length < 2) throw new BadRequestException('Mínimo 2 caracteres para buscar');
    return (this.prisma as any).producto.findMany({
      where: {
        empresaId,
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { codigoBarras: q },
        ],
      },
      include: {
        unidadMedida: { select: { abreviatura: true } },
        stock: { include: { bodega: { select: { id: true, nombre: true } } } },
      },
      take: 20,
    });
  }

  async findOne(id: number, empresaId: number) {
    const p = await (this.prisma as any).producto.findFirst({
      where: { id, empresaId },
      include: PRODUCTO_INCLUDE,
    });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  async create(dto: CreateProductoDto, empresaId: number) {
    const exists = await (this.prisma as any).producto.findUnique({
      where: { empresaId_sku: { empresaId, sku: dto.sku } },
    });
    if (exists) throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    return (this.prisma as any).producto.create({ data: { ...dto, empresaId }, include: PRODUCTO_INCLUDE });
  }

  async update(id: number, dto: UpdateProductoDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.sku) {
      const conflict = await (this.prisma as any).producto.findFirst({
        where: { empresaId, sku: dto.sku, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    }
    return (this.prisma as any).producto.update({ where: { id }, data: dto, include: PRODUCTO_INCLUDE });
  }
}
