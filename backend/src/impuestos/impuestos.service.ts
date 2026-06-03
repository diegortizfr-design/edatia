import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImpuestoDto } from './dto/create-impuesto.dto';
import { UpdateImpuestoDto } from './dto/update-impuesto.dto';

@Injectable()
export class ImpuestosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: string) {
    return this.prisma.impuesto.findMany({
      where: { empresaId },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
  }

  async create(empresaId: string, dto: CreateImpuestoDto) {
    // If this impuesto is being set as default, clear the flag from all others first
    if (dto.esDefecto) {
      await this.prisma.impuesto.updateMany({
        where: { empresaId, esDefecto: true },
        data: { esDefecto: false },
      });
    }

    return this.prisma.impuesto.upsert({
      where: {
        empresaId_nombre: {
          empresaId,
          nombre: dto.nombre,
        },
      },
      update: {
        tipo: dto.tipo,
        tarifa: dto.tarifa,
        cuentaDebito: dto.cuentaDebito ?? null,
        cuentaCredito: dto.cuentaCredito ?? null,
        aplica: dto.aplica ?? null,
        activo: dto.activo ?? true,
        esDefecto: dto.esDefecto ?? false,
        notas: dto.notas ?? null,
      },
      create: {
        empresaId,
        nombre: dto.nombre,
        tipo: dto.tipo,
        tarifa: dto.tarifa,
        cuentaDebito: dto.cuentaDebito ?? null,
        cuentaCredito: dto.cuentaCredito ?? null,
        aplica: dto.aplica ?? null,
        activo: dto.activo ?? true,
        esDefecto: dto.esDefecto ?? false,
        notas: dto.notas ?? null,
      },
    });
  }

  async update(id: string, empresaId: string, dto: UpdateImpuestoDto) {
    await this.findOneOrFail(id, empresaId);

    // If this impuesto is being set as default, clear the flag from all others first
    if (dto.esDefecto) {
      await this.prisma.impuesto.updateMany({
        where: { empresaId, esDefecto: true, id: { not: id } },
        data: { esDefecto: false },
      });
    }

    return this.prisma.impuesto.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.tarifa !== undefined && { tarifa: dto.tarifa }),
        ...(dto.cuentaDebito !== undefined && { cuentaDebito: dto.cuentaDebito }),
        ...(dto.cuentaCredito !== undefined && { cuentaCredito: dto.cuentaCredito }),
        ...(dto.aplica !== undefined && { aplica: dto.aplica }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.esDefecto !== undefined && { esDefecto: dto.esDefecto }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
      },
    });
  }

  async remove(id: string, empresaId: string) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.impuesto.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: string, empresaId: string) {
    const impuesto = await this.prisma.impuesto.findFirst({
      where: { id, empresaId },
    });

    if (!impuesto) {
      throw new NotFoundException(`Impuesto con id "${id}" no encontrado.`);
    }

    return impuesto;
  }
}
