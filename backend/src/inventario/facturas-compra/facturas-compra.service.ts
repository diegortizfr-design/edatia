import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComprobantesService } from '../../contabilidad/comprobantes/comprobantes.service';
import { CreateFacturaCompraDto, UpdateFacturaCompraDto } from './dto/factura-compra.dto';

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
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: dto.proveedorId, empresaId },
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
      const numero = await this.generarConsecutivoInterno(empresaId, tx);
      // 1. Persistir la factura de compra
      const fc = await tx.facturaCompra.create({
        data: {
          empresaId,
          numero,
          prefijoProveedor: dto.prefijoProveedor,
          consecutivoProveedor: dto.consecutivoProveedor,
          proveedorId: dto.proveedorId,
          fechaEmision: new Date(dto.fechaEmision),
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
          subtotal: dto.subtotal,
          descuento: dto.descuento ?? 0,
          iva: dto.iva ?? 0,
          total: dto.total,
          xmlAdjunto: dto.xmlAdjunto,
          recepcionId: dto.recepcionId,
          notas: dto.notas,
          estado: 'REGISTRADA',
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

      // 2. Causación Contable Automatizada (PUC 1435 vs 2205)
      // Resolver cuentas del PUC
      let cuentaInventario = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: { in: ['143505', '1435'] } },
      });
      if (!cuentaInventario) {
        cuentaInventario = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { startsWith: '1435' } },
        });
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
        let cuentaIva = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: { in: ['240810', '2408'] } },
        });
        if (!cuentaIva) {
          cuentaIva = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: { startsWith: '2408' } },
          });
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
}
