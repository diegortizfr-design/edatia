import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

  async login(dto: LoginDto) {
    // 1. Verificar que la empresa con ese NIT existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { nit: dto.nit.trim() },
    });

    if (!empresa) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Buscar el usuario dentro de esa empresa
    const user = await this.prisma.user.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [{ email: dto.identifier }, { usuario: dto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Validar contraseña
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.signToken(user.id, user.email, user.usuario, user.rol);

    return {
      user: {
        id: user.id,
        email: user.email,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        empresaId: user.empresaId,
        empresa: { id: empresa.id, nombre: empresa.nombre, nit: empresa.nit },
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

  private signToken(id: number, email: string, usuario: string, rol: string) {
    return this.jwtService.sign({ sub: id, email, usuario, rol });
  }
}
