import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number, q?: string) {
    const where: any = { empresaId };
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { nombreComercial: { contains: q, mode: 'insensitive' } },
        { numeroDocumento: { contains: q } },
      ];
    }
    return (this.prisma as any).proveedor.findMany({
      where,
      include: { _count: { select: { ordenesCompra: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const p = await (this.prisma as any).proveedor.findFirst({
      where: { id, empresaId },
      include: {
        ordenesCompra: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, numero: true, estado: true, total: true, fechaEmision: true },
        },
      },
    });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  async create(dto: CreateProveedorDto, empresaId: number) {
    return (this.prisma as any).proveedor.create({ data: { ...dto, empresaId } });
  }

  async update(id: number, dto: UpdateProveedorDto, empresaId: number) {
    await this.findOne(id, empresaId);
    return (this.prisma as any).proveedor.update({ where: { id }, data: dto });
  }
}
