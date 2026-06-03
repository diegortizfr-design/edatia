import { Module } from '@nestjs/common';
import { GruposProductoController } from './grupos-producto.controller';
import { GruposProductoService } from './grupos-producto.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GruposProductoController],
  providers: [GruposProductoService],
  exports: [GruposProductoService],
})
export class GruposProductoModule {}
