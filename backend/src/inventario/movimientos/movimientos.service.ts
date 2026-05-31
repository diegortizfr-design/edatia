import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import {
  EntradaManualDto, SalidaManualDto, AjusteDto, TrasladoDto,
  DevolucionProveedorDto, DevolucionClienteDto,
} from './dto/movimiento.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MovimientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Registra una salida de inventario de forma centralizada.
   * Puede ser llamada desde otros servicios dentro de una transacción.
   */
  async registrarSalidaInterna(
    tx: any,
    data: {
      empresaId: number;
      productoId: number;
      bodegaId: number;
      cantidad: number;
      concepto: string;
      tipo: string;
      referenciaId?: string;
      referenciaTipo?: string;
      usuarioId?: number;
      numeroMov?: string;
      notas?: string;
      loteNumero?: string;
      seriales?: string[];
    },
  ) {
    const producto = await tx.producto.findUnique({ where: { id: data.productoId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const stock = await this.getOrCreateStock(data.productoId, data.bodegaId, data.empresaId, tx);
    const cantidadDisponible = Number(stock.cantidad) - Number(stock.cantidadReservada ?? 0);

    // Verificar política de stock negativo
    const empresa = await tx.empresa.findUnique({
      where: { id: data.empresaId },
      select: { permiteStockNegativo: true },
    });
    const bodega = await tx.bodega.findUnique({
      where: { id: data.bodegaId },
      select: { permiteStockNegativo: true },
    });
    const permiteNegativo = (empresa?.permiteStockNegativo ?? false) && (bodega?.permiteStockNegativo ?? false);
    
    if (!permiteNegativo && cantidadDisponible < data.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${cantidadDisponible}, solicitado: ${data.cantidad}`,
      );
    }

    const cpp = Number(producto.costoPromedio);
    const saldoAnterior = Number(stock.cantidad);
    const nuevoSaldo = saldoAnterior - data.cantidad;
    const numero = data.numeroMov || (await this.generarNumero('MOV', data.empresaId));

    // 1. Actualizar Stock
    await tx.stock.update({
      where: { id: stock.id },
      data: { cantidad: { decrement: data.cantidad } },
    });

    const loteNotas = data.loteNumero ? ` [Lote: ${data.loteNumero}]` : '';
    const finalNotas = data.notas ? `${data.notas}${loteNotas}` : `${data.concepto}${loteNotas}`;

    // 2. Crear Movimiento (Kardex)
    // NOTA: Guardamos cantidad absoluta (positiva), el tipo define la dirección.
    const mov = await tx.movimientoInventario.create({
      data: {
        empresaId: data.empresaId,
        numero,
        tipo: data.tipo,
        concepto: data.concepto,
        productoId: data.productoId,
        bodegaOrigenId: data.bodegaId,
        cantidad: data.cantidad,
        costoUnitario: cpp,
        costoTotal: data.cantidad * cpp,
        saldoCantidad: nuevoSaldo,
        saldoCostoTotal: nuevoSaldo * cpp,
        saldoCpp: cpp,
        usuarioId: data.usuarioId,
        referenciaId: data.referenciaId,
        referenciaTipo: data.referenciaTipo,
        notas: finalNotas,
      },
    });

    // ── Consumo de Lotes por FEFO / Específico ──────────────────
    if (producto.manejaLotes) {
      if (data.loteNumero) {
        const lote = await tx.lote.findFirst({
          where: {
            empresaId: data.empresaId,
            productoId: data.productoId,
            bodegaId: data.bodegaId,
            numero: data.loteNumero,
          },
        });
        if (!lote) {
          if (!permiteNegativo) {
            throw new BadRequestException(`El lote ${data.loteNumero} no existe en esta bodega.`);
          } else {
            await tx.lote.create({
              data: {
                empresaId: data.empresaId,
                productoId: data.productoId,
                bodegaId: data.bodegaId,
                numero: data.loteNumero,
                cantidad: -data.cantidad,
                cantidadInicial: 0,
                activo: true,
              },
            });
          }
        } else {
          const cantLote = Number(lote.cantidad);
          if (!permiteNegativo && cantLote < data.cantidad) {
            throw new BadRequestException(`Stock insuficiente en el lote ${data.loteNumero}. Disponible: ${cantLote}`);
          }
          await tx.lote.update({
            where: { id: lote.id },
            data: { cantidad: { decrement: data.cantidad } },
          });
        }
      } else {
        const lotes = await tx.lote.findMany({
          where: {
            productoId: data.productoId,
            bodegaId: data.bodegaId,
            empresaId: data.empresaId,
            cantidad: { gt: 0 },
            activo: true,
          },
          orderBy: [
            { fechaVencimiento: 'asc' },
            { id: 'asc' },
          ],
        });

        let restante = data.cantidad;
        for (const lote of lotes) {
          if (restante <= 0) break;
          const cantLote = Number(lote.cantidad);
          if (cantLote <= restante) {
            await tx.lote.update({
              where: { id: lote.id },
              data: { cantidad: 0 },
            });
            restante -= cantLote;
          } else {
            await tx.lote.update({
              where: { id: lote.id },
              data: { cantidad: { decrement: restante } },
            });
            restante = 0;
            break;
          }
        }

        if (restante > 0) {
          if (lotes.length > 0) {
            await tx.lote.update({
              where: { id: lotes[0].id },
              data: { cantidad: { decrement: restante } },
            });
          } else {
            await tx.lote.create({
              data: {
                empresaId: data.empresaId,
                productoId: data.productoId,
                bodegaId: data.bodegaId,
                numero: 'LOTE-GENERICO-NEG',
                cantidad: -restante,
                cantidadInicial: 0,
                activo: true,
              },
            });
          }
        }
      }
    }

    // ── Consumo de Seriales ─────────────────────────────────────
    if (producto.manejaSerial) {
      let nuevoEstado = 'VENDIDO';
      if (data.concepto === 'MERMA' || data.concepto === 'averia' || data.concepto === 'perdida' || data.concepto === 'dar de baja') {
        nuevoEstado = 'BAJA';
      }

      if (data.seriales && data.seriales.length > 0) {
        await tx.numeroSerie.updateMany({
          where: {
            empresaId: data.empresaId,
            productoId: data.productoId,
            serial: { in: data.seriales },
          },
          data: {
            estado: nuevoEstado,
            bodegaId: null,
            movimientoSalidaId: mov.id,
          },
        });
      } else {
        const serialsDisponibles = await tx.numeroSerie.findMany({
          where: {
            empresaId: data.empresaId,
            productoId: data.productoId,
            bodegaId: data.bodegaId,
            estado: 'DISPONIBLE',
          },
          orderBy: { id: 'asc' },
          take: Math.ceil(data.cantidad),
        });

        const serialIds = serialsDisponibles.map(s => s.id);
        if (serialIds.length > 0) {
          await tx.numeroSerie.updateMany({
            where: { id: { in: serialIds } },
            data: {
              estado: nuevoEstado,
              bodegaId: null,
              movimientoSalidaId: mov.id,
            },
          });
        }
      }
    }

    // 3. Auditoría
    void this.auditLog.log({
      accion: 'STOCK_OUT',
      entidad: 'Producto',
      entidadId: data.productoId,
      colaboradorId: data.usuarioId,
      detalles: {
        cantidad: data.cantidad,
        tipo: data.tipo,
        concepto: data.concepto,
        bodegaId: data.bodegaId,
        numeroMov: numero,
      },
    });

    return mov;
  }


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

  private async getOrCreateBodegaEspecial(empresaId: number, codigo: string, nombre: string, tx: any) {
    let bodega = await tx.bodega.findUnique({
      where: { empresaId_codigo: { empresaId, codigo } },
    });
    if (!bodega) {
      bodega = await tx.bodega.create({
        data: {
          empresaId,
          codigo,
          nombre,
          tipo: 'VIRTUAL',
          activo: true,
          esPrincipal: false,
          permiteStockNegativo: true,
        },
      });
    }
    return bodega;
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

    // Validaciones de Lotes y Seriales
    if (producto.manejaLotes && !dto.loteNumero) {
      throw new BadRequestException(`Debe especificar el número de lote para el producto ${producto.nombre}`);
    }
    if (producto.manejaSerial) {
      if (!dto.seriales || dto.seriales.length === 0) {
        throw new BadRequestException(`Debe especificar los números de serie para el producto ${producto.nombre}`);
      }
      if (dto.seriales.length !== Math.ceil(dto.cantidad)) {
        throw new BadRequestException(`La cantidad de seriales (${dto.seriales.length}) no coincide con la cantidad a ingresar (${dto.cantidad})`);
      }
    }

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

      // 3. Procesar Lote
      let loteId: number | undefined;
      if (producto.manejaLotes && dto.loteNumero) {
        let lote = await tx.lote.findFirst({
          where: {
            empresaId,
            productoId: dto.productoId,
            bodegaId: dto.bodegaId,
            numero: dto.loteNumero,
          },
        });
        if (lote) {
          lote = await tx.lote.update({
            where: { id: lote.id },
            data: {
              cantidad: { increment: cantNueva },
              cantidadInicial: { increment: cantNueva },
              fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : lote.fechaVencimiento,
            },
          });
        } else {
          lote = await tx.lote.create({
            data: {
              empresaId,
              productoId: dto.productoId,
              bodegaId: dto.bodegaId,
              numero: dto.loteNumero,
              cantidadInicial: cantNueva,
              cantidad: cantNueva,
              fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
              activo: true,
            },
          });
        }
        loteId = lote.id;
      }

      // 4. Crear movimiento (kardex)
      const loteNotas = dto.loteNumero ? ` [Lote: ${dto.loteNumero}]` : '';
      const mov = await tx.movimientoInventario.create({
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
          notas: dto.notas ? `${dto.notas}${loteNotas}` : (dto.concepto ?? 'OTRO') + loteNotas,
          referenciaTipo: 'Manual',
        },
      });

      // 5. Procesar Seriales
      if (producto.manejaSerial && dto.seriales && dto.seriales.length > 0) {
        for (const s of dto.seriales) {
          const existeSerial = await tx.numeroSerie.findFirst({
            where: {
              empresaId,
              productoId: dto.productoId,
              serial: s,
            },
          });
          if (existeSerial) {
            await tx.numeroSerie.update({
              where: { id: existeSerial.id },
              data: {
                estado: 'DISPONIBLE',
                bodegaId: dto.bodegaId,
                loteId: loteId ?? null,
                movimientoEntradaId: mov.id,
              },
            });
          } else {
            await tx.numeroSerie.create({
              data: {
                empresaId,
                productoId: dto.productoId,
                bodegaId: dto.bodegaId,
                loteId: loteId ?? null,
                serial: s,
                estado: 'DISPONIBLE',
                movimientoEntradaId: mov.id,
              },
            });
          }
        }
      }

      return mov;
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
    const permiteNegativo = (empresa?.permiteStockNegativo ?? false) && (bodega?.permiteStockNegativo ?? false);

    if (!permiteNegativo && cantidadDisponible < dto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${cantidadDisponible}, solicitado: ${dto.cantidad}`
      );
    }

    // Validar seriales si maneja serial
    if (producto.manejaSerial && dto.seriales && dto.seriales.length > 0) {
      if (dto.seriales.length !== Math.ceil(dto.cantidad)) {
        throw new BadRequestException(`La cantidad de seriales (${dto.seriales.length}) no coincide con la salida (${dto.cantidad})`);
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      return this.registrarSalidaInterna(tx, {
        empresaId,
        productoId: dto.productoId,
        bodegaId: dto.bodegaId,
        cantidad: dto.cantidad,
        concepto: dto.concepto ?? 'Salida Manual',
        tipo: 'SALIDA',
        usuarioId,
        notas: dto.notas,
        loteNumero: dto.loteNumero,
        seriales: dto.seriales,
      });
    });
  }

  // ── Ajuste ────────────────────────────────────────────────────────────────

  async procesarAjuste(dto: AjusteDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    let bodegaIdProcesamiento = dto.bodegaId;
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const numero = await this.generarNumero('MOV', empresaId);
    const cppAnterior = parseFloat(producto.costoPromedio.toString());
    const tipo = dto.cantidad >= 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
    const cantAbs = Math.abs(dto.cantidad);

    // Validaciones
    if (dto.cantidad >= 0) {
      if (producto.manejaLotes && !dto.loteNumero) {
        throw new BadRequestException(`Debe especificar el número de lote para el producto ${producto.nombre}`);
      }
      if (producto.manejaSerial) {
        if (!dto.seriales || dto.seriales.length === 0) {
          throw new BadRequestException(`Debe especificar los números de serie para el producto ${producto.nombre}`);
        }
        if (dto.seriales.length !== Math.ceil(cantAbs)) {
          throw new BadRequestException(`La cantidad de seriales (${dto.seriales.length}) no coincide con el ajuste (${cantAbs})`);
        }
      }
    } else {
      if (producto.manejaSerial && dto.seriales && dto.seriales.length > 0) {
        if (dto.seriales.length !== Math.ceil(cantAbs)) {
          throw new BadRequestException(`La cantidad de seriales (${dto.seriales.length}) no coincide con el ajuste (${cantAbs})`);
        }
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      // BC-02 + BC-03: Si el motivo es DAR_DE_BAJA, procesamos desde la bodega especial de averías/pérdidas
      if (dto.motivo === 'DAR_DE_BAJA') {
        const esPerdida = dto.notas?.toLowerCase().includes('pérdidas') || dto.notas?.toLowerCase().includes('perdidas');
        const codigoBolsa = esPerdida ? 'B-PERDIDAS' : 'B-AVERIAS';
        const nombreBolsa = esPerdida ? 'Bolsa de Pérdidas' : 'Bolsa de Averías';
        const bodegaEspecial = await this.getOrCreateBodegaEspecial(empresaId, codigoBolsa, nombreBolsa, tx);
        bodegaIdProcesamiento = bodegaEspecial.id;
      }

      // Si es un ajuste negativo por avería o pérdida, hacemos un traslado interno a la bodega especial
      if (dto.cantidad < 0 && (dto.motivo === 'AVERIA' || dto.motivo === 'PERDIDA')) {
        // Descontar stock de la bodega de origen
        const stockOrigen = await this.getOrCreateStock(dto.productoId, dto.bodegaId, empresaId, tx);
        const cantOrigen = parseFloat(stockOrigen.cantidad.toString());
        if (cantOrigen < cantAbs) {
          throw new BadRequestException(`Stock insuficiente en origen para avería/pérdida. Disponible: ${cantOrigen}`);
        }
        await tx.stock.update({
          where: { id: stockOrigen.id },
          data: { cantidad: { decrement: cantAbs } },
        });

        // Crear/sumar stock a la bodega especial
        const codigoBolsa = dto.motivo === 'AVERIA' ? 'B-AVERIAS' : 'B-PERDIDAS';
        const nombreBolsa = dto.motivo === 'AVERIA' ? 'Bolsa de Averías' : 'Bolsa de Pérdidas';
        const bodegaEspecial = await this.getOrCreateBodegaEspecial(empresaId, codigoBolsa, nombreBolsa, tx);
        const stockEspecial = await this.getOrCreateStock(dto.productoId, bodegaEspecial.id, empresaId, tx);
        await tx.stock.update({
          where: { id: stockEspecial.id },
          data: { cantidad: { increment: cantAbs } },
        });

        // Procesar lote en origen y destino si aplica
        let loteId: number | undefined;
        if (producto.manejaLotes) {
          if (dto.loteNumero) {
            const loteOrigen = await tx.lote.findFirst({
              where: { empresaId, productoId: dto.productoId, bodegaId: dto.bodegaId, numero: dto.loteNumero },
            });
            if (loteOrigen) {
              await tx.lote.update({
                where: { id: loteOrigen.id },
                data: { cantidad: { decrement: cantAbs } },
              });
              let loteEspecial = await tx.lote.findFirst({
                where: { empresaId, productoId: dto.productoId, bodegaId: bodegaEspecial.id, numero: dto.loteNumero },
              });
              if (loteEspecial) {
                await tx.lote.update({
                  where: { id: loteEspecial.id },
                  data: { cantidad: { increment: cantAbs } },
                });
              } else {
                await tx.lote.create({
                  data: {
                    empresaId,
                    productoId: dto.productoId,
                    bodegaId: bodegaEspecial.id,
                    numero: dto.loteNumero,
                    cantidadInicial: cantAbs,
                    cantidad: cantAbs,
                    fechaVencimiento: loteOrigen.fechaVencimiento,
                    activo: true,
                  },
                });
              }
            }
          }
        }

        // Mover seriales si maneja seriales
        if (producto.manejaSerial && dto.seriales && dto.seriales.length > 0) {
          await tx.numeroSerie.updateMany({
            where: {
              empresaId,
              productoId: dto.productoId,
              bodegaId: dto.bodegaId,
              serial: { in: dto.seriales },
            },
            data: {
              bodegaId: bodegaEspecial.id,
            },
          });
        }

        // Registrar movimientos en el Kardex
        const notasAjuste = dto.notas || `Ajuste por ${dto.motivo.toLowerCase()}`;
        const mov1 = await tx.movimientoInventario.create({
          data: {
            numero,
            empresaId,
            tipo: 'AJUSTE_NEGATIVO',
            concepto: 'AJUSTE_FISICO',
            productoId: dto.productoId,
            bodegaOrigenId: dto.bodegaId,
            cantidad: cantAbs,
            costoUnitario: cppAnterior,
            costoTotal: cantAbs * cppAnterior,
            saldoCantidad: cantOrigen - cantAbs,
            saldoCostoTotal: (cantOrigen - cantAbs) * cppAnterior,
            saldoCpp: cppAnterior,
            usuarioId,
            notas: `${notasAjuste} (Salida Bodega de Origen)`,
          },
        });

        const numeroEntrada = await this.generarNumero('MOV', empresaId);
        const cantEspecialAnterior = parseFloat(stockEspecial.cantidad.toString());
        await tx.movimientoInventario.create({
          data: {
            numero: numeroEntrada,
            empresaId,
            tipo: 'AJUSTE_POSITIVO',
            concepto: 'AJUSTE_FISICO',
            productoId: dto.productoId,
            bodegaDestinoId: bodegaEspecial.id,
            cantidad: cantAbs,
            costoUnitario: cppAnterior,
            costoTotal: cantAbs * cppAnterior,
            saldoCantidad: cantEspecialAnterior + cantAbs,
            saldoCostoTotal: (cantEspecialAnterior + cantAbs) * cppAnterior,
            saldoCpp: cppAnterior,
            usuarioId,
            notas: `${notasAjuste} (Ingreso a Bolsa de Control)`,
          },
        });

        return mov1;
      }

      // Proceso normal de ajuste
      const stock = await this.getOrCreateStock(dto.productoId, bodegaIdProcesamiento, empresaId, tx);
      const cantAnterior = parseFloat(stock.cantidad.toString());
      const saldoCantidad = cantAnterior + dto.cantidad;

      // Verificar stock negativo
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        select: { permiteStockNegativo: true },
      });
      const permiteNegativo = (empresa?.permiteStockNegativo ?? false) && (bodega?.permiteStockNegativo ?? false);

      if (dto.cantidad < 0 && !permiteNegativo && (cantAnterior - (stock.cantidadReservada ?? 0)) < cantAbs) {
        throw new BadRequestException(`Stock insuficiente para realizar el ajuste negativo. Disponible: ${cantAnterior - (stock.cantidadReservada ?? 0)}`);
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: { cantidad: { increment: dto.cantidad } },
      });

      // BC-04: Recalcular CPP si es ajuste positivo
      let nuevoCPP = cppAnterior;
      if (dto.cantidad >= 0) {
        const costoNuevo = dto.costoUnitario ?? cppAnterior;
        const stockGlobal = await tx.stock.findMany({
          where: { productoId: dto.productoId, empresaId },
        });
        const cantTotalAnterior = stockGlobal.reduce((acc: number, s: any) => acc + parseFloat(s.cantidad.toString()), 0) - dto.cantidad;
        const cantTotalNueva = cantTotalAnterior + dto.cantidad;

        nuevoCPP = cantTotalNueva > 0
          ? (cantTotalAnterior * cppAnterior + dto.cantidad * costoNuevo) / cantTotalNueva
          : costoNuevo;

        await tx.producto.update({
          where: { id: dto.productoId },
          data: { costoPromedio: nuevoCPP },
        });
      }

      // Procesar Lote
      let loteId: number | undefined;
      if (producto.manejaLotes) {
        if (dto.cantidad >= 0) {
          let lote = await tx.lote.findFirst({
            where: { empresaId, productoId: dto.productoId, bodegaId: bodegaIdProcesamiento, numero: dto.loteNumero! },
          });
          if (lote) {
            lote = await tx.lote.update({
              where: { id: lote.id },
              data: {
                cantidad: { increment: cantAbs },
                cantidadInicial: { increment: cantAbs },
                fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : lote.fechaVencimiento,
              },
            });
          } else {
            lote = await tx.lote.create({
              data: {
                empresaId,
                productoId: dto.productoId,
                bodegaId: bodegaIdProcesamiento,
                numero: dto.loteNumero!,
                cantidadInicial: cantAbs,
                cantidad: cantAbs,
                fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
                activo: true,
              },
            });
          }
          loteId = lote.id;
        } else {
          if (dto.loteNumero) {
            const lote = await tx.lote.findFirst({
              where: { empresaId, productoId: dto.productoId, bodegaId: bodegaIdProcesamiento, numero: dto.loteNumero },
            });
            if (!lote) {
              if (!permiteNegativo) throw new BadRequestException(`El lote ${dto.loteNumero} no existe`);
              const newLote = await tx.lote.create({
                data: {
                  empresaId,
                  productoId: dto.productoId,
                  bodegaId: bodegaIdProcesamiento,
                  numero: dto.loteNumero,
                  cantidad: -cantAbs,
                  cantidadInicial: 0,
                  activo: true,
                },
              });
              loteId = newLote.id;
            } else {
              await tx.lote.update({
                where: { id: lote.id },
                data: { cantidad: { decrement: cantAbs } },
              });
              loteId = lote.id;
            }
          } else {
            const lotes = await tx.lote.findMany({
              where: { empresaId, productoId: dto.productoId, bodegaId: bodegaIdProcesamiento, activo: true, cantidad: { gt: 0 } },
              orderBy: [{ fechaVencimiento: 'asc' }, { id: 'asc' }],
            });
            let restante = cantAbs;
            for (const lote of lotes) {
              if (restante <= 0) break;
              const cantLote = Number(lote.cantidad);
              if (cantLote <= restante) {
                await tx.lote.update({ where: { id: lote.id }, data: { cantidad: 0 } });
                restante -= cantLote;
              } else {
                await tx.lote.update({ where: { id: lote.id }, data: { cantidad: { decrement: restante } } });
                restante = 0;
                break;
              }
            }
            if (restante > 0) {
              if (lotes.length > 0) {
                await tx.lote.update({ where: { id: lotes[0].id }, data: { cantidad: { decrement: restante } } });
              } else {
                const newLote = await tx.lote.create({
                  data: {
                    empresaId,
                    productoId: dto.productoId,
                    bodegaId: bodegaIdProcesamiento,
                    numero: 'LOTE-GENERICO-NEG',
                    cantidad: -restante,
                    cantidadInicial: 0,
                    activo: true,
                  },
                });
                loteId = newLote.id;
              }
            }
          }
        }
      }

      const loteNotas = dto.loteNumero ? ` [Lote: ${dto.loteNumero}]` : '';
      const mov = await tx.movimientoInventario.create({
        data: {
          numero,
          empresaId,
          tipo,
          concepto: 'AJUSTE_FISICO',
          productoId: dto.productoId,
          bodegaOrigenId: dto.cantidad < 0 ? bodegaIdProcesamiento : null,
          bodegaDestinoId: dto.cantidad >= 0 ? bodegaIdProcesamiento : null,
          cantidad: cantAbs,
          costoUnitario: dto.cantidad >= 0 ? (dto.costoUnitario ?? cppAnterior) : cppAnterior,
          costoTotal: cantAbs * (dto.cantidad >= 0 ? (dto.costoUnitario ?? cppAnterior) : cppAnterior),
          saldoCantidad,
          saldoCostoTotal: saldoCantidad * nuevoCPP,
          saldoCpp: nuevoCPP,
          usuarioId,
          notas: dto.notas ? `${dto.notas}${loteNotas}` : `Ajuste físico${loteNotas}`,
          referenciaTipo: 'Manual',
        },
      });

      // Procesar Seriales
      if (producto.manejaSerial) {
        if (dto.cantidad >= 0) {
          for (const s of dto.seriales!) {
            const existeSerial = await tx.numeroSerie.findFirst({
              where: { empresaId, productoId: dto.productoId, serial: s },
            });
            if (existeSerial) {
              await tx.numeroSerie.update({
                where: { id: existeSerial.id },
                data: {
                  estado: 'DISPONIBLE',
                  bodegaId: bodegaIdProcesamiento,
                  loteId: loteId ?? null,
                  movimientoEntradaId: mov.id,
                },
              });
            } else {
              await tx.numeroSerie.create({
                data: {
                  empresaId,
                  productoId: dto.productoId,
                  bodegaId: bodegaIdProcesamiento,
                  loteId: loteId ?? null,
                  serial: s,
                  estado: 'DISPONIBLE',
                  movimientoEntradaId: mov.id,
                },
              });
            }
          }
        } else {
          let nuevoEstado = 'BAJA';
          if (dto.seriales && dto.seriales.length > 0) {
            await tx.numeroSerie.updateMany({
              where: { empresaId, productoId: dto.productoId, serial: { in: dto.seriales } },
              data: {
                estado: nuevoEstado,
                bodegaId: null,
                movimientoSalidaId: mov.id,
              },
            });
          } else {
            const serialsDisponibles = await tx.numeroSerie.findMany({
              where: { empresaId, productoId: dto.productoId, bodegaId: bodegaIdProcesamiento, estado: 'DISPONIBLE' },
              orderBy: { id: 'asc' },
              take: Math.ceil(cantAbs),
            });
            const serialIds = serialsDisponibles.map(s => s.id);
            if (serialIds.length > 0) {
              await tx.numeroSerie.updateMany({
                where: { id: { in: serialIds } },
                data: {
                  estado: nuevoEstado,
                  bodegaId: null,
                  movimientoSalidaId: mov.id,
                },
              });
            }
          }
        }
      }

      return mov;
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

    // Verificar stock en origen (BC-08: descontar cantidad reservada)
    const stockOrigen = await (this.prisma as any).stock.findUnique({
      where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaOrigenId } },
    });
    const cantOrigen = stockOrigen ? parseFloat(stockOrigen.cantidad.toString()) : 0;
    const reservada = stockOrigen ? parseFloat(stockOrigen.cantidadReservada?.toString() ?? '0') : 0;
    const disponible = cantOrigen - reservada;
    if (disponible < dto.cantidad) {
      throw new BadRequestException(`Stock disponible insuficiente en origen. Disponible: ${disponible}, Reservado: ${reservada}`);
    }

    // Validar seriales si maneja serial
    if (producto.manejaSerial && dto.seriales && dto.seriales.length > 0) {
      if (dto.seriales.length !== Math.ceil(dto.cantidad)) {
        throw new BadRequestException(`La cantidad de seriales (${dto.seriales.length}) no coincide con el traslado (${dto.cantidad})`);
      }
    }

    const cpp = parseFloat(producto.costoPromedio.toString());
    const numeroSalida = await this.generarNumero('MOV', empresaId);

    return this.prisma.$transaction(async (tx: any) => {
      // Salida de origen
      await tx.stock.update({
        where: { id: stockOrigen.id },
        data: { cantidad: { decrement: dto.cantidad } },
      });

      const saldoOrigen = cantOrigen - dto.cantidad;

      // Procesar Lote
      let loteId: number | undefined;
      if (producto.manejaLotes) {
        if (dto.loteNumero) {
          const lote = await tx.lote.findFirst({
            where: { empresaId, productoId: dto.productoId, bodegaId: dto.bodegaOrigenId, numero: dto.loteNumero },
          });
          if (!lote) throw new BadRequestException(`El lote ${dto.loteNumero} no existe en la bodega origen`);
          await tx.lote.update({
            where: { id: lote.id },
            data: { cantidad: { decrement: dto.cantidad } },
          });
          loteId = lote.id;
        } else {
          const lotes = await tx.lote.findMany({
            where: { empresaId, productoId: dto.productoId, bodegaId: dto.bodegaOrigenId, activo: true, cantidad: { gt: 0 } },
            orderBy: [{ fechaVencimiento: 'asc' }, { id: 'asc' }],
          });
          let restante = dto.cantidad;
          for (const lote of lotes) {
            if (restante <= 0) break;
            const cantLote = Number(lote.cantidad);
            if (cantLote <= restante) {
              await tx.lote.update({ where: { id: lote.id }, data: { cantidad: 0 } });
              restante -= cantLote;
            } else {
              await tx.lote.update({ where: { id: lote.id }, data: { cantidad: { decrement: restante } } });
              restante = 0;
              break;
            }
          }
          if (restante > 0 && lotes.length > 0) {
            await tx.lote.update({ where: { id: lotes[0].id }, data: { cantidad: { decrement: restante } } });
          }
        }
      }

      // Guardar información del lote en las notas para recuperarlo al recibir
      const loteNotas = dto.loteNumero ? ` [Lote: ${dto.loteNumero}]` : '';
      const finalNotas = dto.notas ? `${dto.notas}${loteNotas}` : `Traslado en tránsito${loteNotas}`;

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
          notas: finalNotas,
          estado: 'EN_TRANSITO',
          referenciaTipo: 'Manual',
        },
      });

      // Procesar seriales: cambiarlos a EN_TRANSITO
      if (producto.manejaSerial) {
        if (dto.seriales && dto.seriales.length > 0) {
          await tx.numeroSerie.updateMany({
            where: { empresaId, productoId: dto.productoId, serial: { in: dto.seriales } },
            data: {
              estado: 'EN_TRANSITO',
              bodegaId: null,
              movimientoSalidaId: mov1.id,
            },
          });
        } else {
          const serialsDisponibles = await tx.numeroSerie.findMany({
            where: { empresaId, productoId: dto.productoId, bodegaId: dto.bodegaOrigenId, estado: 'DISPONIBLE' },
            orderBy: { id: 'asc' },
            take: Math.ceil(dto.cantidad),
          });
          const serialIds = serialsDisponibles.map(s => s.id);
          if (serialIds.length > 0) {
            await tx.numeroSerie.updateMany({
              where: { id: { in: serialIds } },
              data: {
                estado: 'EN_TRANSITO',
                bodegaId: null,
                movimientoSalidaId: mov1.id,
              },
            });
          }
        }
      }

      return { traslado: mov1, movimientos: [mov1] };
    });
  }

  async recibirTraslado(id: number, empresaId: number, usuarioId: number) {
    const mov1 = await (this.prisma as any).movimientoInventario.findFirst({
      where: { id, empresaId, tipo: 'TRASLADO_SALIDA' },
    });
    if (!mov1) throw new NotFoundException('Traslado no encontrado');
    if (mov1.estado !== 'EN_TRANSITO') {
      throw new BadRequestException('Este traslado ya fue recibido o no está en tránsito');
    }
    if (!mov1.bodegaDestinoId) {
      throw new BadRequestException(
        'Este traslado no tiene bodega destino definida y no puede ser recibido. Contacte al administrador.'
      );
    }

    const producto = await this.getProducto(mov1.productoId, empresaId);
    const cpp = parseFloat(producto.costoPromedio.toString());

    return this.prisma.$transaction(async (tx: any) => {
      const stockDestino = await this.getOrCreateStock(mov1.productoId, mov1.bodegaDestinoId, empresaId, tx);
      const cantDestinoAnterior = parseFloat(stockDestino.cantidad.toString());
      const saldoDestino = cantDestinoAnterior + parseFloat(mov1.cantidad.toString());

      // Entrada en destino
      await tx.stock.update({
        where: { id: stockDestino.id },
        data: { cantidad: { increment: mov1.cantidad } },
      });

      // Extraer número de lote de las notas de mov1 si existe
      let loteNumero: string | null = null;
      if (mov1.notas) {
        const match = mov1.notas.match(/\[Lote:\s*([^\]]+)\]/);
        if (match) {
          loteNumero = match[1].trim();
        }
      }

      // Procesar Lote en destino
      let loteId: number | undefined;
      if (producto.manejaLotes && loteNumero) {
        let lote = await tx.lote.findFirst({
          where: {
            empresaId,
            productoId: mov1.productoId,
            bodegaId: mov1.bodegaDestinoId,
            numero: loteNumero,
          },
        });
        if (lote) {
          lote = await tx.lote.update({
            where: { id: lote.id },
            data: {
              cantidad: { increment: mov1.cantidad },
              cantidadInicial: { increment: mov1.cantidad },
            },
          });
        } else {
          const loteOrigen = await tx.lote.findFirst({
            where: {
              empresaId,
              productoId: mov1.productoId,
              bodegaId: mov1.bodegaOrigenId,
              numero: loteNumero,
            },
          });
          lote = await tx.lote.create({
            data: {
              empresaId,
              productoId: mov1.productoId,
              bodegaId: mov1.bodegaDestinoId,
              numero: loteNumero,
              cantidadInicial: mov1.cantidad,
              cantidad: mov1.cantidad,
              fechaVencimiento: loteOrigen?.fechaVencimiento ?? null,
              activo: true,
            },
          });
        }
        loteId = lote.id;
      }

      // Generar consecutivo para el movimiento de entrada
      const numeroEntrada = await this.generarNumero('MOV', empresaId);

      // Crear el movimiento TRASLADO_ENTRADA
      const mov2 = await tx.movimientoInventario.create({
        data: {
          numero: numeroEntrada,
          empresaId,
          tipo: 'TRASLADO_ENTRADA',
          concepto: 'TRASLADO',
          productoId: mov1.productoId,
          bodegaOrigenId: mov1.bodegaOrigenId,
          bodegaDestinoId: mov1.bodegaDestinoId,
          cantidad: mov1.cantidad,
          costoUnitario: cpp,
          costoTotal: parseFloat(mov1.cantidad.toString()) * cpp,
          saldoCantidad: saldoDestino,
          saldoCostoTotal: saldoDestino * cpp,
          saldoCpp: cpp,
          usuarioId,
          notas: mov1.notas,
          estado: 'RECIBIDO',
          movimientoParId: mov1.id,
          referenciaTipo: 'Manual',
        },
      });

      // Procesar seriales en destino: ponerlos como DISPONIBLE en la bodega destino
      if (producto.manejaSerial) {
        await tx.numeroSerie.updateMany({
          where: {
            empresaId,
            productoId: mov1.productoId,
            movimientoSalidaId: mov1.id,
            estado: 'EN_TRANSITO',
          },
          data: {
            estado: 'DISPONIBLE',
            bodegaId: mov1.bodegaDestinoId,
            loteId: loteId ?? null,
            movimientoEntradaId: mov2.id,
          },
        });
      }

      // Actualizar mov1 a RECIBIDO y enlazar con mov2
      const updatedMov1 = await tx.movimientoInventario.update({
        where: { id: mov1.id },
        data: {
          estado: 'RECIBIDO',
          movimientoParId: mov2.id,
        },
      });

      return { traslado: updatedMov1, movimientos: [updatedMov1, mov2] };
    });
  }

  // ── Devolución a Proveedor ─────────────────────────────────────────────────
  // Reduce stock (producto regresa al proveedor por defecto de calidad, etc.)

  async procesarDevolucionProveedor(dto: DevolucionProveedorDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const stock = await (this.prisma as any).stock.findUnique({
      where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
    });
    const disponible = stock ? parseFloat(stock.cantidad.toString()) : 0;
    if (disponible < dto.cantidad) {
      throw new BadRequestException(`Stock insuficiente. Disponible: ${disponible}, solicitado: ${dto.cantidad}`);
    }

    const numero = await this.generarNumero('DEV', empresaId);

    return this.prisma.$transaction(async (tx: any) => {
      // BC-05: delegar el procesamiento a registrarSalidaInterna para consistencia de lotes y seriales
      return this.registrarSalidaInterna(tx, {
        empresaId,
        productoId: dto.productoId,
        bodegaId: dto.bodegaId,
        cantidad: dto.cantidad,
        concepto: 'DEVOLUCION_PROVEEDOR',
        tipo: 'DEVOLUCION_PROVEEDOR',
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaId ? 'OrdenCompra' : 'Manual',
        usuarioId,
        numeroMov: numero,
        notas: dto.notas,
        loteNumero: dto.loteNumero,
        seriales: dto.seriales,
      });
    });
  }

  // ── Devolución de Cliente ──────────────────────────────────────────────────
  // Aumenta stock (cliente devuelve mercancía — puede recalcular CPP)

  async procesarDevolucionCliente(dto: DevolucionClienteDto, empresaId: number, usuarioId: number) {
    const producto = await this.getProducto(dto.productoId, empresaId);
    const bodega = await (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } });
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    const numero = await this.generarNumero('DEV', empresaId);

    return this.prisma.$transaction(async (tx: any) => {
      const stock = await this.getOrCreateStock(dto.productoId, dto.bodegaId, empresaId, tx);

      const cantAnterior = parseFloat(stock.cantidad.toString());
      const cppAnterior  = parseFloat(producto.costoPromedio.toString());
      const cantNueva    = dto.cantidad;
      const costoNuevo   = dto.costoUnitario !== undefined && dto.costoUnitario !== null
        ? dto.costoUnitario
        : cppAnterior;

      // Recalcula CPP ponderado
      const totalAnterior = cantAnterior * cppAnterior;
      const totalNuevo    = cantNueva * costoNuevo;
      const cantTotal     = cantAnterior + cantNueva;
      const nuevoCPP      = cantTotal > 0 ? (totalAnterior + totalNuevo) / cantTotal : costoNuevo;
      const saldoCantidad = cantTotal;

      await tx.stock.update({
        where: { productoId_bodegaId: { productoId: dto.productoId, bodegaId: dto.bodegaId } },
        data: { cantidad: { increment: cantNueva } },
      });

      await tx.producto.update({
        where: { id: dto.productoId },
        data: { costoPromedio: nuevoCPP },
      });

      return tx.movimientoInventario.create({
        data: {
          numero,
          empresaId,
          tipo: 'DEVOLUCION_CLIENTE',
          concepto: 'DEVOLUCION_CLIENTE',
          productoId: dto.productoId,
          bodegaDestinoId: dto.bodegaId,
          cantidad: cantNueva,
          costoUnitario: costoNuevo,
          costoTotal: cantNueva * costoNuevo,
          saldoCantidad,
          saldoCostoTotal: saldoCantidad * nuevoCPP,
          saldoCpp: nuevoCPP,
          usuarioId,
          referenciaId: dto.referenciaId,
          referenciaTipo: dto.referenciaId ? 'Factura' : 'Manual',
          notas: dto.notas,
        },
      });
    });
  }
}
