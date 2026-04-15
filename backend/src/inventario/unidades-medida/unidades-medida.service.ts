import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnidadMedidaDto, UpdateUnidadMedidaDto } from './dto/unidad-medida.dto';

@Injectable()
export class UnidadesMedidaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    return (this.prisma as any).unidadMedida.findMany({
      where: { empresaId },
      include: { _count: { select: { productos: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const u = await (this.prisma as any).unidadMedida.findFirst({ where: { id, empresaId } });
    if (!u) throw new NotFoundException('Unidad de medida no encontrada');
    return u;
  }

  async create(dto: CreateUnidadMedidaDto, empresaId: number) {
    const exists = await (this.prisma as any).unidadMedida.findUnique({
      where: { empresaId_abreviatura: { empresaId, abreviatura: dto.abreviatura } },
    });
    if (exists) throw new ConflictException(`Ya existe una unidad con abreviatura "${dto.abreviatura}"`);
    return (this.prisma as any).unidadMedida.create({ data: { ...dto, empresaId } });
  }

  async update(id: number, dto: UpdateUnidadMedidaDto, empresaId: number) {
    await this.findOne(id, empresaId);
    if (dto.abreviatura) {
      const conflict = await (this.prisma as any).unidadMedida.findFirst({
        where: { empresaId, abreviatura: dto.abreviatura, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Ya existe una unidad con abreviatura "${dto.abreviatura}"`);
    }
    return (this.prisma as any).unidadMedida.update({ where: { id }, data: dto });
  }
}
