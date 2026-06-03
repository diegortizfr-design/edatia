import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMonedaDto } from './dto/create-moneda.dto';
import { UpdateMonedaDto } from './dto/update-moneda.dto';

@Injectable()
export class MonedasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: string) {
    return this.prisma.moneda.findMany({
      where: { empresaId },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async create(empresaId: string, dto: CreateMonedaDto) {
    // Check for duplicate codigo within the same empresa
    const existing = await this.prisma.moneda.findFirst({
      where: { empresaId, codigo: dto.codigo },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una moneda con el código "${dto.codigo}" en esta empresa.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // If this new moneda is principal, clear the flag on all others first
      if (dto.esPrincipal) {
        await tx.moneda.updateMany({
          where: { empresaId, esPrincipal: true },
          data: { esPrincipal: false },
        });
      }

      return tx.moneda.create({
        data: {
          ...dto,
          tasaCambio: dto.tasaCambio ?? 1,
          esPrincipal: dto.esPrincipal ?? false,
          activo: dto.activo ?? true,
          empresaId,
        },
      });
    });
  }

  async update(id: string, empresaId: string, dto: UpdateMonedaDto) {
    await this.findOneOrFail(id, empresaId);

    // Check for duplicate codigo if it's being changed
    if (dto.codigo) {
      const duplicate = await this.prisma.moneda.findFirst({
        where: { empresaId, codigo: dto.codigo, NOT: { id } },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe una moneda con el código "${dto.codigo}" en esta empresa.`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // If setting this moneda as principal, clear the flag on all others first
      if (dto.esPrincipal) {
        await tx.moneda.updateMany({
          where: { empresaId, esPrincipal: true, NOT: { id } },
          data: { esPrincipal: false },
        });
      }

      return tx.moneda.update({
        where: { id },
        data: dto,
      });
    });
  }

  async remove(id: string, empresaId: string) {
    const moneda = await this.findOneOrFail(id, empresaId);

    if (moneda.esPrincipal) {
      throw new ConflictException(
        'No se puede eliminar la moneda principal de la empresa.',
      );
    }

    await this.prisma.moneda.delete({ where: { id } });
    return { message: 'Moneda eliminada correctamente.', id };
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  private async findOneOrFail(id: string, empresaId: string) {
    const moneda = await this.prisma.moneda.findFirst({
      where: { id, empresaId },
    });

    if (!moneda) {
      throw new NotFoundException(`Moneda con id "${id}" no encontrada.`);
    }

    return moneda;
  }
}
