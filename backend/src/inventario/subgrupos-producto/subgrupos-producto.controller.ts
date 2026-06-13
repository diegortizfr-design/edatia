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
import { CreateSubgrupoProductoDto, UpdateSubgrupoProductoDto } from './dto/subgrupo-producto.dto';
import { SubgruposProductoService } from './subgrupos-producto.service';

@UseGuards(JwtAuthGuard)
@Controller('subgrupos-producto')
export class SubgruposProductoController {
  constructor(private readonly svc: SubgruposProductoService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.svc.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateSubgrupoProductoDto) {
    const empresaId: number = req.user.empresaId;
    return this.svc.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubgrupoProductoDto,
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
