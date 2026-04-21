import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/productos')
export class ProductosController {
  constructor(private readonly svc: ProductosService) {}

  @Get('buscar')
  buscar(@Query('q') q: string, @GetUser() user: JwtPayload) {
    return this.svc.buscar(q, user.empresaId!);
  }

  @Post('clasificar-abc')
  clasificarAbc(@GetUser() user: JwtPayload) {
    return this.svc.clasificarAbc(user.empresaId!);
  }

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('marcaId') marcaId?: string,
    @Query('activo') activo?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      q,
      categoriaId: categoriaId ? +categoriaId : undefined,
      marcaId: marcaId ? +marcaId : undefined,
      activo: activo !== undefined ? activo === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateProductoDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductoDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }
}
