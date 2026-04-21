import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, Res, UseGuards, Header } from '@nestjs/common'
import { Response } from 'express'
import { FacturasService } from './facturas.service'
import { CreateFacturaDto } from './dto/factura.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/facturas')
export class FacturasController {
  constructor(private svc: FacturasService) {}

  @Get()
  findAll(
    @GetUser() u: JwtPayload,
    @Query('clienteId') cId?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.svc.findAll(u.empresaId!, { clienteId: cId ? +cId : undefined, estado, desde, hasta })
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Get(':id/xml')
  @Header('Content-Type', 'application/xml')
  async getXml(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload, @Res() res: Response) {
    const xml = await this.svc.getXml(id, u.empresaId!)
    res.set('Content-Disposition', `attachment; filename="factura-${id}.xml"`)
    res.send(xml)
  }

  @Post()
  create(@Body() dto: CreateFacturaDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!, u.sub)
  }

  @Patch(':id/emitir')
  emitir(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.emitir(id, u.empresaId!, u.sub)
  }

  @Patch(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.anular(id, u.empresaId!)
  }
}
