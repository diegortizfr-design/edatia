import { Injectable, NotFoundException, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComprobantesService } from '../../contabilidad/comprobantes/comprobantes.service';
import { CreateFacturaCompraDto, UpdateFacturaCompraDto, CreateRecepcionProductoDto } from './dto/factura-compra.dto';
import { calcularNuevoCPP } from '../common/costo-promedio.helper';

@Injectable()
export class FacturasCompraService implements OnModuleInit {
  async asegurarColumnas() {
    const statements = [
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "formaPago" TEXT DEFAULT 'CONTADO'`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "medioPago" TEXT`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "diasCredito" INTEGER DEFAULT 0`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "saldo" DECIMAL(14,2) DEFAULT 0`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "totalPagado" DECIMAL(14,2) DEFAULT 0`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "documentoCxpId" INTEGER`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "numeroCxp" TEXT`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "documentoCeId" INTEGER`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "numeroCe" TEXT`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "cajaBancoId" INTEGER`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "egresoId" INTEGER`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "ordenCompraId" INTEGER`,
      `ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "estadoRecepcion" TEXT DEFAULT 'PENDIENTE'`,
    ];

    for (const sql of statements) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
      } catch (err: any) {
        // Ignorar si ya existe
      }
    }
  }

  async onModuleInit() {
    await this.asegurarColumnas();
  }
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

    try {
      return await this.prisma.facturaCompra.findMany({
        where,
        include: {
          proveedor: { select: { id: true, nombre: true, numeroDocumento: true } },
          items: { include: { producto: { select: { nombre: true, sku: true } } } },
          ordenCompra: { select: { id: true, numero: true } },
          documentoConfig: { select: { id: true, nombre: true, prefijo: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      console.warn('[FacturasCompraService.findAll] Error inicial, asegurando columnas y reintentando:', err?.message);
      await this.asegurarColumnas();
      try {
        return await this.prisma.facturaCompra.findMany({
          where,
          include: {
            proveedor: { select: { id: true, nombre: true, numeroDocumento: true } },
            items: { include: { producto: { select: { nombre: true, sku: true } } } },
            ordenCompra: { select: { id: true, numero: true } },
            documentoConfig: { select: { id: true, nombre: true, prefijo: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (retryErr: any) {
        console.error('[FacturasCompraService.findAll] Fallback por consulta cruda para proteger facturas:', retryErr?.message);
        const rows: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT 
            fc.id, fc.numero, fc."consecutivoProveedor", fc."prefijoProveedor",
            fc."fechaEmision", fc."fechaVencimiento", fc.subtotal, fc.descuento, fc.iva, fc.total,
            COALESCE(fc.saldo, 0) as saldo, 
            COALESCE(fc."totalPagado", 0) as "totalPagado", 
            COALESCE(fc."formaPago", 'CONTADO') as "formaPago", 
            fc."medioPago", fc.estado,
            COALESCE(fc."estadoRecepcion", 'PENDIENTE') as "estadoRecepcion", 
            fc."xmlAdjunto", fc."notas", fc."createdAt",
            fc."numeroCxp", fc."numeroCe",
            json_build_object('id', t.id, 'nombre', t.nombre, 'numeroDocumento', t."numeroDocumento") as proveedor
          FROM "FacturaCompra" fc
          LEFT JOIN "Tercero" t ON fc."proveedorId" = t.id
          WHERE fc."empresaId" = ${empresaId}
          ORDER BY fc."createdAt" DESC
        `);
        return rows;
      }
    }
  }

  async findOne(id: number, empresaId: number) {
    try {
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
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      await this.asegurarColumnas();
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
  }

  private async generarConsecutivoInterno(empresaId: number, tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const db = tx || this.prisma;
    const count = await db.facturaCompra.count({
      where: { empresaId, numero: { startsWith: `FC-${year}-` } },
    });
    return `FC-${year}-${count + 1}`;
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

      // 1. Determinar condiciones de pago, vencimiento y documentos de soporte (CXP / CE)
      const isCredito = dto.formaPago === 'CREDITO';
      const totalNum = Number(dto.total);
      const saldoNum = isCredito ? totalNum : 0;
      const totalPagadoNum = isCredito ? 0 : totalNum;

      let fechaVenc: Date | null = null;
      let numeroCxp: string | null = null;
      let docCxpId: number | null = null;

      let numeroCe: string | null = null;
      let docCeId: number | null = null;
      let cuentaTesoreriaPuc: any = null;
      let cajaBancoObj: any = null;

      if (isCredito) {
        if (dto.fechaVencimiento) {
          fechaVenc = new Date(dto.fechaVencimiento);
        } else {
          const emision = new Date(dto.fechaEmision);
          emision.setDate(emision.getDate() + (Number(dto.diasCredito) || 30));
          fechaVenc = emision;
        }

        // Resolución de CXP (Cuenta por Pagar)
        if (dto.documentoCxpId) {
          const docCxp = await tx.documentoConfig.findFirst({
            where: { id: dto.documentoCxpId, empresaId, sigla: 'CXP' },
          });
          if (docCxp) {
            numeroCxp = `${docCxp.prefijo}-${docCxp.consecutivoSiguiente}`;
            await tx.documentoConfig.update({
              where: { id: docCxp.id },
              data: { consecutivoSiguiente: { increment: 1 } },
            });
            docCxpId = docCxp.id;
          }
        } else {
          const docCxp = await tx.documentoConfig.findFirst({
            where: { empresaId, sigla: 'CXP', estado: 'ACTIVO' },
          });
          if (docCxp) {
            numeroCxp = `${docCxp.prefijo}-${docCxp.consecutivoSiguiente}`;
            await tx.documentoConfig.update({
              where: { id: docCxp.id },
              data: { consecutivoSiguiente: { increment: 1 } },
            });
            docCxpId = docCxp.id;
          }
        }
      } else {
        fechaVenc = new Date(dto.fechaEmision);

        // Resolución de CE (Comprobante de Egreso)
        if (dto.documentoCeId) {
          const docCe = await tx.documentoConfig.findFirst({
            where: { id: dto.documentoCeId, empresaId, sigla: 'CE' },
          });
          if (docCe) {
            numeroCe = `${docCe.prefijo}-${docCe.consecutivoSiguiente}`;
            await tx.documentoConfig.update({
              where: { id: docCe.id },
              data: { consecutivoSiguiente: { increment: 1 } },
            });
            docCeId = docCe.id;
          }
        } else {
          const docCe = await tx.documentoConfig.findFirst({
            where: { empresaId, sigla: 'CE', estado: 'ACTIVO' },
          });
          if (docCe) {
            numeroCe = `${docCe.prefijo}-${docCe.consecutivoSiguiente}`;
            await tx.documentoConfig.update({
              where: { id: docCe.id },
              data: { consecutivoSiguiente: { increment: 1 } },
            });
            docCeId = docCe.id;
          } else {
            numeroCe = `CE-${new Date(dto.fechaEmision).getFullYear()}-1`;
          }
        }

        // Resolver Caja / Banco de salida
        if (dto.cajaBancoId) {
          cajaBancoObj = await tx.cajaBanco.findFirst({
            where: { id: dto.cajaBancoId, empresaId },
          });
          if (cajaBancoObj?.cuentaPUC) {
            cuentaTesoreriaPuc = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: cajaBancoObj.cuentaPUC },
            });
          }
        }

        if (!cuentaTesoreriaPuc) {
          const defCod = cajaBancoObj?.tipo === 'CAJA' ? '110505' : '111005';
          cuentaTesoreriaPuc = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: { in: [defCod, '110505', '1105', '111005', '1110'] } },
          });
        }
      }

      // 1. Persistir la factura de compra
      const tienePagosMixtos = !isCredito && Array.isArray(dto.pagos) && dto.pagos.length > 0;
      const fc = await tx.facturaCompra.create({
        data: {
          empresaId,
          numero,
          documentoConfigId: dto.documentoConfigId,
          documentoCxpId: docCxpId,
          numeroCxp: numeroCxp,
          documentoCeId: docCeId,
          numeroCe: numeroCe,
          cajaBancoId: tienePagosMixtos ? dto.pagos![0].cajaBancoId : (dto.cajaBancoId || undefined),
          prefijoProveedor: dto.prefijoProveedor,
          consecutivoProveedor: dto.consecutivoProveedor,
          proveedorId: dto.proveedorId,
          ordenCompraId: dto.ordenCompraId,
          fechaEmision: new Date(dto.fechaEmision),
          fechaVencimiento: fechaVenc,
          formaPago: dto.formaPago || (dto.fechaVencimiento ? 'CREDITO' : 'CONTADO'),
          medioPago: tienePagosMixtos ? 'MIXTO' : (dto.medioPago || undefined),
          diasCredito: dto.diasCredito !== undefined ? Number(dto.diasCredito) : (isCredito ? 30 : 0),
          saldo: saldoNum,
          totalPagado: totalPagadoNum,
          subtotal: dto.subtotal,
          descuento: dto.descuento ?? 0,
          iva: dto.iva ?? 0,
          total: dto.total,
          xmlAdjunto: dto.xmlAdjunto,
          notas: dto.notas,
          estado: isCredito ? 'REGISTRADA' : 'PAGADA',
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
      const numComp = `FP-${anio}-${seqComp}`;

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

      // 3. Si la compra es de CONTADO, generar automáticamente el Egreso (CE) y Comprobante de Egreso (CE)
      let pagosProcesados: {
        cajaBancoId?: number;
        cajaBancoNombre: string;
        medioPago: string;
        monto: number;
        referencia?: string;
        cuentaPuc: any;
      }[] = [];

      if (tienePagosMixtos) {
        for (const p of dto.pagos!) {
          let cbObj: any = null;
          let ctPuc: any = null;
          if (p.cajaBancoId) {
            cbObj = await tx.cajaBanco.findFirst({
              where: { id: p.cajaBancoId, empresaId },
            });
            if (cbObj?.cuentaPUC) {
              ctPuc = await tx.cuentaPUC.findFirst({
                where: { empresaId, codigo: cbObj.cuentaPUC },
              });
            }
          }
          if (!ctPuc) {
            const defCod = cbObj?.tipo === 'CAJA' ? '110505' : '111005';
            ctPuc = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: { in: [defCod, '110505', '1105', '111005', '1110'] } },
            });
          }
          if (!ctPuc) {
            ctPuc = cuentaTesoreriaPuc || await tx.cuentaPUC.findFirst({ where: { empresaId, codigo: { startsWith: '11' } } });
          }

          pagosProcesados.push({
            cajaBancoId: p.cajaBancoId,
            cajaBancoNombre: cbObj?.nombre || 'Tesorería',
            medioPago: p.medioPago || 'TRANSFERENCIA',
            monto: Number(p.monto),
            referencia: p.referencia,
            cuentaPuc: ctPuc,
          });
        }
      } else if (cuentaTesoreriaPuc) {
        pagosProcesados.push({
          cajaBancoId: dto.cajaBancoId || 0,
          cajaBancoNombre: cajaBancoObj?.nombre || 'Tesorería',
          medioPago: dto.medioPago || 'TRANSFERENCIA',
          monto: totalNum,
          cuentaPuc: cuentaTesoreriaPuc,
        });
      }

      if (!isCredito && cuentaProveedores && pagosProcesados.length > 0) {
        const detallePagosStr = tienePagosMixtos
          ? pagosProcesados.map(p => `${p.medioPago} (${p.cajaBancoNombre}): $${Math.round(p.monto).toLocaleString('es-CO')}`).join(' | ')
          : '';

        const conceptoEgreso = tienePagosMixtos
          ? `Pago FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor} [Pago Mixto: ${detallePagosStr}]`
          : `Pago Factura Compra ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`;

        const egreso = await tx.egreso.create({
          data: {
            empresaId,
            numero: numeroCe || `CE-${anio}-${fc.id}`,
            fecha,
            terceroId: dto.proveedorId,
            beneficiarioNombre: proveedor.nombre,
            beneficiarioDoc: proveedor.numeroDocumento,
            categoriaGasto: 'COMPRA MERCANCIA',
            concepto: conceptoEgreso,
            referencia: fc.numero,
            cuentaGastoId: cuentaProveedores.id,
            cajaBancoId: pagosProcesados[0]?.cajaBancoId || dto.cajaBancoId || undefined,
            medioPago: tienePagosMixtos ? 'MIXTO' : (dto.medioPago || 'TRANSFERENCIA'),
            monto: totalNum,
            montoNeto: totalNum,
            estado: 'APROBADO',
            usuarioId,
            documentoConfigId: docCeId || undefined,
          },
        });

        // Consecutivo del comprobante de egreso (CE)
        const lastCompEgreso = await tx.comprobante.findFirst({
          where: { empresaId, tipo: 'CE' },
          orderBy: { id: 'desc' },
        });
        const seqCompEgreso = lastCompEgreso ? parseInt(lastCompEgreso.numero.split('-').pop() ?? '0') + 1 : 1;
        const numCompEgreso = `CE-${anio}-${seqCompEgreso}`;

        const lineasEgreso = [
          {
            cuentaId: cuentaProveedores.id,
            descripcion: `Cancelación proveedor - FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}`,
            debito: totalNum,
            credito: 0,
            terceroNit: proveedor.numeroDocumento,
            terceroNombre: proveedor.nombre,
            orden: 0,
          },
          ...pagosProcesados.map((p, idx) => ({
            cuentaId: p.cuentaPuc.id,
            descripcion: `Salida fondos ${p.cajaBancoNombre} [${p.medioPago}] - ${egreso.numero}${p.referencia ? ` (Ref: ${p.referencia})` : ''}`,
            debito: 0,
            credito: p.monto,
            terceroNit: proveedor.numeroDocumento,
            terceroNombre: proveedor.nombre,
            orden: idx + 1,
          })),
        ];

        const compEgreso = await tx.comprobante.create({
          data: {
            empresaId,
            numero: numeroCe || numCompEgreso,
            tipo: 'CE',
            concepto: `Egreso ${egreso.numero} - Cancelación FC ${dto.prefijoProveedor ?? ''} ${dto.consecutivoProveedor}${tienePagosMixtos ? ' [Pago Mixto]' : ''}`,
            fecha,
            periodoId: periodo.id,
            referenciaId: egreso.id,
            referenciaTipo: 'EGRESO',
            usuarioId,
            lineas: {
              create: lineasEgreso,
            },
          },
        });

        await tx.egreso.update({
          where: { id: egreso.id },
          data: { comprobanteId: compEgreso.id },
        });

        await tx.facturaCompra.update({
          where: { id: fc.id },
          data: { egresoId: egreso.id },
        });
      }

      return fc;
    });
  }

  async anular(id: number, empresaId: number, motivo?: string, usuarioId?: number) {
    const fc = await this.prisma.facturaCompra.findFirst({
      where: { id, empresaId },
      include: { recepciones: true, items: true },
    });
    if (!fc) throw new NotFoundException('Factura de compra no encontrada');
    if (fc.estado === 'ANULADA') {
      throw new BadRequestException('Esta factura de compra ya se encuentra anulada');
    }

    if (fc.recepciones && fc.recepciones.length > 0) {
      throw new BadRequestException('No se puede anular la factura de compra porque ya cuenta con recepciones físicas de mercancía en bodega (RP). Debe anular o revertir los ingresos a almacén primero.');
    }

    if (fc.estadoRecepcion && fc.estadoRecepcion !== 'PENDIENTE') {
      throw new BadRequestException('No se puede anular la factura de compra porque ya tiene recepciones registradas en inventario.');
    }

    // Buscar si existe un Egreso contable real en la tabla Egreso
    const egresoAsociado = (fc as any).egresoId
      ? await this.prisma.egreso.findFirst({ where: { id: (fc as any).egresoId, empresaId } })
      : await this.prisma.egreso.findFirst({
          where: {
            empresaId,
            OR: [
              { referencia: fc.numero },
              { concepto: { contains: fc.consecutivoProveedor } },
            ],
            estado: { not: 'ANULADO' },
          },
        });

    return this.prisma.$transaction(async (tx) => {
      // 1. Si hay un Egreso contable real asociado, anularlo automáticamente
      if (egresoAsociado && egresoAsociado.estado !== 'ANULADO') {
        await tx.egreso.update({
          where: { id: egresoAsociado.id },
          data: {
            estado: 'ANULADO',
            notas: motivo ? `[ANULADO POR ANULACIÓN FC: ${motivo}]` : '[ANULADO POR ANULACIÓN FC]',
          },
        });

        // Anular también comprobantes contables vinculados al egreso
        const compEgresos = await tx.comprobante.findMany({
          where: { empresaId, referenciaId: egresoAsociado.id, referenciaTipo: 'EGRESO' },
        });
        for (const ceComp of compEgresos) {
          await tx.comprobante.update({
            where: { id: ceComp.id },
            data: { estado: 'ANULADO' },
          });
        }
      }

      // 2. Anular comprobantes contables vinculados a la causación de la FC (FP)
      const comprobantes = await tx.comprobante.findMany({
        where: { empresaId, referenciaId: id, referenciaTipo: 'FACTURA_COMPRA' },
      });
      for (const comp of comprobantes) {
        await tx.comprobante.update({
          where: { id: comp.id },
          data: {
            estado: 'ANULADO',
            concepto: motivo ? `${comp.concepto} [ANULADO: ${motivo}]` : `${comp.concepto} [ANULADO]`,
          },
        });
      }

      // 3. Si vino vinculada a una Orden de Compra, revertir estado de OC a 'APROBADA'
      if (fc.ordenCompraId) {
        await tx.ordenCompra.update({
          where: { id: fc.ordenCompraId },
          data: { estado: 'APROBADA' },
        });
      }

      // 4. Anulación lógica de factura de compra
      const notaAnulacion = motivo ? `[ANULADA: ${motivo}]` : '[ANULADA]';
      const notasActualizadas = fc.notas ? `${fc.notas} | ${notaAnulacion}` : notaAnulacion;

      return tx.facturaCompra.update({
        where: { id },
        data: {
          estado: 'ANULADA',
          saldo: 0,
          totalPagado: 0,
          notas: notasActualizadas,
        },
        include: {
          proveedor: true,
          items: true,
        },
      });
    });
  }

  async remove(id: number, empresaId: number) {
    return this.anular(id, empresaId);
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
        const cantTotal = cantAnterior + cantNueva;

        // Recalcular CPP ponderado multi-bodega con prevención de saldo negativo
        const { nuevoCPP } = await calcularNuevoCPP(tx, {
          productoId,
          empresaId,
          cantNueva,
          costoUnitario,
        });

        // Actualizar Stock de la bodega destino
        await tx.stock.update({
          where: { id: stock.id },
          data: { cantidad: { increment: cantNueva } },
        });

        // Actualizar CPP y Costo Última Compra en Producto
        await tx.producto.update({
          where: { id: productoId },
          data: {
            costoPromedio: nuevoCPP,
            costoUltimo: costoUnitario,
          },
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
            referenciaId: numeroRec,
            referenciaTipo: 'RP',
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

  async saldosProveedores(empresaId: number) {
    const facturas = await this.prisma.facturaCompra.findMany({
      where: {
        empresaId,
        estado: { notIn: ['PAGADA', 'ANULADA'] },
      },
      include: {
        proveedor: { select: { id: true, nombre: true, numeroDocumento: true, telefono: true } },
      },
      orderBy: { fechaEmision: 'desc' },
    });

    const proveedorMap = new Map<number, any>();
    for (const f of facturas) {
      const provId = f.proveedorId;
      const fSaldo = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : (f.formaPago === 'CONTADO' ? 0 : Number(f.total));
      if (fSaldo <= 0) continue;

      if (!proveedorMap.has(provId)) {
        proveedorMap.set(provId, {
          id: provId,
          nombre: f.proveedor?.nombre ?? 'Proveedor',
          numeroDocumento: f.proveedor?.numeroDocumento ?? '—',
          telefono: f.proveedor?.telefono ?? '—',
          totalFacturado: 0,
          saldo: 0,
          facturasPendientes: 0,
        });
      }

      const item = proveedorMap.get(provId);
      item.totalFacturado += Number(f.total);
      item.saldo += fSaldo;
      item.facturasPendientes += 1;
    }

    return Array.from(proveedorMap.values());
  }

  async registrarPago(
    id: number,
    empresaId: number,
    dto: { valor: number; medioPago?: string; referencia?: string; notas?: string; cajaBancoId?: number; documentoCeId?: number },
    usuarioId: number,
  ) {
    const fc = await this.findOne(id, empresaId);
    const valorNum = Number(dto.valor);
    if (valorNum <= 0) throw new BadRequestException('El valor del pago debe ser mayor a 0');

    const saldoActual = fc.saldo !== null && fc.saldo !== undefined ? Number(fc.saldo) : (fc.formaPago === 'CONTADO' ? 0 : Number(fc.total));
    if (valorNum > saldoActual) {
      throw new BadRequestException(`El valor del pago (${valorNum}) supera el saldo pendiente (${saldoActual})`);
    }

    const nuevoSaldo = Math.max(0, saldoActual - valorNum);
    const nuevoTotalPagado = Number(fc.totalPagado ?? 0) + valorNum;
    const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL';

    return this.prisma.$transaction(async (tx) => {
      const fecha = new Date();
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      // 1. Obtener o resolver documento CE
      let docCe = null;
      if (dto.documentoCeId) {
        docCe = await tx.documentoConfig.findFirst({
          where: { id: dto.documentoCeId, empresaId, sigla: 'CE', estado: 'ACTIVO' },
        });
      }
      if (!docCe) {
        docCe = await tx.documentoConfig.findFirst({
          where: { empresaId, sigla: 'CE', estado: 'ACTIVO' },
        });
      }

      let numeroCe: string;
      if (docCe) {
        numeroCe = `${docCe.prefijo}-${docCe.consecutivoSiguiente}`;
        await tx.documentoConfig.update({
          where: { id: docCe.id },
          data: { consecutivoSiguiente: { increment: 1 } },
        });
      } else {
        const lastEgreso = await tx.egreso.findFirst({
          where: { empresaId },
          orderBy: { id: 'desc' },
        });
        const seqEgreso = lastEgreso ? parseInt(lastEgreso.numero.split('-').pop() ?? '0') + 1 : 1;
        numeroCe = `CE-${anio}-${seqEgreso}`;
      }

      // 2. Resolver Cuentas Contables (2205 Proveedores y 1105/1110 Tesorería)
      let cuentaProveedores = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: { in: ['220505', '2205'] } },
      });
      if (!cuentaProveedores) {
        cuentaProveedores = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { startsWith: '2205' } },
        });
      }
      if (!cuentaProveedores) {
        cuentaProveedores = await tx.cuentaPUC.findFirst({
          where: { empresaId },
        });
      }

      let cajaBancoObj: any = null;
      let cuentaTesoreriaPuc: any = null;
      if (dto.cajaBancoId) {
        cajaBancoObj = await tx.cajaBanco.findFirst({
          where: { id: dto.cajaBancoId, empresaId },
        });
        if (cajaBancoObj?.cuentaPUC) {
          cuentaTesoreriaPuc = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: cajaBancoObj.cuentaPUC },
          });
        }
      }
      if (!cuentaTesoreriaPuc) {
        const defCod = cajaBancoObj?.tipo === 'CAJA' ? '110505' : '111005';
        cuentaTesoreriaPuc = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { in: [defCod, '110505', '1105', '111005', '1110'] } },
        });
      }

      const tienePagosMixtos = Array.isArray(dto.pagos) && dto.pagos.length > 0;
      let pagosProcesados: {
        cajaBancoId?: number;
        cajaBancoNombre: string;
        medioPago: string;
        monto: number;
        referencia?: string;
        cuentaPuc: any;
      }[] = [];

      if (tienePagosMixtos) {
        for (const p of dto.pagos!) {
          let cbObj: any = null;
          let ctPuc: any = null;
          if (p.cajaBancoId) {
            cbObj = await tx.cajaBanco.findFirst({
              where: { id: p.cajaBancoId, empresaId },
            });
            if (cbObj?.cuentaPUC) {
              ctPuc = await tx.cuentaPUC.findFirst({
                where: { empresaId, codigo: cbObj.cuentaPUC },
              });
            }
          }
          if (!ctPuc) {
            const defCod = cbObj?.tipo === 'CAJA' ? '110505' : '111005';
            ctPuc = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: { in: [defCod, '110505', '1105', '111005', '1110'] } },
            });
          }
          if (!ctPuc) {
            ctPuc = cuentaTesoreriaPuc || await tx.cuentaPUC.findFirst({ where: { empresaId, codigo: { startsWith: '11' } } });
          }

          pagosProcesados.push({
            cajaBancoId: p.cajaBancoId,
            cajaBancoNombre: cbObj?.nombre || 'Tesorería',
            medioPago: p.medioPago || 'TRANSFERENCIA',
            monto: Number(p.monto),
            referencia: p.referencia,
            cuentaPuc: ctPuc,
          });
        }
      } else if (cuentaTesoreriaPuc) {
        pagosProcesados.push({
          cajaBancoId: dto.cajaBancoId || 0,
          cajaBancoNombre: cajaBancoObj?.nombre || 'Tesorería',
          medioPago: dto.medioPago || 'TRANSFERENCIA',
          monto: valorNum,
          cuentaPuc: cuentaTesoreriaPuc,
        });
      }

      // 3. Crear Egreso en Tesorería
      const detallePagosStr = tienePagosMixtos
        ? pagosProcesados.map(p => `${p.medioPago} (${p.cajaBancoNombre}): $${Math.round(p.monto).toLocaleString('es-CO')}`).join(' | ')
        : '';

      const conceptoEgreso = tienePagosMixtos
        ? `Abono FC ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor} [Pago Mixto: ${detallePagosStr}]`
        : `Abono a Factura Compra ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor} (${fc.numero})`;

      const egreso = await tx.egreso.create({
        data: {
          empresaId,
          numero: numeroCe,
          fecha,
          terceroId: fc.proveedorId,
          beneficiarioNombre: fc.proveedor?.nombre,
          beneficiarioDoc: fc.proveedor?.numeroDocumento,
          categoriaGasto: 'PAGO PROVEEDOR',
          concepto: conceptoEgreso,
          referencia: fc.numero,
          cuentaGastoId: cuentaProveedores ? cuentaProveedores.id : 1,
          cajaBancoId: pagosProcesados[0]?.cajaBancoId || dto.cajaBancoId || undefined,
          medioPago: tienePagosMixtos ? 'MIXTO' : (dto.medioPago || 'TRANSFERENCIA'),
          monto: valorNum,
          montoNeto: valorNum,
          estado: 'APROBADO',
          usuarioId,
          documentoConfigId: docCe ? docCe.id : undefined,
        },
      });

      // 4. Crear Comprobante Contable CE
      if (cuentaProveedores && pagosProcesados.length > 0) {
        const periodo = await tx.periodoContable.upsert({
          where: { empresaId_anio_mes: { empresaId, anio, mes } },
          create: { empresaId, anio, mes },
          update: {},
        });

        const lineasEgreso = [
          {
            cuentaId: cuentaProveedores.id,
            descripcion: `Abono proveedor - FC ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor}`,
            debito: valorNum,
            credito: 0,
            terceroNit: fc.proveedor?.numeroDocumento,
            terceroNombre: fc.proveedor?.nombre,
            orden: 0,
          },
          ...pagosProcesados.map((p, idx) => ({
            cuentaId: p.cuentaPuc.id,
            descripcion: `Salida fondos ${p.cajaBancoNombre} [${p.medioPago}] - ${numeroCe}${p.referencia ? ` (Ref: ${p.referencia})` : ''}`,
            debito: 0,
            credito: p.monto,
            terceroNit: fc.proveedor?.numeroDocumento,
            terceroNombre: fc.proveedor?.nombre,
            orden: idx + 1,
          })),
        ];

        const compEgreso = await tx.comprobante.create({
          data: {
            empresaId,
            numero: numeroCe,
            tipo: 'CE',
            concepto: `Egreso ${numeroCe} - Pago FC ${fc.prefijoProveedor ?? ''} ${fc.consecutivoProveedor}${tienePagosMixtos ? ' [Pago Mixto]' : ''}`,
            fecha,
            periodoId: periodo.id,
            referenciaId: egreso.id,
            referenciaTipo: 'EGRESO',
            usuarioId,
            lineas: {
              create: lineasEgreso,
            },
          },
        });

        await tx.egreso.update({
          where: { id: egreso.id },
          data: { comprobanteId: compEgreso.id },
        });
      }

      // 5. Actualizar FacturaCompra
      return tx.facturaCompra.update({
        where: { id },
        data: {
          saldo: nuevoSaldo,
          totalPagado: nuevoTotalPagado,
          estado: nuevoEstado,
          numeroCe: fc.numeroCe ? fc.numeroCe : numeroCe,
          egresoId: egreso.id,
        },
        include: {
          proveedor: true,
        },
      });
    });
  }
}
