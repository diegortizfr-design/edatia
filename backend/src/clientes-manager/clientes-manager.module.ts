import { Module } from '@nestjs/common';
import { ClientesManagerController } from './clientes-manager.controller';
import { ClientesPublicController } from './clientes-public.controller';
import { ClientesManagerService } from './clientes-manager.service';
import { ManagerAuthModule } from '../manager-auth/manager-auth.module';

@Module({
  imports: [ManagerAuthModule],
  controllers: [ClientesManagerController, ClientesPublicController],
  providers: [ClientesManagerService],
  exports: [ClientesManagerService],
})
export class ClientesManagerModule {}

