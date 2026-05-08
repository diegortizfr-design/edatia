import { Module } from '@nestjs/common';
import { ConfigDianController } from './config-dian.controller';
import { ConfigDianService } from './config-dian.service';

@Module({
  controllers: [ConfigDianController],
  providers: [ConfigDianService],
  exports: [ConfigDianService],
})
export class ConfigDianModule {}
