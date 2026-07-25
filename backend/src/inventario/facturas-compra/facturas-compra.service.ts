import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComprobantesService } from '../../contabilidad/comprobantes/comprobantes.service';
import { CreateFacturaCompraDto, UpdateFacturaCompraDto, CreateRecepcionProductoDto } from './dto/factura-compra.dto';

@Injectable()
export class FacturasCompraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comprobantes: ComprobantesService,
  ) {}

  async findAll(empresaId: number, query?: { query?: string; proveedorId?: number }) {
    const where: any = { empresaId };

    if (query?.proveedorId) {
      where.proveedorId = query.proveedorId;
    }

    if (query?.query) {
      where.OR = [
        { numero: { contains: query.query, mode: 'insensitive' } },
        { consecutivoProveedor: { contains: query.query, mode: 'insensitive' } },
        { proveedor: { nombre: { contains: query.query, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.facturaCompra.findMany({
      where,
      include: {
        proveedor: { select: { id: true, nombre: true, numeroDocumento: true } },
        items: { include: { producto: { select: { nombre: true, sku: true } } } },
        ordenCompra: { select: { id: true, numero: true } },
        documentoConfig: { select: { id: true, nombre: true, prefijo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const fc = await this.prisma.facturaCompra.findFirst({
      where: { id, empresaId },
      include: {
        proveedor: { select: { id: true, nombre: true, numeroDocumento: true, email: true, telefono: true, direccion: true } },
        items: { include: { producto: { select: { nombre: true, sku: true } } } },
        ordenCompra: { select: { id: true, numero: true } },
        documentoConfig: { select: { id: true, nombre: true, prefijo: true } },
      },
    });
    if (!fc) throw new NotFoundException('Factura de compra no encontrada');
    return fc;
  }

  private async generarConsecutivoInterno(empresaId: number, tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const db = tx || this.prisma;
    const count = await db.facturaCompra.count({
      where: { empresaId, numero: { startsWith: `FC-${year}-` } },
    });
    return `FC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  async create(dto: CreateFacturaCompraDto, empresaId: number, usuarioId: number) {
    const proveedor = await this.prisma.tercero.findFirst({
      where: { id: dto.proveedorId, empresaId, esProveedor: true },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    // Verificar duplicado de factura de proveedor
    const existe = await this.prisma.facturaCompra.findFirst({
      where: {
        empresaId,
        proveedorId: dto.proveedorId,
        consecutivoProveedor: dto.consecutivoProveedor,
      },
    });
    if (existe) {
      throw new ConflictException(
        `Ya se encuentra registrada la factura ${dto.consecutivoProveedor} para este proveedor.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let numero: string;
      if (dto.documentoConfigId) {
        const docConfig = await tx.documentoConfig.findFirst({
          where: { id: dto.documentoConfigId, empresaId, sigla: 'FC' },
        });
        if (!docConfig) {
          throw new NotFoundException('Resolución de documento de factura de compra no encontrada');
        }
        numero = `${docConfig.prefijo}-${docConfig.consecutivoSiguiente}`;
        await tx.documentoConfig.update({
          where: { id: docConfig.id },
          data: { consecutivoSiguiente: { increment: 1 } },
        });
      } else {
        numero = await this.generarConsecutivoInterno(empresaId, tx);
      }

      // 1. Persistir la factura de compra
      const fc = await tx.facturaCompra.create({
        data: {
          empresaId,
          numero,
          documentoConfigId: dto.documentoConfigId,
          prefijoProveedor: dto.prefijoProveedor,
          consecutivoProveedor: dto.consecutivoProveedor,
          proveedorId: dto.proveedorId,
          ordenCompraId: dto.ordenCompraId,
          fechaEmision: new Date(dto.fechaEmision),
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
          subtotal: dto.subtotal,
          descuento: dto.descuento ?? 0,
          iva: dto.iva ?? 0,
          total: dto.total,
          xmlAdjunto: dto.xmlAdjunto,
          notas: dto.notas,
          estado: 'REGISTRADA',
          estadoRecepcion: 'PENDIENTE',
          items: dto.items && dto.items.length > 0 ? {
            create: dto.items.map(item => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              costoUnitario: item.costoUnitario,
              subtotal: item.subtotal,
            }))
          } : undefined
        },
      });

      // Si viene vinculada a una Orden de Compra, actualizamos el estado de la OC
      if (dto.ordenCompraId) {
        await tx.ordenCompra.update({
          where: { id: dto.ordenCompraId },
          data: { estado: 'FACTURADA' },
        });
      }

      // 2. Causación Contable Automatizada (PUC 1435 vs 2205)
      // Resolver cuenta de inventario desde la clasificación contable o el grupo de los productos de la factura
      let cuentaInventarioCodigo = null;
      if (dto.items && dto.items.length > 0) {
        const primerItem = await tx.producto.findUnique({
          where: { id: dto.items[0].productoId },
          include: { clasificacion: true, grupo: true }
        });
        if (primerItem?.grupo?.contable && (primerItem.grupo.contable as any).compras) {
          cuentaInventarioCodigo = (primerItem.grupo.contable as any).compras;
        } else if (primerItem?.clasificacion?.pucCuenta) {
          cuentaInventarioCodigo = primerItem.clasificacion.pucCuenta;
        }
      }

      let cuentaInventario = null;
      if (cuentaInventarioCodigo) {
        cuentaInventario = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: cuentaInventarioCodigo }
        });
      }

      if (!cuentaInventario) {
        cuentaInventario = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { in: ['143505', '1435'] } },
        });
        if (!cuentaInventario) {
          cuentaInventario = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: { startsWith: '1435' } },
          });
        }
      }

      let cuentaProveedores = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: { in: ['220505', '2205'] } },
      });
      if (!cuentaProveedores) {
        cuentaProveedores = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { startsWith: '2205' } },
        });
      }

      if (!cuentaInventario || !cuentaProveedores) {
        throw new BadRequestException(
          'No se pueden generar asientos contables automáticos porque las cuentas de Inventario (1435) y/o Proveedores (2205) no están configuradas en su catálogo PUC.'
        );
      }

      const netMerchandise = Number(dto.subtotal) - Number(dto.descuento ?? 0);
      const ivaVal = Number(dto.iva ?? 0);
      const totalVal = Number(dto.total);

      const lineas: any[] = [];

      // Inventario (1435) Débito
      lineas.push({
        cuentaId: cuentaInventario.id,
        descripcion: `Compra mercancía - FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`,
        debito: netMerchandise,
        credito: 0,
        terceroNit: proveedor.numeroDocumento,
        terceroNombre: proveedor.nombre,
      });

      // IVA descontable (240810) Débito (si aplica)
      if (ivaVal > 0) {
        let cuentaIvaCodigo = null;

        // Intentar buscar la cuenta de compras (cuentaCredito) del impuesto de IVA asociado a los productos de la factura
        if (dto.items && dto.items.length > 0) {
          const productIds = dto.items.map(it => it.productoId);
          const prodImpuesto = await tx.productoImpuesto.findFirst({
            where: {
              productoId: { in: productIds },
              impuesto: { tipo: 'IVA', cuentaCredito: { not: null } }
            },
            include: { impuesto: true }
          });
          if (prodImpuesto?.impuesto?.cuentaCredito) {
            cuentaIvaCodigo = prodImpuesto.impuesto.cuentaCredito;
          }
        }

        let cuentaIva = null;
        if (cuentaIvaCodigo) {
          cuentaIva = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: cuentaIvaCodigo }
          });
        }

        if (!cuentaIva) {
          cuentaIva = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: { in: ['240810', '2408'] } },
          });
          if (!cuentaIva) {
            cuentaIva = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: { startsWith: '2408' } },
            });
          }
        }

        if (cuentaIva) {
          lineas.push({
            cuentaId: cuentaIva.id,
            descripcion: `IVA descontable compras - FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`,
            debito: ivaVal,
            credito: 0,
            terceroNit: proveedor.numeroDocumento,
            terceroNombre: proveedor.nombre,
          });
        } else {
          // Si no existe, se suma al inventario (mayor valor del costo de mercancía)
          lineas[0].debito += ivaVal;
        }
      }

      // Proveedores (2205) Crédito
      lineas.push({
        cuentaId: cuentaProveedores.id,
        descripcion: `Obligación con proveedores - FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`,
        debito: 0,
        credito: totalVal,
        terceroNit: proveedor.numeroDocumento,
        terceroNombre: proveedor.nombre,
      });

      // Validar cuadre de partida doble
      const sumDebito = lineas.reduce((a, b) => a + b.debito, 0);
      const sumCredito = lineas.reduce((a, b) => a + b.credito, 0);
      if (Math.abs(sumDebito - sumCredito) > 0.01) {
        // Ajustamos diferencia por centavos en el inventario
        const diff = sumCredito - sumDebito;
        lineas[0].debito += diff;
      }

      // Obtener o crear período contable
      const fecha = new Date(dto.fechaEmision);
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      const periodo = await tx.periodoContable.upsert({
        where: { empresaId_anio_mes: { empresaId, anio, mes } },
        create: { empresaId, anio, mes },
        update: {},
      });

      if (periodo.estado === 'CERRADO') {
        throw new BadRequestException(`El período contable ${mes}/${anio} está cerrado`);
      }

      // Generar consecutivo del comprobante
      const lastComp = await tx.comprobante.findFirst({
        where: { empresaId, tipo: 'FP' },
        orderBy: { id: 'desc' },
      });
      const seqComp = lastComp ? parseInt(lastComp.numero.split('-').pop() ?? '0') + 1 : 1;
      const numComp = `FP-${anio}-${String(seqComp).padStart(5, '0')}`;

      // Crear el comprobante contable directamente
      await tx.comprobante.create({
        data: {
          empresaId,
          numero: numComp,
          tipo: 'FP',
          concepto: `Causación Factura de Compra ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`,
          fecha,
          periodoId: periodo.id,
          referenciaId: fc.id,
          referenciaTipo: 'FACTURA_COMPRA',
          usuarioId,
          lineas: {
            create: lineas.map((l, idx) => ({
              cuentaId: l.cuentaId,
              descripcion: l.descripcion,
              debito: l.debito,
              credito: l.credito,
              terceroNit: l.terceroNit,
              terceroNombre: l.terceroNombre,
              orden: idx,
            })),
          },
        },
      });

      return fc;
    });
  }

  async remove(id: number, empresaId: number) {
    const fc = await this.findOne(id, empresaId);

    return this.prisma.$transaction(async (tx) => {
      // Anular comprobantes contables vinculados
      const comprobantes = await tx.comprobante.findMany({
        where: { empresaId, referenciaId: id, referenciaTipo: 'FACTURA_COMPRA' },
      });
      for (const comp of comprobantes) {
        await tx.comprobante.update({
          where: { id: comp.id },
          data: { estado: 'ANULADO' },
        });
      }

      // Anulación lógica de factura de compra
      return tx.facturaCompra.update({
        where: { id },
        data: { estado: 'ANULADA' },
      });
    });
  }

  async createRecepcion(facturaCompraId: number, dto: CreateRecepcionProductoDto, empresaId: number, usuarioId: number) {
    const fc = await this.prisma.facturaCompra.findFirst({
      where: { id: facturaCompraId, empresaId },
      include: { items: true, proveedor: true },
    });
    if (!fc) throw new NotFoundException('Factura de compra no encontrada');
    if (fc.estado === 'ANULADA') throw new BadRequestException('No se puede generar recepción sobre una factura de compra anulada');

    const bodega = await this.prisma.bodega.findFirst({
      where: { id: dto.bodegaId, empresaId },
    });
    if (!bodega) throw new NotFoundException('Bodega de destino no encontrada');

    return this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      let numeroRec: string;

      if (dto.documentoConfigId) {
        const docConfig = await tx.documentoConfig.findFirst({
          where: { id: dto.documentoConfigId, empresaId, sigla: 'RP' },
        });
        if (docConfig) {
          numeroRec = `${docConfig.prefijo}-${docConfig.consecutivoSiguiente}`;
          await tx.documentoConfig.update({
            where: { id: docConfig.id },
            data: { consecutivoSiguiente: { increment: 1 } },
          });
        } else {
          const recCount = await tx.recepcionMercancia.count({
            where: { empresaId, numero: { startsWith: `RP-${year}-` } },
          });
          numeroRec = `RP-${year}-${String(recCount + 1).padStart(5, '0')}`;
        }
      } else {
        const recCount = await tx.recepcionMercancia.count({
          where: { empresaId, numero: { startsWith: `RP-${year}-` } },
        });
        numeroRec = `RP-${year}-${String(recCount + 1).padStart(5, '0')}`;
      }

      // 1. Crear RecepcionMercancia
      const recepcion = await tx.recepcionMercancia.create({
        data: {
          numero: numeroRec,
          empresaId,
          facturaCompraId,
          ordenCompraId: fc.ordenCompraId ?? undefined,
          bodegaId: dto.bodegaId,
          documentoConfigId: dto.documentoConfigId,
          usuarioId,
          notas: dto.notas || `Recepción física por FC ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor}`,
          inventarioAfectado: true,
          items: {
            create: dto.items.map((it: any) => ({
              productoId: it.productoId,
              facturaCompraItemId: it.facturaCompraItemId,
              cantidadRecibida: it.cantidadRecibida,
              costoUnitario: it.costoUnitario,
            })),
          },
        },
      });

      // 2. Incrementar stock, recalcular CPP y generar Kardex por cada ítem recibido
      for (const item of dto.items) {
        const productoId = item.productoId;
        const cantNueva = Number(item.cantidadRecibida);
        const costoUnitario = Number(item.costoUnitario);

        const producto = await tx.producto.findUnique({ where: { id: productoId } });
        if (!producto) throw new NotFoundException(`Producto ${productoId} no encontrado`);

        // Obtener o crear Stock para la bodega elegida
        let stock = await tx.stock.findUnique({
          where: { productoId_bodegaId: { productoId, bodegaId: dto.bodegaId } },
        });
        if (!stock) {
          stock = await tx.stock.create({
            data: { productoId, bodegaId: dto.bodegaId, empresaId, cantidad: 0, cantidadReservada: 0 },
          });
        }

        const cantAnterior = Number(stock.cantidad);
        const cppAnterior = Number(producto.costoPromedio);
        const cantTotal = cantAnterior + cantNueva;

        const nuevoCPP = cantTotal > 0
          ? (cantAnterior * cppAnterior + cantNueva * costoUnitario) / cantTotal
          : costoUnitario;

        // Actualizar Stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { cantidad: { increment: cantNueva } },
        });

        // Actualizar CPP en Producto
        await tx.producto.update({
          where: { id: productoId },
          data: { costoPromedio: nuevoCPP },
        });

        // Actualizar cantidadRecibida en FacturaCompraItem si aplica
        if (item.facturaCompraItemId) {
          await tx.facturaCompraItem.update({
            where: { id: item.facturaCompraItemId },
            data: { cantidadRecibida: { increment: cantNueva } },
          });
        }

        // Generar número de movimiento de Kardex
        const movCount = await tx.movimientoInventario.count({
          where: { empresaId, numero: { startsWith: `MOV-${year}-` } },
        });
        const numMov = `MOV-${year}-${String(movCount + 1).padStart(5, '0')}`;

        await tx.movimientoInventario.create({
          data: {
            numero: numMov,
            empresaId,
            tipo: 'ENTRADA',
            concepto: 'RECEPCION_COMPRA',
            productoId,
            bodegaDestinoId: dto.bodegaId,
            cantidad: cantNueva,
            costoUnitario,
            costoTotal: cantNueva * costoUnitario,
            saldoCantidad: cantTotal,
            saldoCostoTotal: cantTotal * nuevoCPP,
            saldoCpp: nuevoCPP,
            usuarioId,
            referenciaId: String(facturaCompraId),
            referenciaTipo: 'FACTURA_COMPRA',
            notas: `Recepción ${numeroRec} de FC ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor} [Bodega: ${bodega.nombre}]`,
          },
        });
      }

      // 3. Evaluar estado de recepción de la Factura de Compra
      const allItemsFC = await tx.facturaCompraItem.findMany({
        where: { facturaCompraId },
      });

      let totalFacturado = 0;
      let totalRecibido = 0;

      for (const fcItem of allItemsFC) {
        totalFacturado += Number(fcItem.cantidad);
        totalRecibido += Number(fcItem.cantidadRecibida);
      }

      let estadoRecepcion = 'PENDIENTE';
      if (totalRecibido >= totalFacturado) {
        estadoRecepcion = 'RECIBIDO';
      } else if (totalRecibido > 0) {
        estadoRecepcion = 'PARCIAL';
      }

      await tx.facturaCompra.update({
        where: { id: facturaCompraId },
        data: { estadoRecepcion },
      });

      return recepcion;
    });
  }

  async getRecepciones(empresaId: number) {
    return this.prisma.recepcionMercancia.findMany({
      where: { empresaId },
      include: {
        facturaCompra: { select: { id: true, numero: true, consecutivoProveedor: true, proveedor: { select: { nombre: true } } } },
        ordenCompra: { select: { id: true, numero: true } },
        bodega: { select: { id: true, nombre: true, codigo: true } },
        items: { include: { producto: { select: { id: true, nombre: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
