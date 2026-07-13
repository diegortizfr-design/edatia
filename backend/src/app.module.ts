import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { ManagerModule } from './manager.module';
import { InventarioModule } from './inventario/inventario.module';
import { VentasModule } from './ventas/ventas.module';
import { ContabilidadModule } from './contabilidad/contabilidad.module';
import { PosModule } from './pos/pos.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { HerramientasModule } from './herramientas/herramientas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DigitalModule } from './digital/digital.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { DocumentosConfigModule } from './documentos-config/documentos-config.module';
import { GeolocalizacionModule } from './geolocalizacion/geolocalizacion.module';

// ── Módulos migrados desde localStorage ──────────────────────────────────────
import { ImpuestosModule } from './impuestos/impuestos.module';
import { MonedasModule } from './monedas/monedas.module';
import { CajasBancosModule } from './cajas-bancos/cajas-bancos.module';
import { RolesModule } from './roles/roles.module';
import { VendedoresModule } from './vendedores/vendedores.module';
import { GruposProductoModule } from './grupos-producto/grupos-producto.module';
import { AuditoriaErpModule } from './auditoria-erp/auditoria-erp.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { CierrePeriodoModule } from './cierre-periodo/cierre-periodo.module';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: máx 120 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        name:    'global',
        ttl:     60_000,  // ventana de 1 minuto
        limit:   120,     // máx 120 requests por IP por ventana
      },
    ]),
    PrismaModule,
    AuditLogModule,   // global — AuditLogService disponible en toda la app
    AuthModule,
    UsersModule,

    ManagerModule,
    InventarioModule,
    VentasModule,
    ContabilidadModule,
    PosModule,
    ConfiguracionModule,
    HerramientasModule,
    DashboardModule,
    DigitalModule,
    SucursalesModule,
    DocumentosConfigModule,
    GeolocalizacionModule,

    // ── Módulos migrados desde localStorage ──────────────────────────────────
    ImpuestosModule,
    MonedasModule,
    CajasBancosModule,
    RolesModule,
    VendedoresModule,
    GruposProductoModule,
    AuditoriaErpModule,
    NotificacionesModule,
    CierrePeriodoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica ThrottlerGuard globalmente a toda la API
    {
      provide:  APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Aplica AuditoriaInterceptor globalmente a toda la API
    {
      provide:  APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
})
export class AppModule {}
