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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateTallaProductoDto, UpdateTallaProductoDto } from './dto/talla-producto.dto';
import { TallasProductoService } from './tallas-producto.service';

@UseGuards(JwtAuthGuard)
@Controller('tallas-producto')
export class TallasProductoController {
  constructor(private readonly svc: TallasProductoService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.svc.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTallaProductoDto) {
    const empresaId: number = req.user.empresaId;
    return this.svc.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTallaProductoDto,
  ) {
    const empresaId: number = req.user.empresaId;
    return this.svc.update(id, empresaId, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const empresaId: number = req.user.empresaId;
    return this.svc.remove(id, empresaId);
  }
}
