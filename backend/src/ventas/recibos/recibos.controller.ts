import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { RecibosService, CreateReciboDto } from './recibos.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/recibos')
export class RecibosController {
  constructor(private svc: RecibosService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('clienteId') cId?: string) {
    return this.svc.findAll(u.empresaId!, cId ? +cId : undefined)
  }

  @Get('facturas-pendientes')
  facturasPendientes(@GetUser() u: JwtPayload, @Query('clienteId', ParseIntPipe) clienteId: number) {
    return this.svc.facturasPendientes(u.empresaId!, clienteId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateReciboDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!, u.sub)
  }

  @Patch(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.anular(id, u.empresaId!)
  }
}
