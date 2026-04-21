import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { CotizacionesService } from './cotizaciones.service'
import { CreateCotizacionDto, UpdateCotizacionDto } from './dto/cotizacion.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/cotizaciones')
export class CotizacionesController {
  constructor(private svc: CotizacionesService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('clienteId') cId?: string, @Query('estado') estado?: string) {
    return this.svc.findAll(u.empresaId!, {
      clienteId: cId ? +cId : undefined,
      estado,
    })
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateCotizacionDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!, u.sub)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCotizacionDto, @GetUser() u: JwtPayload) {
    return this.svc.update(id, dto, u.empresaId!)
  }

  @Patch(':id/estado')
  estado(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: string, @GetUser() u: JwtPayload) {
    return this.svc.cambiarEstado(id, estado, u.empresaId!)
  }
}
