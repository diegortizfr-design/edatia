import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HerramientasPrismaService } from './herramientas-prisma.service';

@Global()
@Module({
  providers: [PrismaService, HerramientasPrismaService],
  exports: [PrismaService, HerramientasPrismaService],
})
export class PrismaModule {}
