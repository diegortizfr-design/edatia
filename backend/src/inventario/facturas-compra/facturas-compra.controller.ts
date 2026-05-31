import { Controller, Get, Post, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FacturasCompraService } from './facturas-compra.service';
import { CreateFacturaCompraDto } from './dto/factura-compra.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/facturas-compra')
export class FacturasCompraController {
  constructor(private readonly svc: FacturasCompraService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('query') query?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      query,
      proveedorId: proveedorId ? +proveedorId : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateFacturaCompraDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!, user.sub);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.remove(id, user.empresaId!);
  }
}
