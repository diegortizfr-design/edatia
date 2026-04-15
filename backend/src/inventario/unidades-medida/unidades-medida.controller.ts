import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UnidadesMedidaService } from './unidades-medida.service';
import { CreateUnidadMedidaDto, UpdateUnidadMedidaDto } from './dto/unidad-medida.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/unidades-medida')
export class UnidadesMedidaController {
  constructor(private readonly svc: UnidadesMedidaService) {}

  @Get()
  findAll(@GetUser() user: JwtPayload) { return this.svc.findAll(user.empresaId!); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateUnidadMedidaDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnidadMedidaDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }
}
