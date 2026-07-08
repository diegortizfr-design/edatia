import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCajaBancoDto } from './dto/create-caja-banco.dto';
import { UpdateCajaBancoDto } from './dto/update-caja-banco.dto';

@Injectable()
export class CajasBancosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(empresaId: number) {
    const list = await this.prisma.cajaBanco.findMany({
      where: { empresaId },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });

    return Promise.all(
      list.map(async (cb) => {
        let saldoContable = 0;
        if (cb.cuentaPUC) {
          const cuenta = await this.prisma.cuentaPUC.findFirst({
            where: { empresaId, codigo: cb.cuentaPUC, activo: true },
            select: { id: true },
          });

          if (cuenta) {
            const aggregates = await this.prisma.comprobanteLinea.aggregate({
              where: {
                cuentaId: cuenta.id,
                comprobante: { empresaId, estado: { not: 'ANULADO' } },
              },
              _sum: { debito: true, credito: true },
            });

            const debito = Number(aggregates._sum.debito ?? 0);
            const credito = Number(aggregates._sum.credito ?? 0);
            saldoContable = debito - credito;
          }
        }

        return {
          ...cb,
          saldoContable: Number(cb.saldoInicial) + saldoContable,
        };
      })
    );
  }

  async create(empresaId: number, dto: CreateCajaBancoDto) {
    return this.prisma.cajaBanco.create({
      data: {
        ...dto,
        empresaId,
      },
    });
  }

  async update(id: number, empresaId: number, dto: UpdateCajaBancoDto) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.cajaBanco.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOneOrFail(id, empresaId);

    return this.prisma.cajaBanco.delete({
      where: { id },
    });
  }

  private async findOneOrFail(id: number, empresaId: number) {
    const record = await this.prisma.cajaBanco.findFirst({
      where: { id, empresaId },
    });

    if (!record) {
      throw new NotFoundException(`CajaBanco with id ${id} not found`);
    }

    return record;
  }
}
