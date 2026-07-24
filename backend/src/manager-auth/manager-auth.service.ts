import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ManagerLoginDto } from './dto/manager-login.dto';

const DUMMY_HASH   = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
const REFRESH_TTL_MS   = 7 * 24 * 60 * 60 * 1000; // 7 días
const MAX_FALLOS       = 5;                          // intentos antes de bloquear
const BLOQUEO_TTL_MS   = 15 * 60 * 1000;            // 15 minutos de bloqueo

export interface RequestCtx {
  ip?: string;
  ua?: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

@Injectable()
export class ManagerAuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  async onModuleInit() {
    try {
      const email = 'admin@edatia.com';
      const managerPassword = process.env.MANAGER_ADMIN_PASSWORD ?? 'Manager123!';
      const hash = await bcrypt.hash(managerPassword, 12);

      let perfilAdmin = await (this.prisma as any).perfilCargo.findFirst({
        where: { nombre: 'Administrador del Sistema' },
      });

      if (!perfilAdmin) {
        perfilAdmin = await (this.prisma as any).perfilCargo.create({
          data: {
            nombre: 'Administrador del Sistema',
            descripcion: 'Acceso total al portal Manager de Edatia',
            permisos: ['*'],
          },
        });
      }

      await (this.prisma as any).colaborador.upsert({
        where: { email },
        update: {
          password: hash,
          rol: 'ADMIN',
          activo: true,
        },
        create: {
          email,
          nombre: 'Administrador Edatia',
          password: hash,
          rol: 'ADMIN',
          activo: true,
          perfilCargoId: perfilAdmin.id,
        },
      });
      console.log(`✅ [ManagerAuthService] Colaborador admin autosembrado/actualizado: ${email}`);
    } catch (err) {
      console.error('⚠️ [ManagerAuthService] Error al autosembrar admin colaborador:', err);
    }
  }

  async login(dto: ManagerLoginDto, ctx: RequestCtx = {}) {
    const email = dto.email.toLowerCase().trim();

    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { email },
    });

    // Timing-safe: siempre corremos bcrypt aunque el usuario no exista
    const hashToCompare = colaborador?.password ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(dto.password, hashToCompare);

    // ── Verificar bloqueo activo ───────────────────────────────────────────
    if (colaborador?.loginBloqueadoHasta && colaborador.loginBloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (colaborador.loginBloqueadoHasta.getTime() - Date.now()) / 60_000,
      );
      void this.auditLog.log({
        accion: 'LOGIN_FAIL',
        colaboradorId: colaborador.id,
        colaboradorEmail: colaborador.email,
        ip: ctx.ip,
        userAgent: ctx.ua,
        detalles: { motivo: 'cuenta_bloqueada', minutosRestantes },
      });
      throw new UnauthorizedException(
        `Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${minutosRestantes} minuto(s).`,
      );
    }

    // ── Credenciales inválidas ────────────────────────────────────────────
    if (!colaborador || !passwordValid) {
      // Incrementar contador solo si el email existe
      if (colaborador) {
        const nuevosFallos = (colaborador.loginFallidosConsecutivos ?? 0) + 1;
        const bloquear = nuevosFallos >= MAX_FALLOS;

        await (this.prisma as any).colaborador.update({
          where: { id: colaborador.id },
          data: {
            loginFallidosConsecutivos: bloquear ? 0 : nuevosFallos,
            loginBloqueadoHasta: bloquear
              ? new Date(Date.now() + BLOQUEO_TTL_MS)
              : null,
          },
        });

        if (bloquear) {
          void this.auditLog.log({
            accion: 'CUENTA_BLOQUEADA',
            colaboradorId: colaborador.id,
            colaboradorEmail: colaborador.email,
            ip: ctx.ip,
            userAgent: ctx.ua,
            detalles: { motivo: `${MAX_FALLOS} intentos fallidos consecutivos`, bloqueoMinutos: 15 },
          });
        }
      }

      void this.auditLog.log({
        accion: 'LOGIN_FAIL',
        colaboradorEmail: email,
        ip: ctx.ip,
        userAgent: ctx.ua,
        detalles: { motivo: 'credenciales_invalidas' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // ── Colaborador inactivo ──────────────────────────────────────────────
    if (!colaborador.activo) {
      void this.auditLog.log({
        accion: 'LOGIN_FAIL',
        colaboradorId: colaborador.id,
        colaboradorEmail: colaborador.email,
        ip: ctx.ip,
        userAgent: ctx.ua,
        detalles: { motivo: 'colaborador_inactivo' },
      });
      throw new UnauthorizedException('Colaborador inactivo');
    }

    // ── Login exitoso: generar tokens + resetear contador ────────────────
    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
      area: colaborador.area,
    };

    const accessToken    = this.jwtService.sign(payload);
    const refreshToken   = generateRefreshToken();
    const refreshTokenHash   = hashToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TTL_MS);

    await (this.prisma as any).colaborador.update({
      where: { id: colaborador.id },
      data: {
        refreshTokenHash,
        refreshTokenExpiry,
        loginFallidosConsecutivos: 0,   // resetear contador
        loginBloqueadoHasta: null,       // quitar bloqueo si lo hubiera
      },
    });

    void this.auditLog.log({
      accion: 'LOGIN_OK',
      colaboradorId: colaborador.id,
      colaboradorEmail: colaborador.email,
      ip: ctx.ip,
      userAgent: ctx.ua,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      colaborador: {
        id: colaborador.id,
        email: colaborador.email,
        nombre: colaborador.nombre,
        rol: colaborador.rol,
        area: colaborador.area,
      },
    };
  }

  async refresh(refreshToken: string, ctx: RequestCtx = {}) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado');
    }

    const tokenHash = hashToken(refreshToken);

    const colaborador = await (this.prisma as any).colaborador.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        refreshTokenExpiry: { gt: new Date() },
        activo: true,
      },
    });

    if (!colaborador) {
      void this.auditLog.log({
        accion: 'TOKEN_REFRESH_FAIL',
        ip: ctx.ip,
        userAgent: ctx.ua,
        detalles: { motivo: 'token_invalido_o_expirado' },
      });
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const newRefreshToken      = generateRefreshToken();
    const newRefreshTokenHash  = hashToken(newRefreshToken);
    const newExpiry            = new Date(Date.now() + REFRESH_TTL_MS);

    await (this.prisma as any).colaborador.update({
      where: { id: colaborador.id },
      data: { refreshTokenHash: newRefreshTokenHash, refreshTokenExpiry: newExpiry },
    });

    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
      area: colaborador.area,
    };

    void this.auditLog.log({
      accion: 'TOKEN_REFRESH',
      colaboradorId: colaborador.id,
      colaboradorEmail: colaborador.email,
      ip: ctx.ip,
      userAgent: ctx.ua,
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: number, ctx: RequestCtx = {}) {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await (this.prisma as any).colaborador.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
    });

    void this.auditLog.log({
      accion: 'LOGOUT',
      colaboradorId: userId,
      colaboradorEmail: colaborador?.email,
      ip: ctx.ip,
      userAgent: ctx.ua,
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  async me(id: number) {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id },
      select: {
        id: true, email: true, nombre: true, rol: true, area: true,
        activo: true, createdAt: true, perfilCargo: true,
      },
    });

    if (!colaborador) throw new UnauthorizedException('Colaborador no encontrado');
    return colaborador;
  }
}
