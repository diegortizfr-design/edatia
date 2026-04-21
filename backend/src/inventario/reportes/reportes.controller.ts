import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/reportes')
export class ReportesController {
  constructor(private readonly svc: ReportesService) {}

  @Get('stock')
  getStock(@GetUser() user: JwtPayload) {
    return this.svc.getReporteStock(user.empresaId!);
  }

  @Get('movimientos')
  getMovimientos(
    @GetUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('tipo') tipo?: string,
    @Query('bodegaId') bodegaId?: string,
  ) {
    return this.svc.getReporteMovimientos(user.empresaId!, {
      desde,
      hasta,
      tipo,
      bodegaId: bodegaId ? +bodegaId : undefined,
    });
  }

  @Get('abc')
  getAbc(@GetUser() user: JwtPayload) {
    return this.svc.getReporteAbc(user.empresaId!);
  }
}
