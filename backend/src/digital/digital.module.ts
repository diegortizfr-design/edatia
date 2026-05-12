import { Module } from '@nestjs/common';
import { DigitalService } from './digital.service';
import { DigitalController } from './digital.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DigitalController],
  providers: [DigitalService],
  exports: [DigitalService],
})
export class DigitalModule {}
