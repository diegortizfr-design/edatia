import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBodegaDto, UpdateBodegaDto } from './dto/bodega.dto';

@Injectable()
export class BodegasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, incluirInactivas = false) {
    const where: any = { empresaId };
    if (!incluirInactivas) {
      where.activo = true;
    }
    return (this.prisma as any).bodega.findMany({
      where,
      include: {
        _count: { select: { stock: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number, empresaId: number) {
    const b = await (this.prisma as any).bodega.findFirst({
      where: { id, empresaId },
      include: {
        _count: { select: { stock: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });
    if (!b) throw new NotFoundException('Bodega no encontrada');
    return b;
  }

  async create(dto: CreateBodegaDto, empresaId: number) {
    const exists = await (this.prisma as any).bodega.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: dto.codigo } },
    });
    if (exists) throw new ConflictException(`Ya existe una bodega con código "${dto.codigo}"`);

    // Si se marca como principal, desmarcar las otras de la misma sucursal
    if (dto.esPrincipal && dto.sucursalId) {
      await (this.prisma as any).bodega.updateMany({
        where: { empresaId, sucursalId: dto.sucursalId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    return (this.prisma as any).bodega.create({ data: { ...dto, empresaId } });
  }

  async update(id: number, dto: UpdateBodegaDto, empresaId: number) {
    await this.findOne(id, empresaId);

    if (dto.codigo) {
      const conflict = await (this.prisma as any).bodega.findFirst({
        where: { empresaId, codigo: dto.codigo, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe una bodega con código "${dto.codigo}"`);
    }

    if (dto.esPrincipal) {
      // Obtener sucursalId de la bodega si no viene en el DTO
      let sId = dto.sucursalId;
      if (sId === undefined) {
        const current = await this.findOne(id, empresaId);
        sId = current.sucursalId;
      }

      if (sId) {
        await (this.prisma as any).bodega.updateMany({
          where: { empresaId, sucursalId: sId, esPrincipal: true, NOT: { id } },
          data: { esPrincipal: false },
        });
      }
    }

    return (this.prisma as any).bodega.update({ where: { id }, data: dto });
  }

  async remove(id: number, empresaId: number) {
    const bodega = await this.findOne(id, empresaId);

    if (bodega.esPrincipal) {
      throw new BadRequestException('No se puede eliminar la bodega principal. Primero asigne otra bodega como principal antes de eliminar esta.');
    }

    // Validar si tiene productos con existencias > 0
    const stocksConCantidad = await (this.prisma as any).stock.findMany({
      where: { bodegaId: id, empresaId, cantidad: { gt: 0 } },
      include: { producto: { select: { nombre: true, sku: true } } },
      take: 5,
    });

    if (stocksConCantidad.length > 0) {
      const nombres = stocksConCantidad.map((s: any) => `${s.producto?.nombre || 'Producto'} (${s.producto?.sku || 'S/SKU'})`).join(', ');
      throw new BadRequestException(`No se puede eliminar la bodega porque contiene productos con existencias físicas: ${nombres}. Ajuste o traslade el stock a cero primero.`);
    }

    // Verificar transacciones históricas (movimientos, facturas de venta, órdenes de compra)
    const [movimientosCount, facturasCount, ocsCount] = await Promise.all([
      (this.prisma as any).movimientoInventario.count({
        where: { OR: [{ bodegaOrigenId: id }, { bodegaDestinoId: id }] },
      }),
      (this.prisma as any).facturaVenta.count({
        where: { bodegaId: id },
      }),
      (this.prisma as any).ordenCompra.count({
        where: { bodegaId: id },
      }),
    ]);

    if (movimientosCount > 0 || facturasCount > 0 || ocsCount > 0) {
      // Si tiene historial, desactivar lógicamente para no romper integridad referencial
      return (this.prisma as any).bodega.update({
        where: { id },
        data: { activo: false, nombre: `${bodega.nombre} (Inactiva)` },
      });
    }

    // Si no tiene movimientos ni transacciones, borrar registros de stock vacíos y eliminar la bodega físicamente
    await (this.prisma as any).stock.deleteMany({ where: { bodegaId: id } });
    return (this.prisma as any).bodega.delete({ where: { id } });
  }
}
