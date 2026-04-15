import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  accion: string;
  entidad?: string;
  entidadId?: number;
  colaboradorId?: number;
  colaboradorEmail?: string;
  ip?: string;
  userAgent?: string;
  detalles?: Record<string, unknown>;
}

export interface AuditLogFilters {
  accion?: string;
  colaboradorEmail?: string;
  ip?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget: nunca lanza excepciones ni bloquea el flujo principal. */
  async log(data: AuditLogData): Promise<void> {
    try {
      await (this.prisma as any).auditLog.create({ data });
    } catch (err) {
      this.logger.warn(`[AuditLog] No se pudo escribir el registro: ${String(err)}`);
    }
  }

  /** Lista paginada con filtros opcionales — usada por el panel de monitoreo. */
  async findAll(filters: AuditLogFilters = {}) {
    const { accion, colaboradorEmail, ip, dateFrom, dateTo } = filters;
    const page  = Math.max(1, filters.page  ?? 1);
    const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (accion)           where['accion']           = accion;
    if (colaboradorEmail) where['colaboradorEmail']  = { contains: colaboradorEmail, mode: 'insensitive' };
    if (ip)               where['ip']               = { contains: ip };

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt['gte'] = new Date(dateFrom);
      if (dateTo)   createdAt['lte'] = new Date(dateTo + 'T23:59:59.999Z');
      where['createdAt'] = createdAt;
    }

    const [total, data] = await Promise.all([
      (this.prisma as any).auditLog.count({ where }),
      (this.prisma as any).auditLog.findMany({
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
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  /** Stats rápidas para el header del panel. */
  async stats() {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    const [totalHoy, fallosUltimaHora, cuentasBloqueadas] = await Promise.all([
      (this.prisma as any).auditLog.count({
        where: { createdAt: { gte: hoy } },
      }),
      (this.prisma as any).auditLog.count({
        where: { accion: 'LOGIN_FAIL', createdAt: { gte: haceUnaHora } },
      }),
      (this.prisma as any).colaborador.count({
        where: { loginBloqueadoHasta: { gt: new Date() } },
      }),
    ]);

    return { totalHoy, fallosUltimaHora, cuentasBloqueadas };
  }
}
