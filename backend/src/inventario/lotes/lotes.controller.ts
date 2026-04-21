import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LotesService, CreateLoteDto } from './lotes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/lotes')
export class LotesController {
  constructor(private readonly svc: LotesService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('productoId') productoId?: string,
    @Query('bodegaId') bodegaId?: string,
    @Query('soloActivos') soloActivos?: string,
    @Query('soloConStock') soloConStock?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      productoId: productoId ? +productoId : undefined,
      bodegaId:   bodegaId   ? +bodegaId   : undefined,
      soloActivos:   soloActivos   === 'true',
      soloConStock:  soloConStock  === 'true',
    });
  }

  @Get('proximos-vencer')
  proximosAVencer(@GetUser() user: JwtPayload, @Query('dias') dias?: string) {
    return this.svc.proximosAVencer(user.empresaId!, dias ? +dias : 30);
  }

  @Get('fefo')
  sugerirFefo(
    @GetUser() user: JwtPayload,
    @Query('productoId', ParseIntPipe) productoId: number,
    @Query('bodegaId', ParseIntPipe) bodegaId: number,
    @Query('cantidad') cantidad: string,
  ) {
    return this.svc.sugerirFefo(productoId, bodegaId, user.empresaId!, parseFloat(cantidad));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateLoteDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLoteDto>,
    @GetUser() user: JwtPayload,
  ) {
    return this.svc.update(id, user.empresaId!, dto);
  }
}
