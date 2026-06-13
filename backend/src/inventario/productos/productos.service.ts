import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

const PRODUCTO_INCLUDE = {
  categoria: { select: { id: true, nombre: true } },
  marca: { select: { id: true, nombre: true } },
  unidadMedida: { select: { id: true, nombre: true, abreviatura: true } },
  grupo: { select: { id: true, nombre: true } },
  subgrupo: { select: { id: true, nombre: true } },
  color: { select: { id: true, nombre: true } },
  talla: { select: { id: true, nombre: true } },
  clasificacion: { select: { id: true, nombre: true, pucCuenta: true } },
  proveedoresRel: {
    include: {
      proveedor: { select: { id: true, nombre: true, nombreComercial: true, email: true, telefono: true } }
    }
  },
  codigosBarrasRel: true,
  stock: {
    include: { bodega: { select: { id: true, nombre: true, codigo: true } } },
  },
};

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, query?: { q?: string; categoriaId?: number; marcaId?: number; activo?: boolean }) {
    const where: any = { empresaId };
    if (query?.activo !== undefined) where.activo = query.activo;
    if (query?.categoriaId) where.categoriaId = query.categoriaId;
    if (query?.marcaId) where.marcaId = query.marcaId;
    if (query?.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { codigoBarras: { contains: query.q, mode: 'insensitive' } },
        { referencia: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return (this.prisma as any).producto.findMany({
      where,
      include: PRODUCTO_INCLUDE,
      orderBy: { nombre: 'asc' },
    });
  }

  async buscar(q: string, empresaId: number) {
    if (!q || q.length < 2) throw new BadRequestException('Mínimo 2 caracteres para buscar');
    return (this.prisma as any).producto.findMany({
      where: {
        empresaId,
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { codigoBarras: q },
        ],
      },
      include: {
        unidadMedida: { select: { abreviatura: true } },
        stock: { include: { bodega: { select: { id: true, nombre: true } } } },
      },
      take: 20,
    });
  }

  async findOne(id: number, empresaId: number) {
    const p = await (this.prisma as any).producto.findFirst({
      where: { id, empresaId },
      include: PRODUCTO_INCLUDE,
    });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  async create(dto: CreateProductoDto, empresaId: number) {
    const exists = await (this.prisma as any).producto.findUnique({
      where: { empresaId_sku: { empresaId, sku: dto.sku } },
    });
    if (exists) throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    
    const { proveedores, codigos, ...productData } = dto as any;
    
    const p = await (this.prisma as any).producto.create({
      data: {
        ...productData,
        empresaId,
      },
      include: PRODUCTO_INCLUDE,
    });
    
    // Sync suppliers if any
    if (proveedores && Array.isArray(proveedores)) {
      await (this.prisma as any).productoProveedor.createMany({
        data: proveedores.map((prov: any) => ({
          productoId: p.id,
          proveedorId: Number(prov.id || prov.proveedorId),
          codigoProveedor: prov.codigoProveedor || null,
          precioCompra: Number(prov.precioCompra || prov.precioAcordado) || 0,
          tiempoEntregaDias: Number(prov.tiempoEntregaDias || prov.plazoEntrega) || 0,
          prioridad: prov.esPrincipal ? 1 : 2,
          empresaId,
        }))
      });
    }
    
    // Sync barcodes if any
    if (codigos && Array.isArray(codigos)) {
      await (this.prisma as any).codigoBarras.createMany({
        data: codigos.map((c: any) => ({
          productoId: p.id,
          codigo: c.codigo,
          tipo: c.tipo || 'EAN13',
          descripcion: c.descripcion || null,
          esPrincipal: !!c.esPrincipal,
          empresaId,
        }))
      });
    }
    
    return this.findOne(p.id, empresaId);
  }

  async update(id: number, dto: UpdateProductoDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.sku) {
      const conflict = await (this.prisma as any).producto.findFirst({
        where: { empresaId, sku: dto.sku, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    }
    
    const { proveedores, codigos, ...productData } = dto as any;
    
    const p = await (this.prisma as any).producto.update({
      where: { id },
      data: productData,
      include: PRODUCTO_INCLUDE,
    });
    
    // Sync suppliers if any
    if (proveedores && Array.isArray(proveedores)) {
      await (this.prisma as any).productoProveedor.deleteMany({ where: { productoId: id } });
      await (this.prisma as any).productoProveedor.createMany({
        data: proveedores.map((prov: any) => ({
          productoId: id,
          proveedorId: Number(prov.id || prov.proveedorId),
          codigoProveedor: prov.codigoProveedor || null,
          precioCompra: Number(prov.precioCompra || prov.precioAcordado) || 0,
          tiempoEntregaDias: Number(prov.tiempoEntregaDias || prov.plazoEntrega) || 0,
          prioridad: prov.esPrincipal ? 1 : 2,
          empresaId,
        }))
      });
    }
    
    // Sync barcodes if any
    if (codigos && Array.isArray(codigos)) {
      await (this.prisma as any).codigoBarras.deleteMany({ where: { productoId: id } });
      await (this.prisma as any).codigoBarras.createMany({
        data: codigos.map((c: any) => ({
          productoId: id,
          codigo: c.codigo,
          tipo: c.tipo || 'EAN13',
          descripcion: c.descripcion || null,
          esPrincipal: !!c.esPrincipal,
          empresaId,
        }))
      });
    }
    
    return this.findOne(id, empresaId);
  }

  /**
   * Clasifica todos los productos de la empresa según el método ABC:
   *   A → acumula hasta el 80 % del valor de inventario
   *   B → del 80 % al 95 %
   *   C → del 95 % en adelante
   */
  async clasificarAbc(empresaId: number) {
    const stocks = await (this.prisma as any).stock.findMany({
      where: { empresaId },
      include: { producto: { select: { id: true, costoPromedio: true } } },
    });

    // Agrupar por producto (suma de todas las bodegas)
    const valorPorProducto = new Map<number, number>();
    for (const s of stocks) {
      const valor = parseFloat(s.cantidad) * parseFloat(s.producto.costoPromedio);
      valorPorProducto.set(s.productoId, (valorPorProducto.get(s.productoId) ?? 0) + valor);
    }

    const valorTotal = [...valorPorProducto.values()].reduce((a, v) => a + v, 0);
    const ordenados = [...valorPorProducto.entries()].sort((a, b) => b[1] - a[1]);

    let acumulado = 0;
    const updates: Promise<any>[] = [];
    for (const [productoId, valor] of ordenados) {
      acumulado += valor;
      const pct = valorTotal > 0 ? (acumulado / valorTotal) * 100 : 100;
      const clase = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
      updates.push(
        (this.prisma as any).producto.update({ where: { id: productoId }, data: { claseAbc: clase } }),
      );
    }

    await Promise.all(updates);
    return { clasificados: updates.length, mensaje: 'Clasificación ABC actualizada correctamente' };
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    try {
      // Delete stock, lotes, serials, and variants first
      await (this.prisma as any).stock.deleteMany({ where: { productoId: id } });
      await (this.prisma as any).lote.deleteMany({ where: { productoId: id } });
      await (this.prisma as any).numeroSerie.deleteMany({ where: { productoId: id } });
      await (this.prisma as any).varianteProducto.deleteMany({ where: { productoId: id } });
      
      return await (this.prisma as any).producto.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2003') {
        throw new ConflictException(
          'No se puede eliminar el producto porque tiene movimientos de inventario, facturas o registros relacionados históricos.'
        );
      }
      throw e;
    }
  }
}
