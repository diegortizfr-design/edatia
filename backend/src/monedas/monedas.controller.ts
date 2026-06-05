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
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator';
import { CreateMonedaDto } from './dto/create-moneda.dto';
import { UpdateMonedaDto } from './dto/update-moneda.dto';
import { MonedasService } from './monedas.service';

@UseGuards(JwtAuthGuard)
@Controller('monedas')
export class MonedasController {
  constructor(private readonly monedasService: MonedasService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload) {
    return this.monedasService.findAll(u.empresaId!);
  }

  @Post()
  create(
    @GetUser() u: JwtPayload,
    @Body() dto: CreateMonedaDto,
  ) {
    return this.monedasService.create(u.empresaId!, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
    @Body() dto: UpdateMonedaDto,
  ) {
    return this.monedasService.update(id, u.empresaId!, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
  ) {
    return this.monedasService.remove(id, u.empresaId!);
  }
}

