import { Injectable, Logger, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';

/**
 * Cliente mínimo de la API de Gemini (Google AI Studio) usado para:
 *  - Analizar fotos de productos y generar su ficha (nombre, descripción, categoría...).
 *  - Convertir una foto en una imagen de estudio (fondo blanco) para el catálogo.
 *
 * La API key vive solo en el backend (GEMINI_API_KEY) y nunca se expone al frontend.
 */

export interface ImagenEntrada {
  data: Buffer;
  mimeType: string;
}

export interface CategoriaContexto {
  id: number;
  nombre: string;
  padre?: string | null;
}

export interface AnalisisProducto {
  nombre: string;
  descripcion: string;
  descripcionWeb: string;
  marca: string;
  presentacion: string;
  etapaTalla: string;
  tipoProducto: string;
  detalles: string[];
  categoriaId: number | null;
  nuevaCategoria: { nombre: string; padreId: number | null } | null;
  prefijoSku: string;
  sufijoSku: string;
  advertencia: string;
}

export interface InfoPublicacionWeb {
  nombreWeb: string;
  slug: string;
  etiquetaSeo: string;
  metaDescripcion: string;
  descripcionWeb: string;
}

class GeminiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Sin facturación activa, Google responde 429 con "limit: 0" para modelos de imagen.
const RE_SIN_FACTURACION = /limit:\s*0|billing|free[_ ]?tier|FreeTier/i;

// Modelos ordenados por estabilidad y velocidad comprobada
const MODELOS_TEXTO_FALLBACK = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  readonly modeloTexto = process.env.GEMINI_TEXT_MODEL || 'gemini-flash-lite-latest';
  readonly modeloImagen = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  private get apiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new ServiceUnavailableException('Falta configurar GEMINI_API_KEY en el servidor.');
    }
    return key;
  }

  // ── Análisis de producto (texto estructurado) ────────────────────────────────
  async analizarProducto(
    imagenes: ImagenEntrada[],
    categorias: CategoriaContexto[],
    marcas: string[],
    notas?: string,
  ): Promise<AnalisisProducto> {
    const listaCategorias = categorias.length
      ? categorias.map((c) => `${c.id} | ${c.padre ? `${c.padre} > ` : ''}${c.nombre}`).join('\n')
      : '(no hay categorías creadas)';

    const prompt = `Eres el catalogador de "Pañalera Baby World", una tienda colombiana de productos para bebé (pañales, fórmulas, aseo, juguetes, ropa, calzado, accesorios).
Analiza las fotos (todas son del MISMO producto) y genera su ficha en español de Colombia.

Reglas:
- Lee con atención el empaque: marca, línea, talla/etapa, cantidad de unidades o peso neto.
- "nombre": comercial y completo, máximo 70 caracteres. Ej: "Pañales Winny Pants Etapa 5 XXG x 50 Und".
- "descripcion": corta para inventario, máximo 130 caracteres.
- "descripcionWeb": persuasiva y clara (2 a 4 párrafos cortos) con beneficios reales. No inventes certificaciones ni datos que no se vean o no sean de conocimiento común de la marca.
- "detalles": 3 a 5 viñetas cortas con beneficios o características.
- Categoría: elige el "categoriaId" de la lista si alguna encaja bien. Si ninguna encaja, deja "categoriaId" en null y propone "nuevaCategoria" (nombre corto en plural, y "padreId" si debe ir dentro de una categoría existente).
- "prefijoSku": 3 letras mayúsculas según el tipo (PAN pañales, LEC leches/fórmulas, ASE aseo, JUG juguetes, ROP ropa, CAL calzado, ACC accesorios, etc.).
- "sufijoSku": 1 a 4 caracteres de talla/variante (ej: M, XXG, E1, 800G). Si no aplica usa "U".
- "advertencia": texto breve si la foto es borrosa, el producto no se distingue o hay datos que no pudiste confirmar; si todo está bien, cadena vacía.
${marcas.length ? `\nMarcas ya registradas (usa el mismo nombre si coincide): ${marcas.join(', ')}` : ''}
${notas ? `\nNotas del vendedor (tienen prioridad): ${notas}` : ''}

Categorías existentes (id | ruta):
${listaCategorias}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...imagenes.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data.toString('base64') } })),
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            nombre: { type: 'STRING' },
            descripcion: { type: 'STRING' },
            descripcionWeb: { type: 'STRING' },
            marca: { type: 'STRING' },
            presentacion: { type: 'STRING' },
            etapaTalla: { type: 'STRING' },
            tipoProducto: { type: 'STRING' },
            detalles: { type: 'ARRAY', items: { type: 'STRING' } },
            categoriaId: { type: 'INTEGER', nullable: true },
            nuevaCategoria: {
              type: 'OBJECT',
              nullable: true,
              properties: {
                nombre: { type: 'STRING' },
                padreId: { type: 'INTEGER', nullable: true },
              },
              required: ['nombre'],
            },
            prefijoSku: { type: 'STRING' },
            sufijoSku: { type: 'STRING' },
            advertencia: { type: 'STRING' },
          },
          required: [
            'nombre', 'descripcion', 'descripcionWeb', 'marca', 'presentacion', 'etapaTalla',
            'tipoProducto', 'detalles', 'prefijoSku', 'sufijoSku', 'advertencia',
          ],
        },
      },
    };

    let json: any;
    let ultimoErr: unknown;

    // Intentar con el modelo configurado y luego con los fallbacks si hay saturación
    const modelosATratar = Array.from(new Set([this.modeloTexto, ...MODELOS_TEXTO_FALLBACK]));

    for (const mod of modelosATratar) {
      try {
        json = await this.llamar(mod, body, 35_000);
        if (json?.candidates?.[0]?.content?.parts) {
          break; // Éxito con este modelo
        }
      } catch (e: any) {
        ultimoErr = e;
        this.logger.warn(`Modelo ${mod} no disponible (${e?.message || e}). Probando siguiente alternativa...`);
      }
    }

    if (!json?.candidates?.[0]?.content?.parts) {
      throw this.traducirError(ultimoErr, 'analizar el producto');
    }

    const texto: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text;
    if (!texto) {
      throw new BadGatewayException('La IA no devolvió información del producto. Intenta con otra foto más clara.');
    }

    let crudo: any;
    try {
      crudo = JSON.parse(texto);
    } catch {
      throw new BadGatewayException('La respuesta de la IA no tuvo el formato esperado. Intenta de nuevo.');
    }

    return this.sanitizarAnalisis(crudo, categorias);
  }

  // ── Imagen de estudio ────────────────────────────────────────────────────────
  async generarImagenEstudio(imagen: ImagenEntrada, instruccionExtra?: string): Promise<Buffer> {
    const prompt = `Edit this product photo into a professional e-commerce catalog image.
- Pure white seamless studio background (#FFFFFF) with a subtle, natural contact shadow directly beneath the base of the product (do not make the product float high in the air).
- Close-up studio framing: product must be upright, centered, prominent and fill approximately 88-92% of the frame (avoid distant shots or excessive empty margins).
- Keep the product and its packaging EXACTLY as they are: same brand logos, texts, numbers, sizes, colors and proportions. Do not invent, translate, blur or rewrite any text on the package.
- Remove everything that is not the product: hands, fingers, tables, retail price tags, store hanging labels, stickers, barcodes, watermarks, hangers and reflections.
- Do NOT add any new logos, text, frames, badges or watermarks.
- Square 1:1 composition.${instruccionExtra ? `\nAdditional instruction from the seller: ${instruccionExtra}` : ''}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imagen.mimeType, data: imagen.data.toString('base64') } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1' },
      },
    };

    let json: any;
    try {
      json = await this.llamar(this.modeloImagen, body, 25_000);
    } catch (e) {
      throw this.traducirError(e, 'generar la imagen');
    }

    const partes: any[] = json?.candidates?.[0]?.content?.parts || [];
    const parteImagen = partes.find((p) => p?.inlineData?.data || p?.inline_data?.data);
    const data: string | undefined = parteImagen?.inlineData?.data || parteImagen?.inline_data?.data;
    if (!data) {
      const motivo = json?.candidates?.[0]?.finishReason || json?.promptFeedback?.blockReason;
      this.logger.warn(`Gemini no devolvió imagen (motivo: ${motivo || 'desconocido'})`);
      throw new BadGatewayException('La IA no devolvió una imagen. Puedes regenerarla o usar la foto original.');
    }
    return Buffer.from(data, 'base64');
  }

  // ── Generar Información de Publicación Web (SEO y Copywriting) ───────────────
  async generarInfoPublicacion(producto: {
    nombre: string;
    descripcion?: string | null;
    descripcionAlterna?: string | null;
    marca?: string | null;
    categoria?: string | null;
    sku?: string | null;
    precio?: number | null;
    imagen?: ImagenEntrada | null;
  }): Promise<InfoPublicacionWeb> {
    const tieneImagen = Boolean(producto.imagen?.data && producto.imagen.data.length > 0);

    const prompt = `Eres un copywriter y especialista en SEO e-commerce para la tienda "Distribuidora Baby World" en Colombia.
Tu tarea es generar la información de publicación web optimizada para vender el siguiente producto:
- Nombre actual: ${producto.nombre}
- SKU: ${producto.sku || 'N/A'}
- Categoría: ${producto.categoria || 'General'}
- Marca: ${producto.marca || 'N/A'}
- Descripción actual: ${producto.descripcion || producto.descripcionAlterna || 'N/A'}
- Precio de venta aproximado: $${producto.precio || 0} COP${tieneImagen ? `
- FOTO REAL DEL PRODUCTO ADJUNTA:
  * Analiza con máxima atención la foto y su empaque (caja, bolsa o etiqueta física).
  * Lee minuciosamente cualquier texto impreso en el empaque: marca, línea, capacidad en ml u onzas, talla, etapa, cantidad de unidades, sellos (ej: "Libre de BPA", "Hipoalergénico", "Tetina flujo lento", "0% alcohol"), ingredientes o componentes.
  * Identifica los colores reales, estampados, diseño y presentación física.
  * Si el nombre actual en el ERP es muy genérico, corto o está en mayúsculas sin detalles (ej: "BIBERON" o un código numérico), CORRÍGELO Y COMPLETA "nombreWeb" con lo que lees y ves directamente en la foto (ej: Marca + Tipo de producto + Capacidad/Talla + Color/Estilo).` : ''}

Reglas:
1. "nombreWeb": Nombre comercial claro, atractivo y completo para el catálogo online (máx 70 caracteres). Ejemplo: "Aceite Corporal Arrurú con Jojoba y Manzanilla 200ml"${tieneImagen ? ' o "Biberón Anticólico Philips Avent 260ml Azul"' : ''}.
2. "slug": URL amigable en minúsculas separada por guiones (ej: "aceite-corporal-arruru-200ml").
3. "etiquetaSeo": Título SEO optimizado para buscadores de Google (máx 60 caracteres). Ej: "Aceite Corporal Arrurú 200ml | Baby World Colombia".
4. "metaDescripcion": Resumen atractivo de venta para resultados de búsqueda de Google, con beneficios clave y llamado a la acción (máx 155 caracteres).
5. "descripcionWeb": Redacción comercial persuasiva y detallada (2 a 4 párrafos o secciones cortas con viñetas) que destaque beneficios para el bebé y la madre, ingredientes/materiales, modo de uso y confianza de marca. Redactado en español colombiano natural.${tieneImagen ? ' Incorpora de forma precisa las características, sellos y beneficios reales que se observan en la foto del empaque.' : ''}`;

    const parts: any[] = [{ text: prompt }];

    if (tieneImagen && producto.imagen) {
      parts.push({
        inlineData: {
          mimeType: producto.imagen.mimeType || 'image/jpeg',
          data: producto.imagen.data.toString('base64'),
        },
      });
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            nombreWeb: { type: 'STRING' },
            slug: { type: 'STRING' },
            etiquetaSeo: { type: 'STRING' },
            metaDescripcion: { type: 'STRING' },
            descripcionWeb: { type: 'STRING' },
          },
          required: ['nombreWeb', 'slug', 'etiquetaSeo', 'metaDescripcion', 'descripcionWeb'],
        },
      },
    };

    const modelosATratar = Array.from(new Set([this.modeloTexto, ...MODELOS_TEXTO_FALLBACK]));
    let json: any;
    let ultimoErr: any;

    for (const mod of modelosATratar) {
      try {
        json = await this.llamar(mod, body, 25_000);
        if (json?.candidates?.[0]?.content?.parts) break;
      } catch (e: any) {
        ultimoErr = e;
      }
    }

    // Fallback de seguridad: si falló con la foto, reintentar con solo texto
    if (!json?.candidates?.[0]?.content?.parts && tieneImagen) {
      this.logger.warn(`Llamada multimodal falló (${ultimoErr?.message || ultimoErr}). Reintentando generación con solo texto...`);
      const bodySoloTexto = {
        ...body,
        contents: [{ parts: [{ text: prompt }] }],
      };
      for (const mod of modelosATratar) {
        try {
          json = await this.llamar(mod, bodySoloTexto, 25_000);
          if (json?.candidates?.[0]?.content?.parts) break;
        } catch (e: any) {
          ultimoErr = e;
        }
      }
    }

    if (!json?.candidates?.[0]?.content?.parts) {
      throw this.traducirError(ultimoErr, 'generar información de publicación');
    }

    const texto = json.candidates[0].content.parts.find((p: any) => typeof p.text === 'string')?.text;
    const crudo = JSON.parse(texto);

    return {
      nombreWeb: String(crudo.nombreWeb || producto.nombre).slice(0, 100).trim(),
      slug: String(crudo.slug || producto.nombre).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      etiquetaSeo: String(crudo.etiquetaSeo || producto.nombre).slice(0, 70).trim(),
      metaDescripcion: String(crudo.metaDescripcion || '').slice(0, 160).trim(),
      descripcionWeb: String(crudo.descripcionWeb || producto.descripcion || '').trim(),
    };
  }

  // ── Infraestructura ──────────────────────────────────────────────────────────
  private async llamar(modelo: string, body: unknown, timeoutMs: number): Promise<any> {
    const MAX_INTENTOS = 3;
    const apiKey = this.apiKey; // falla de inmediato (sin reintentos) si no está configurada
    let ultimoError: unknown;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${API_BASE}/${modelo}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const json: any = await res.json().catch(() => ({}));
        if (res.ok) return json;
        throw new GeminiError(json?.error?.message || `HTTP ${res.status}`, res.status);
      } catch (e: any) {
        ultimoError = e?.name === 'AbortError' ? new GeminiError('Tiempo de espera agotado', 504) : e;
        if (!this.esReintentable(ultimoError) || intento === MAX_INTENTOS) break;
        await new Promise((r) => setTimeout(r, 1500 * intento));
      } finally {
        clearTimeout(timer);
      }
    }
    throw ultimoError;
  }

  private esReintentable(e: unknown): boolean {
    if (!(e instanceof GeminiError)) return true; // errores de red
    if (e.status === 429) return !RE_SIN_FACTURACION.test(e.message);
    return e.status >= 500;
  }

  private traducirError(e: unknown, accion: string): Error {
    if (e instanceof ServiceUnavailableException) return e;
    if (e instanceof GeminiError) {
      this.logger.error(`Gemini (${accion}) → ${e.status}: ${e.message}`);
      if (e.status === 429 && RE_SIN_FACTURACION.test(e.message)) {
        return new ServiceUnavailableException(
          'La clave de Gemini no tiene facturación activa para esta función. Actívala en Google AI Studio (Billing) e intenta de nuevo.',
        );
      }
      if (e.status === 429) {
        return new ServiceUnavailableException('La IA está saturada en este momento. Espera un minuto e intenta de nuevo.');
      }
      if (e.status === 400 || e.status === 403) {
        return new ServiceUnavailableException(`No se pudo ${accion}: la clave de Gemini es inválida o no tiene permisos.`);
      }
      if (e.status === 504) {
        return new ServiceUnavailableException(`La IA tardó demasiado en ${accion}. Intenta de nuevo.`);
      }
    } else {
      this.logger.error(`Gemini (${accion}) → error de red: ${(e as any)?.message}`);
    }
    return new ServiceUnavailableException(`No se pudo ${accion} con la IA. Intenta de nuevo en unos minutos.`);
  }

  private sanitizarAnalisis(crudo: any, categorias: CategoriaContexto[]): AnalisisProducto {
    const txt = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
    const idsValidos = new Set(categorias.map((c) => c.id));

    const categoriaId = Number.isInteger(crudo?.categoriaId) && idsValidos.has(crudo.categoriaId) ? crudo.categoriaId : null;
    let nuevaCategoria: AnalisisProducto['nuevaCategoria'] = null;
    if (!categoriaId && crudo?.nuevaCategoria?.nombre) {
      const padreId = Number.isInteger(crudo.nuevaCategoria.padreId) && idsValidos.has(crudo.nuevaCategoria.padreId)
        ? crudo.nuevaCategoria.padreId
        : null;
      nuevaCategoria = { nombre: txt(crudo.nuevaCategoria.nombre, 60), padreId };
    }

    const prefijo = txt(crudo?.prefijoSku, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const sufijo = txt(crudo?.sufijoSku, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');

    return {
      nombre: txt(crudo?.nombre, 70) || 'Producto sin nombre',
      descripcion: txt(crudo?.descripcion, 130),
      descripcionWeb: txt(crudo?.descripcionWeb, 3000),
      marca: txt(crudo?.marca, 60),
      presentacion: txt(crudo?.presentacion, 80),
      etapaTalla: txt(crudo?.etapaTalla, 40),
      tipoProducto: txt(crudo?.tipoProducto, 40),
      detalles: Array.isArray(crudo?.detalles) ? crudo.detalles.map((d: unknown) => txt(d, 120)).filter(Boolean).slice(0, 6) : [],
      categoriaId,
      nuevaCategoria,
      prefijoSku: prefijo.length === 3 ? prefijo : 'PRD',
      sufijoSku: sufijo || 'U',
      advertencia: txt(crudo?.advertencia, 200),
    };
  }
}
