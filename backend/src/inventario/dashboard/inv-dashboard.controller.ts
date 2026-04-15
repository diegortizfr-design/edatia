import { Controller, Get, UseGuards } from '@nestjs/common';
import { InvDashboardService } from './inv-dashboard.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/dashboard')
export class InvDashboardController {
  constructor(private readonly svc: InvDashboardService) {}

  @Get()
  getKpis(@GetUser() user: JwtPayload) {
    return this.svc.getKpis(user.empresaId!);
  }
}
