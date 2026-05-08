import { Controller, Get, Put, Post, Patch, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ConfigDianService } from './config-dian.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/ventas/config-dian')
export class ConfigDianController {
  constructor(private readonly configService: ConfigDianService) {}

  @Get()
  getConfig(@Request() req: any) {
    return this.configService.getConfig(req.user.empresaId);
  }

  @Put()
  upsertConfig(@Request() req: any, @Body() body: any) {
    return this.configService.upsertConfig(req.user.empresaId, body);
  }

  @Post('resoluciones')
  addResolucion(@Request() req: any, @Body() body: any) {
    return this.configService.addResolucion(req.user.empresaId, body);
  }

  @Patch('resoluciones/:id/toggle')
  toggleResolucion(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.configService.toggleResolucion(req.user.empresaId, id);
  }
}
