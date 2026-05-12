import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('digital')
@UseGuards(JwtAuthGuard)
export class DigitalController {
  constructor(private readonly digitalService: DigitalService) {}

  @Get('config')
  getConfig(@Request() req: any) {
    return this.digitalService.getConfig(req.user.empresaId);
  }

  @Patch('config')
  updateConfig(@Request() req: any, @Body() body: any) {
    return this.digitalService.updateConfig(req.user.empresaId, body);
  }

  @Get('productos')
  getProductos(@Request() req: any) {
    return this.digitalService.getProductosWeb(req.user.empresaId);
  }

  @Patch('productos/:id/toggle')
  toggleProducto(
    @Request() req: any,
    @Param('id') id: string,
    @Body('publicado') publicado: boolean,
  ) {
    return this.digitalService.toggleProductoWeb(req.user.empresaId, +id, publicado);
  }
}
