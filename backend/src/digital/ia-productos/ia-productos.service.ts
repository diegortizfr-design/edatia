import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ImagenEntrada } from './gemini.service';
import { ImagenEstandarService } from './imagen-estandar.service';
import {
  CrearProductoIaDto,
  RegenerarImagenIaDto,
  ActualizarBorradorIaDto,
  RegistrarCompartidoDto,
} from './dto/ia-productos.dto';
import { v2 as cloudinary } from 'cloudinary';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class IaProductosService {
  private readonly logger = new Logger(IaProductosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly imagenEstandar: ImagenEstandarService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Pipeline completo para crear un producto borrador asistido por IA:
   *  1. Valida archivos (1 a 3 fotos).
   *  2. Normaliza las fotos de entrada.
   *  3. Carga categorías y marcas existentes de la empresa para pasarlas como contexto a Gemini.
   *  4. Analiza las fotos con Gemini (nombre, descripción, categoría, talla, marca, SKU sugerido).
   *  5. Resuelve la categoría (asigna existente o crea una nueva si la IA la propone).
   *  6. Resuelve la marca (asocia o crea si aplica).
   *  7. Genera la imagen de estudio (fondo blanco) con Gemini Image (con fallback si falla)
   *     y monta el logo en la mejor esquina con sharp.
   *  8. Sube las imágenes resultantes y originales a Cloudinary.
   *  9. Guarda el producto en la BD con publicadoWeb = false y stock = 0.
   */
  async crearBorrador(
    empresaId: number,
    archivos: Express.Multer.File[],
    dto: CrearProductoIaDto,
  ) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debes subir al menos una foto del producto.');
    }
    if (archivos.length > 3) {
      throw new BadRequestException('Puedes subir máximo 3 fotos por producto.');
    }

    // 1. Normalizar fotos
    const fotosNormalizadas: { buffer: Buffer; mimeType: string }[] = [];
    for (const file of archivos) {
      const buffer = await this.imagenEstandar.normalizarEntrada(file.buffer);
      fotosNormalizadas.push({ buffer, mimeType: 'image/jpeg' });
    }

    // 2. Obtener categorías y marcas de la empresa
    const [categoriasRaw, marcasRaw] = await Promise.all([
      (this.prisma as any).categoria.findMany({
        where: { empresaId, activo: true },
        include: { parent: { select: { nombre: true } } },
      }),
      (this.prisma as any).marca.findMany({
        where: { empresaId, activo: true },
        select: { id: true, nombre: true },
      }),
    ]);

    const categoriasContexto = categoriasRaw.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      padre: c.parent?.nombre || null,
    }));
    const marcasLista = marcasRaw.map((m: any) => m.nombre);

    // 3. Analizar con Gemini
    const entradasIa: ImagenEntrada[] = fotosNormalizadas.map((f) => ({
      data: f.buffer,
      mimeType: f.mimeType,
    }));
    const aiData = await this.gemini.analizarProducto(
      entradasIa,
      categoriasContexto,
      marcasLista,
      dto.notas,
    );

    // 4. Resolver Categoría
    let categoriaId = aiData.categoriaId;
    if (!categoriaId && aiData.nuevaCategoria?.nombre) {
      categoriaId = await this.asegurarCategoria(
        empresaId,
        aiData.nuevaCategoria.nombre,
        aiData.nuevaCategoria.padreId,
      );
    }

    // 5. Resolver Marca
    let marcaId: number | null = null;
    if (aiData.marca && aiData.marca.trim()) {
      marcaId = await this.asegurarMarca(empresaId, aiData.marca.trim());
    }

    // 6. Generar SKU único
    const sku = await this.generarSkuUnico(
      empresaId,
      aiData.prefijoSku,
      aiData.sufijoSku,
    );

    // 7. Procesar imágenes: Formato 1:1 estándar centrado (sin logos)
    const imagenesFinalesUrls: string[] = [];
    const imagenesOriginalesUrls: string[] = [];

    for (let i = 0; i < fotosNormalizadas.length; i++) {
      const foto = fotosNormalizadas[i];
      let bufferBaseEstudio = foto.buffer;
      let usoIaEstudio = false;

      // Intentar transformación de estudio con Gemini
      try {
        bufferBaseEstudio = await this.gemini.generarImagenEstudio({
          data: foto.buffer,
          mimeType: foto.mimeType,
        });
        usoIaEstudio = true;
      } catch (err: any) {
        this.logger.warn(
          `No se pudo generar fondo de estudio con Gemini para imagen ${i + 1}: ${err.message}. Se usará la foto normalizada centrada en blanco.`,
        );
      }

      // Estandarizar imagen (cuadrada 1:1, centrada, fondo blanco limpio, sin logo)
      const { imagen: bufferEstandar } =
        await this.imagenEstandar.componer(bufferBaseEstudio);

      // Subir a Cloudinary (estándar)
      const sufijo = fotosNormalizadas.length > 1 ? `-${i + 1}` : '';
      const publicId = `${sku}${sufijo}`;
      const urlEstandar = await this.subirACloudinary(
        bufferEstandar,
        `edatia_erp/empresa_${empresaId}/productos`,
        publicId,
      );
      imagenesFinalesUrls.push(urlEstandar);

      // Subir también la foto original (para poder regenerar o revertir)
      const urlOriginal = await this.subirACloudinary(
        foto.buffer,
        `edatia_erp/empresa_${empresaId}/productos/originales`,
        `${sku}${sufijo}-orig`,
      );
      imagenesOriginalesUrls.push(urlOriginal);
    }

    // 8. Armar precios y slug
    const precioNumerico = Number(dto.precio);
    const precios = Array(11).fill(0);
    precios[0] = precioNumerico;

    const baseSlug = slugify(aiData.nombre);
    const slug = `${baseSlug}-${sku.toLowerCase()}`;

    // 9. Guardar Producto en BD
    const metadataWeb = {
      imagenes: imagenesFinalesUrls,
      imagenesOriginales: imagenesOriginalesUrls,
      detalles: aiData.detalles,
      marca: aiData.marca,
      presentacion: aiData.presentacion,
      etapaTalla: aiData.etapaTalla,
      tipoProducto: aiData.tipoProducto,
      ia: {
        modeloTexto: this.gemini.modeloTexto,
        modeloImagen: this.gemini.modeloImagen,
        fecha: new Date().toISOString(),
        advertencia: aiData.advertencia || null,
      },
      compartido: {
        whatsapp: null,
        marketplace: null,
      },
    };

    const productoCreado = await (this.prisma as any).producto.create({
      data: {
        empresaId,
        sku,
        nombre: aiData.nombre,
        descripcion: aiData.descripcion,
        descripcionWeb: aiData.descripcionWeb,
        precioBase: precioNumerico,
        precioWeb: precioNumerico,
        precios,
        imagen: imagenesFinalesUrls[0],
        categoriaId: categoriaId || null,
        marcaId: marcaId || null,
        activo: true,
        publicadoWeb: false, // 🔒 Borrador: el usuario decide cuándo publicarlo
        esDestacado: false,
        slug,
        tipoIva: 'EXENTO',
        manejaBodega: true,
        costoPromedio: 0,
        costo: 0,
        stockMinimo: 0,
        puntoReorden: 0,
        metadataWeb,
      },
      include: {
        categoria: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
      },
    });

    return {
      producto: productoCreado,
      advertencia: aiData.advertencia || null,
      imagenesGeneradas: imagenesFinalesUrls,
      imagenesOriginales: imagenesOriginalesUrls,
    };
  }

  /**
   * Regenera o altera una imagen específica de un producto borrador.
   * - modo 'ia': vuelve a pasar por Gemini Image y remonta logo.
   * - modo 'original': toma la foto original directa y solo le monta el logo.
   */
  async regenerarImagen(
    empresaId: number,
    productoId: number,
    dto: RegenerarImagenIaDto,
  ) {
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const meta = (producto.metadataWeb as Record<string, any>) || {};
    const originales: string[] = Array.isArray(meta.imagenesOriginales)
      ? meta.imagenesOriginales
      : [];
    const imagenesActuales: string[] = Array.isArray(meta.imagenes)
      ? [...meta.imagenes]
      : [];

    const urlOrig = originales[dto.indice];
    if (!urlOrig) {
      throw new BadRequestException(
        `No se encontró la foto original del índice ${dto.indice}`,
      );
    }

    // Descargar buffer de la imagen original
    const resp = await fetch(urlOrig);
    if (!resp.ok) {
      throw new BadRequestException(
        'No se pudo recuperar la imagen original desde el almacenamiento',
      );
    }
    const arrayBuffer = await resp.arrayBuffer();
    const origBuffer: Buffer = Buffer.from(arrayBuffer as any);

    let bufferProcesar: Buffer = origBuffer;
    if (dto.modo === 'ia') {
      bufferProcesar = await this.gemini.generarImagenEstudio(
        { data: origBuffer, mimeType: 'image/jpeg' },
        dto.instruccion,
      );
    }

    const { imagen: bufferEstandar } =
      await this.imagenEstandar.componer(bufferProcesar);

    const sufijo =
      originales.length > 1 ? `-${dto.indice + 1}` : '';
    const publicId = `${producto.sku}${sufijo}-regen-${Date.now().toString().slice(-4)}`;
    const nuevaUrl = await this.subirACloudinary(
      bufferEstandar,
      `edatia_erp/empresa_${empresaId}/productos`,
      publicId,
    );

    imagenesActuales[dto.indice] = nuevaUrl;

    const metadataActualizada = {
      ...meta,
      imagenes: imagenesActuales,
    };

    const productoActualizado = await (this.prisma as any).producto.update({
      where: { id: productoId },
      data: {
        imagen: imagenesActuales[0],
        metadataWeb: metadataActualizada,
      },
    });

    return {
      producto: productoActualizado,
      nuevaImagenUrl: nuevaUrl,
      indice: dto.indice,
    };
  }

  /**
   * Actualiza datos básicos del borrador (nombre, precio, descripciones, categoría)
   */
  async actualizarBorrador(
    empresaId: number,
    productoId: number,
    dto: ActualizarBorradorIaDto,
  ) {
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const dataUpdate: any = {};
    if (dto.nombre) {
      dataUpdate.nombre = dto.nombre;
      dataUpdate.slug = `${slugify(dto.nombre)}-${producto.sku.toLowerCase()}`;
    }
    if (dto.descripcion !== undefined) dataUpdate.descripcion = dto.descripcion;
    if (dto.descripcionWeb !== undefined)
      dataUpdate.descripcionWeb = dto.descripcionWeb;
    if (dto.precio !== undefined) {
      const precioNum = Number(dto.precio);
      dataUpdate.precioBase = precioNum;
      dataUpdate.precioWeb = precioNum;
      const precios = Array(11).fill(0);
      precios[0] = precioNum;
      dataUpdate.precios = precios;
    }
    if (dto.categoriaId !== undefined) {
      dataUpdate.categoriaId = dto.categoriaId || null;
    }

    return (this.prisma as any).producto.update({
      where: { id: productoId },
      data: dataUpdate,
      include: {
        categoria: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
      },
    });
  }

  /**
   * Registra la fecha de publicación en WhatsApp o Marketplace para métricas del vendedor
   */
  async registrarCompartido(
    empresaId: number,
    productoId: number,
    dto: RegistrarCompartidoDto,
  ) {
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const meta = (producto.metadataWeb as Record<string, any>) || {};
    const compartido = meta.compartido || {};

    const nuevoCompartido = {
      ...compartido,
      [dto.red]: new Date().toISOString(),
    };

    await (this.prisma as any).producto.update({
      where: { id: productoId },
      data: {
        metadataWeb: {
          ...meta,
          compartido: nuevoCompartido,
        },
      },
    });

    return { success: true, red: dto.red, fecha: nuevoCompartido[dto.red] };
  }

  /**
   * Genera textos optimizados de publicación web (nombreWeb, slug, etiquetaSeo, metaDescripcion, descripcionWeb)
   * a partir de los datos registrados del producto utilizando Gemini.
   */
  async generarInfoPublicacion(empresaId: number, productoId: number) {
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: productoId, empresaId },
      include: {
        categoria: { select: { nombre: true } },
        marca: { select: { nombre: true } },
      },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    const precio = Number(
      producto.precioWeb ||
      producto.precioBase ||
      (Array.isArray(producto.precios) ? producto.precios[0] : 0),
    );

    const info = await this.gemini.generarInfoPublicacion({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      descripcionAlterna: producto.descripcionAlterna,
      marca: producto.marca?.nombre,
      categoria: producto.categoria?.nombre,
      sku: producto.sku,
      precio,
    });

    return info;
  }

  /**
   * Procesa una foto de producto (archivo cargado o URL) para generarle un fondo
   * de estudio blanco puro (#FFFFFF), centrado 1:1 (1200x1200 px), sin marcas ni logos,
   * y la guarda en Cloudinary y en el producto.
   */
  async procesarImagenEstudio(
    empresaId: number,
    productoId: number,
    bufferEntrada?: Buffer,
    imageUrl?: string,
  ) {
    const producto = await (this.prisma as any).producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    let bufferOriginal: Buffer;

    if (bufferEntrada && bufferEntrada.length > 0) {
      bufferOriginal = bufferEntrada;
    } else if (imageUrl && imageUrl.trim()) {
      try {
        const resp = await fetch(imageUrl.trim());
        if (!resp.ok) {
          throw new BadRequestException('No se pudo descargar la imagen desde la URL');
        }
        const ab = await resp.arrayBuffer();
        bufferOriginal = Buffer.from(ab as any);
      } catch (e: any) {
        throw new BadRequestException('Error al descargar la imagen de la URL: ' + (e?.message || e));
      }
    } else {
      throw new BadRequestException('Debes proporcionar un archivo de imagen o una URL válida');
    }

    // 1. Normalizar entrada (HEIC, orientación EXIF, max 1536px, JPEG)
    const bufferNormalizado = await this.imagenEstandar.normalizarEntrada(bufferOriginal);

    // 2. Generar imagen de estudio con Gemini
    const bufferIa = await this.gemini.generarImagenEstudio({
      data: bufferNormalizado,
      mimeType: 'image/jpeg',
    });

    // 3. Componer a 1200x1200 cuadrado centrado con fondo blanco puro (#FFFFFF) y SIN logo
    const { imagen: bufferFinal } = await this.imagenEstandar.componer(bufferIa);

    // 4. Subir a Cloudinary
    const timestamp = Date.now();
    const publicId = `${producto.sku || 'prod'}-estudio-${timestamp.toString().slice(-6)}`;
    const urlSubida = await this.subirACloudinary(
      bufferFinal,
      `edatia_erp/empresa_${empresaId}/productos`,
      publicId,
    );

    // 5. Actualizar el producto en BD agregando o reemplazando la imagen
    const meta = (producto.metadataWeb as Record<string, any>) || {};
    const imagenesActuales: string[] = Array.isArray(meta.imagenes) && meta.imagenes.length > 0
      ? [...meta.imagenes]
      : (producto.imagen ? [producto.imagen] : []);

    let nuevasImagenes: string[];
    if (imageUrl && imagenesActuales.includes(imageUrl.trim())) {
      const idx = imagenesActuales.indexOf(imageUrl.trim());
      nuevasImagenes = [...imagenesActuales];
      nuevasImagenes[idx] = urlSubida;
    } else {
      nuevasImagenes = [...imagenesActuales, urlSubida];
    }

    const nuevaMeta = {
      ...meta,
      imagenes: nuevasImagenes,
    };

    const productoActualizado = await (this.prisma as any).producto.update({
      where: { id: productoId },
      data: {
        imagen: nuevasImagenes[0] || urlSubida,
        metadataWeb: nuevaMeta,
      },
    });

    return {
      url: urlSubida,
      imagenes: nuevasImagenes,
      producto: productoActualizado,
    };
  }

  // ── Helpers de Base de Datos y Cloudinary ──────────────────────────────────

  private async asegurarCategoria(
    empresaId: number,
    nombre: string,
    padreId?: number | null,
  ): Promise<number> {
    const slug = slugify(nombre);
    let cat = await (this.prisma as any).categoria.findFirst({
      where: { empresaId, slug },
    });
    if (!cat) {
      cat = await (this.prisma as any).categoria.create({
        data: {
          empresaId,
          nombre,
          slug,
          parentId: padreId || null,
          activo: true,
        },
      });
    }
    return cat.id;
  }

  private async asegurarMarca(empresaId: number, nombre: string): Promise<number> {
    const norm = nombre.trim();
    let marca = await (this.prisma as any).marca.findFirst({
      where: { empresaId, nombre: { equals: norm, mode: 'insensitive' } },
    });
    if (!marca) {
      marca = await (this.prisma as any).marca.create({
        data: {
          empresaId,
          nombre: norm,
          activo: true,
        },
      });
    }
    return marca.id;
  }

  private async generarSkuUnico(
    empresaId: number,
    prefijo: string,
    sufijo: string,
  ): Promise<string> {
    const pref = (prefijo || 'PRD').toUpperCase().slice(0, 3);
    const suf = (sufijo || 'U').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

    const productosPrefijo = await (this.prisma as any).producto.findMany({
      where: {
        empresaId,
        sku: { startsWith: `${pref}-` },
      },
      select: { sku: true },
    });

    let maxNum = 0;
    for (const p of productosPrefijo) {
      const parts = (p.sku || '').split('-');
      if (parts.length >= 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }

    const proximoNum = (maxNum + 1).toString().padStart(3, '0');
    return `${pref}-${proximoNum}-${suf}`;
  }

  private async subirACloudinary(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Error Cloudinary upload_stream:', error);
            return reject(new BadRequestException('Error al subir imagen a Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(buffer);
    });
  }
}

