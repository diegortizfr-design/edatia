import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { PucService } from './puc.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('contabilidad/puc')
export class PucController {
  constructor(private svc: PucService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('nivel') nivel?: string, @Query('tipo') tipo?: string) {
    return this.svc.findAll(u.empresaId!, nivel ? +nivel : undefined, tipo)
  }

  @Get('arbol')
  arbol(@GetUser() u: JwtPayload) {
    return this.svc.arbol(u.empresaId!)
  }

  @Get('auxiliares')
  auxiliares(@GetUser() u: JwtPayload, @Query('q') q?: string) {
    return this.svc.cuentasAuxiliares(u.empresaId!, q)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() data: any, @GetUser() u: JwtPayload) {
    return this.svc.create(data, u.empresaId!)
  }

  @Post('seed')
  seed(@GetUser() u: JwtPayload) {
    return this.svc.seed(u.empresaId!)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @GetUser() u: JwtPayload) {
    return this.svc.update(id, data, u.empresaId!)
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.toggle(id, u.empresaId!)
  }
}
