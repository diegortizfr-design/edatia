import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuloSoftwareDto, UpdateModuloSoftwareDto } from './dto/modulo-software.dto';

@Injectable()
export class ModulosSoftwareService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const modulos = await (this.prisma as any).moduloSoftware.findMany({
      include: {
        _count: { select: { planesCliente: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    return modulos.map((m: any) => ({
      ...m,
      precioAnual: Number(m.precioAnual),
    }));
  }

  async findOne(id: number) {
    const modulo = await (this.prisma as any).moduloSoftware.findUnique({
      where: { id },
      include: {
        _count: { select: { planesCliente: true } },
      },
    });

    if (!modulo) {
      throw new NotFoundException(`Módulo #${id} no encontrado`);
    }

    return { ...modulo, precioAnual: Number(modulo.precioAnual) };
  }

  async create(dto: CreateModuloSoftwareDto) {
    const existing = await (this.prisma as any).moduloSoftware.findFirst({
      where: { OR: [{ nombre: dto.nombre }, { slug: dto.slug }] },
    });

    if (existing) {
      throw new ConflictException('Ya existe un módulo con ese nombre o slug');
    }

    const modulo = await (this.prisma as any).moduloSoftware.create({
      data: {
        nombre: dto.nombre,
        slug: dto.slug,
        descripcion: dto.descripcion,
        icono: dto.icono,
        precioAnual: dto.precioAnual,
      },
    });

    return { ...modulo, precioAnual: Number(modulo.precioAnual) };
  }

  async update(id: number, dto: UpdateModuloSoftwareDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.icono !== undefined) data.icono = dto.icono;
    if (dto.precioAnual !== undefined) data.precioAnual = dto.precioAnual;

    const modulo = await (this.prisma as any).moduloSoftware.update({
      where: { id },
      data,
    });

    return { ...modulo, precioAnual: Number(modulo.precioAnual) };
  }

  async toggleActivo(id: number) {
    const modulo = await (this.prisma as any).moduloSoftware.findUnique({
      where: { id },
      select: { id: true, activo: true },
    });

    if (!modulo) {
      throw new NotFoundException(`Módulo #${id} no encontrado`);
    }

    const updated = await (this.prisma as any).moduloSoftware.update({
      where: { id },
      data: { activo: !modulo.activo },
    });

    return { ...updated, precioAnual: Number(updated.precioAnual) };
  }
}
