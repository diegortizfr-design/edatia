import { Module } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { DigitalController } from './digital.controller';
import { DigitalPublicController } from './digital-public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MercadoPagoService } from './mercadopago.service';
import { AnaliticaService } from './analitica.service';
import { IaProductosController } from './ia-productos/ia-productos.controller';
import { IaProductosService } from './ia-productos/ia-productos.service';
import { GeminiService } from './ia-productos/gemini.service';
import { ImagenEstandarService } from './ia-productos/imagen-estandar.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    DigitalController,
    DigitalPublicController,
    IaProductosController,
  ],
  providers: [
    DigitalService,
    MercadoPagoService,
    AnaliticaService,
    IaProductosService,
    GeminiService,
    ImagenEstandarService,
  ],
  exports: [DigitalService, IaProductosService],
})
export class DigitalModule {}
