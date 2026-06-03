import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
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
  findAll(@GetUser('empresaId') empresaId: string) {
    return this.monedasService.findAll(empresaId);
  }

  @Post()
  create(
    @GetUser('empresaId') empresaId: string,
    @Body() dto: CreateMonedaDto,
  ) {
    return this.monedasService.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('empresaId') empresaId: string,
    @Body() dto: UpdateMonedaDto,
  ) {
    return this.monedasService.update(id, empresaId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('empresaId') empresaId: string) {
    return this.monedasService.remove(id, empresaId);
  }
}
