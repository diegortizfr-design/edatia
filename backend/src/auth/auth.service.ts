import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DUMMY_HASH   = '$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
const MAX_FALLOS     = 5;
const BLOQUEO_TTL    = 15 * 60 * 1000; // 15 min

export interface RequestCtx {
  ip?: string;
  ua?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { usuario: dto.usuario }],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'El email ya está registrado'
          : 'El nombre de usuario ya está en uso',
      );
    }

    const hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        usuario: dto.usuario,
        nombre: dto.nombre,
        password: hash,
        empresaId: dto.empresaId ?? null,
      },
      select: {
        id: true,
        email: true,
        usuario: true,
        nombre: true,
        rol: true,
        empresaId: true,
        createdAt: true,
      },
    });

    const token = this.signToken(user.id, user.email, user.usuario, user.rol);

    return { user, access_token: token };
  }

  async login(dto: LoginDto, ctx: RequestCtx = {}) {
    // 1. Verificar que la empresa con ese NIT existe
    const nitLimpio = dto.nit.trim();
    
    const includeQuery = {
      clienteManager: {
        include: {
          planBase: { include: { modulos: { include: { modulo: true } } } },
          modulosActivos: { include: { modulo: true } },
        },
      },
    };

    let empresa = await this.prisma.empresa.findUnique({
      where: { nit: nitLimpio },
      include: includeQuery,
    });

    if (!empresa) {
      empresa = await this.prisma.empresa.findFirst({
        where: { nit: { startsWith: nitLimpio } },
        include: includeQuery,
      });
    }

    if (!empresa) {
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, detalles: { nit: nitLimpio, motivo: 'empresa_no_existe' } });
      throw new UnauthorizedException('La empresa con este NIT no existe');
    }

    // 2. Buscar el usuario
    const user = await this.prisma.user.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [{ email: dto.identifier }, { usuario: dto.identifier }],
      },
    });

    // 3. Validaciones de seguridad (Bloqueo y Estado)
    if (user?.loginBloqueadoHasta && user.loginBloqueadoHasta > new Date()) {
      const min = Math.ceil((user.loginBloqueadoHasta.getTime() - Date.now()) / 60000);
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email, detalles: { motivo: 'bloqueado', minutos: min } });
      throw new UnauthorizedException(`Cuenta bloqueateda. Intenta en ${min} min.`);
    }

    if (user && !user.activo) {
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email, detalles: { motivo: 'inactivo' } });
      throw new UnauthorizedException('Usuario inactivo');
    }

    // 4. Validar contraseña
    const hashToCompare = user?.password ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !passwordValid) {
      if (user) {
        const fallos = (user.loginFallidosConsecutivos ?? 0) + 1;
        const bloquear = fallos >= MAX_FALLOS;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            loginFallidosConsecutivos: bloquear ? 0 : fallos,
            loginBloqueadoHasta: bloquear ? new Date(Date.now() + BLOQUEO_TTL) : null,
          }
        });
        if (bloquear) {
          void this.auditLog.log({ accion: 'CUENTA_BLOQUEADA', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email, detalles: { motivo: 'fuerza_bruta' } });
        }
      }
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, detalles: { identifier: dto.identifier, motivo: 'credenciales_invalidas' } });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. Extraer módulos permitidos
    const modulosPermitidos = new Set<string>();
    
    // Core (siempre disponibles)
    modulosPermitidos.add('configuracion');
    
    if (empresa.clienteManager) {
      const cm = empresa.clienteManager;
      
      // Módulos incluidos en el plan base
      if (cm.planBase && cm.planBase.modulos) {
        cm.planBase.modulos.forEach((pm: any) => {
          modulosPermitidos.add(pm.modulo.slug);
        });
      }
      
      // Módulos adicionales adquiridos o negociados a la carta
      if (cm.modulosActivos) {
        cm.modulosActivos.forEach((ma: any) => {
          if (ma.activo) {
            modulosPermitidos.add(ma.modulo.slug);
          }
        });
      }
    }

    const modulosArray = Array.from(modulosPermitidos);

    // 6. Login exitoso
    const token = this.signToken(user.id, user.email, user.usuario, user.rol, modulosArray);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginFallidosConsecutivos: 0, loginBloqueadoHasta: null }
    });

    void this.auditLog.log({
      accion: 'LOGIN_OK',
      colaboradorId: user.id,
      colaboradorEmail: user.email,
      ip: ctx.ip,
      userAgent: ctx.ua,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        empresaId: user.empresaId,
        empresa: { id: empresa.id, nombre: empresa.nombre, nit: empresa.nit },
        modulosPermitidos: modulosArray,
      },
      access_token: token,
    };
  }

  async me(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        usuario: true,
        nombre: true,
        rol: true,
        empresaId: true,
        createdAt: true,
        empresa: {
          select: { id: true, nombre: true, nit: true },
        },
        profile: {
          select: { id: true, bio: true },
        },
      },
    });
  }

  private signToken(id: number, email: string, usuario: string, rol: string, modulosPermitidos: string[] = []) {
    return this.jwtService.sign({ sub: id, email, usuario, rol, modulosPermitidos });
  }
}
