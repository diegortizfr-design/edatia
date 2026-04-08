import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';

const EMPRESA_SELECT = {
  id: true,
  nit: true,
  nombre: true,
  direccion: true,
  telefono: true,
  createdAt: true,
  _count: { select: { usuarios: true } },
};

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.empresa.findMany({
      select: EMPRESA_SELECT,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        ...EMPRESA_SELECT,
        usuarios: {
          select: { id: true, usuario: true, nombre: true, email: true, rol: true },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    return empresa;
  }

  async create(dto: CreateEmpresaDto) {
    const existing = await this.prisma.empresa.findUnique({ where: { nit: dto.nit } });
    if (existing) {
      throw new ConflictException(`Ya existe una empresa con NIT ${dto.nit}`);
    }

    return this.prisma.empresa.create({
      data: dto,
      select: EMPRESA_SELECT,
    });
  }

  async update(id: number, dto: UpdateEmpresaDto) {
    await this.findOne(id);
    return this.prisma.empresa.update({
      where: { id },
      data: dto,
      select: EMPRESA_SELECT,
    });
  }

  async remove(id: number) {
    const empresa = await this.findOne(id);
    const usersCount = empresa._count.usuarios;

    if (usersCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: la empresa tiene ${usersCount} usuario(s) asociado(s)`,
      );
    }

    await this.prisma.empresa.delete({ where: { id } });
    return { message: `Empresa ${id} eliminada correctamente` };
  }

  async stats() {
    const [total, conUsuarios] = await Promise.all([
      this.prisma.empresa.count(),
      this.prisma.empresa.count({
        where: { usuarios: { some: {} } },
      }),
    ]);

    return { total, conUsuarios, sinUsuarios: total - conUsuarios };
  }
}
