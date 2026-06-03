import { Module } from '@nestjs/common';
import { ImpuestosController } from './impuestos.controller';
import { ImpuestosService } from './impuestos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImpuestosController],
  providers: [ImpuestosService],
  exports: [ImpuestosService],
})
export class ImpuestosModule {}
