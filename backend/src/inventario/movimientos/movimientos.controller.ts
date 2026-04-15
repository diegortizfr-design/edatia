import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { EntradaManualDto, SalidaManualDto, AjusteDto, TrasladoDto } from './dto/movimiento.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/movimientos')
export class MovimientosController {
  constructor(private readonly svc: MovimientosService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('productoId') productoId?: string,
    @Query('bodegaId') bodegaId?: string,
    @Query('tipo') tipo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      productoId: productoId ? +productoId : undefined,
      bodegaId: bodegaId ? +bodegaId : undefined,
      tipo,
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    });
  }

  @Get('kardex/:productoId')
  getKardex(
    @Param('productoId', ParseIntPipe) productoId: number,
    @GetUser() user: JwtPayload,
    @Query('bodegaId') bodegaId?: string,
  ) {
    return this.svc.getKardex(productoId, user.empresaId!, bodegaId ? +bodegaId : undefined);
  }

  @Post('entrada')
  entrada(@Body() dto: EntradaManualDto, @GetUser() user: JwtPayload) {
    return this.svc.procesarEntrada(dto, user.empresaId!, user.sub);
  }

  @Post('salida')
  salida(@Body() dto: SalidaManualDto, @GetUser() user: JwtPayload) {
    return this.svc.procesarSalida(dto, user.empresaId!, user.sub);
  }

  @Post('ajuste')
  ajuste(@Body() dto: AjusteDto, @GetUser() user: JwtPayload) {
    return this.svc.procesarAjuste(dto, user.empresaId!, user.sub);
  }

  @Post('traslado')
  traslado(@Body() dto: TrasladoDto, @GetUser() user: JwtPayload) {
    return this.svc.procesarTraslado(dto, user.empresaId!, user.sub);
  }
}
