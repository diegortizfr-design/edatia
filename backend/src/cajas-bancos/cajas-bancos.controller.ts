import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CajasBancosService } from './cajas-bancos.service';
import { CreateCajaBancoDto } from './dto/create-caja-banco.dto';
import { UpdateCajaBancoDto } from './dto/update-caja-banco.dto';

@UseGuards(JwtAuthGuard)
@Controller('cajas-bancos')
export class CajasBancosController {
  constructor(private readonly cajasBancosService: CajasBancosService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.cajasBancosService.findAll(req.user.empresaId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCajaBancoDto) {
    return this.cajasBancosService.create(req.user.empresaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateCajaBancoDto,
  ) {
    return this.cajasBancosService.update(id, req.user.empresaId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.cajasBancosService.remove(id, req.user.empresaId);
  }
}
