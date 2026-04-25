import { Module } from '@nestjs/common'
import { ConfiguracionController } from './configuracion.controller'
import { ConfiguracionService } from './configuracion.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
})
export class ConfiguracionModule {}
