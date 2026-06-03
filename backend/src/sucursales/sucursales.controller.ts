import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { SucursalesService } from './sucursales.service'
import { CreateSucursalDto, UpdateSucursalDto, DeleteSucursalDto } from './dto/sucursal.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('configuracion/sucursales')
export class SucursalesController {
  constructor(private readonly svc: SucursalesService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload) {
    return this.svc.findAll(u.empresaId!)
  }

  @Get('eliminadas')
  findDeleted(@GetUser() u: JwtPayload) {
    return this.svc.findDeleted(u.empresaId!)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateSucursalDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSucursalDto,
    @GetUser() u: JwtPayload,
  ) {
    return this.svc.update(id, dto, u.empresaId!)
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteSucursalDto,
    @GetUser() u: JwtPayload,
  ) {
    return this.svc.softDelete(id, u.empresaId!, dto.codigoAutorizacion, u.sub)
  }
}
