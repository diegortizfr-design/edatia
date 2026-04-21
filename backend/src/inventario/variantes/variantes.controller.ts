import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { VariantesService, CreateVarianteDto, AjustarStockVarianteDto } from './variantes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/variantes')
export class VariantesController {
  constructor(private readonly svc: VariantesService) {}

  @Get()
  findByProducto(@GetUser() user: JwtPayload, @Query('productoId', ParseIntPipe) productoId: number) {
    return this.svc.findByProducto(productoId, user.empresaId!);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateVarianteDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateVarianteDto>,
    @GetUser() user: JwtPayload,
  ) {
    return this.svc.update(id, user.empresaId!, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.toggleActivo(id, user.empresaId!);
  }

  @Post(':id/stock')
  ajustarStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarStockVarianteDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.svc.ajustarStock(id, user.empresaId!, dto);
  }
}
