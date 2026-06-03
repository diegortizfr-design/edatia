import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all active roles for the given company, ordered by name.
   */
  async findAll(empresaId: number) {
    return this.prisma.rol.findMany({
      where: {
        empresaId,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  /**
   * Creates a new role scoped to the given company.
   */
  async create(empresaId: number, dto: CreateRolDto) {
    return this.prisma.rol.create({
      data: {
        ...dto,
        empresaId,
        activo: dto.activo ?? true,
        esAdmin: dto.esAdmin ?? false,
      },
    });
  }

  /**
   * Updates an existing role, ensuring it belongs to the given company.
   */
  async update(id: number, empresaId: number, dto: UpdateRolDto) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.rol.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Soft-deletes a role by setting activo=false.
   * Ensures the role belongs to the given company before updating.
   */
  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.rol.update({
      where: { id },
      data: { activo: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetches a role by id and empresaId, throwing NotFoundException if not found.
   */
  private async findOneOrFail(id: number, empresaId: number) {
    const rol = await this.prisma.rol.findFirst({
      where: { id, empresaId },
    });

    if (!rol) {
      throw new NotFoundException(
        `Rol con id ${id} no encontrado para esta empresa.`,
      );
    }

    return rol;
  }
}
