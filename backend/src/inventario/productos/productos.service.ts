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

    const metadata = (p.metadataWeb as Record<string, any>) || {};
    return {
      ...p,
      esDigital: metadata.esDigital ?? false,
      nombreWeb: metadata.nombreWeb ?? '',
      imagenes: Array.isArray(metadata.imagenes) ? metadata.imagenes : [],
      etiquetaSeo: metadata.etiquetaSeo ?? '',
      metaDescripcion: metadata.metaDescripcion ?? '',
      ordenMostrar: metadata.ordenMostrar ?? 0,
      urlDescarga: metadata.urlDescarga ?? '',
    };
  }

  async create(dto: CreateProductoDto, empresaId: number) {
    const exists = await (this.prisma as any).producto.findUnique({
      where: { empresaId_sku: { empresaId, sku: dto.sku } },
    });
    if (exists) throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    
    const { proveedores, codigos, ...productData } = dto as any;

    const metadataFields = {
      esDigital: productData.esDigital,
      nombreWeb: productData.nombreWeb,
      imagenes: productData.imagenes,
      etiquetaSeo: productData.etiquetaSeo,
      metaDescripcion: productData.metaDescripcion,
      ordenMostrar: productData.ordenMostrar,
      urlDescarga: productData.urlDescarga
    };

    delete productData.esDigital;
    delete productData.nombreWeb;
    delete productData.imagenes;
    delete productData.etiquetaSeo;
    delete productData.metaDescripcion;
    delete productData.ordenMostrar;
    delete productData.urlDescarga;

    productData.metadataWeb = metadataFields;
    if (Array.isArray(metadataFields.imagenes) && metadataFields.imagenes.length > 0) {
      productData.imagen = metadataFields.imagenes[0];
    }

    if (!productData.tipoIva) {
      if (productData.productoExentoIva) {
        productData.tipoIva = 'EXENTO';
      } else if (productData.liquidarIva === false || (Array.isArray(productData.appliedTaxIds) && productData.appliedTaxIds.length === 0)) {
        productData.tipoIva = 'EXCLUIDO';
      } else if (Array.isArray(productData.appliedTaxIds) && productData.appliedTaxIds.some((t: string) => t.toLowerCase().includes('5'))) {
        productData.tipoIva = 'GRAVADO_5';
      } else {
        productData.tipoIva = 'GRAVADO_19';
      }
    }

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

    const existing = await this.findOne(id, empresaId);
    const existingMetadata = (existing.metadataWeb as Record<string, any>) || {};

    const metadataFields = {
      ...existingMetadata,
      ...(productData.esDigital !== undefined && { esDigital: productData.esDigital }),
      ...(productData.nombreWeb !== undefined && { nombreWeb: productData.nombreWeb }),
      ...(productData.imagenes !== undefined && { imagenes: productData.imagenes }),
      ...(productData.etiquetaSeo !== undefined && { etiquetaSeo: productData.etiquetaSeo }),
      ...(productData.metaDescripcion !== undefined && { metaDescripcion: productData.metaDescripcion }),
      ...(productData.ordenMostrar !== undefined && { ordenMostrar: productData.ordenMostrar }),
      ...(productData.urlDescarga !== undefined && { urlDescarga: productData.urlDescarga }),
    };

    delete productData.esDigital;
    delete productData.nombreWeb;
    delete productData.imagenes;
    delete productData.etiquetaSeo;
    delete productData.metaDescripcion;
    delete productData.ordenMostrar;
    delete productData.urlDescarga;

    productData.metadataWeb = metadataFields;
    if (Array.isArray(metadataFields.imagenes) && metadataFields.imagenes.length > 0) {
      productData.imagen = metadataFields.imagenes[0];
    }

    if (productData.productoExentoIva !== undefined || productData.liquidarIva !== undefined || productData.appliedTaxIds !== undefined) {
      const isExempt = productData.productoExentoIva ?? existing.productoExentoIva;
      const isLiquidated = productData.liquidarIva ?? existing.liquidarIva;
      const appliedTaxes = productData.appliedTaxIds ?? existing.appliedTaxIds;

      if (isExempt) {
        productData.tipoIva = 'EXENTO';
      } else if (isLiquidated === false || (Array.isArray(appliedTaxes) && appliedTaxes.length === 0)) {
        productData.tipoIva = 'EXCLUIDO';
      } else if (Array.isArray(appliedTaxes) && appliedTaxes.some((t: string) => t.toLowerCase().includes('5'))) {
        productData.tipoIva = 'GRAVADO_5';
      } else if (Array.isArray(appliedTaxes) && appliedTaxes.some((t: string) => t.toLowerCase().includes('19'))) {
        productData.tipoIva = 'GRAVADO_19';
      }
    }

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

  async getFacturas(productoId: number, empresaId: number) {
    await this.findOne(productoId, empresaId);
    return (this.prisma as any).facturaVentaItem.findMany({
      where: {
        productoId,
        factura: {
          empresaId,
        },
      },
      include: {
        factura: {
          include: {
            cliente: {
              select: {
                nombre: true,
                numeroDocumento: true,
              },
            },
          },
        },
      },
      orderBy: {
        factura: {
          fecha: 'desc',
        },
      },
    });
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

  async importarMasivo(items: any[], empresaId: number, userId?: number) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Se requiere una lista de productos para importar.');
    }

    const resultados = {
      creados: 0,
      actualizados: 0,
      fallidos: 0,
      errores: [] as string[],
    };

    // Pre-obtener o crear bodega principal
    let defaultBodega = await (this.prisma as any).bodega.findFirst({
      where: { empresaId, esPrincipal: true, activo: true },
    });
    if (!defaultBodega) {
      defaultBodega = await (this.prisma as any).bodega.findFirst({
        where: { empresaId, activo: true },
      });
    }
    if (!defaultBodega) {
      defaultBodega = await (this.prisma as any).bodega.create({
        data: {
          empresaId,
          codigo: 'BOD-01',
          nombre: 'Bodega Principal',
          tipo: 'PRINCIPAL',
          esPrincipal: true,
          activo: true,
        },
      });
    }

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const filaNum = i + 1;
      const sku = String(row.sku || row.SKU || '').trim();
      const nombre = String(row.nombre || row.Nombre || '').trim();

      if (!sku || !nombre) {
        resultados.fallidos++;
        resultados.errores.push(`Fila ${filaNum}: SKU y Nombre son obligatorios.`);
        continue;
      }

      try {
        // 1. Categoría
        let categoriaId: number | null = null;
        const catNombre = String(row.categoria || row.Categoria || '').trim();
        if (catNombre) {
          const catSlug = catNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          let cat = await (this.prisma as any).categoria.findFirst({
            where: { empresaId, OR: [{ nombre: { equals: catNombre, mode: 'insensitive' } }, { slug: catSlug }] },
          });
          if (!cat) {
            cat = await (this.prisma as any).categoria.create({
              data: { empresaId, nombre: catNombre, slug: catSlug, activo: true },
            });
          }
          categoriaId = cat.id;
        }

        // 2. Marca
        let marcaId: number | null = null;
        const marcaNombre = String(row.marca || row.Marca || '').trim();
        if (marcaNombre) {
          let m = await (this.prisma as any).marca.findFirst({
            where: { empresaId, nombre: { equals: marcaNombre, mode: 'insensitive' } },
          });
          if (!m) {
            m = await (this.prisma as any).marca.create({
              data: { empresaId, nombre: marcaNombre, activo: true },
            });
          }
          marcaId = m.id;
        }

        // 3. Unidad de Medida
        let unidadMedidaId: number | null = null;
        const undNombre = String(row.unidadMedida || row.Unidad_Medida || row.unidad || 'UND').trim().toUpperCase();
        if (undNombre) {
          let u = await (this.prisma as any).unidadMedida.findFirst({
            where: { empresaId, OR: [{ abreviatura: { equals: undNombre, mode: 'insensitive' } }, { nombre: { equals: undNombre, mode: 'insensitive' } }] },
          });
          if (!u) {
            u = await (this.prisma as any).unidadMedida.create({
              data: { empresaId, nombre: undNombre, abreviatura: undNombre, tipo: 'UNIDAD', activo: true },
            });
          }
          unidadMedidaId = u.id;
        }

        // 4. Bodega
        let targetBodegaId = defaultBodega.id;
        const bodegaNombre = String(row.bodega || row.Bodega || '').trim();
        if (bodegaNombre) {
          const b = await (this.prisma as any).bodega.findFirst({
            where: { empresaId, OR: [{ nombre: { equals: bodegaNombre, mode: 'insensitive' } }, { codigo: { equals: bodegaNombre, mode: 'insensitive' } }] },
          });
          if (b) targetBodegaId = b.id;
        }

        // 5. Precios y Costos
        const precioBase = Number(String(row.precioVenta || row.Precio_Venta || row.precio || 0).replace(/[^0-9.]/g, '')) || 0;
        const precio2 = Number(String(row.precio2 || row.Precio_2 || 0).replace(/[^0-9.]/g, '')) || 0;
        const costo = Number(String(row.costoUnitario || row.Costo_Unitario || row.costo || 0).replace(/[^0-9.]/g, '')) || 0;
        const stockInicial = Number(String(row.stockInicial || row.Stock_Inicial || row.stock || 0).replace(/[^0-9.]/g, '')) || 0;
        const stockMinimo = Number(String(row.stockMinimo || row.Stock_Minimo || 0).replace(/[^0-9.]/g, '')) || 0;
        const puntoReorden = Number(String(row.puntoReorden || row.Punto_Reorden || 0).replace(/[^0-9.]/g, '')) || 0;

        // 6. IVA
        const rawTipoIva = String(row.tipoIva || row.Tipo_IVA || 'GRAVADO_19').trim().toUpperCase();
        let tipoIva = 'GRAVADO_19';
        let productoExentoIva = false;
        let liquidarIva = true;
        let appliedTaxIds = ['iva_19'];

        if (rawTipoIva.includes('EXENTO') || rawTipoIva === '0') {
          tipoIva = 'EXENTO';
          productoExentoIva = true;
          liquidarIva = false;
          appliedTaxIds = [];
        } else if (rawTipoIva.includes('EXCLUIDO') || rawTipoIva === 'NO' || rawTipoIva === 'SIN_IVA') {
          tipoIva = 'EXCLUIDO';
          productoExentoIva = false;
          liquidarIva = false;
          appliedTaxIds = [];
        } else if (rawTipoIva.includes('5')) {
          tipoIva = 'GRAVADO_5';
          productoExentoIva = false;
          liquidarIva = true;
          appliedTaxIds = ['iva_5'];
        }

        const codigoBarras = String(row.codigoBarras || row.Codigo_Barras || '').trim() || null;
        const referencia = String(row.referencia || row.Referencia || '').trim() || null;
        const descripcion = String(row.descripcion || row.Descripcion || '').trim() || null;
        const ubicacion1 = String(row.ubicacion || row.Ubicacion || row.ubicacion1 || '').trim() || null;
        const manejaLotes = String(row.manejaLotes || row.Maneja_Lotes || '').toLowerCase() === 'si' || String(row.manejaLotes || row.Maneja_Lotes || '').toLowerCase() === 'true';
        const numeroLote = String(row.numeroLote || row.Numero_Lote || '').trim() || null;
        const fechaVencimiento = String(row.fechaVencimiento || row.Fecha_Vencimiento || '').trim() || null;

        // Precios array (11 precios)
        const precios = Array(11).fill(0);
        precios[0] = precioBase;
        if (precio2 > 0) precios[1] = precio2;

        // 7. Upsert Producto
        const existing = await (this.prisma as any).producto.findFirst({
          where: { empresaId, sku },
        });

        let productoId: number;
        if (existing) {
          const updated = await (this.prisma as any).producto.update({
            where: { id: existing.id },
            data: {
              nombre,
              codigoBarras: codigoBarras ?? existing.codigoBarras,
              referencia: referencia ?? existing.referencia,
              descripcion: descripcion ?? existing.descripcion,
              categoriaId: categoriaId ?? existing.categoriaId,
              marcaId: marcaId ?? existing.marcaId,
              unidadMedidaId: unidadMedidaId ?? existing.unidadMedidaId,
              precioBase: precioBase > 0 ? precioBase : existing.precioBase,
              precios: precioBase > 0 ? precios : existing.precios,
              costo: costo > 0 ? costo : existing.costo,
              costoPromedio: costo > 0 ? costo : existing.costoPromedio,
              costoUltimo: costo > 0 ? costo : existing.costoUltimo,
              tipoIva,
              liquidarIva,
              productoExentoIva,
              appliedTaxIds,
              stockMinimo: stockMinimo > 0 ? stockMinimo : existing.stockMinimo,
              puntoReorden: puntoReorden > 0 ? puntoReorden : existing.puntoReorden,
              ubicacion1: ubicacion1 ?? existing.ubicacion1,
              manejaLotes: manejaLotes ?? existing.manejaLotes,
            },
          });
          productoId = updated.id;
          resultados.actualizados++;
        } else {
          const created = await (this.prisma as any).producto.create({
            data: {
              empresaId,
              sku,
              nombre,
              codigoBarras,
              referencia,
              descripcion,
              categoriaId,
              marcaId,
              unidadMedidaId,
              precioBase,
              precios,
              costo,
              costoPromedio: costo,
              costoUltimo: costo,
              tipoIva,
              liquidarIva,
              productoExentoIva,
              appliedTaxIds,
              stockMinimo,
              puntoReorden,
              ubicacion1,
              manejaBodega: true,
              manejaLotes,
              activo: true,
            },
          });
          productoId = created.id;
          resultados.creados++;
        }

        // 8. Stock Inicial y Movimiento de Entrada
        if (stockInicial > 0) {
          const existingStock = await (this.prisma as any).stock.findFirst({
            where: { productoId, bodegaId: targetBodegaId },
          });

          if (existingStock) {
            await (this.prisma as any).stock.update({
              where: { id: existingStock.id },
              data: { cantidad: { increment: stockInicial } },
            });
          } else {
            await (this.prisma as any).stock.create({
              data: {
                empresaId,
                productoId,
                bodegaId: targetBodegaId,
                cantidad: stockInicial,
                cantidadReservada: 0,
              },
            });
          }

          // Kardex Entry
          const numeroMov = `ENT-INI-${Date.now().toString().slice(-6)}-${filaNum}`;
          await (this.prisma as any).movimientoInventario.create({
            data: {
              empresaId,
              numero: numeroMov,
              tipo: 'ENTRADA',
              concepto: 'Saldo Inicial / Importación Masiva Excel',
              productoId,
              bodegaDestinoId: targetBodegaId,
              cantidad: stockInicial,
              costoUnitario: costo,
              costoTotal: stockInicial * costo,
              saldoCantidad: stockInicial,
              saldoCostoTotal: stockInicial * costo,
              saldoCpp: costo,
              usuarioId: userId ?? null,
              notas: `Carga masiva fila #${filaNum}`,
            },
          });

          // Lote si aplica
          if (manejaLotes && numeroLote) {
            const expDate = fechaVencimiento ? new Date(fechaVencimiento) : null;
            await (this.prisma as any).lote.create({
              data: {
                empresaId,
                productoId,
                bodegaId: targetBodegaId,
                numero: numeroLote,
                cantidad: stockInicial,
                cantidadInicial: stockInicial,
                fechaVencimiento: expDate,
                activo: true,
              },
            });
          }
        }
      } catch (err: any) {
        resultados.fallidos++;
        resultados.errores.push(`Fila ${filaNum} (${sku}): ${err.message || 'Error al procesar'}`);
      }
    }

    return resultados;
  }
}
