import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ConfiguracionService } from './configuracion.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser } from '../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly svc: ConfiguracionService) {}

  @Get('empresa')
  getEmpresa(@GetUser() u: any) {
    return this.svc.getEmpresa(u.empresaId)
  }

  @Patch('empresa')
  updateEmpresa(@GetUser() u: any, @Body() dto: any) {
    return this.svc.updateEmpresa(u.empresaId, dto)
  }
}
