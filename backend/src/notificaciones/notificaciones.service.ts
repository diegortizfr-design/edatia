import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all notifications for the given empresa.
   * If usuarioId is provided, returns notifications targeted to that user
   * OR notifications with no specific user (usuarioId IS NULL).
   * Results are sorted: unread first, then by createdAt descending, limited to 100.
   */
  async findAll(empresaId: number, usuarioId?: number) {
    const where: any = { empresaId };

    if (usuarioId !== undefined) {
      where.OR = [{ usuarioId }, { usuarioId: null }];
    }

    return this.prisma.notificacion.findMany({
      where,
      orderBy: [{ leida: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  /**
   * Creates a new notification scoped to the given empresa.
   */
  async create(empresaId: number, dto: CreateNotificacionDto) {
    return this.prisma.notificacion.create({
      data: {
        empresaId,
        tipo: dto.tipo,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
        modulo: dto.modulo ?? null,
        usuarioId: dto.usuarioId ?? null,
        accionUrl: dto.accionUrl ?? null,
        leida: false,
      },
    });
  }

  /**
   * Marks a single notification as read (leida=true, leidaAt=now).
   * Validates that the notification belongs to the given empresa.
   */
  async marcarLeida(id: number, empresaId: number) {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificación con id ${id} no encontrada`);
    }

    if (notificacion.empresaId !== empresaId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta notificación',
      );
    }

    return this.prisma.notificacion.update({
      where: { id },
      data: {
        leida: true,
        leidaAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications for the given empresa as read.
   */
  async marcarTodasLeidas(empresaId: number) {
    const result = await this.prisma.notificacion.updateMany({
      where: {
        empresaId,
        leida: false,
      },
      data: {
        leida: true,
        leidaAt: new Date(),
      },
    });

    return {
      message: `${result.count} notificación(es) marcada(s) como leída(s)`,
      count: result.count,
    };
  }

  /**
   * Deletes a notification by id, ensuring it belongs to the given empresa.
   */
  async remove(id: number, empresaId: number) {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificación con id ${id} no encontrada`);
    }

    if (notificacion.empresaId !== empresaId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta notificación',
      );
    }

    await this.prisma.notificacion.delete({ where: { id } });

    return { message: `Notificación ${id} eliminada correctamente` };
  }
}
