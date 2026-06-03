import { Module } from '@nestjs/common';
import { AuditoriaErpController } from './auditoria-erp.controller';
import { AuditoriaErpService } from './auditoria-erp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditoriaErpController],
  providers: [AuditoriaErpService],
  exports: [AuditoriaErpService],
})
export class AuditoriaErpModule {}
