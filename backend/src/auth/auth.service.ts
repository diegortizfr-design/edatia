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
    // 1. Limpiar NIT (Remover guión, dígito de verificación, puntos y espacios)
    // Ej: "1143875756-3" -> "1143875756"
    const rawNit = dto.nit.trim();
    const nitLimpio = rawNit.split('-')[0].replace(/\D/g, '') || rawNit;
    
    const includeQuery = {
      clienteManager: {
        include: {
          planBase: { include: { modulos: { include: { modulo: true } } } },
          modulosActivos: { include: { modulo: true } },
        },
      },
    };

    const empresa = await this.prisma.empresa.findFirst({
      where: {
        OR: [
          { nit: rawNit },
          { nit: nitLimpio },
          { nit: { startsWith: nitLimpio } },
        ],
      },
      include: includeQuery,
    });

    if (!empresa) {
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, detalles: { nit: rawNit, nitLimpio, motivo: 'empresa_no_existe' } });
      throw new UnauthorizedException('No se encontró ninguna empresa registrada con este NIT.');
    }

    // 2. Buscar el usuario dentro de ESTA empresa
    const identifierClean = dto.identifier.trim();
    const isEmail = identifierClean.includes('@');

    const user = await this.prisma.user.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          { usuario: identifierClean },
          ...(isEmail ? [{ email: identifierClean }] : []),
        ],
      },
    });

    if (!user) {
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, detalles: { identifier: identifierClean, motivo: 'usuario_no_existe_en_empresa' } });
      throw new UnauthorizedException('El usuario no existe en esta empresa.');
    }

    // 3. Validaciones de seguridad (Bloqueo temporal por intentos)
    if (user.loginBloqueadoHasta && user.loginBloqueadoHasta > new Date()) {
      const min = Math.max(1, Math.ceil((user.loginBloqueadoHasta.getTime() - Date.now()) / 60000));
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email ?? user.usuario, detalles: { motivo: 'bloqueado', minutos: min } });
      throw new UnauthorizedException(`Cuenta bloqueada temporalmente por seguridad. Podrás intentar nuevamente en ${min} minuto(s).`);
    }

    // 4. Validación de usuario activo
    if (!user.activo) {
      void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email ?? user.usuario, detalles: { motivo: 'inactivo' } });
      throw new UnauthorizedException('Este usuario se encuentra inactivo. Contacta al administrador de tu empresa.');
    }

    // 5. Validar contraseña
    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      const fallos = (user.loginFallidosConsecutivos ?? 0) + 1;
      const bloquear = fallos >= MAX_FALLOS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginFallidosConsecutivos: bloquear ? 0 : fallos,
          loginBloqueadoHasta: bloquear ? new Date(Date.now() + BLOQUEO_TTL) : null,
        },
      });

      if (bloquear) {
        void this.auditLog.log({ accion: 'CUENTA_BLOQUEADA', ip: ctx.ip, userAgent: ctx.ua, colaboradorEmail: user.email ?? user.usuario, detalles: { motivo: 'fuerza_bruta' } });
        throw new UnauthorizedException('Has superado los 5 intentos permitidos. Tu acceso ha sido bloqueado temporalmente por 15 minutos.');
      } else {
        const intentosRestantes = MAX_FALLOS - fallos;
        void this.auditLog.log({ accion: 'LOGIN_FAIL', ip: ctx.ip, userAgent: ctx.ua, detalles: { identifier: identifierClean, motivo: 'password_invalido', intentosRestantes } });
        throw new UnauthorizedException(`Contraseña incorrecta. Te quedan ${intentosRestantes} intento(s) antes del bloqueo temporal de 15 minutos.`);
      }
    }

    // 6. Extraer módulos permitidos
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

    // 7. Login exitoso — resetear contador de fallos
    const token = this.signToken(user.id, user.email, user.usuario, user.rol, modulosArray);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginFallidosConsecutivos: 0, loginBloqueadoHasta: null },
    });

    void this.auditLog.log({
      accion: 'LOGIN_OK',
      colaboradorId: user.id,
      colaboradorEmail: user.email ?? user.usuario,
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

  private signToken(id: number, email: string | null | undefined, usuario: string, rol: string, modulosPermitidos: string[] = []) {
    return this.jwtService.sign({ sub: id, email: email ?? undefined, usuario, rol, modulosPermitidos });
  }
}
