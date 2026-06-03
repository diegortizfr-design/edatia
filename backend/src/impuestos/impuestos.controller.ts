import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ImpuestosService } from './impuestos.service';
import { CreateImpuestoDto } from './dto/create-impuesto.dto';
import { UpdateImpuestoDto } from './dto/update-impuesto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('impuestos')
export class ImpuestosController {
  constructor(private readonly impuestosService: ImpuestosService) {}

  @Get()
  findAll(@GetUser() user: JwtPayload) {
    return this.impuestosService.findAll(user.empresaId);
  }

  @Post()
  create(
    @GetUser() user: JwtPayload,
    @Body() dto: CreateImpuestoDto,
  ) {
    return this.impuestosService.create(user.empresaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() dto: UpdateImpuestoDto,
  ) {
    return this.impuestosService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.impuestosService.remove(id, user.empresaId);
  }
}

