import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ManagerModule } from './manager.module';

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
    AuthModule,
    UsersModule,
    EmpresasModule,
    ManagerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica ThrottlerGuard globalmente a toda la API
    {
      provide:  APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
