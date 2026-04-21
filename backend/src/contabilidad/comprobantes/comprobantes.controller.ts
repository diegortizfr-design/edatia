import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ComprobantesService, CreateComprobanteDto } from './comprobantes.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('contabilidad/comprobantes')
export class ComprobantesController {
  constructor(private svc: ComprobantesService) {}

  @Get()
  findAll(
    @GetUser() u: JwtPayload,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.svc.findAll(u.empresaId!, { tipo, desde, hasta })
  }

  @Get('libro-mayor')
  libroMayor(
    @GetUser() u: JwtPayload,
    @Query('cuentaId', ParseIntPipe) cuentaId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.svc.libroMayor(u.empresaId!, cuentaId, desde, hasta)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateComprobanteDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!, u.sub)
  }

  @Patch(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.anular(id, u.empresaId!)
  }
}
