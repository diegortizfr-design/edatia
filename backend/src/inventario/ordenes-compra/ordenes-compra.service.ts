import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrdenCompraDto, UpdateOrdenCompraDto, RecibirOrdenCompraDto } from './dto/orden-compra.dto';

const OC_INCLUDE = {
  proveedor: { select: { id: true, nombre: true, nombreComercial: true, email: true, telefono: true } },
  bodega: { select: { id: true, nombre: true, codigo: true } },
  items: {
    include: {
      producto: { select: { id: true, nombre: true, sku: true, costoPromedio: true, unidadMedida: { select: { abreviatura: true } } } },
    },
  },
  recepciones: {
    include: { items: { include: { ordenCompraItem: { include: { producto: { select: { nombre: true, sku: true } } } } } } },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class OrdenesCompraService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async generarNumeroOC(empresaId: number, tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const db = tx || this.prisma;
    const count = await (db as any).ordenCompra.count({
      where: { empresaId, numero: { startsWith: `OC-${year}-` } },
    });
    return `OC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generarNumeroREC(empresaId: number, tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const db = tx || this.prisma;
    const count = await (db as any).recepcionMercancia.count({
      where: { empresaId, numero: { startsWith: `REC-${year}-` } },
    });
    return `REC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private calcularTotalesItem(cantidad: number, costoUnitario: number, descuentoPct = 0, tipoIva = 'GRAVADO_19') {
    const subtotalBruto = cantidad * costoUnitario;
    const descuento = subtotalBruto * (descuentoPct / 100);
    const subtotal = subtotalBruto - descuento;
    const tasaIva = tipoIva === 'GRAVADO_19' ? 0.19 : tipoIva === 'GRAVADO_5' ? 0.05 : 0;
    const ivaValor = subtotal * tasaIva;
    const total = subtotal + ivaValor;
    return { subtotal, ivaValor, total, descuento: descuento };
  }

  private calcularTotalesOC(items: Array<{ subtotal: number; ivaValor: number; total: number }>) {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.subtotal,
        iva: acc.iva + item.ivaValor,
        total: acc.total + item.total,
      }),
      { subtotal: 0, iva: 0, total: 0 },
    );
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async findAll(empresaId: number, filters?: { estado?: string; proveedorId?: number }) {
    const where: any = { empresaId };
    if (filters?.estado) where.estado = filters.estado;
    if (filters?.proveedorId) where.proveedorId = filters.proveedorId;

    return (this.prisma as any).ordenCompra.findMany({
      where,
      include: {
        proveedor: { select: { id: true, nombre: true, nombreComercial: true } },
        bodega: { select: { id: true, nombre: true, codigo: true } },
        items: {
          include: {
            producto: { select: { id: true, nombre: true, sku: true } }
          }
        },
        recepciones: {
          include: {
            items: {
              include: {
                ordenCompraItem: {
                  include: {
                    producto: { select: { id: true, nombre: true, sku: true } }
                  }
                }
              }
            }
          }
        },
        _count: { select: { items: true, recepciones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const oc = await (this.prisma as any).ordenCompra.findFirst({
      where: { id, empresaId },
      include: OC_INCLUDE,
    });
    if (!oc) throw new NotFoundException('Orden de compra no encontrada');
    return oc;
  }

  async create(dto: CreateOrdenCompraDto, empresaId: number, usuarioId: number) {
    if (!dto.items?.length) throw new BadRequestException('La orden debe tener al menos un ítem');

    // Verificar proveedor y bodega pertenecen a la empresa
    const [proveedor, bodega] = await Promise.all([
      this.prisma.tercero.findFirst({ where: { id: dto.proveedorId, empresaId, esProveedor: true } }),
      (this.prisma as any).bodega.findFirst({ where: { id: dto.bodegaId, empresaId } }),
    ]);
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    if (!bodega) throw new NotFoundException('Bodega no encontrada');

    // Obtener productos para calcular IVA
    const productoIds = dto.items.map(i => i.productoId);
    const productos = await (this.prisma as any).producto.findMany({
      where: { id: { in: productoIds }, empresaId },
      select: { id: true, tipoIva: true },
    });
    const productoMap = new Map(productos.map((p: any) => [p.id, p]));

    // Calcular totales por ítem
    const itemsCalculados = dto.items.map(item => {
      const producto = productoMap.get(item.productoId) as any;
      if (!producto) throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
      const totales = this.calcularTotalesItem(item.cantidad, item.costoUnitario, item.descuentoPct ?? 0, producto.tipoIva);
      return { ...item, ...totales };
    });

    const totalesOC = this.calcularTotalesOC(itemsCalculados);

    return this.prisma.$transaction(async (tx: any) => {
      const numero = await this.generarNumeroOC(empresaId, tx);
      return tx.ordenCompra.create({
        data: {
          numero,
          empresaId,
          proveedorId: dto.proveedorId,
          bodegaId: dto.bodegaId,
          fechaEsperada: dto.fechaEsperada ? new Date(dto.fechaEsperada) : undefined,
          notas: dto.notas,
          usuarioId,
          subtotal: totalesOC.subtotal,
          descuento: itemsCalculados.reduce((acc, i) => acc + i.descuento, 0),
          iva: totalesOC.iva,
          total: totalesOC.total,
          items: {
            create: itemsCalculados.map(item => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              costoUnitario: item.costoUnitario,
              descuentoPct: item.descuentoPct ?? 0,
              subtotal: item.subtotal,
              ivaValor: item.ivaValor,
              total: item.total,
            })),
          },
        },
        include: OC_INCLUDE,
      });
    });
  }

  async update(id: number, dto: UpdateOrdenCompraDto, empresaId: number) {
    const oc = await this.findOne(id, empresaId);
    if (oc.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden editar órdenes en estado BORRADOR');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // Si hay nuevos ítems, eliminar los anteriores y recrear
      if (dto.items && dto.items.length > 0) {
        await tx.ordenCompraItem.deleteMany({ where: { ordenCompraId: id } });

        const productoIds = dto.items.map(i => i.productoId);
        const productos = await tx.producto.findMany({
          where: { id: { in: productoIds }, empresaId },
          select: { id: true, tipoIva: true },
        });
        const productoMap = new Map(productos.map((p: any) => [p.id, p]));

        const itemsCalculados = dto.items.map((item: any) => {
          const producto = productoMap.get(item.productoId) as any;
          if (!producto) throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
          const totales = this.calcularTotalesItem(item.cantidad, item.costoUnitario, item.descuentoPct ?? 0, producto.tipoIva);
          return { ...item, ...totales };
        });

        const totalesOC = this.calcularTotalesOC(itemsCalculados);

        await tx.ordenCompraItem.createMany({
          data: itemsCalculados.map((item: any) => ({
            ordenCompraId: id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            descuentoPct: item.descuentoPct ?? 0,
            subtotal: item.subtotal,
            ivaValor: item.ivaValor,
            total: item.total,
          })),
        });

        return tx.ordenCompra.update({
          where: { id },
          data: {
            proveedorId: dto.proveedorId,
            bodegaId: dto.bodegaId,
            fechaEsperada: dto.fechaEsperada ? new Date(dto.fechaEsperada) : undefined,
            notas: dto.notas,
            subtotal: totalesOC.subtotal,
            iva: totalesOC.iva,
            total: totalesOC.total,
            descuento: itemsCalculados.reduce((acc: number, i: any) => acc + i.descuento, 0),
          },
          include: OC_INCLUDE,
        });
      }

      return tx.ordenCompra.update({
        where: { id },
        data: {
          proveedorId: dto.proveedorId,
          bodegaId: dto.bodegaId,
          fechaEsperada: dto.fechaEsperada ? new Date(dto.fechaEsperada) : undefined,
          notas: dto.notas,
        },
        include: OC_INCLUDE,
      });
    });
  }

  // ── Transiciones de estado ────────────────────────────────────────────────

  async aprobar(id: number, empresaId: number) {
    const oc = await this.findOne(id, empresaId);
    if (oc.estado !== 'BORRADOR') {
      throw new BadRequestException(`No se puede aprobar una orden en estado ${oc.estado}`);
    }
    return (this.prisma as any).ordenCompra.update({
      where: { id },
      data: { estado: 'APROBADA' },
      include: OC_INCLUDE,
    });
  }

  async anular(id: number, empresaId: number) {
    const oc = await this.findOne(id, empresaId);
    if (['RECIBIDA', 'ANULADA'].includes(oc.estado)) {
      throw new BadRequestException(`No se puede anular una orden en estado ${oc.estado}`);
    }
    return (this.prisma as any).ordenCompra.update({
      where: { id },
      data: { estado: 'ANULADA' },
      include: OC_INCLUDE,
    });
  }

  // ── Recepción de Mercancía ─────────────────────────────────────────────────
  // Crea la recepción, actualiza stock (upsert) y recalcula CPP — todo en una sola transacción

  async recibir(id: number, dto: RecibirOrdenCompraDto, empresaId: number, usuarioId: number) {
    const oc = await this.findOne(id, empresaId);
    if (!['APROBADA', 'RECIBIDA_PARCIAL'].includes(oc.estado)) {
      throw new BadRequestException(
        `No se puede recibir mercancía de una orden en estado ${oc.estado}. Debe estar APROBADA o RECIBIDA_PARCIAL.`
      );
    }

    if (!dto.items?.length) throw new BadRequestException('Debe especificar al menos un ítem a recibir');

    // Validar que los ítems pertenecen a esta OC y no sobrepasan lo pendiente
    const ocItemsMap = new Map(oc.items.map((i: any) => [i.id, i]));
    for (const ri of dto.items) {
      const ocItem = ocItemsMap.get(ri.ordenCompraItemId) as any;
      if (!ocItem) throw new NotFoundException(`Ítem ${ri.ordenCompraItemId} no pertenece a esta orden`);
      const pendiente = parseFloat(ocItem.cantidad.toString()) - parseFloat(ocItem.cantidadRecibida.toString());
      if (ri.cantidadRecibida > pendiente + 0.001) {
        throw new BadRequestException(
          `Producto ${ocItem.producto?.nombre}: cantidad a recibir (${ri.cantidadRecibida}) supera lo pendiente (${pendiente.toFixed(3)})`
        );
      }
    }

    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx: any) => {
      const numeroRec = await this.generarNumeroREC(empresaId, tx);
      // 1. Crear la recepción con sus ítems
      const recepcion = await tx.recepcionMercancia.create({
        data: {
          numero: numeroRec,
          empresaId,
          ordenCompraId: id,
          usuarioId,
          notas: dto.notas,
          items: {
            create: dto.items.map(ri => {
              const ocItem = ocItemsMap.get(ri.ordenCompraItemId) as any;
              return {
                ordenCompraItemId: ri.ordenCompraItemId,
                cantidadRecibida: ri.cantidadRecibida,
                costoUnitario: ri.costoUnitario ?? parseFloat(ocItem.costoUnitario.toString()),
              };
            }),
          },
        },
      });

      // 2. Para cada ítem recibido: actualizar stock + recalcular CPP + crear movimiento en kardex
      for (const ri of dto.items) {
        const ocItem = ocItemsMap.get(ri.ordenCompraItemId) as any;
        const costoUnitario = ri.costoUnitario ?? parseFloat(ocItem.costoUnitario.toString());
        const productoId = ocItem.productoId;
        const bodegaId = oc.bodegaId;

        // Obtener producto actual (CPP vigente)
        const producto = await tx.producto.findUnique({ where: { id: productoId } });
        if (!producto) throw new NotFoundException(`Producto ${productoId} no encontrado`);

        // Validaciones de Lotes y Seriales
        if (producto.manejaLotes && !ri.loteNumero) {
          throw new BadRequestException(`Debe especificar el número de lote para el producto ${producto.nombre}`);
        }
        if (producto.manejaSerial) {
          if (!ri.seriales || ri.seriales.length === 0) {
            throw new BadRequestException(`Debe especificar los números de serie para el producto ${producto.nombre}`);
          }
          if (ri.seriales.length !== Math.ceil(ri.cantidadRecibida)) {
            throw new BadRequestException(`La cantidad de seriales (${ri.seriales.length}) no coincide con la cantidad recibida (${ri.cantidadRecibida}) para el producto ${producto.nombre}`);
          }
        }

        // Obtener o crear stock
        let stock = await tx.stock.findUnique({
          where: { productoId_bodegaId: { productoId, bodegaId } },
        });
        if (!stock) {
          stock = await tx.stock.create({
            data: { productoId, bodegaId, empresaId, cantidad: 0, cantidadReservada: 0 },
          });
        }

        const cantAnterior = parseFloat(stock.cantidad.toString());
        const cppAnterior = parseFloat(producto.costoPromedio.toString());
        const cantNueva = ri.cantidadRecibida;
        const cantTotal = cantAnterior + cantNueva;

        // Recalcular CPP
        const nuevoCPP = cantTotal > 0
          ? (cantAnterior * cppAnterior + cantNueva * costoUnitario) / cantTotal
          : costoUnitario;

        // Actualizar stock
        await tx.stock.update({
          where: { productoId_bodegaId: { productoId, bodegaId } },
          data: { cantidad: { increment: cantNueva } },
        });

        // Actualizar CPP del producto
        await tx.producto.update({
          where: { id: productoId },
          data: { costoPromedio: nuevoCPP },
        });

        // Procesar Lote si maneja lotes
        let loteId: number | undefined;
        if (producto.manejaLotes && ri.loteNumero) {
          let lote = await tx.lote.findFirst({
            where: {
              empresaId,
              productoId,
              bodegaId,
              numero: ri.loteNumero,
            },
          });
          if (lote) {
            lote = await tx.lote.update({
              where: { id: lote.id },
              data: {
                cantidad: { increment: cantNueva },
                cantidadInicial: { increment: cantNueva },
                fechaVencimiento: ri.fechaVencimiento ? new Date(ri.fechaVencimiento) : lote.fechaVencimiento,
              },
            });
          } else {
            lote = await tx.lote.create({
              data: {
                empresaId,
                productoId,
                bodegaId,
                numero: ri.loteNumero,
                cantidadInicial: cantNueva,
                cantidad: cantNueva,
                fechaVencimiento: ri.fechaVencimiento ? new Date(ri.fechaVencimiento) : null,
                activo: true,
              },
            });
          }
          loteId = lote.id;
        }

        // Generar número de movimiento
        const movCount = await tx.movimientoInventario.count({
          where: { empresaId, numero: { startsWith: `MOV-${year}-` } },
        });
        const numMov = `MOV-${year}-${String(movCount + 1).padStart(5, '0')}`;

        // Notas para registrar el lote si existe
        const loteNotas = ri.loteNumero ? ` [Lote: ${ri.loteNumero}]` : '';

        // Crear movimiento en el kardex
        const mov = await tx.movimientoInventario.create({
          data: {
            numero: numMov,
            empresaId,
            tipo: 'ENTRADA',
            concepto: 'COMPRA',
            productoId,
            bodegaDestinoId: bodegaId,
            cantidad: cantNueva,
            costoUnitario,
            costoTotal: cantNueva * costoUnitario,
            saldoCantidad: cantTotal,
            saldoCostoTotal: cantTotal * nuevoCPP,
            saldoCpp: nuevoCPP,
            usuarioId,
            referenciaId: String(id),
            referenciaTipo: 'OrdenCompra',
            notas: `Recepción ${numeroRec} · OC ${oc.numero}${loteNotas}`,
          },
        });

        // Procesar Seriales si maneja seriales
        if (producto.manejaSerial && ri.seriales && ri.seriales.length > 0) {
          for (const s of ri.seriales) {
            const existeSerial = await tx.numeroSerie.findFirst({
              where: {
                empresaId,
                productoId,
                serial: s,
              },
            });
            if (existeSerial) {
              await tx.numeroSerie.update({
                where: { id: existeSerial.id },
                data: {
                  estado: 'DISPONIBLE',
                  bodegaId,
                  loteId: loteId ?? null,
                  movimientoEntradaId: mov.id,
                },
              });
            } else {
              await tx.numeroSerie.create({
                data: {
                  empresaId,
                  productoId,
                  bodegaId,
                  loteId: loteId ?? null,
                  serial: s,
                  estado: 'DISPONIBLE',
                  movimientoEntradaId: mov.id,
                },
              });
            }
          }
        }

        // Actualizar cantidadRecibida del ítem de la OC
        await tx.ordenCompraItem.update({
          where: { id: ri.ordenCompraItemId },
          data: { cantidadRecibida: { increment: cantNueva } },
        });
      }

      // 3. Determinar nuevo estado de la OC
      // Recargar ítems actualizados para verificar si todo fue recibido
      const itemsActualizados = await tx.ordenCompraItem.findMany({ where: { ordenCompraId: id } });
      const todoRecibido = itemsActualizados.every((item: any) => {
        const recibido = parseFloat(item.cantidadRecibida.toString());
        const total = parseFloat(item.cantidad.toString());
        return recibido >= total - 0.001;
      });

      const nuevoEstado = todoRecibido ? 'RECIBIDA' : 'RECIBIDA_PARCIAL';
      await tx.ordenCompra.update({
        where: { id },
        data: {
          estado: nuevoEstado,
          fechaRecepcion: todoRecibido ? new Date() : undefined,
        },
      });

      return {
        recepcion,
        estado: nuevoEstado,
        message: todoRecibido
          ? `Recepción completa registrada. OC marcada como RECIBIDA.`
          : `Recepción parcial registrada. Quedan ítems pendientes.`,
      };
    });
  }
}
