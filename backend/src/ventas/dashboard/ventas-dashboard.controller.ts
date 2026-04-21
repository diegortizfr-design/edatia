import { Controller, Get, UseGuards } from '@nestjs/common'
import { VentasDashboardService } from './ventas-dashboard.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('ventas/dashboard')
export class VentasDashboardController {
  constructor(private svc: VentasDashboardService) {}

  @Get()
  kpis(@GetUser() u: JwtPayload) {
    return this.svc.getKpis(u.empresaId!)
  }
}
