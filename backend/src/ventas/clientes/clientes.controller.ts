import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ClientesService } from './clientes.service'
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/clientes')
export class ClientesController {
  constructor(private svc: ClientesService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('q') q?: string) {
    return this.svc.findAll(u.empresaId!, q)
  }

  @Get('saldos')
  saldos(@GetUser() u: JwtPayload) {
    return this.svc.saldos(u.empresaId!)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateClienteDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto, @GetUser() u: JwtPayload) {
    return this.svc.update(id, dto, u.empresaId!)
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.toggle(id, u.empresaId!)
  }
}
