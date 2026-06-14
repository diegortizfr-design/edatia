import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBodegaDto, UpdateBodegaDto } from './dto/bodega.dto';

@Injectable()
export class BodegasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).bodega.findMany({
      where: { empresaId },
      include: {
        _count: { select: { stock: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number, empresaId: number) {
    const b = await (this.prisma as any).bodega.findFirst({
      where: { id, empresaId },
      include: {
        _count: { select: { stock: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });
    if (!b) throw new NotFoundException('Bodega no encontrada');
    return b;
  }

  async create(dto: CreateBodegaDto, empresaId: number) {
    const exists = await (this.prisma as any).bodega.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: dto.codigo } },
    });
    if (exists) throw new ConflictException(`Ya existe una bodega con código "${dto.codigo}"`);

    // Si se marca como principal, desmarcar las otras de la misma sucursal
    if (dto.esPrincipal && dto.sucursalId) {
      await (this.prisma as any).bodega.updateMany({
        where: { empresaId, sucursalId: dto.sucursalId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    return (this.prisma as any).bodega.create({ data: { ...dto, empresaId } });
  }

  async update(id: number, dto: UpdateBodegaDto, empresaId: number) {
    await this.findOne(id, empresaId);

    if (dto.codigo) {
      const conflict = await (this.prisma as any).bodega.findFirst({
        where: { empresaId, codigo: dto.codigo, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe una bodega con código "${dto.codigo}"`);
    }

    if (dto.esPrincipal) {
      // Obtener sucursalId de la bodega si no viene en el DTO
      let sId = dto.sucursalId;
      if (sId === undefined) {
        const current = await this.findOne(id, empresaId);
        sId = current.sucursalId;
      }

      if (sId) {
        await (this.prisma as any).bodega.updateMany({
          where: { empresaId, sucursalId: sId, esPrincipal: true, NOT: { id } },
          data: { esPrincipal: false },
        });
      }
    }

    return (this.prisma as any).bodega.update({ where: { id }, data: dto });
  }
}
