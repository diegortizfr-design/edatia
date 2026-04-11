import { Module } from '@nestjs/common';
import { PerfilesCargoController } from './perfiles-cargo.controller';
import { PerfilesCargoService } from './perfiles-cargo.service';
import { ManagerAuthModule } from '../manager-auth/manager-auth.module';

@Module({
  imports: [ManagerAuthModule],
  controllers: [PerfilesCargoController],
  providers: [PerfilesCargoService],
  exports: [PerfilesCargoService],
})
export class PerfilesCargoModule {}
