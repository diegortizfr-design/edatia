import { Controller, Get, Post, Put, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ConfigDianService } from './config-dian.service'
import { UpsertConfigDianDto, CreateResolucionDto } from './dto/config-dian.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/config-dian')
export class ConfigDianController {
  constructor(private svc: ConfigDianService) {}

  @Get()
  get(@GetUser() u: JwtPayload) {
    return this.svc.getConfig(u.empresaId!)
  }

  @Put()
  upsert(@Body() dto: UpsertConfigDianDto, @GetUser() u: JwtPayload) {
    return this.svc.upsert(dto, u.empresaId!)
  }

  @Post('resoluciones')
  addResolucion(@Body() dto: CreateResolucionDto, @GetUser() u: JwtPayload) {
    return this.svc.addResolucion(dto, u.empresaId!)
  }

  @Patch('resoluciones/:id/toggle')
  toggleResolucion(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleResolucion(id)
  }
}
