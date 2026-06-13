import { Module } from '@nestjs/common';
import { ColoresProductoController } from './colores-producto.controller';
import { ColoresProductoService } from './colores-producto.service';

@Module({
  controllers: [ColoresProductoController],
  providers: [ColoresProductoService],
  exports: [ColoresProductoService],
})
export class ColoresProductoModule {}
