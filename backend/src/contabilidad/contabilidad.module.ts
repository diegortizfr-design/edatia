import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'

import { PucController } from './puc/puc.controller'
import { PucService } from './puc/puc.service'
import { ComprobantesController } from './comprobantes/comprobantes.controller'
import { ComprobantesService } from './comprobantes/comprobantes.service'
import { ContReportesController } from './reportes/cont-reportes.controller'
import { ContReportesService } from './reportes/cont-reportes.service'
import { TesoreriaController } from './tesoreria/tesoreria.controller'
import { TesoreriaService } from './tesoreria/tesoreria.service'

import { AuditoriaErpModule } from '../auditoria-erp/auditoria-erp.module'

@Module({
  imports: [AuthModule, AuditoriaErpModule],
  controllers: [
    PucController,
    ComprobantesController,
    ContReportesController,
    TesoreriaController,
  ],
  providers: [
    PucService,
    ComprobantesService,
    ContReportesService,
    TesoreriaService,
  ],
  exports: [PucService, ComprobantesService, TesoreriaService],
})
export class ContabilidadModule {}
