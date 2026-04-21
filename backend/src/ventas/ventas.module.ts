import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'

import { ClientesController } from './clientes/clientes.controller'
import { ClientesService } from './clientes/clientes.service'

import { ConfigDianController } from './config-dian/config-dian.controller'
import { ConfigDianService } from './config-dian/config-dian.service'

import { CotizacionesController } from './cotizaciones/cotizaciones.controller'
import { CotizacionesService } from './cotizaciones/cotizaciones.service'

import { FacturasController } from './facturas/facturas.controller'
import { FacturasService } from './facturas/facturas.service'
import { CufeService } from './facturas/cufe.service'
import { UblService } from './facturas/ubl.service'

import { NotasCreditoController } from './notas-credito/notas-credito.controller'
import { NotasCreditoService } from './notas-credito/notas-credito.service'

import { RecibosController } from './recibos/recibos.controller'
import { RecibosService } from './recibos/recibos.service'

import { VentasDashboardController } from './dashboard/ventas-dashboard.controller'
import { VentasDashboardService } from './dashboard/ventas-dashboard.service'

@Module({
  imports: [AuthModule],
  controllers: [
    ClientesController,
    ConfigDianController,
    CotizacionesController,
    FacturasController,
    NotasCreditoController,
    RecibosController,
    VentasDashboardController,
  ],
  providers: [
    ClientesService,
    ConfigDianService,
    CotizacionesService,
    FacturasService,
    CufeService,
    UblService,
    NotasCreditoService,
    RecibosService,
    VentasDashboardService,
  ],
  exports: [ClientesService, FacturasService],
})
export class VentasModule {}
