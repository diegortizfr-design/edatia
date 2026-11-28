import { Controller, Get, Post, Patch, Param, Body, Query, Headers, Header, HttpCode, ParseIntPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DigitalService } from './digital.service';
import { AnaliticaService } from './analitica.service';

@Controller('public/tiendas')
export class DigitalPublicController {
  constructor(
    private readonly digitalService: DigitalService,
    private readonly analiticaService: AnaliticaService,
  ) {}

  // Feed XML para Meta Commerce Manager (Facebook / Instagram Shopping)
  @Get(':slug/meta-feed.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=7200, s-maxage=7200')
  async getMetaFeedXml(
    @Param('slug') slug: string,
    @Query('filtro') filtro?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.digitalService.getMetaFeedXml(slug, filtro || 'alto_margen', refresh === 'true');
  }

  // Alias estándar compatible con /feed.xml
  @Get(':slug/feed.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=7200, s-maxage=7200')
  async getFeedXml(
    @Param('slug') slug: string,
    @Query('filtro') filtro?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.digitalService.getMetaFeedXml(slug, filtro || 'alto_margen', refresh === 'true');
  }

  // Vista Previa enriquecida (Open Graph) para bots de WhatsApp, Facebook, etc.
  @Get(':slug/og/:productoSlug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getProductoOgHtml(
    @Param('slug') slug: string,
    @Param('productoSlug') productoSlug: string,
  ) {
    return this.digitalService.getProductoOgHtml(slug, productoSlug);
  }

  // Vista Previa enriquecida (Open Graph) para el Portal de Aliados (/aliados)
  @Get(':slug/og-aliados')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getAliadosOgHtml(@Param('slug') slug: string) {
    return this.digitalService.getAliadosOgHtml(slug);
  }

  // Analítica anónima de la tienda (visitas, producto visto, carrito, checkout)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post(':slug/eventos')
  @HttpCode(202)
  async registrarEvento(@Param('slug') slug: string, @Body() body: any) {
    return this.analiticaService.registrarEvento(slug, body);
  }

  @Get(':slug/productos')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getProductosPublic(@Param('slug') slug: string) {
    return this.digitalService.getProductosWebPublic(slug);
  }

  @Get(':slug/categorias')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getCategoriasPublic(@Param('slug') slug: string) {
    return this.digitalService.getCategoriasWebPublic(slug);
  }

  @Get(':slug/info')
  async getTiendaInfoPublic(@Param('slug') slug: string) {
    return this.digitalService.getTiendaInfoPublic(slug);
  }

  // Registro de miembros al Club Familia Baby World (crea o actualiza Cliente en Tercero)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/familia-registro')
  async registrarClienteFamilia(@Param('slug') slug: string, @Body() body: any) {
    return this.digitalService.registrarClienteFamilia(slug, body);
  }

  // Límite estricto para evitar spam de pedidos falsos
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/pedidos')
  async crearPedidoPublic(@Param('slug') slug: string, @Body() body: any) {
    return this.digitalService.crearPedidoWeb(slug, body);
  }

  // Resolución de stream de video limpio sin marcas de agua
  @Get(':slug/video-stream')
  async getVideoStream(@Query('url') url: string) {
    return this.digitalService.resolverVideoStream(url);
  }

  // Permite al cliente cambiar su forma de pago en un pedido pendiente
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Patch(':slug/pedidos/:id/metodo-pago')
  async cambiarMetodoPagoPublic(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.digitalService.cambiarMetodoPagoWeb(slug, id, body);
  }

  // Notificaciones (webhooks) de Mercado Pago. Siempre responde 200 rápido.
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Post(':slug/mercadopago/webhook')
  @HttpCode(200)
  async webhookMercadoPago(
    @Param('slug') slug: string,
    @Query() query: any,
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.digitalService.procesarWebhookMercadoPago(slug, query, body, headers);
  }
}
