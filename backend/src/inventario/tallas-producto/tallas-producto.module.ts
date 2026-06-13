import { Module } from '@nestjs/common';
import { TallasProductoController } from './tallas-producto.controller';
import { TallasProductoService } from './tallas-producto.service';

@Module({
  controllers: [TallasProductoController],
  providers: [TallasProductoService],
  exports: [TallasProductoService],
})
export class TallasProductoModule {}
