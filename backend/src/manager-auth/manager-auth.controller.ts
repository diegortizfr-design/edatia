import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ManagerAuthService } from './manager-auth.service';
import { ManagerLoginDto } from './dto/manager-login.dto';
import { ManagerJwtAuthGuard } from './manager-jwt-auth.guard';
import { ManagerJwtPayload } from './manager-jwt.strategy';

// ── Decorador para extraer el usuario del JWT ──────────────────────────────
const GetManagerUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ManagerJwtPayload => {
    const req = ctx.switchToHttp().getRequest<Request & { user: ManagerJwtPayload }>();
    return req.user;
  },
);

// ── Nombre de la cookie httpOnly ──────────────────────────────────────────
const REFRESH_COOKIE = 'manager_refresh';

// ── Opciones de la cookie según entorno ──────────────────────────────────
function cookieOptions(isProd: boolean) {
  return {
    httpOnly: true,                          // No accesible por JS — protege contra XSS
    secure: isProd,                          // Solo HTTPS en producción
    sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/api/v1/manager/auth',            // Solo se envía en endpoints de auth
    maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 días en milisegundos
  };
}

// ── Helper: extraer IP real considerando proxies (Traefik/Nginx) ──────────
function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
}

@ApiTags('Manager Auth')
@Controller('manager/auth')
export class ManagerAuthController {
  constructor(private readonly managerAuthService: ManagerAuthService) {}

  /**
   * Login — máx 10 intentos por minuto por IP (rate limiting estricto).
   * El refresh token se establece como httpOnly cookie (no visible en JS).
   * El body de respuesta solo contiene: { access_token, colaborador }.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login — devuelve access_token; refresh_token va en cookie httpOnly' })
  async login(
    @Body() dto: ManagerLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const ctx = { ip: extractIp(req), ua: req.headers['user-agent'] };

    const { refresh_token, ...responseBody } = await this.managerAuthService.login(dto, ctx);

    // Establecer refresh token como cookie httpOnly — no accesible por JavaScript
    res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions(isProd));

    return responseBody; // { access_token, colaborador }
  }

  /**
   * Refresh — renueva el access token leyendo el refresh desde la cookie httpOnly.
   * Rota el refresh token en cada llamada (one-time use).
   * No requiere body.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'Renueva access_token usando la cookie httpOnly de refresh' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const refreshToken = (req as any).cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado');
    }

    const ctx = { ip: extractIp(req), ua: req.headers['user-agent'] };
    const { refresh_token, ...responseBody } = await this.managerAuthService.refresh(refreshToken, ctx);

    // Rotar cookie con el nuevo refresh token
    res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions(isProd));

    return responseBody; // { access_token }
  }

  /**
   * Logout — invalida el refresh token en BD y elimina la cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UseGuards(ManagerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cierra sesión e invalida el refresh token' })
  async logout(
    @GetManagerUser() user: ManagerJwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const ctx = { ip: extractIp(req), ua: req.headers['user-agent'] };

    const result = await this.managerAuthService.logout(user.sub, ctx);

    // Eliminar cookie del navegador
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
      path: '/api/v1/manager/auth',
    });

    return result;
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(ManagerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del colaborador autenticado' })
  me(@GetManagerUser() user: ManagerJwtPayload) {
    return this.managerAuthService.me(user.sub);
  }
}
