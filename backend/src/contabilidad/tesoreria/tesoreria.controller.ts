import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';
import { TesoreriaService } from './tesoreria.service';
import {
  CreateEgresoDto,
  CreateCajaMenorDto,
  UpdateCajaMenorDto,
  CreateGastoCajaMenorDto,
  ReembolsoCajaMenorDto,
} from './dto/tesoreria.dto';

@UseGuards(JwtAuthGuard)
@Controller('contabilidad/tesoreria')
export class TesoreriaController {
  constructor(private readonly tesoreria: TesoreriaService) {}

  // ─── Egresos / Gastos ────────────────────────────────────────────────────────

  @Get('egresos/categorias')
  getCategoriasGasto(@GetUser() user: JwtPayload) {
    return this.tesoreria.getCategoriasGasto(user.empresaId!);
  }

  @Get('egresos')
  findAllEgresos(
    @GetUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('categoria') categoria?: string,
    @Query('cajaBancoId') cajaBancoId?: string,
    @Query('query') query?: string,
  ) {
    return this.tesoreria.findAllEgresos(user.empresaId!, {
      desde,
      hasta,
      categoria,
      cajaBancoId: cajaBancoId ? Number(cajaBancoId) : undefined,
      query,
    });
  }

  @Get('egresos/:id')
  findOneEgreso(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.tesoreria.findOneEgreso(id, user.empresaId!);
  }

  @Post('egresos')
  createEgreso(
    @GetUser() user: JwtPayload,
    @Body() dto: CreateEgresoDto,
  ) {
    return this.tesoreria.createEgreso(user.empresaId!, dto, user.sub);
  }

  @Patch('egresos/:id/anular')
  anularEgreso(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.tesoreria.anularEgreso(id, user.empresaId!, user.sub);
  }

  // ─── Caja Menor ─────────────────────────────────────────────────────────────

  @Get('cajas-menores')
  findAllCajasMenores(@GetUser() user: JwtPayload) {
    return this.tesoreria.findAllCajasMenores(user.empresaId!);
  }

  @Post('cajas-menores')
  createCajaMenor(
    @GetUser() user: JwtPayload,
    @Body() dto: CreateCajaMenorDto,
  ) {
    return this.tesoreria.createCajaMenor(user.empresaId!, dto);
  }

  @Patch('cajas-menores/:id')
  updateCajaMenor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() dto: UpdateCajaMenorDto,
  ) {
    return this.tesoreria.updateCajaMenor(id, user.empresaId!, dto);
  }

  @Get('cajas-menores/:id/gastos')
  getGastosCajaMenor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Query('estado') estado?: string,
  ) {
    return this.tesoreria.getGastosCajaMenor(id, user.empresaId!, estado);
  }

  @Post('cajas-menores/:id/gastos')
  createGastoCajaMenor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() dto: CreateGastoCajaMenorDto,
  ) {
    return this.tesoreria.createGastoCajaMenor(id, user.empresaId!, dto);
  }

  @Delete('cajas-menores/gastos/:gastoId')
  deleteGastoCajaMenor(
    @Param('gastoId', ParseIntPipe) gastoId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.tesoreria.deleteGastoCajaMenor(gastoId, user.empresaId!);
  }

  @Post('cajas-menores/:id/reembolso')
  reembolsarCajaMenor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() dto: ReembolsoCajaMenorDto,
  ) {
    return this.tesoreria.reembolsarCajaMenor(id, user.empresaId!, dto, user.sub);
  }

  @Get('cajas-menores/:id/reembolsos')
  getReembolsosCajaMenor(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.tesoreria.getReembolsosCajaMenor(id, user.empresaId!);
  }
}

