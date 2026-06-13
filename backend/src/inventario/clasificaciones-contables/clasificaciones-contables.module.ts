import { Module } from '@nestjs/common';
import { ClasificacionesContablesController } from './clasificaciones-contables.controller';
import { ClasificacionesContablesService } from './clasificaciones-contables.service';

@Module({
  controllers: [ClasificacionesContablesController],
  providers: [ClasificacionesContablesService],
  exports: [ClasificacionesContablesService],
})
export class ClasificacionesContablesModule {}
