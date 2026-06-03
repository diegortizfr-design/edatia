import { Module } from '@nestjs/common';
import { MonedasController } from './monedas.controller';
import { MonedasService } from './monedas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonedasController],
  providers: [MonedasService],
  exports: [MonedasService],
})
export class MonedasModule {}
