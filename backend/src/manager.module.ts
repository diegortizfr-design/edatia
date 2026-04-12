import { Module } from '@nestjs/common';
import { ManagerAuthModule } from './manager-auth/manager-auth.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { PerfilesCargoModule } from './perfiles-cargo/perfiles-cargo.module';
import { ModulosSoftwareModule } from './modulos-software/modulos-software.module';
import { ClientesManagerModule } from './clientes-manager/clientes-manager.module';
import { PlanesBaseModule } from './planes-base/planes-base.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ManagerAuthModule,
    ColaboradoresModule,
    PerfilesCargoModule,
    ModulosSoftwareModule,
    ClientesManagerModule,
    PlanesBaseModule,
    TicketsModule,
  ],
})
export class ManagerModule {}
