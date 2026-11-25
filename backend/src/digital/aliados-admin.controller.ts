import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AliadosService } from './aliados.service';

@Controller('digital/aliados')
@UseGuards(JwtAuthGuard)
export class AliadosAdminController {
  constructor(private readonly aliadosService: AliadosService) {}

  @Get('config')
  getConfig(@Request() req: any) {
    return this.aliadosService.getConfigAdmin(req.user.empresaId);
  }

  @Patch('config')
  updateConfig(@Request() req: any, @Body() body: any) {
    return this.aliadosService.updateConfigAdmin(req.user.empresaId, body);
  }

  @Get()
  listarAliados(@Request() req: any) {
    return this.aliadosService.listarAliadosAdmin(req.user.empresaId);
  }

  @Patch(':id')
  actualizarAliado(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.aliadosService.actualizarAliadoAdmin(req.user.empresaId, id, body);
  }

  @Post(':id/liquidar')
  liquidarComisiones(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.aliadosService.liquidarComisionesAprobadas(req.user.empresaId, id, body);
  }

  @Get('comisiones')
  listarComisiones(@Request() req: any, @Query('estado') estado?: string) {
    return this.aliadosService.listarComisionesAdmin(req.user.empresaId, estado);
  }

  @Patch('comisiones/:comisionId')
  actualizarComision(
    @Request() req: any,
    @Param('comisionId', ParseIntPipe) comisionId: number,
    @Body() body: any,
  ) {
    return this.aliadosService.actualizarEstadoComision(req.user.empresaId, comisionId, body);
  }
}

