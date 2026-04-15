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

  private async generarNumeroOC(empresaId: number): Promise<string> {
    const year = new Date().getFullYear();
    const count = await (this.prisma as any).ordenCompra.count({
      where: { empresaId, numero: { startsWith: `OC-${year}-` } },
    });
    return `OC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generarNumeroREC(empresaId: number): Promise<string> {
    const year = new Date().getFullYear();
    const count = await (this.prisma as any).recepcionMercancia.count({
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
      (this.prisma as any).proveedor.findFirst({ where: { id: dto.proveedorId, empresaId } }),
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
    const numero = await this.generarNumeroOC(empresaId);

    return (this.prisma as any).ordenCompra.create({
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

    const numeroRec = await this.generarNumeroREC(empresaId);
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx: any) => {
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

        // Generar número de movimiento
        const movCount = await tx.movimientoInventario.count({
          where: { empresaId, numero: { startsWith: `MOV-${year}-` } },
        });
        const numMov = `MOV-${year}-${String(movCount + 1).padStart(5, '0')}`;

        // Crear movimiento en el kardex
        await tx.movimientoInventario.create({
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
            notas: `Recepción ${numeroRec} · OC ${oc.numero}`,
          },
        });

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
