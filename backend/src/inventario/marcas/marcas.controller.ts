import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { CreateMarcaDto, UpdateMarcaDto } from './dto/marca.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/marcas')
export class MarcasController {
  constructor(private readonly svc: MarcasService) {}

  @Get()
  findAll(@GetUser() user: JwtPayload) { return this.svc.findAll(user.empresaId!); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findOne(id, user.empresaId!);
  }

  @Post()
  create(@Body() dto: CreateMarcaDto, @GetUser() user: JwtPayload) {
    return this.svc.create(dto, user.empresaId!);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMarcaDto, @GetUser() user: JwtPayload) {
    return this.svc.update(id, dto, user.empresaId!);
  }
}
