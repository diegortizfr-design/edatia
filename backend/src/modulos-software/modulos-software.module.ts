import { Module } from '@nestjs/common';
import { ModulosSoftwareController } from './modulos-software.controller';
import { ModulosSoftwareService } from './modulos-software.service';
import { ManagerAuthModule } from '../manager-auth/manager-auth.module';

@Module({
  imports: [ManagerAuthModule],
  controllers: [ModulosSoftwareController],
  providers: [ModulosSoftwareService],
  exports: [ModulosSoftwareService],
})
export class ModulosSoftwareModule {}
