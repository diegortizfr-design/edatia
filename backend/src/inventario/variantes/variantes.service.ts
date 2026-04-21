import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateVarianteDto {
  productoId: number;
  sku: string;
  nombre: string;
  atributos: Array<{ nombre: string; valor: string }>;
  costoPromedio?: number;
  precioBase?: number;
  codigoBarras?: string;
  imagen?: string;
}

export interface AjustarStockVarianteDto {
  bodegaId: number;
  cantidad: number;
}

@Injectable()
export class VariantesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProducto(productoId: number, empresaId: number) {
    const producto = await (this.prisma as any).producto.findFirst({ where: { id: productoId, empresaId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return (this.prisma as any).varianteProducto.findMany({
      where: { productoId, empresaId },
      include: {
        stock: {
          include: { bodega: { select: { id: true, nombre: true, codigo: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const v = await (this.prisma as any).varianteProducto.findFirst({
      where: { id, empresaId },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        stock: {
          include: { bodega: { select: { id: true, nombre: true, codigo: true } } },
        },
      },
    });
    if (!v) throw new NotFoundException('Variante no encontrada');
    return v;
  }

  async create(dto: CreateVarianteDto, empresaId: number) {
    const producto = await (this.prisma as any).producto.findFirst({ where: { id: dto.productoId, empresaId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const existe = await (this.prisma as any).varianteProducto.findFirst({
      where: { empresaId, sku: dto.sku },
    });
    if (existe) throw new ConflictException(`Ya existe una variante con SKU "${dto.sku}"`);

    return (this.prisma as any).varianteProducto.create({
      data: {
        empresaId,
        productoId: dto.productoId,
        sku: dto.sku,
        nombre: dto.nombre,
        atributos: dto.atributos,
        costoPromedio: dto.costoPromedio ?? producto.costoPromedio,
        precioBase: dto.precioBase ?? producto.precioBase,
        codigoBarras: dto.codigoBarras,
        imagen: dto.imagen,
      },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        stock: true,
      },
    });
  }

  async update(id: number, empresaId: number, dto: Partial<CreateVarianteDto>) {
    await this.findOne(id, empresaId);
    if (dto.sku) {
      const conflict = await (this.prisma as any).varianteProducto.findFirst({
        where: { empresaId, sku: dto.sku, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`SKU "${dto.sku}" ya está en uso`);
    }
    return (this.prisma as any).varianteProducto.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        sku: dto.sku,
        atributos: dto.atributos,
        costoPromedio: dto.costoPromedio,
        precioBase: dto.precioBase,
        codigoBarras: dto.codigoBarras,
        imagen: dto.imagen,
      },
    });
  }

  async toggleActivo(id: number, empresaId: number) {
    const v = await this.findOne(id, empresaId);
    return (this.prisma as any).varianteProducto.update({
      where: { id },
      data: { activo: !v.activo },
    });
  }

  /** Ajusta el stock de una variante en una bodega */
  async ajustarStock(id: number, empresaId: number, dto: AjustarStockVarianteDto) {
    const variante = await this.findOne(id, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const stockActual = await (this.prisma as any).stockVariante.findFirst({
      where: { varianteId: id, bodegaId: dto.bodegaId },
    });

    if (dto.cantidad < 0) {
      const disponible = stockActual ? parseFloat(stockActual.cantidad) : 0;
      if (Math.abs(dto.cantidad) > disponible) {
        throw new BadRequestException(`Stock insuficiente. Disponible: ${disponible}`);
      }
    }

    if (stockActual) {
      return (this.prisma as any).stockVariante.update({
        where: { id: stockActual.id },
        data: { cantidad: { increment: dto.cantidad } },
        include: { bodega: { select: { nombre: true } } },
      });
    }

    if (dto.cantidad < 0) throw new BadRequestException('No hay stock en esta bodega para descontar');

    return (this.prisma as any).stockVariante.create({
      data: {
        empresaId,
        varianteId: id,
        bodegaId: dto.bodegaId,
        cantidad: dto.cantidad,
        cantidadReservada: 0,
      },
      include: { bodega: { select: { nombre: true } } },
    });
  }
}
