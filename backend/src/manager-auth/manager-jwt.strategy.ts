import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface ManagerJwtPayload {
  sub: number;
  email: string;
  nombre: string;
  rol: string;
}

@Injectable()
export class ManagerJwtStrategy extends PassportStrategy(Strategy, 'manager-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('MANAGER_JWT_SECRET'),
    });
  }

  async validate(payload: ManagerJwtPayload): Promise<ManagerJwtPayload> {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });

    if (!colaborador) {
      throw new UnauthorizedException('Token inválido o colaborador no encontrado');
    }

    if (!colaborador.activo) {
      throw new UnauthorizedException('Colaborador inactivo');
    }

    return {
      sub: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol: colaborador.rol,
    };
  }
}
