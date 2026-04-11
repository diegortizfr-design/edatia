import { Module } from '@nestjs/common';
import { PlanesBaseController } from './planes-base.controller';
import { PlanesBaseService } from './planes-base.service';
import { ManagerAuthModule } from '../manager-auth/manager-auth.module';

@Module({
  imports: [ManagerAuthModule],
  controllers: [PlanesBaseController],
  providers: [PlanesBaseService],
  exports: [PlanesBaseService],
})
export class PlanesBaseModule {}
