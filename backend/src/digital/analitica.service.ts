import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TIPOS_VALIDOS = ['VISITA', 'VER_PRODUCTO', 'AGREGAR_CARRITO', 'INICIO_CHECKOUT'] as const;
const DISPOSITIVOS_VALIDOS = ['MOVIL', 'ESCRITORIO', 'TABLET'];
const VISITOR_ID_REGEX = /^[A-Za-z0-9-]{8,64}$/;

@Injectable()
export class AnaliticaService {
  private readonly logger = new Logger(AnaliticaService.name);

  constructor(private prisma: PrismaService) {}

  /** Registra un evento anónimo. Valida todo con listas permitidas; nunca lanza error al visitante. */
  async registrarEvento(slug: string, body: any) {
    const tipo = String(body?.tipo ?? '');
    const visitorId = String(body?.visitorId ?? '');
    if (!(TIPOS_VALIDOS as readonly string[]).includes(tipo) || !VISITOR_ID_REGEX.test(visitorId)) {
      return { ok: false };
    }

    const config = await this.prisma.configuracionTienda.findFirst({
      where: { OR: [{ slugTienda: slug }, { dominioPropio: slug }] },
      select: { empresaId: true, activo: true },
    });
    if (!config || !config.activo) return { ok: false };

    const productoIdNum = Number(body?.productoId);
    const productoId = Number.isInteger(productoIdNum) && productoIdNum > 0 ? productoIdNum : null;
    const origenRaw = typeof body?.origen === 'string' ? body.origen : '';
    const origen = origenRaw.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60) || 'directo';
    const dispositivo = DISPOSITIVOS_VALIDOS.includes(body?.dispositivo) ? body.dispositivo : null;

    try {
      await this.prisma.eventoTienda.create({
        data: { empresaId: config.empresaId, tipo, visitorId, productoId, origen, dispositivo },
      });
      return { ok: true };
    } catch (error: any) {
      this.logger.warn(`No se pudo registrar evento de tienda: ${error?.code ?? 'error'}`);
      return { ok: false };
    }
  }

  /** Estadísticas para el panel admin, siempre acotadas a la empresa autenticada. */
  async getEstadisticas(empresaId: number, diasParam?: number) {
    const dias = Math.min(Math.max(Number(diasParam) || 30, 1), 365);
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));

    const filtro = { empresaId, createdAt: { gte: desde } };

    const [porTipo, visitantes, porDia, porOrigen, porDispositivo, topProductos] = await Promise.all([
      this.prisma.eventoTienda.groupBy({ by: ['tipo'], where: filtro, _count: { _all: true } }),
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(DISTINCT "visitorId") AS total FROM "EventoTienda"
        WHERE "empresaId" = ${empresaId} AND "createdAt" >= ${desde}`,
      this.prisma.$queryRaw<{ dia: Date; visitas: bigint; visitantes: bigint }[]>`
        SELECT DATE("createdAt") AS dia,
               COUNT(*) FILTER (WHERE "tipo" = 'VISITA') AS visitas,
               COUNT(DISTINCT "visitorId") AS visitantes
        FROM "EventoTienda"
        WHERE "empresaId" = ${empresaId} AND "createdAt" >= ${desde}
        GROUP BY DATE("createdAt") ORDER BY dia ASC`,
      this.prisma.eventoTienda.groupBy({
        by: ['origen'],
        where: { ...filtro, tipo: 'VISITA' },
        _count: { _all: true },
        orderBy: { _count: { origen: 'desc' } },
        take: 10,
      }),
      this.prisma.eventoTienda.groupBy({
        by: ['dispositivo'],
        where: { ...filtro, tipo: 'VISITA' },
        _count: { _all: true },
      }),
      this.prisma.eventoTienda.groupBy({
        by: ['productoId'],
        where: { ...filtro, tipo: 'VER_PRODUCTO', productoId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { productoId: 'desc' } },
        take: 10,
      }),
    ]);

    const ids = topProductos.map((p) => p.productoId as number);
    const productos = ids.length
      ? await this.prisma.producto.findMany({
          where: { empresaId, id: { in: ids } },
          select: { id: true, nombre: true },
        })
      : [];
    const nombres = new Map(productos.map((p) => [p.id, p.nombre]));

    const conteo = (t: string) => porTipo.find((x) => x.tipo === t)?._count._all ?? 0;
    const visitas = conteo('VISITA');
    const checkout = conteo('INICIO_CHECKOUT');

    return {
      rangoDias: dias,
      resumen: {
        visitas,
        visitantesUnicos: Number(visitantes[0]?.total ?? 0),
        productosVistos: conteo('VER_PRODUCTO'),
        agregadosCarrito: conteo('AGREGAR_CARRITO'),
        iniciosCheckout: checkout,
        conversionCheckoutPct: visitas > 0 ? Number(((checkout / visitas) * 100).toFixed(1)) : 0,
      },
      porDia: porDia.map((d) => ({
        dia: d.dia instanceof Date ? d.dia.toISOString().slice(0, 10) : String(d.dia),
        visitas: Number(d.visitas),
        visitantes: Number(d.visitantes),
      })),
      porOrigen: porOrigen.map((o) => ({ origen: o.origen ?? 'directo', visitas: o._count._all })),
      porDispositivo: porDispositivo.map((d) => ({ dispositivo: d.dispositivo ?? 'DESCONOCIDO', visitas: d._count._all })),
      topProductos: topProductos.map((p) => ({
        productoId: p.productoId,
        nombre: nombres.get(p.productoId as number) ?? `Producto #${p.productoId}`,
        vistas: p._count._all,
      })),
    };
  }
}
