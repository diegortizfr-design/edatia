import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCierreDto } from './dto/create-cierre.dto';

@Injectable()
export class CierrePeriodoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all period-closing records for the empresa, ordered newest first.
   */
  async findAll(empresaId: number) {
    return this.prisma.periodoCierreERP.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns the latest open (ABIERTO) period for the empresa.
   * Throws NotFoundException if no open period exists.
   */
  async findActivo(empresaId: number) {
    const periodo = await this.prisma.periodoCierreERP.findFirst({
      where: {
        empresaId,
        estado: 'ABIERTO',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!periodo) {
      throw new NotFoundException(
        'No hay un periodo activo (ABIERTO) para esta empresa.',
      );
    }

    return periodo;
  }

  /**
   * Creates / opens a new period.
   * Prevents duplicate open periods of the same tipo+periodo combination.
   */
  async create(empresaId: number, dto: CreateCierreDto, usuarioId: number) {
    // Check there is no already-open record with the same tipo + periodo
    const existing = await this.prisma.periodoCierreERP.findFirst({
      where: {
        empresaId,
        tipo: dto.tipo,
        periodo: dto.periodo,
        estado: 'ABIERTO',
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un periodo abierto de tipo "${dto.tipo}" para "${dto.periodo}".`,
      );
    }

    return this.prisma.periodoCierreERP.create({
      data: {
        empresaId,
        tipo: dto.tipo,
        periodo: dto.periodo,
        observaciones: dto.observaciones ?? null,
        estado: 'ABIERTO',
      },
    });
  }

  /**
   * Closes a period by setting estado=CERRADO, fechaCierre=now, and
   * optionally recording closing observaciones.
   */
  async cerrar(
    id: number,
    empresaId: number,
    usuarioId: number,
    observaciones?: string,
  ) {
    // Verify the record belongs to this empresa
    const periodo = await this.prisma.periodoCierreERP.findFirst({
      where: { id, empresaId },
    });

    if (!periodo) {
      throw new NotFoundException(
        `Periodo con id "${id}" no encontrado para esta empresa.`,
      );
    }

    if (periodo.estado === 'CERRADO') {
      throw new BadRequestException(
        `El periodo ya se encuentra cerrado.`,
      );
    }

    return this.prisma.periodoCierreERP.update({
      where: { id },
      data: {
        estado: 'CERRADO',
        fechaCierre: new Date(),
        cerradoPor: usuarioId,
        ...(observaciones !== undefined && { observaciones }),
      },
    });
  }
}

