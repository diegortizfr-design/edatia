import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BodegasService } from './bodegas.service';
import { CreateBodegaDto, UpdateBodegaDto } from './dto/bodega.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/bodegas')
export class BodegasController {
  constructor(private readonly svc: BodegasService) {}

  @Get()
  findAll(@GetUser() user: JwtPayload, @Query('incluirInactivas') incluirInactivas?: string) { 
    return this.svc.findAll(user.empresaId!, incluirInactivas === 'true'); 
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateBodegaDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBodegaDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.remove(id, user.empresaId!);
  }
}
