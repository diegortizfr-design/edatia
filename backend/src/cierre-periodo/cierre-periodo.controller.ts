import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CierrePeriodoService } from './cierre-periodo.service';
import { CreateCierreDto } from './dto/create-cierre.dto';
import { CerrarPeriodoDto } from './dto/cerrar-periodo.dto';

@UseGuards(JwtAuthGuard)
@Controller('cierre-periodo')
export class CierrePeriodoController {
  constructor(private readonly cierrePeriodoService: CierrePeriodoService) {}

  /**
   * GET /cierre-periodo
   * Returns all period records for the authenticated empresa, newest first.
   */
  @Get()
  findAll(@Req() req: any) {
    const empresaId: string = req.user.empresaId;
    return this.cierrePeriodoService.findAll(empresaId);
  }

  /**
   * GET /cierre-periodo/activo
   * Returns the current open (ABIERTO) period for the authenticated empresa.
   */
  @Get('activo')
  findActivo(@Req() req: any) {
    const empresaId: string = req.user.empresaId;
    return this.cierrePeriodoService.findActivo(empresaId);
  }

  /**
   * POST /cierre-periodo
   * Creates / opens a new period for the authenticated empresa.
   */
  @Post()
  create(@Req() req: any, @Body() dto: CreateCierreDto) {
    const empresaId: string = req.user.empresaId;
    const usuarioId: string = req.user.sub ?? req.user.id;
    return this.cierrePeriodoService.create(empresaId, dto, usuarioId);
  }

  /**
   * PATCH /cierre-periodo/:id/cerrar
   * Closes the specified period (sets estado=CERRADO, fechaCierre=now).
   */
  @Patch(':id/cerrar')
  cerrar(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CerrarPeriodoDto,
  ) {
    const empresaId: string = req.user.empresaId;
    const usuarioId: string = req.user.sub ?? req.user.id;
    return this.cierrePeriodoService.cerrar(
      id,
      empresaId,
      usuarioId,
      dto.observaciones,
    );
  }
}
