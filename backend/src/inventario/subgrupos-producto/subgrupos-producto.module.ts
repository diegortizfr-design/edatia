import { Module } from '@nestjs/common';
import { SubgruposProductoController } from './subgrupos-producto.controller';
import { SubgruposProductoService } from './subgrupos-producto.service';

@Module({
  controllers: [SubgruposProductoController],
  providers: [SubgruposProductoService],
  exports: [SubgruposProductoService],
})
export class SubgruposProductoModule {}
