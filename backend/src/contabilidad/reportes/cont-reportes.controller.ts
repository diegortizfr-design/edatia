import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common'
import { ContReportesService } from './cont-reportes.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('contabilidad/reportes')
export class ContReportesController {
  constructor(private svc: ContReportesService) {}

  @Get('balance-comprobacion')
  balanceComprobacion(
    @GetUser() u: JwtPayload,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.svc.balanceComprobacion(u.empresaId!, desde, hasta)
  }

  @Get('estado-resultados')
  estadoResultados(
    @GetUser() u: JwtPayload,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.svc.estadoResultados(u.empresaId!, desde, hasta)
  }

  @Get('balance-general')
  balanceGeneral(@GetUser() u: JwtPayload, @Query('hasta') hasta: string) {
    return this.svc.balanceGeneral(u.empresaId!, hasta)
  }

  @Get('periodos')
  periodos(@GetUser() u: JwtPayload) {
    return this.svc.periodos(u.empresaId!)
  }

  @Post('periodos/cerrar')
  cerrarPeriodo(
    @GetUser() u: JwtPayload,
    @Body('anio') anio: number,
    @Body('mes') mes: number,
  ) {
    return this.svc.cerrarPeriodo(u.empresaId!, anio, mes)
  }
}
