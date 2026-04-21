import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'

import { PucController } from './puc/puc.controller'
import { PucService } from './puc/puc.service'
import { ComprobantesController } from './comprobantes/comprobantes.controller'
import { ComprobantesService } from './comprobantes/comprobantes.service'
import { ContReportesController } from './reportes/cont-reportes.controller'
import { ContReportesService } from './reportes/cont-reportes.service'

@Module({
  imports: [AuthModule],
  controllers: [PucController, ComprobantesController, ContReportesController],
  providers: [PucService, ComprobantesService, ContReportesService],
  exports: [PucService, ComprobantesService],
})
export class ContabilidadModule {}
