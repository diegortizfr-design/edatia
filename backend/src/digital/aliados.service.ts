import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DigitalService } from './digital.service';
import { GeminiService } from './ia-productos/gemini.service';
import {
  ConfigAliadosPrograma,
  mergeConfigAliados,
  normalizarTelefonoCol,
  esCategoriaHabilitadaAliado,
  calcularGananciaUnitariaAliado,
} from './aliados.utils';

interface CopyCacheEntry {
  titulo: string;
  texto: string;
  hashtags: string[];
  expiresAt: number;
}

@Injectable()
export class AliadosService {
  private readonly copyCache = new Map<string, CopyCacheEntry>();
  private readonly COPY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  private readonly COPY_CACHE_MAX_SIZE = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalService: DigitalService,
    private readonly gemini: GeminiService,
  ) {}

  private sanitizeText(val: any, maxLen = 150): string {
    return String(val ?? '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLen);
  }

  private get signingSecret(): string {
    return `${process.env.JWT_SECRET || 'edatia-aliados-fallback-secret'}:aliados`;
  }

  private firmarToken(payload: { aliadoId: number; empresaId: number; codigoReferido: string }): string {
    const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', this.signingSecret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private async verificarTokenAliado(authHeader: string | undefined, empresaId: number) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debes iniciar sesión en tu cuenta de Aliado.');
    }
    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Sesión de aliado inválida.');
    }

    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(body).digest('base64url');
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      throw new UnauthorizedException('Sesión de aliado expirada o inválida.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Sesión de aliado corrupta.');
    }

    if (!parsed?.aliadoId || !parsed?.exp || Date.now() > Number(parsed.exp) || Number(parsed.empresaId) !== empresaId) {
      throw new UnauthorizedException('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const aliado = await (this.prisma as any).aliadoComercial.findFirst({
      where: { id: Number(parsed.aliadoId), empresaId },
    });
    if (!aliado) {
      throw new UnauthorizedException('Cuenta de aliado no encontrada.');
    }
    if (aliado.estado === 'SUSPENDIDO') {
      throw new ForbiddenException('Tu cuenta de aliado se encuentra suspendida. Contacta al administrador.');
    }

    return aliado;
  }

  private async resolverTiendaPorSlug(slug: string) {
    const config = await this.prisma.configuracionTienda.findFirst({
      where: {
        OR: [{ slugTienda: slug }, { dominioPropio: slug }],
      },
    });
    if (!config || !config.activo) {
      throw new NotFoundException('Tienda no encontrada o inactiva');
    }
    const configAliados = mergeConfigAliados((config as any).configAliados);
    return { config, configAliados };
  }

  private obtenerBaseUrlTienda(config: any): string {
    if (config.dominioPropio) {
      const dom = String(config.dominioPropio).replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `https://${dom}`;
    }
    if (config.slugTienda && config.slugTienda !== 'distribuidorababyworld') {
      return `https://${config.slugTienda}.edatia.com`;
    }
    return 'https://distribuidorababyworld.com';
  }

  private async generarCodigoReferidoUnico(empresaId: number, nombre: string): Promise<string> {
    const primeraPalabra = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 6) || 'ALIADO';

    for (let i = 0; i < 8; i++) {
      const sufijo = Math.floor(10 + Math.random() * 89);
      const codigo = `BW-${primeraPalabra}${sufijo}`;
      const existe = await (this.prisma as any).aliadoComercial.findFirst({
        where: { empresaId, codigoReferido: codigo },
        select: { id: true },
      });
      if (!existe) return codigo;
    }
    return `BW-${primeraPalabra}${Date.now().toString().slice(-4)}`;
  }

  private sanitizarAliadoPublico(aliado: any, configAliados: ConfigAliadosPrograma, baseUrl: string) {
    const pct = aliado.porcentajeUtilidad !== null && aliado.porcentajeUtilidad !== undefined
      ? Number(aliado.porcentajeUtilidad)
      : configAliados.porcentajeUtilidad;

    return {
      id: aliado.id,
      nombre: aliado.nombre,
      tipoDocumento: aliado.tipoDocumento,
      numeroDocumento: aliado.numeroDocumento,
      telefono: aliado.telefono,
      email: aliado.email,
      ciudad: aliado.ciudad,
      medioPago: aliado.medioPago,
      cuentaPago: aliado.cuentaPago,
      codigoReferido: aliado.codigoReferido,
      porcentajeUtilidad: pct,
      estado: aliado.estado,
      urlTiendaReferido: `${baseUrl}/?ref=${encodeURIComponent(aliado.codigoReferido)}`,
      createdAt: aliado.createdAt,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDPOINTS PÚBLICOS / PORTAL DE ALIADOS
  // ═══════════════════════════════════════════════════════════════════════════

  async getConfigPublica(slug: string) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    return {
      activo: configAliados.activo,
      porcentajeUtilidad: configAliados.porcentajeUtilidad,
      requiereCodigoInvitacion: Boolean(configAliados.codigoInvitacion),
      requiereAprobacion: configAliados.requiereAprobacion,
      montoMinimoRetiro: configAliados.montoMinimoRetiro,
      nombreTienda:
        config.nombreTienda && config.nombreTienda !== 'Edatia Demo SAS'
          ? config.nombreTienda
          : 'Distribuidora Baby World',
    };
  }

  async registrarAliado(slug: string, dto: any) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    if (!configAliados.activo) {
      throw new ForbiddenException('El programa de aliados no está habilitado en este momento.');
    }

    if (configAliados.codigoInvitacion) {
      const codigoIngresado = this.sanitizeText(dto?.codigoInvitacion, 40).toUpperCase();
      if (codigoIngresado !== configAliados.codigoInvitacion) {
        throw new BadRequestException('El código de invitación del piloto es inválido o está vencido.');
      }
    }

    const nombre = this.sanitizeText(dto?.nombre, 120);
    const tipoDocumento = ['CC', 'CE', 'PASAPORTE', 'NIT'].includes(dto?.tipoDocumento) ? dto.tipoDocumento : 'CC';
    const numeroDocumento = this.sanitizeText(dto?.numeroDocumento, 25).replace(/[^\w-]/g, '');
    const telefonoNorm = normalizarTelefonoCol(dto?.telefono);
    const email = this.sanitizeText(dto?.email, 120) || null;
    const ciudad = this.sanitizeText(dto?.ciudad, 80) || null;
    const medioPago = ['NEQUI', 'DAVIPLATA', 'BANCOLOMBIA'].includes(String(dto?.medioPago || '').toUpperCase())
      ? String(dto.medioPago).toUpperCase()
      : 'NEQUI';
    const cuentaPago = this.sanitizeText(dto?.cuentaPago, 40).replace(/[^\dA-Za-z-]/g, '') || telefonoNorm;
    const pin = String(dto?.pin ?? '').trim();

    if (!nombre || nombre.length < 3) {
      throw new BadRequestException('Ingresa tu nombre completo.');
    }
    if (!numeroDocumento || numeroDocumento.length < 5) {
      throw new BadRequestException('Ingresa un número de documento válido.');
    }
    if (!telefonoNorm || telefonoNorm.length < 10) {
      throw new BadRequestException('Ingresa un número de WhatsApp colombiano válido (10 dígitos).');
    }
    if (!/^\d{4,6}$/.test(pin)) {
      throw new BadRequestException('El PIN de acceso debe tener entre 4 y 6 dígitos numéricos.');
    }
    if (dto?.aceptaTerminos === false) {
      throw new BadRequestException('Debes aceptar los términos del programa de aliados.');
    }

    const empresaId = config.empresaId;
    const existente = await (this.prisma as any).aliadoComercial.findFirst({
      where: {
        empresaId,
        OR: [{ telefono: telefonoNorm }, { numeroDocumento }],
      },
      select: { id: true, telefono: true, numeroDocumento: true },
    });

    if (existente) {
      if (existente.telefono === telefonoNorm) {
        throw new ConflictException('Ya existe un aliado registrado con este WhatsApp. Inicia sesión con tu PIN.');
      }
      throw new ConflictException('Ya existe un aliado registrado con este número de documento.');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const codigoReferido = await this.generarCodigoReferidoUnico(empresaId, nombre);
    const estadoInicial = configAliados.requiereAprobacion ? 'PENDIENTE' : 'ACTIVO';

    const aliado = await (this.prisma as any).aliadoComercial.create({
      data: {
        empresaId,
        nombre,
        tipoDocumento,
        numeroDocumento,
        telefono: telefonoNorm,
        email,
        ciudad,
        medioPago,
        cuentaPago,
        codigoReferido,
        pinHash,
        estado: estadoInicial,
        aceptaTerminos: true,
      },
    });

    const token = this.firmarToken({
      aliadoId: aliado.id,
      empresaId,
      codigoReferido: aliado.codigoReferido,
    });
    const baseUrl = this.obtenerBaseUrlTienda(config);

    return {
      token,
      aliado: this.sanitizarAliadoPublico(aliado, configAliados, baseUrl),
    };
  }

  async loginAliado(slug: string, dto: any) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    if (!configAliados.activo) {
      throw new ForbiddenException('El programa de aliados no está habilitado.');
    }

    const identificadorRaw = this.sanitizeText(dto?.identificador || dto?.telefono || dto?.numeroDocumento, 40);
    const telNorm = normalizarTelefonoCol(identificadorRaw);
    const docNorm = identificadorRaw.replace(/[^\w-]/g, '');
    const pin = String(dto?.pin ?? '').trim();

    if (!identificadorRaw || !pin) {
      throw new BadRequestException('Ingresa tu WhatsApp (o cédula) y tu PIN.');
    }

    const aliado = await (this.prisma as any).aliadoComercial.findFirst({
      where: {
        empresaId: config.empresaId,
        OR: [
          ...(telNorm ? [{ telefono: telNorm }] : []),
          ...(docNorm ? [{ numeroDocumento: docNorm }] : []),
        ],
      },
    });

    if (!aliado) {
      throw new UnauthorizedException('No encontramos una cuenta con esos datos.');
    }
    if (aliado.estado === 'SUSPENDIDO') {
      throw new ForbiddenException('Tu cuenta fue suspendida. Comunícate con el administrador.');
    }

    const pinValido = await bcrypt.compare(pin, aliado.pinHash);
    if (!pinValido) {
      throw new UnauthorizedException('El PIN ingresado es incorrecto.');
    }

    const token = this.firmarToken({
      aliadoId: aliado.id,
      empresaId: config.empresaId,
      codigoReferido: aliado.codigoReferido,
    });
    const baseUrl = this.obtenerBaseUrlTienda(config);

    return {
      token,
      aliado: this.sanitizarAliadoPublico(aliado, configAliados, baseUrl),
    };
  }

  async getPerfilYResumen(slug: string, authHeader: string | undefined) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    const aliado = await this.verificarTokenAliado(authHeader, config.empresaId);
    const baseUrl = this.obtenerBaseUrlTienda(config);

    const comisiones = await (this.prisma as any).comisionAliado.findMany({
      where: { empresaId: config.empresaId, aliadoId: aliado.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let pendiente = 0;
    let aprobada = 0;
    let pagada = 0;
    let ventasValidas = 0;

    for (const c of comisiones) {
      const val = Number(c.valorComision || 0);
      if (c.estado === 'PENDIENTE') {
        pendiente += val;
        ventasValidas++;
      } else if (c.estado === 'APROBADA') {
        aprobada += val;
        ventasValidas++;
      } else if (c.estado === 'PAGADA') {
        pagada += val;
        ventasValidas++;
      }
    }

    return {
      aliado: this.sanitizarAliadoPublico(aliado, configAliados, baseUrl),
      resumen: {
        pendiente,
        aprobada,
        pagada,
        totalHistorico: pendiente + aprobada + pagada,
        ventasValidas,
        montoMinimoRetiro: configAliados.montoMinimoRetiro,
        puedeSolicitarPago: aprobada >= configAliados.montoMinimoRetiro,
      },
      // Nunca exponemos costoTotal ni utilidadNeta al portal público de aliados
      comisiones: comisiones.map((c: any) => ({
        id: c.id,
        pedidoNumero: c.pedidoNumero,
        origen: c.origen,
        clienteNombre: c.clienteNombre,
        montoVenta: Number(c.montoVenta || 0),
        valorComision: Number(c.valorComision || 0),
        estado: c.estado,
        detalleItems: c.detalleItems || [],
        comprobantePago: c.comprobantePago || null,
        fechaAprobacion: c.fechaAprobacion,
        fechaPago: c.fechaPago,
        createdAt: c.createdAt,
      })),
    };
  }

  async getCatalogoAliado(slug: string, authHeader: string | undefined) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    if (!configAliados.activo) {
      throw new ForbiddenException('El programa de aliados está pausado temporalmente.');
    }
    const aliado = await this.verificarTokenAliado(authHeader, config.empresaId);
    const baseUrl = this.obtenerBaseUrlTienda(config);

    const bodegasFiltro = Array.isArray(config.bodegasIds) && config.bodegasIds.length > 0
      ? (config.bodegasIds as any[]).map((bid: any) => Number(bid)).filter((bid: number) => !isNaN(bid))
      : null;

    const pctAliado = aliado.porcentajeUtilidad !== null && aliado.porcentajeUtilidad !== undefined
      ? Number(aliado.porcentajeUtilidad)
      : configAliados.porcentajeUtilidad;

    const productos = await this.prisma.producto.findMany({
      where: { empresaId: config.empresaId, publicadoWeb: true, activo: true },
      select: {
        id: true,
        nombre: true,
        sku: true,
        slug: true,
        imagen: true,
        descripcion: true,
        descripcionWeb: true,
        precioBase: true,
        precioWeb: true,
        costoPromedio: true,
        comisionValor: true,
        tipoIva: true,
        liquidarIva: true,
        productoExentoIva: true,
        appliedTaxIds: true,
        manejaBodega: true,
        metadataWeb: true,
        categoriaId: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
            parentId: true,
            parent: { select: { id: true, nombre: true } },
          },
        },
        marca: { select: { nombre: true } },
        stock: {
          select: {
            cantidad: true,
            cantidadReservada: true,
            bodegaId: true,
            bodega: { select: { id: true, activo: true } },
          },
        },
        variantes: {
          where: { activo: true },
          select: {
            id: true,
            sku: true,
            nombre: true,
            precioBase: true,
            stock: {
              select: {
                cantidad: true,
                cantidadReservada: true,
                bodegaId: true,
                bodega: { select: { id: true, activo: true } },
              },
            },
          },
        },
      },
      orderBy: [{ esDestacado: 'desc' }, { nombre: 'asc' }],
    });

    const itemsCatalogo: any[] = [];

    for (const p of productos) {
      if (!esCategoriaHabilitadaAliado(p.categoria, p.categoriaId, configAliados)) continue;

      const stockDisponible = this.digitalService.calcularStockDisponible(p, bodegasFiltro);
      if (stockDisponible < configAliados.stockMinimoCatalogo) continue;

      const pricing = this.digitalService.resolverPrecioYImpuesto(p, (config as any).reglasPrecios);
      const calc = calcularGananciaUnitariaAliado({
        precioSubtotal: pricing.precioSubtotal,
        precioTotal: pricing.precioTotal,
        costoPromedio: p.costoPromedio,
        comisionValor: p.comisionValor,
        porcentajeUtilidad: pctAliado,
        redondeo: configAliados.redondeoComision,
      });
      if (!calc.elegible || calc.ganancia <= 0) continue;

      const meta = (p.metadataWeb as any) || {};
      const nombreVisible = meta.nombreWeb || p.nombre;
      const prodSlug = p.slug || p.id;

      itemsCatalogo.push({
        id: p.id,
        sku: p.sku,
        nombre: nombreVisible,
        slug: String(prodSlug),
        descripcion: p.descripcion || p.descripcionWeb || '',
        categoria: p.categoria?.parent?.nombre || p.categoria?.nombre || 'Juguetería',
        subcategoria: p.categoria?.parent ? p.categoria.nombre : null,
        marca: p.marca?.nombre || meta.marca || null,
        imagen: p.imagen || (Array.isArray(meta.imagenes) ? meta.imagenes[0] : null) || null,
        imagenes: Array.isArray(meta.imagenes) ? meta.imagenes : (p.imagen ? [p.imagen] : []),
        videos: Array.isArray(meta.videos) ? meta.videos : [],
        precioPublico: pricing.precioTotal,
        precioAnterior: pricing.precioAnterior,
        stockDisponible,
        gananciaAliado: calc.ganancia,
        urlReferido: `${baseUrl}/producto/${encodeURIComponent(String(prodSlug))}?ref=${encodeURIComponent(aliado.codigoReferido)}`,
        variantes: (p.variantes || [])
          .map((v: any) => {
            const vStock = (v.stock || [])
              .filter((s: any) => {
                if (s.bodega && s.bodega.activo === false) return false;
                const bId = s.bodegaId ?? s.bodega?.id;
                if (bodegasFiltro && bodegasFiltro.length > 0 && bId && !bodegasFiltro.includes(bId)) return false;
                return true;
              })
              .reduce((sum: number, s: any) => sum + Math.max(0, Number(s.cantidad || 0) - Number(s.cantidadReservada || 0)), 0);
            const vBase = Number(v.precioBase || 0);
            const targetProd = vBase > 0 && vBase !== Number(p.precioBase || 0) ? { ...p, precioBase: vBase, precioWeb: null } : p;
            const vPrice = this.digitalService.resolverPrecioYImpuesto(targetProd, (config as any).reglasPrecios);
            return {
              id: v.id,
              nombre: v.nombre,
              stockDisponible: vStock,
              precioPublico: vPrice.precioTotal,
            };
          })
          .filter((v: any) => v.stockDisponible > 0),
      });
    }

    return {
      codigoReferido: aliado.codigoReferido,
      porcentajeAplicado: pctAliado,
      productos: itemsCatalogo,
    };
  }

  async generarCopyProductoIa(
    slug: string,
    authHeader: string | undefined,
    productoId: number,
    estiloRaw?: string,
    regenerar = false,
  ) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    if (!configAliados.activo) {
      throw new ForbiddenException('El programa de aliados no está activo.');
    }
    const aliado = await this.verificarTokenAliado(authHeader, config.empresaId);
    if (aliado.estado !== 'ACTIVO') {
      throw new ForbiddenException('Tu cuenta de aliado aún está pendiente de aprobación.');
    }

    const estilo: 'whatsapp' | 'marketplace' | 'instagram' =
      estiloRaw === 'marketplace' || estiloRaw === 'instagram' ? estiloRaw : 'whatsapp';

    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId: config.empresaId, publicadoWeb: true, activo: true },
      include: {
        categoria: { select: { nombre: true, parent: { select: { nombre: true } } } },
        marca: { select: { nombre: true } },
      },
    });
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const baseUrl = this.obtenerBaseUrlTienda(config);
    const meta = (producto.metadataWeb as any) || {};
    const nombreVisible = meta.nombreWeb || producto.nombre;
    const prodSlug = producto.slug || producto.id;
    const urlReferido = `${baseUrl}/producto/${encodeURIComponent(String(prodSlug))}?ref=${encodeURIComponent(aliado.codigoReferido)}`;
    const pricing = this.digitalService.resolverPrecioYImpuesto(producto, (config as any).reglasPrecios);
    const precioRef = Math.round(Number(pricing.precioTotal || 0));
    const COPY_CACHE_VERSION = 2;

    const cacheKey = `${config.empresaId}:${producto.id}:${estilo}:${precioRef}`;
    const ahora = Date.now();
    let baseCopy = !regenerar ? this.copyCache.get(cacheKey) : undefined;
    let hitCache = Boolean(baseCopy && baseCopy.expiresAt >= ahora);

    if (!hitCache && !regenerar) {
      const saved = meta?.copiesAliados?.[estilo];
      if (
        saved &&
        Number(saved.v) === COPY_CACHE_VERSION &&
        Number(saved.precioRef) === precioRef &&
        typeof saved.texto === 'string' &&
        saved.texto.includes('{{URL}}')
      ) {
        baseCopy = {
          titulo: String(saved.titulo || nombreVisible),
          texto: saved.texto,
          hashtags: Array.isArray(saved.hashtags) ? saved.hashtags : [],
          expiresAt: ahora + this.COPY_CACHE_TTL_MS,
        };
        this.copyCache.set(cacheKey, baseCopy);
        hitCache = true;
      }
    }

    if (!hitCache || !baseCopy) {
      const generado = await this.gemini.generarCopyRedesAliado(
        {
          nombre: nombreVisible,
          descripcion: producto.descripcion,
          descripcionWeb: producto.descripcionWeb,
          precio: pricing.precioTotal,
          categoria: producto.categoria?.parent?.nombre || producto.categoria?.nombre,
          marca: producto.marca?.nombre || meta.marca,
          tiendaNombre: config.nombreTienda && config.nombreTienda !== 'Edatia Demo SAS' ? config.nombreTienda : 'Distribuidora Baby World',
        },
        estilo,
      );

      if (this.copyCache.size >= this.COPY_CACHE_MAX_SIZE) {
        const oldestKey = this.copyCache.keys().next().value;
        if (oldestKey) this.copyCache.delete(oldestKey);
      }

      baseCopy = {
        ...generado,
        expiresAt: ahora + this.COPY_CACHE_TTL_MS,
      };
      this.copyCache.set(cacheKey, baseCopy);

      // Persistir en metadataWeb para compartir el copy entre todos los aliados (y sobrevivir reinicios)
      try {
        const nextMeta = {
          ...meta,
          copiesAliados: {
            ...(meta.copiesAliados && typeof meta.copiesAliados === 'object' ? meta.copiesAliados : {}),
            [estilo]: {
              v: COPY_CACHE_VERSION,
              precioRef,
              titulo: generado.titulo,
              texto: generado.texto,
              hashtags: generado.hashtags,
              updatedAt: new Date().toISOString(),
            },
          },
        };
        await this.prisma.producto.update({
          where: { id: producto.id },
          data: { metadataWeb: nextMeta },
        });
      } catch {
        // No bloquear respuesta al aliado si falla la escritura de caché persistente
      }
    }

    const textoFinal = baseCopy.texto.replace(/\{\{URL\}\}/g, urlReferido);

    return {
      estilo,
      titulo: baseCopy.titulo,
      texto: textoFinal,
      hashtags: baseCopy.hashtags,
      urlReferido,
      desdeCache: hitCache,
    };
  }

  async crearPedidoDesdeAliado(slug: string, authHeader: string | undefined, dto: any) {
    const { config, configAliados } = await this.resolverTiendaPorSlug(slug);
    if (!configAliados.activo) {
      throw new ForbiddenException('El programa de aliados no está activo.');
    }
    const aliado = await this.verificarTokenAliado(authHeader, config.empresaId);
    if (aliado.estado !== 'ACTIVO') {
      throw new ForbiddenException('Tu cuenta de aliado debe estar ACTIVA para registrar pedidos.');
    }

    return this.digitalService.crearPedidoWeb(slug, {
      ...dto,
      refCodigo: aliado.codigoReferido,
      origenAliado: 'PEDIDO_ALIADO',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDPOINTS ADMINISTRATIVOS EN EL ERP (JWT ADMIN)
  // ═══════════════════════════════════════════════════════════════════════════

  async getConfigAdmin(empresaId: number) {
    const config = await this.digitalService.getConfig(empresaId);
    const configAliados = mergeConfigAliados((config as any).configAliados);

    const categorias = await (this.prisma as any).categoria.findMany({
      where: { empresaId, activo: true },
      select: {
        id: true,
        nombre: true,
        parentId: true,
        parent: { select: { id: true, nombre: true } },
      },
      orderBy: [{ parentId: 'asc' }, { nombre: 'asc' }],
    });

    const baseUrl = this.obtenerBaseUrlTienda(config);

    return {
      configAliados,
      urlPortalAliados: `${baseUrl}/aliados`,
      categoriasDisponibles: categorias.map((c: any) => ({
        id: c.id,
        nombre: c.parent ? `${c.parent.nombre} > ${c.nombre}` : c.nombre,
        esPadre: !c.parentId,
      })),
    };
  }

  async updateConfigAdmin(empresaId: number, body: any) {
    const current = await this.digitalService.getConfig(empresaId);
    const merged = mergeConfigAliados({
      ...((current as any).configAliados || {}),
      ...(body || {}),
    });

    await this.prisma.configuracionTienda.update({
      where: { empresaId },
      data: { configAliados: merged as any },
    });

    return { configAliados: merged };
  }

  async listarAliadosAdmin(empresaId: number) {
    const config = await this.digitalService.getConfig(empresaId);
    const configAliados = mergeConfigAliados((config as any).configAliados);
    const baseUrl = this.obtenerBaseUrlTienda(config);

    const aliados = await (this.prisma as any).aliadoComercial.findMany({
      where: { empresaId },
      include: {
        comisiones: {
          select: { id: true, estado: true, valorComision: true, montoVenta: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return aliados.map((a: any) => {
      let saldoPendiente = 0;
      let saldoAprobado = 0;
      let saldoPagado = 0;
      let totalVentas = 0;
      let pedidosCount = 0;

      for (const c of a.comisiones || []) {
        const val = Number(c.valorComision || 0);
        if (c.estado === 'ANULADA') continue;
        pedidosCount++;
        totalVentas += Number(c.montoVenta || 0);
        if (c.estado === 'PENDIENTE') saldoPendiente += val;
        else if (c.estado === 'APROBADA') saldoAprobado += val;
        else if (c.estado === 'PAGADA') saldoPagado += val;
      }

      return {
        ...this.sanitizarAliadoPublico(a, configAliados, baseUrl),
        porcentajePersonalizado: a.porcentajeUtilidad !== null ? Number(a.porcentajeUtilidad) : null,
        notas: a.notas,
        resumen: {
          pedidosCount,
          totalVentas,
          saldoPendiente,
          saldoAprobado,
          saldoPagado,
        },
      };
    });
  }

  async actualizarAliadoAdmin(empresaId: number, aliadoId: number, body: any) {
    const aliado = await (this.prisma as any).aliadoComercial.findFirst({
      where: { id: aliadoId, empresaId },
    });
    if (!aliado) throw new NotFoundException('Aliado comercial no encontrado');

    const data: any = {};
    if (body?.estado && ['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(body.estado)) {
      data.estado = body.estado;
    }
    if (body?.porcentajeUtilidad !== undefined) {
      if (body.porcentajeUtilidad === null || body.porcentajeUtilidad === '') {
        data.porcentajeUtilidad = null;
      } else {
        const pct = Number(body.porcentajeUtilidad);
        if (isNaN(pct) || pct <= 0 || pct > 80) {
          throw new BadRequestException('El porcentaje debe estar entre 1% y 80%.');
        }
        data.porcentajeUtilidad = pct;
      }
    }
    if (body?.notas !== undefined) {
      data.notas = this.sanitizeText(body.notas, 500) || null;
    }

    return (this.prisma as any).aliadoComercial.update({
      where: { id: aliado.id },
      data,
    });
  }

  async listarComisionesAdmin(empresaId: number, estado?: string) {
    const where: any = { empresaId };
    if (estado && ['PENDIENTE', 'APROBADA', 'PAGADA', 'ANULADA'].includes(estado)) {
      where.estado = estado;
    }

    const rows = await (this.prisma as any).comisionAliado.findMany({
      where,
      include: {
        aliado: {
          select: { id: true, nombre: true, codigoReferido: true, telefono: true, medioPago: true, cuentaPago: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    return rows.map((r: any) => ({
      ...r,
      montoVenta: Number(r.montoVenta || 0),
      costoTotal: Number(r.costoTotal || 0),
      utilidadNeta: Number(r.utilidadNeta || 0),
      porcentajeAplicado: Number(r.porcentajeAplicado || 0),
      valorComision: Number(r.valorComision || 0),
    }));
  }

  async actualizarEstadoComision(empresaId: number, comisionId: number, body: any) {
    const comision = await (this.prisma as any).comisionAliado.findFirst({
      where: { id: comisionId, empresaId },
    });
    if (!comision) throw new NotFoundException('Comisión no encontrada');

    const nuevoEstado = String(body?.estado || '').toUpperCase();
    if (!['PENDIENTE', 'APROBADA', 'PAGADA', 'ANULADA'].includes(nuevoEstado)) {
      throw new BadRequestException('Estado de comisión inválido');
    }

    const data: any = { estado: nuevoEstado };
    if (nuevoEstado === 'APROBADA' && !comision.fechaAprobacion) {
      data.fechaAprobacion = new Date();
    }
    if (nuevoEstado === 'PAGADA') {
      if (!comision.fechaAprobacion) data.fechaAprobacion = new Date();
      data.fechaPago = new Date();
      if (body?.comprobantePago) {
        data.comprobantePago = this.sanitizeText(body.comprobantePago, 120);
      }
    }
    if (body?.notas !== undefined) {
      data.notas = this.sanitizeText(body.notas, 400) || null;
    }

    return (this.prisma as any).comisionAliado.update({
      where: { id: comision.id },
      data,
    });
  }

  async liquidarComisionesAprobadas(empresaId: number, aliadoId: number, body: any) {
    const aliado = await (this.prisma as any).aliadoComercial.findFirst({
      where: { id: aliadoId, empresaId },
    });
    if (!aliado) throw new NotFoundException('Aliado no encontrado');

    const comprobantePago = this.sanitizeText(body?.comprobantePago, 120) || 'Transferencia Nequi/Daviplata';
    const notas = this.sanitizeText(body?.notas, 300) || null;

    return this.prisma.$transaction(async (tx) => {
      const aprobadas = await (tx as any).comisionAliado.findMany({
        where: { empresaId, aliadoId, estado: 'APROBADA' },
        select: { id: true, valorComision: true },
      });

      if (aprobadas.length === 0) {
        throw new BadRequestException('Este aliado no tiene comisiones aprobadas pendientes por pagar.');
      }

      const ids = aprobadas.map((c: any) => c.id);
      const totalPagado = aprobadas.reduce((sum: number, c: any) => sum + Number(c.valorComision || 0), 0);

      await (tx as any).comisionAliado.updateMany({
        where: { id: { in: ids } },
        data: {
          estado: 'PAGADA',
          fechaPago: new Date(),
          comprobantePago,
          ...(notas ? { notas } : {}),
        },
      });

      return {
        aliadoId,
        cantidadLiquidadas: ids.length,
        totalPagado,
        comprobantePago,
      };
    });
  }
}

