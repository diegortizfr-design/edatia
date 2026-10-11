import { Controller, Get, Post, Patch, Param, Body, Query, Headers, HttpCode, ParseIntPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DigitalService } from './digital.service';

@Controller('public/tiendas')
export class DigitalPublicController {
  constructor(private readonly digitalService: DigitalService) {}

  @Get(':slug/productos')
  async getProductosPublic(@Param('slug') slug: string) {
    return this.digitalService.getProductosWebPublic(slug);
  }

  // Límite estricto para evitar spam de pedidos falsos
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/pedidos')
  async crearPedidoPublic(@Param('slug') slug: string, @Body() body: any) {
    return this.digitalService.crearPedidoWeb(slug, body);
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
