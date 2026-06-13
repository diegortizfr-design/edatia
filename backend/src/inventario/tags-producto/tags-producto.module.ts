import { Module } from '@nestjs/common';
import { TagsProductoController } from './tags-producto.controller';
import { TagsProductoService } from './tags-producto.service';

@Module({
  controllers: [TagsProductoController],
  providers: [TagsProductoService],
  exports: [TagsProductoService],
})
export class TagsProductoModule {}
