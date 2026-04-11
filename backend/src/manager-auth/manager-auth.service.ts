import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ManagerLoginDto } from './dto/manager-login.dto';

@Injectable()
export class ManagerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: ManagerLoginDto) {
    const colaborador = await (this.prisma as any).colaborador.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { nombre: dto.identifier },
        ],
      },
    });

    if (!colaborador) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!colaborador.activo) {
      throw new UnauthorizedException('Colaborador inactivo');
    }

    const passwordValid = await bcrypt.compare(dto.password, colaborador.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      colaborador: {
        id: colaborador.id,
        email: colaborador.email,
        nombre: colaborador.nombre,
        rol: colaborador.rol,
      },
    };
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
