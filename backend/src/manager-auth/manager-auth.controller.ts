import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { IsString, MinLength } from 'class-validator';
import { ManagerAuthService } from './manager-auth.service';
import { ManagerLoginDto } from './dto/manager-login.dto';
import { ManagerJwtAuthGuard } from './manager-jwt-auth.guard';
import { ManagerJwtPayload } from './manager-jwt.strategy';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const GetManagerUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ManagerJwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: ManagerJwtPayload }>();
    return request.user;
  },
);

class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtenido en el login' })
  @IsString()
  @MinLength(10)
  refresh_token!: string;
}

@ApiTags('Manager Auth')
@Controller('manager/auth')
export class ManagerAuthController {
  constructor(private readonly managerAuthService: ManagerAuthService) {}

  /**
   * Login — rate limiting estricto: máx 10 intentos por minuto por IP.
   * Previene ataques de fuerza bruta.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login de colaborador Edatia Manager' })
  login(@Body() dto: ManagerLoginDto) {
    return this.managerAuthService.login(dto);
  }

  /**
   * Refresh — renueva el access token usando un refresh token válido.
   * El refresh token se rota en cada uso (one-time use).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.managerAuthService.refresh(dto.refresh_token);
  }

  /**
   * Logout — invalida el refresh token en BD.
   * El access token sigue siendo válido hasta que expire (2h), pero sin
   * refresh el usuario no puede obtener uno nuevo.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UseGuards(ManagerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  logout(@GetManagerUser() user: ManagerJwtPayload) {
    return this.managerAuthService.logout(user.sub);
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(ManagerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del colaborador autenticado' })
  me(@GetManagerUser() user: ManagerJwtPayload) {
    return this.managerAuthService.me(user.sub);
  }
}
