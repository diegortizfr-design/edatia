import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSerialesDto {
  productoId: number;
  bodegaId: number;
  seriales: string[];       // lista de números de serie
  loteId?: number;
  notas?: string;
}

export interface ActualizarEstadoDto {
  estado: 'DISPONIBLE' | 'VENDIDO' | 'DEVUELTO' | 'BAJA';
  notas?: string;
}

@Injectable()
export class SerialesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    empresaId: number,
    filters?: { productoId?: number; bodegaId?: number; estado?: string; loteId?: number },
  ) {
    const where: any = { empresaId };
    if (filters?.productoId) where.productoId = filters.productoId;
    if (filters?.bodegaId)   where.bodegaId   = filters.bodegaId;
    if (filters?.estado)     where.estado      = filters.estado;
    if (filters?.loteId)     where.loteId      = filters.loteId;

    return (this.prisma as any).numeroSerie.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        bodega:   { select: { id: true, nombre: true, codigo: true } },
        lote:     { select: { id: true, numero: true, fechaVencimiento: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const s = await (this.prisma as any).numeroSerie.findFirst({
      where: { id, empresaId },
      include: {
        producto: { select: { id: true, nombre: true, sku: true } },
        bodega:   { select: { id: true, nombre: true } },
        lote:     { select: { id: true, numero: true } },
      },
    });
    if (!s) throw new NotFoundException('Número de serie no encontrado');
    return s;
  }

  async buscarPorSerial(serial: string, empresaId: number) {
    return (this.prisma as any).numeroSerie.findFirst({
      where: { serial, empresaId },
      include: {
        producto: { select: { nombre: true, sku: true } },
        bodega:   { select: { nombre: true } },
        lote:     { select: { numero: true, fechaVencimiento: true } },
      },
    });
  }

  /** Ingresa múltiples seriales de una sola vez (entrada de mercancía) */
  async ingresarSeriales(dto: CreateSerialesDto, empresaId: number) {
    const producto = await (this.prisma as any).producto.findFirst({ where: { id: dto.productoId, empresaId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (!producto.manejaSerial) throw new BadRequestException('Este producto no está configurado para manejar seriales');

    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    // Verificar duplicados
    const existentes = await (this.prisma as any).numeroSerie.findMany({
      where: { empresaId, productoId: dto.productoId, serial: { in: dto.seriales } },
      select: { serial: true },
    });
    if (existentes.length > 0) {
      const duplicados = existentes.map((e: any) => e.serial).join(', ');
      throw new ConflictException(`Seriales ya registrados: ${duplicados}`);
    }

    const data = dto.seriales.map(serial => ({
      empresaId,
      productoId: dto.productoId,
      bodegaId: dto.bodegaId,
      loteId: dto.loteId ?? null,
      serial,
      estado: 'DISPONIBLE',
      notas: dto.notas,
    }));

    await (this.prisma as any).numeroSerie.createMany({ data });

    return {
      ingresados: dto.seriales.length,
      seriales: dto.seriales,
    };
  }

  async actualizarEstado(id: number, empresaId: number, dto: ActualizarEstadoDto) {
    await this.findOne(id, empresaId);
    return (this.prisma as any).numeroSerie.update({
      where: { id },
      data: { estado: dto.estado, notas: dto.notas },
    });
  }

  async stats(empresaId: number) {
    const resumen = await (this.prisma as any).numeroSerie.groupBy({
      by: ['estado'],
      where: { empresaId },
      _count: { id: true },
    });

    const result: Record<string, number> = { DISPONIBLE: 0, VENDIDO: 0, DEVUELTO: 0, BAJA: 0 };
    resumen.forEach((r: any) => { result[r.estado] = r._count.id; });
    return { total: Object.values(result).reduce((a, b) => a + b, 0), ...result };
  }
}
