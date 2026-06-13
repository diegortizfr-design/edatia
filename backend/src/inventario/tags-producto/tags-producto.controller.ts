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
import { CreateTagProductoDto, UpdateTagProductoDto } from './dto/tag-producto.dto';
import { TagsProductoService } from './tags-producto.service';

@UseGuards(JwtAuthGuard)
@Controller('tags-producto')
export class TagsProductoController {
  constructor(private readonly svc: TagsProductoService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.svc.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTagProductoDto) {
    const empresaId: number = req.user.empresaId;
    return this.svc.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagProductoDto,
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
