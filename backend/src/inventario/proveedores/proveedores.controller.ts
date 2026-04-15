import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/proveedores')
export class ProveedoresController {
  constructor(private readonly svc: ProveedoresService) {}

  @Get()
  findAll(@GetUser() user: JwtPayload, @Query('q') q?: string) {
    return this.svc.findAll(user.empresaId!, q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateProveedorDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProveedorDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }
}
