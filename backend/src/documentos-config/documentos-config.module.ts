import { Module } from '@nestjs/common'
import { DocumentosConfigController } from './documentos-config.controller'
import { DocumentosConfigService } from './documentos-config.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [DocumentosConfigController],
  providers: [DocumentosConfigService],
  exports: [DocumentosConfigService],
})
export class DocumentosConfigModule {}
