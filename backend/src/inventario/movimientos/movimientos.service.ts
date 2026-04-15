import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntradaManualDto, SalidaManualDto, AjusteDto, TrasladoDto } from './dto/movimiento.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async generarNumero(prefijo: string, empresaId: number): Promise<string> {
    const year = new Date().getFullYear();
    // Contar movimientos de este año para esta empresa
    const count = await (this.prisma as any).movimientoInventario.count({
      where: { empresaId, numero: { startsWith: `${prefijo}-${year}-` } },
    });
    const seq = String(count + 1).padStart(5, '0');
    return `${prefijo}-${year}-${seq}`;
  }

  private async getOrCreateStock(productoId: number, bodegaId: number, empresaId: number, tx: any) {
    let stock = await tx.stock.findUnique({
      where: { productoId_bodegaId: { productoId, bodegaId } },
    });
    if (!stock) {
      stock = await tx.stock.create({
        data: { productoId, bodegaId, empresaId, cantidad: 0, cantidadReservada: 0 },
      });
    }
    return stock;
  }

  private async getProducto(productoId: number, empresaId: number) {
    const p = await (this.prisma as any).producto.findFirst({ where: { id: productoId, empresaId } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  // ── Kardex / Historial ─────────────────────────────────────────────────────

  async findAll(empresaId: number, filters?: { productoId?: number; bodegaId?: number; tipo?: string; limit?: number; offset?: number }) {
    const where: any = { empresaId };
    if (filters?.productoId) where.productoId = filters.productoId;
    if (filters?.bodegaId) {
      where.OR = [{ bodegaOrigenId: filters.bodegaId }, { bodegaDestinoId: filters.bodegaId }];
    }
    if (filters?.tipo) where.tipo = filters.tipo;

    const [total, data] = await Promise.all([
      (this.prisma as any).movimientoInventario.count({ where }),
      (this.prisma as any).movimientoInventario.findMany({
        where,
        include: {
          producto: { select: { id: true, nombre: true, sku: true } },
          bodegaOrigen: { select: { id: true, nombre: true, codigo: true } },
          bodegaDestino: { select: { id: true, nombre: true, codigo: true } },
        },
        orderBy: { fechaMovimiento: 'desc' },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
    ]);

    return { total, data };
  }

  async getKardex(productoId: number, empresaId: number, bodegaId?: number) {
    await this.getProducto(productoId, empresaId);

    const where: any = { productoId, empresaId };
    if (bodegaId) {
      where.OR = [{ bodegaOrigenId: bodegaId }, { bodegaDestinoId: bodegaId }];
    }

    return (this.prisma as any).movimientoInventario.findMany({
      where,
      include: {
        bodegaOrigen: { select: { nombre: true, codigo: true } },
        bodegaDestino: { select: { nombre: true, codigo: true } },
      },
      orderBy: { fechaMovimiento: 'asc' },
    });
  }

  // ── Entrada Manual ─────────────────────────────────────────────────────────

  async procesarEntrada(dto: EntradaManualDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const numero = await this.generarNumero('MOV', empresaId);

    return this.prisma.$transaction(async (tx: any) => {
      const stock = await this.getOrCreateStock(dto.productoId, dto.bodegaId, empresaId, tx);

      const cantAnterior = parseFloat(stock.cantidad.toString());
      const cppAnterior = parseFloat(producto.costoPromedio.toString());
      const cantNueva = dto.cantidad;
      const costoNuevo = dto.costoUnitario;

      // Recalcular CPP
      const totalAnterior = cantAnterior * cppAnterior;
      const totalNuevo = cantNueva * costoNuevo;
      const cantidadTotal = cantAnterior + cantNueva;
      const nuevoCPP = cantidadTotal > 0 ? (totalAnterior + totalNuevo) / cantidadTotal : costoNuevo;

      const saldoCantidad = cantidadTotal;
      const saldoCostoTotal = saldoCantidad * nuevoCPP;

      // 1. Actualizar stock
      await tx.stock.update({
        where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
        data: { cantidad: { increment: cantNueva } },
      });

      // 2. Actualizar CPP del producto
      await tx.producto.update({
        where: { id: dto.productoId },
        data: { costoPromedio: nuevoCPP },
      });

      // 3. Crear movimiento (kardex)
      return tx.movimientoInventario.create({
        data: {
          numero,
          empresaId,
          tipo: 'ENTRADA',
          concepto: dto.concepto ?? 'OTRO',
          productoId: dto.productoId,
          bodegaDestinoId: dto.bodegaId,
          cantidad: cantNueva,
          costoUnitario: costoNuevo,
          costoTotal: cantNueva * costoNuevo,
          saldoCantidad,
          saldoCostoTotal,
          saldoCpp: nuevoCPP,
          usuarioId,
          notas: dto.notas,
          referenciaTipo: 'Manual',
        },
      });
    });
  }

  // ── Salida Manual ──────────────────────────────────────────────────────────

  async procesarSalida(dto: SalidaManualDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const stock = await (this.prisma as any).stock.findUnique({
      where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
    });

    const cantidadDisponible = stock ? parseFloat(stock.cantidad.toString()) - parseFloat((stock.cantidadReservada ?? 0).toString()) : 0;

    // Verificar stock suficiente
    const empresa = await (this.prisma as any).empresa.findUnique({
      where: { id: empresaId },
      select: { permiteStockNegativo: true },
    });
    const permiteNegativo = empresa?.permiteStockNegativo ?? false;

    if (!permiteNegativo && cantidadDisponible < dto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${cantidadDisponible}, solicitado: ${dto.cantidad}`
      );
    }

    const numero = await this.generarNumero('MOV', empresaId);
    const cpp = parseFloat(producto.costoPromedio.toString());
    const cantAnterior = stock ? parseFloat(stock.cantidad.toString()) : 0;
    const saldoCantidad = cantAnterior - dto.cantidad;

    return this.prisma.$transaction(async (tx: any) => {
      await tx.stock.updateMany({
        where: { productoId: dto.productoId, bodegaId: dto.bodegaId },
        data: { cantidad: { decrement: dto.cantidad } },
      });

      return tx.movimientoInventario.create({
        data: {
          numero,
          empresaId,
          tipo: 'SALIDA',
          concepto: dto.concepto ?? 'OTRO',
          productoId: dto.productoId,
          bodegaOrigenId: dto.bodegaId,
          cantidad: dto.cantidad,
          costoUnitario: cpp,
          costoTotal: dto.cantidad * cpp,
          saldoCantidad,
          saldoCostoTotal: saldoCantidad * cpp,
          saldoCpp: cpp,
          usuarioId,
          notas: dto.notas,
          referenciaTipo: 'Manual',
        },
      });
    });
  }

  // ── Ajuste ────────────────────────────────────────────────────────────────

  async procesarAjuste(dto: AjusteDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const numero = await this.generarNumero('MOV', empresaId);
    const cpp = parseFloat(producto.costoPromedio.toString());
    const tipo = dto.cantidad >= 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
    const cantAbs = Math.abs(dto.cantidad);

    return this.prisma.$transaction(async (tx: any) => {
      const stock = await this.getOrCreateStock(dto.productoId, dto.bodegaId, empresaId, tx);
      const cantAnterior = parseFloat(stock.cantidad.toString());
      const saldoCantidad = cantAnterior + dto.cantidad;

      await tx.stock.update({
        where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
        data: { cantidad: { increment: dto.cantidad } },
      });

      return tx.movimientoInventario.create({
        data: {
          numero,
          empresaId,
          tipo,
          concepto: 'AJUSTE_FISICO',
          productoId: dto.productoId,
          bodegaOrigenId: dto.cantidad < 0 ? dto.bodegaId : null,
          bodegaDestinoId: dto.cantidad >= 0 ? dto.bodegaId : null,
          cantidad: cantAbs,
          costoUnitario: cpp,
          costoTotal: cantAbs * cpp,
          saldoCantidad,
          saldoCostoTotal: saldoCantidad * cpp,
          saldoCpp: cpp,
          usuarioId,
          notas: dto.notas,
          referenciaTipo: 'Manual',
        },
      });
    });
  }

  // ── Traslado ──────────────────────────────────────────────────────────────

  async procesarTraslado(dto: TrasladoDto, empresaId: number, usuarioId: number) {
    if (dto.bodegaOrigenId === dto.bodegaDestinoId) {
      throw new BadRequestException('La bodega origen y destino deben ser diferentes');
    }

    const producto = await this.getProducto(dto.productoId, empresaId);
    const [bodegaOrigen, bodegaDestino] = await Promise.all([
      (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaOrigenId, empresaId } }),
      (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaDestinoId, empresaId } }),
    ]);
    if (!bodegaOrigen) throw new NotFoundException('Bodega origen no encontrada');
    if (!bodegaDestino) throw new NotFoundException('Bodega destino no encontrada');

    // Verificar stock en origen
    const stockOrigen = await (this.prisma as any).stock.findUnique({
      where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaOrigenId } },
    });
    const cantOrigen = stockOrigen ? parseFloat(stockOrigen.cantidad.toString()) : 0;
    if (cantOrigen < dto.cantidad) {
      throw new BadRequestException(`Stock insuficiente en origen. Disponible: ${cantOrigen}`);
    }

    const cpp = parseFloat(producto.costoPromedio.toString());
    const numeroSalida = await this.generarNumero('MOV', empresaId);

    return this.prisma.$transaction(async (tx: any) => {
      const stockDestino = await this.getOrCreateStock(dto.productoId, dto.bodegaDestinoId, empresaId, tx);

      // Salida de origen
      await tx.stock.update({
        where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaOrigenId } },
        data: { cantidad: { decrement: dto.cantidad } },
      });

      // Entrada en destino
      await tx.stock.update({
        where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaDestinoId } },
        data: { cantidad: { increment: dto.cantidad } },
      });

      const saldoOrigen = cantOrigen - dto.cantidad;
      const saldoDestino = parseFloat(stockDestino.cantidad.toString()) + dto.cantidad;

      const mov1 = await tx.movimientoInventario.create({
        data: {
          numero: numeroSalida,
          empresaId,
          tipo: 'TRASLADO_SALIDA',
          concepto: 'TRASLADO',
          productoId: dto.productoId,
          bodegaOrigenId: dto.bodegaOrigenId,
          bodegaDestinoId: dto.bodegaDestinoId,
          cantidad: dto.cantidad,
          costoUnitario: cpp,
          costoTotal: dto.cantidad * cpp,
          saldoCantidad: saldoOrigen,
          saldoCostoTotal: saldoOrigen * cpp,
          saldoCpp: cpp,
          usuarioId,
          notas: dto.notas,
          referenciaTipo: 'Manual',
        },
      });

      // Número para el movimiento de entrada (mismo número base, diferente fila)
      const mov2 = await tx.movimientoInventario.create({
        data: {
          numero: `${numeroSalida}-E`,
          empresaId,
          tipo: 'TRASLADO_ENTRADA',
          concepto: 'TRASLADO',
          productoId: dto.productoId,
          bodegaOrigenId: dto.bodegaOrigenId,
          bodegaDestinoId: dto.bodegaDestinoId,
          cantidad: dto.cantidad,
          costoUnitario: cpp,
          costoTotal: dto.cantidad * cpp,
          saldoCantidad: saldoDestino,
          saldoCostoTotal: saldoDestino * cpp,
          saldoCpp: cpp,
          usuarioId,
          notas: dto.notas,
          movimientoParId: mov1.id,
          referenciaTipo: 'Manual',
        },
      });

      // Actualizar mov1 con referencia al par
      await tx.movimientoInventario.update({
        where: { id: mov1.id },
        data: { movimientoParId: mov2.id },
      });

      return { traslado: mov1, movimientos: [mov1, mov2] };
    });
  }
}
