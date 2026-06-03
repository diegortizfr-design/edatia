import { Module } from '@nestjs/common';
import { CajasBancosController } from './cajas-bancos.controller';
import { CajasBancosService } from './cajas-bancos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CajasBancosController],
  providers: [CajasBancosService],
  exports: [CajasBancosService],
})
export class CajasBancosModule {}
