import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManagerAuthController } from './manager-auth.controller';
import { ManagerAuthService } from './manager-auth.service';
import { ManagerJwtStrategy } from './manager-jwt.strategy';
import { ManagerRolesGuard } from './roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'manager-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('MANAGER_JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('MANAGER_JWT_EXPIRES_IN', '8h'),
        },
      }),
    }),
  ],
  controllers: [ManagerAuthController],
  providers: [ManagerAuthService, ManagerJwtStrategy, ManagerRolesGuard],
  exports: [JwtModule, PassportModule, ManagerRolesGuard],
})
export class ManagerAuthModule {}
