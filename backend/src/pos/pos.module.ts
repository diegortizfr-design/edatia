import { Module } from '@nestjs/common'
import { PosController } from './pos.controller'
import { PosService } from './pos.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ContabilidadModule } from '../contabilidad/contabilidad.module'

import { InventarioModule } from '../inventario/inventario.module'

@Module({
  imports: [PrismaModule, ContabilidadModule, InventarioModule],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
