import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { AnaliticaService } from './analitica.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('digital')
@UseGuards(JwtAuthGuard)
export class DigitalController {
  constructor(
    private readonly digitalService: DigitalService,
    private readonly analiticaService: AnaliticaService,
  ) {}

  @Get('analitica')
  getAnalitica(@Request() req: any, @Query('dias') dias?: string) {
    return this.analiticaService.getEstadisticas(req.user.empresaId, dias ? Number(dias) : undefined);
  }

  @Get('config')
  getConfig(@Request() req: any) {
    return this.digitalService.getConfig(req.user.empresaId);
  }

  @Patch('config')
  updateConfig(@Request() req: any, @Body() body: any) {
    return this.digitalService.updateConfig(req.user.empresaId, body);
  }

  @Get('productos')
  getProductos(@Request() req: any, @Query('publicado') publicado?: string) {
    return this.digitalService.getProductosWeb(
      req.user.empresaId,
      publicado !== undefined ? { publicado: publicado === 'true' } : undefined,
    );
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
