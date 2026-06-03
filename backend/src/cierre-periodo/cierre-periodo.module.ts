import { Module } from '@nestjs/common';
import { CierrePeriodoController } from './cierre-periodo.controller';
import { CierrePeriodoService } from './cierre-periodo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CierrePeriodoController],
  providers: [CierrePeriodoService],
  exports: [CierrePeriodoService],
})
export class CierrePeriodoModule {}
