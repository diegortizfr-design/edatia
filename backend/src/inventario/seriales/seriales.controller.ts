import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SerialesService, CreateSerialesDto, ActualizarEstadoDto } from './seriales.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/seriales')
export class SerialesController {
  constructor(private readonly svc: SerialesService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('productoId') productoId?: string,
    @Query('bodegaId') bodegaId?: string,
    @Query('estado') estado?: string,
    @Query('loteId') loteId?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      productoId: productoId ? +productoId : undefined,
      bodegaId:   bodegaId   ? +bodegaId   : undefined,
      estado,
      loteId:     loteId     ? +loteId     : undefined,
    });
  }

  @Get('stats')
  stats(@GetUser() user: JwtPayload) {
    return this.svc.stats(user.empresaId!);
  }

  @Get('buscar')
  buscar(@Query('serial') serial: string, @GetUser() user: JwtPayload) {
    return this.svc.buscarPorSerial(serial, user.empresaId!);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post('ingresar')
  ingresar(@Body() dto: CreateSerialesDto, @GetUser() user: JwtPayload) {
    return this.svc.ingresarSeriales(dto, user.empresaId!);
  }

  @Patch(':id/estado')
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.svc.actualizarEstado(id, user.empresaId!, dto);
  }
}
