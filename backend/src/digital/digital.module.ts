import { Module } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { DigitalController } from './digital.controller';
import { DigitalPublicController } from './digital-public.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DigitalController, DigitalPublicController],
  providers: [DigitalService],
  exports: [DigitalService],
})
export class DigitalModule {}
