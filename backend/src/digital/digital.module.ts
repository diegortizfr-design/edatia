import { Module } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { DigitalController } from './digital.controller';
import { DigitalPublicController } from './digital-public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MercadoPagoService } from './mercadopago.service';
import { AnaliticaService } from './analitica.service';

@Module({
  imports: [PrismaModule],
  controllers: [DigitalController, DigitalPublicController],
  providers: [DigitalService, MercadoPagoService, AnaliticaService],
  exports: [DigitalService],
})
export class DigitalModule {}
