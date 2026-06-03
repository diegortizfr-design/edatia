import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditoriaErpLogData {
  accion: string;
  modulo: string;
  entidad?: string;
  entidadId?: string;
  descripcion?: string;
  valorAntes?: Record<string, unknown>;
  valorDespues?: Record<string, unknown>;
  usuarioId?: number;
  usuarioNombre?: string;
  ip?: string;
}

export interface AuditoriaErpFilters {
  modulo?: string;
  accion?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditoriaErpService {
  private readonly logger = new Logger(AuditoriaErpService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada de auditoría de forma fire-and-forget.
   * Nunca lanza excepciones para no interrumpir el flujo principal.
   */
  async log(empresaId: number, data: AuditoriaErpLogData): Promise<void> {
    try {
      await this.prisma.auditLogERP.create({
        data: {
          empresaId,
          accion: data.accion,
          modulo: data.modulo,
          entidad: data.entidad,
          entidadId: data.entidadId,
          descripcion: data.descripcion,
          valorAntes: data.valorAntes as any,
          valorDespues: data.valorDespues as any,
          usuarioId: data.usuarioId,
          usuarioNombre: data.usuarioNombre,
          ip: data.ip,
        },
      });
    } catch (err) {
      this.logger.warn(
        `[AuditoriaERP] No se pudo escribir el registro: ${String(err)}`,
      );
    }
  }

  /**
   * Retorna logs paginados con filtros opcionales, siempre acotados a la empresa del JWT.
   */
  async findAll(
    empresaId: number,
    filters: AuditoriaErpFilters = {},
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    const { modulo, accion, from, to } = filters;
    const page  = Math.max(1, Number(filters.page)  || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = { empresaId };

    if (modulo) where['modulo'] = { contains: modulo, mode: 'insensitive' };
    if (accion) where['accion'] = { contains: accion, mode: 'insensitive' };

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt['gte'] = new Date(from);
      if (to)   createdAt['lte'] = new Date(`${to}T23:59:59.999Z`);
      where['createdAt'] = createdAt;
    }

    const [total, data] = await Promise.all([
      this.prisma.auditLogERP.count({ where }),
      this.prisma.auditLogERP.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}
