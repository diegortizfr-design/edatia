import { Module } from '@nestjs/common'
import { ConfiguracionController } from './configuracion.controller'
import { ConfiguracionService } from './configuracion.service'
import { ConfiguracionArchivoController } from './configuracion-archivo.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracionController, ConfiguracionArchivoController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
