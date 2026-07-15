import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { DigitalService } from './digital.service';

@Controller('public/tiendas')
export class DigitalPublicController {
  constructor(private readonly digitalService: DigitalService) {}

  @Get(':slug/productos')
  async getProductosPublic(@Param('slug') slug: string) {
    return this.digitalService.getProductosWebPublic(slug);
  }

  @Post(':slug/pedidos')
  async crearPedidoPublic(@Param('slug') slug: string, @Body() body: any) {
    return this.digitalService.crearPedidoWeb(slug, body);
  }
}
