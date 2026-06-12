import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';

@Injectable()
export class VendedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    const vends = await this.prisma.tercero.findMany({
      where: {
        empresaId,
        esVendedor: true,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Mapear campos de Tercero al formato esperado por la pantalla de Vendedores
    return vends.map(v => ({
      id: v.id,
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono,
      documento: v.numeroDocumento,
      comisionPct: v.comisionPct,
      activo: v.activo,
      notas: v.notas,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  async create(empresaId: number, dto: CreateVendedorDto) {
    let tercero = dto.documento ? await this.prisma.tercero.findUnique({
      where: {
        empresaId_tipoDocumento_numeroDocumento: {
          empresaId,
          tipoDocumento: 'CC',
          numeroDocumento: dto.documento,
        }
      }
    }) : null;

    if (tercero) {
      const updated = await this.prisma.tercero.update({
        where: { id: tercero.id },
        data: {
          esVendedor: true,
          comisionPct: dto.comisionPct ?? 0,
          activo: dto.activo ?? true,
          email: dto.email || tercero.email,
          telefono: dto.telefono || tercero.telefono,
          notas: dto.notas || tercero.notas,
        }
      });
      return {
        id: updated.id,
        nombre: updated.nombre,
        email: updated.email,
        telefono: updated.telefono,
        documento: updated.numeroDocumento,
        comisionPct: updated.comisionPct,
        activo: updated.activo,
        notas: updated.notas,
      };
    }

    const created = await this.prisma.tercero.create({
      data: {
        nombre: dto.nombre,
        numeroDocumento: dto.documento || `VEND_${Date.now()}`,
        tipoDocumento: 'CC',
        tipoPersona: 'NATURAL',
        email: dto.email,
        telefono: dto.telefono,
        comisionPct: dto.comisionPct ?? 0,
        activo: dto.activo ?? true,
        esVendedor: true,
        notas: dto.notas,
        empresaId,
      }
    });

    return {
      id: created.id,
      nombre: created.nombre,
      email: created.email,
      telefono: created.telefono,
      documento: created.numeroDocumento,
      comisionPct: created.comisionPct,
      activo: created.activo,
      notas: created.notas,
    };
  }

  async update(id: number, empresaId: number, dto: UpdateVendedorDto) {
    await this.findOneOrFail(id, empresaId);

    const updated = await this.prisma.tercero.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        email: dto.email,
        telefono: dto.telefono,
        numeroDocumento: dto.documento,
        comisionPct: dto.comisionPct,
        activo: dto.activo,
        notas: dto.notas,
      },
    });

    return {
      id: updated.id,
      nombre: updated.nombre,
      email: updated.email,
      telefono: updated.telefono,
      documento: updated.numeroDocumento,
      comisionPct: updated.comisionPct,
      activo: updated.activo,
      notas: updated.notas,
    };
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);

    const updated = await this.prisma.tercero.update({
      where: { id },
      data: { activo: false },
    });

    return {
      id: updated.id,
      nombre: updated.nombre,
      activo: updated.activo,
    };
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const v = await this.prisma.tercero.findFirst({
      where: { id, empresaId, esVendedor: true },
    });

    if (!v) {
      throw new NotFoundException(`Vendedor con id ${id} no encontrado`);
    }

    return v;
  }
}
