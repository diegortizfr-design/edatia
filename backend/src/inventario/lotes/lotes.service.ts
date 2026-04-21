import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateLoteDto {
  productoId: number;
  bodegaId: number;
  numero: string;
  cantidadInicial: number;
  fechaVencimiento?: string;
  fechaFabricacion?: string;
  proveedor?: string;
  notas?: string;
}

export interface SalidaLoteDto {
  productoId: number;
  bodegaId: number;
  cantidad: number;
  concepto?: string;
  notas?: string;
  usuarioId?: number;
}

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, filters?: { productoId?: number; bodegaId?: number; soloActivos?: boolean; soloConStock?: boolean }) {
    const where: any = { empresaId };
    if (filters?.productoId) where.productoId = filters.productoId;
    if (filters?.bodegaId)   where.bodegaId   = filters.bodegaId;
    if (filters?.soloActivos) where.activo = true;
    if (filters?.soloConStock) where.cantidad = { gt: 0 };

    return (this.prisma as any).lote.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true, sku: true, costoPromedio: true } },
        bodega:   { select: { id: true, nombre: true, codigo: true } },
        _count:   { select: { seriales: true } },
      },
      orderBy: [{ fechaVencimiento: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: number, empresaId: number) {
    const lote = await (this.prisma as any).lote.findFirst({
      where: { id, empresaId },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        bodega:   { select: { id: true, nombre: true, codigo: true } },
        seriales: { select: { id: true, serial: true, estado: true } },
      },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return lote;
  }

  async create(dto: CreateLoteDto, empresaId: number) {
    const producto = await (this.prisma as any).producto.findFirst({ where: { id: dto.productoId, empresaId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (!producto.manejaLotes) throw new BadRequestException('Este producto no está configurado para manejar lotes');

    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const existe = await (this.prisma as any).lote.findFirst({
      where: { empresaId, productoId: dto.productoId, bodegaId: dto.bodegaId, numero: dto.numero },
    });
    if (existe) throw new ConflictException(`Ya existe el lote "${dto.numero}" para este producto y bodega`);

    return (this.prisma as any).lote.create({
      data: {
        empresaId,
        productoId: dto.productoId,
        bodegaId: dto.bodegaId,
        numero: dto.numero,
        cantidadInicial: dto.cantidadInicial,
        cantidad: dto.cantidadInicial,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        fechaFabricacion: dto.fechaFabricacion ? new Date(dto.fechaFabricacion) : null,
        proveedor: dto.proveedor,
        notas: dto.notas,
      },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        bodega:   { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }

  /**
   * Sugiere qué lotes consumir usando FEFO
   * (First Expired First Out — vence antes, sale primero)
   */
  async sugerirFefo(productoId: number, bodegaId: number, empresaId: number, cantidadRequerida: number) {
    const lotes = await (this.prisma as any).lote.findMany({
      where: { empresaId, productoId, bodegaId, activo: true, cantidad: { gt: 0 } },
      orderBy: [
        { fechaVencimiento: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });

    const sugeridos: any[] = [];
    let restante = cantidadRequerida;

    for (const lote of lotes) {
      if (restante <= 0) break;
      const disponible = parseFloat(lote.cantidad);
      const tomarDe    = Math.min(disponible, restante);
      sugeridos.push({
        loteId: lote.id,
        numero: lote.numero,
        fechaVencimiento: lote.fechaVencimiento,
        disponible,
        cantidadSugerida: tomarDe,
      });
      restante -= tomarDe;
    }

    return {
      sugeridos,
      cantidadDisponible: cantidadRequerida - restante,
      stockSuficiente: restante <= 0,
    };
  }

  /** Descuenta cantidad de un lote (llamado desde movimientos) */
  async descontarLote(loteId: number, cantidad: number, tx: any) {
    const lote = await tx.lote.findUnique({ where: { id: loteId } });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    const nueva = parseFloat(lote.cantidad) - cantidad;
    if (nueva < 0) throw new BadRequestException(`Stock insuficiente en lote ${lote.numero}`);
    return tx.lote.update({ where: { id: loteId }, data: { cantidad: nueva } });
  }

  /** Lotes próximos a vencer (dentro de N días) */
  async proximosAVencer(empresaId: number, dias: number = 30) {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);

    return (this.prisma as any).lote.findMany({
      where: {
        empresaId,
        activo: true,
        cantidad: { gt: 0 },
        fechaVencimiento: { lte: limite, gte: new Date() },
      },
      include: {
        producto: { select: { nombre: true, sku: true } },
        bodega:   { select: { nombre: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async update(id: number, empresaId: number, data: Partial<CreateLoteDto>) {
    await this.findOne(id, empresaId);
    return (this.prisma as any).lote.update({
      where: { id },
      data: {
        notas: data.notas,
        proveedor: data.proveedor,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      },
    });
  }
}
