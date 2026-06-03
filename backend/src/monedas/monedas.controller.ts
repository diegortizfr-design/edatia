import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateMonedaDto } from './dto/create-moneda.dto';
import { UpdateMonedaDto } from './dto/update-moneda.dto';
import { MonedasService } from './monedas.service';

@UseGuards(JwtAuthGuard)
@Controller('monedas')
export class MonedasController {
  constructor(private readonly monedasService: MonedasService) {}

  @Get()
  findAll(@GetUser('empresaId') empresaId: number) {
    return this.monedasService.findAll(empresaId);
  }

  @Post()
  create(
    @GetUser('empresaId') empresaId: number,
    @Body() dto: CreateMonedaDto,
  ) {
    return this.monedasService.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('empresaId') empresaId: number,
    @Body() dto: UpdateMonedaDto,
  ) {
    return this.monedasService.update(id, empresaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('empresaId') empresaId: number,
  ) {
    return this.monedasService.remove(id, empresaId);
  }
}

