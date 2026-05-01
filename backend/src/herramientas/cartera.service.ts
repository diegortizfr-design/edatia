import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { GuardarCarteraDto, RecuperarCarteraDto } from './dto/cartera.dto';

@Injectable()
export class CarteraService {
  constructor(private prisma: PrismaService) {}

  async guardar(dto: GuardarCarteraDto) {
    const { correo, password, datosJson } = dto;
    let cartera = await (this.prisma as any).herramientaCartera.findUnique({
      where: { correo },
    });

    if (cartera) {
      // Validar password
      const isMatch = await bcrypt.compare(password, cartera.password);
      if (!isMatch) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      // Validar 3 meses
      const tresMeses = 3 * 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - cartera.createdAt.getTime() > tresMeses) {
        throw new BadRequestException('El periodo de prueba de 3 meses ha expirado');
      }

      return (this.prisma as any).herramientaCartera.update({
        where: { id: cartera.id },
        data: { datosJson },
      });
    } else {
      // Crear nueva
      const hashedPassword = await bcrypt.hash(password, 10);
      return (this.prisma as any).herramientaCartera.create({
        data: {
          correo,
          password: hashedPassword,
          datosJson,
        },
      });
    }
  }

  async recuperar(dto: RecuperarCarteraDto) {
    const { correo, password } = dto;
    const cartera = await (this.prisma as any).herramientaCartera.findUnique({
      where: { correo },
    });

    if (!cartera) {
      throw new UnauthorizedException('No se encontraron datos para este correo');
    }

    const isMatch = await bcrypt.compare(password, cartera.password);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const tresMeses = 3 * 30 * 24 * 60 * 60 * 1000;
    const diasRestantes = Math.max(0, Math.ceil((tresMeses - (Date.now() - cartera.createdAt.getTime())) / (1000 * 60 * 60 * 24)));

    if (diasRestantes === 0) {
      throw new BadRequestException('El periodo de prueba de 3 meses ha expirado');
    }

    return {
      datosJson: cartera.datosJson,
      diasRestantes,
    };
  }
}
