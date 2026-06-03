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
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';
import { VendedoresService } from './vendedores.service';

@UseGuards(JwtAuthGuard)
@Controller('vendedores')
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.vendedoresService.findAll(req.user.empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateVendedorDto) {
    return this.vendedoresService.create(req.user.empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendedorDto,
  ) {
    return this.vendedoresService.update(id, req.user.empresaId, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.vendedoresService.remove(id, req.user.empresaId);
  }
}
