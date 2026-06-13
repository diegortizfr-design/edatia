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
import { CreateColorProductoDto, UpdateColorProductoDto } from './dto/color-producto.dto';
import { ColoresProductoService } from './colores-producto.service';

@UseGuards(JwtAuthGuard)
@Controller('colores-producto')
export class ColoresProductoController {
  constructor(private readonly svc: ColoresProductoService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.svc.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateColorProductoDto) {
    const empresaId: number = req.user.empresaId;
    return this.svc.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColorProductoDto,
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
