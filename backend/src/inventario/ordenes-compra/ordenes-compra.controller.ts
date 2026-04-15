import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { OrdenesCompraService } from './ordenes-compra.service';
import { CreateOrdenCompraDto, UpdateOrdenCompraDto, RecibirOrdenCompraDto } from './dto/orden-compra.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/ordenes-compra')
export class OrdenesCompraController {
  constructor(private readonly svc: OrdenesCompraService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('estado') estado?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      estado,
      proveedorId: proveedorId ? +proveedorId : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateOrdenCompraDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!, user.sub);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrdenCompraDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }

  @Post(':id/aprobar')
  aprobar(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.aprobar(id, user.empresaId!);
  }

  @Post(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.anular(id, user.empresaId!);
  }

  @Post(':id/recibir')
  recibir(@Param('id', ParseIntPipe) id: number, @Body() dto: RecibirOrdenCompraDto, @GetUser() user: JwtPayload) {
    return this.svc.recibir(id, dto, user.empresaId!, user.sub);
  }
}
