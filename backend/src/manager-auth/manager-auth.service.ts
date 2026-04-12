import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ManagerLoginDto } from './dto/manager-login.dto';

// Dummy hash para timing-safe: siempre ejecutamos bcrypt aunque el usuario no exista,
// evitando user enumeration por diferencia de tiempo de respuesta.
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

// Refresh token: 7 días
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex'); // 80 chars hex
}

@Injectable()
export class ManagerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: ManagerLoginDto) {
    // Buscar solo por email (no por nombre — evita user enumeration)
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Siempre ejecutar bcrypt para igualar tiempo de respuesta (timing-safe)
    const hashToCompare = colaborador?.password ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(dto.password, hashToCompare);

    if (!colaborador || !passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!colaborador.activo) {
      throw new UnauthorizedException('Colaborador inactivo');
    }

    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
    };

    const accessToken = this.jwtService.sign(payload); // 2h (definido en manager-auth.module)

    // Generar refresh token y almacenar su hash en BD
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + REFRESH_TTL_MS);

    await (this.prisma as any).colaborador.update({
      where: { id: colaborador.id },
      data: { refreshTokenHash, refreshTokenExpiry },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      colaborador: {
        id: colaborador.id,
        email: colaborador.email,
        nombre: colaborador.nombre,
        rol: colaborador.rol,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
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
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotar refresh token (invalidar el anterior)
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newRefreshTokenExpiry = new Date(Date.now() + REFRESH_TTL_MS);

    await (this.prisma as any).colaborador.update({
      where: { id: colaborador.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        refreshTokenExpiry: newRefreshTokenExpiry,
      },
    });

    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
    };

    const newAccessToken = this.jwtService.sign(payload);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: number) {
    // Invalidar refresh token en BD
    await (this.prisma as any).colaborador.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  async me(id: number) {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        perfilCargo: true,
      },
    });

    if (!colaborador) {
      throw new UnauthorizedException('Colaborador no encontrado');
    }

    return colaborador;
  }
}
