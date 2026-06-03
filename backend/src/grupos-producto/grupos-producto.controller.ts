import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGrupoProductoDto } from './dto/create-grupo-producto.dto';
import { UpdateGrupoProductoDto } from './dto/update-grupo-producto.dto';
import { GruposProductoService } from './grupos-producto.service';

@UseGuards(JwtAuthGuard)
@Controller('grupos-producto')
export class GruposProductoController {
  constructor(private readonly gruposProductoService: GruposProductoService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.gruposProductoService.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateGrupoProductoDto) {
    const empresaId: number = req.user.empresaId;
    return this.gruposProductoService.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrupoProductoDto,
  ) {
    const empresaId: number = req.user.empresaId;
    return this.gruposProductoService.update(id, empresaId, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const empresaId: number = req.user.empresaId;
    return this.gruposProductoService.remove(id, empresaId);
  }
}
