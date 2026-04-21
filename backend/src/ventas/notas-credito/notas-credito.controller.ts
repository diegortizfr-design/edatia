import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { NotasCreditoService } from './notas-credito.service'
import { CreateNotaCreditoDto } from './dto/nota-credito.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/notas-credito')
export class NotasCreditoController {
  constructor(private svc: NotasCreditoService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('facturaId') fId?: string) {
    return this.svc.findAll(u.empresaId!, fId ? +fId : undefined)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateNotaCreditoDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!, u.sub)
  }

  @Patch(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.anular(id, u.empresaId!)
  }
}
