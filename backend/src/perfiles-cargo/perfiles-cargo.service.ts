import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilCargoDto, UpdatePerfilCargoDto } from './dto/perfil-cargo.dto';

@Injectable()
export class PerfilesCargoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).perfilCargo.findMany({
      include: {
        _count: { select: { colaboradores: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const perfil = await (this.prisma as any).perfilCargo.findUnique({
      where: { id },
      include: {
        _count: { select: { colaboradores: true } },
      },
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de cargo #${id} no encontrado`);
    }

    return perfil;
  }

  async create(dto: CreatePerfilCargoDto) {
    const existing = await (this.prisma as any).perfilCargo.findFirst({
      where: { nombre: dto.nombre },
    });

    if (existing) {
      throw new ConflictException('Ya existe un perfil de cargo con ese nombre');
    }

    return (this.prisma as any).perfilCargo.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        permisos: dto.permisos ?? [],
      },
    });
  }

  async update(id: number, dto: UpdatePerfilCargoDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.permisos !== undefined) data.permisos = dto.permisos;

    return (this.prisma as any).perfilCargo.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const perfil = await (this.prisma as any).perfilCargo.findUnique({
      where: { id },
      include: {
        _count: { select: { colaboradores: true } },
      },
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de cargo #${id} no encontrado`);
    }

    if (perfil._count.colaboradores > 0) {
      throw new ConflictException(
        `No se puede eliminar el perfil: tiene ${perfil._count.colaboradores} colaborador(es) asignado(s)`,
      );
    }

    return (this.prisma as any).perfilCargo.delete({ where: { id } });
  }
}
