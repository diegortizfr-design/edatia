import { Module } from '@nestjs/common'
import { GeolocalizacionService } from './geolocalizacion.service'
import { GeolocalizacionController } from './geolocalizacion.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [GeolocalizacionController],
  providers: [GeolocalizacionService],
  exports: [GeolocalizacionService],
})
export class GeolocalizacionModule {}
