import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, CalificarTicketDto, CreateMensajeDto } from './dto/ticket.dto';

const INCLUDE_FULL = {
  cliente:      { select: { id: true, nombre: true, nit: true, email: true } },
  asesorSac:    { select: { id: true, nombre: true, email: true, rol: true } },
  desarrollador:{ select: { id: true, nombre: true, email: true, rol: true } },
  mensajes:     { orderBy: { createdAt: 'asc' as const } },
};

const INCLUDE_LIST = {
  cliente:      { select: { id: true, nombre: true, nit: true } },
  asesorSac:    { select: { id: true, nombre: true } },
  desarrollador:{ select: { id: true, nombre: true } },
  _count:       { select: { mensajes: true } },
};

function generarNumero(id: number): string {
  const year = new Date().getFullYear();
  return `TKT-${year}-${String(id).padStart(5, '0')}`;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    estado?: string;
    prioridad?: string;
    asesorSacId?: number;
    desarrolladorId?: number;
    clienteId?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters?.estado)          where['estado']          = filters.estado;
    if (filters?.prioridad)       where['prioridad']       = filters.prioridad;
    if (filters?.asesorSacId)     where['asesorSacId']     = filters.asesorSacId;
    if (filters?.desarrolladorId) where['desarrolladorId'] = filters.desarrolladorId;
    if (filters?.clienteId)       where['clienteId']       = filters.clienteId;

    return (this.prisma as any).ticket.findMany({
      where,
      include: INCLUDE_LIST,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const ticket = await (this.prisma as any).ticket.findUnique({
      where: { id },
      include: INCLUDE_FULL,
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} no encontrado`);
    return ticket;
  }

  async create(dto: CreateTicketDto, autorId: number, autorNombre: string) {
    // Crear el ticket primero para obtener ID
    const ticket = await (this.prisma as any).ticket.create({
      data: {
        numero:      'TKT-TEMP',
        origen:      dto.origen ?? 'TICKET_DIRECTO',
        clienteId:   dto.clienteId,
        asunto:      dto.asunto,
        descripcion: dto.descripcion,
        prioridad:   dto.prioridad ?? 'MEDIA',
        categoria:   dto.categoria,
        estado:      'NUEVO',
        asesorSacId: dto.asesorSacId,
      },
    });

    // Actualizar con el número correcto
    const updated = await (this.prisma as any).ticket.update({
      where: { id: ticket.id },
      data:  { numero: generarNumero(ticket.id) },
      include: INCLUDE_FULL,
    });

    // Agregar el primer mensaje (descripción del cliente/asesor)
    await (this.prisma as any).ticketMensaje.create({
      data: {
        ticketId:  ticket.id,
        autor:     'SAC',
        autorId,
        nombre:    autorNombre,
        contenido: dto.descripcion,
        interno:   false,
      },
    });

    return updated;
  }

  async update(id: number, dto: UpdateTicketDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};

    if (dto.estado !== undefined) {
      data['estado'] = dto.estado;
      if (dto.estado === 'RESUELTO') {
        const resueltoAt = new Date();
        const vence = new Date(resueltoAt);
        vence.setDate(vence.getDate() + 3);
        data['resueltoAt']   = resueltoAt;
        data['venceCalifAt'] = vence;
      }
    }
    if (dto.prioridad       !== undefined) data['prioridad']       = dto.prioridad;
    if (dto.categoria       !== undefined) data['categoria']       = dto.categoria;
    if (dto.asesorSacId     !== undefined) data['asesorSacId']     = dto.asesorSacId;
    if (dto.desarrolladorId !== undefined) data['desarrolladorId'] = dto.desarrolladorId;
    if (dto.asunto          !== undefined) data['asunto']          = dto.asunto;
    if (dto.descripcion     !== undefined) data['descripcion']     = dto.descripcion;

    return (this.prisma as any).ticket.update({
      where: { id },
      data,
      include: INCLUDE_FULL,
    });
  }

  async escalarSAC(id: number, asesorSacId: number) {
    await this.findOne(id);
    return (this.prisma as any).ticket.update({
      where: { id },
      data:  { estado: 'SAC', asesorSacId },
      include: INCLUDE_LIST,
    });
  }

  async escalarDesarrollo(id: number, desarrolladorId: number, autorId: number, autorNombre: string, nota?: string) {
    await this.findOne(id);
    const updated = await (this.prisma as any).ticket.update({
      where: { id },
      data:  { estado: 'DESARROLLO', desarrolladorId },
      include: INCLUDE_FULL,
    });
    if (nota) {
      await (this.prisma as any).ticketMensaje.create({
        data: { ticketId: id, autor: 'SAC', autorId, nombre: autorNombre, contenido: nota, interno: true },
      });
    }
    return updated;
  }

  async devolverSAC(id: number, autorId: number, autorNombre: string, respuesta: string) {
    await this.findOne(id);
    await (this.prisma as any).ticketMensaje.create({
      data: { ticketId: id, autor: 'DESARROLLO', autorId, nombre: autorNombre, contenido: respuesta, interno: false },
    });
    return (this.prisma as any).ticket.update({
      where: { id },
      data:  { estado: 'DEVUELTO' },
      include: INCLUDE_FULL,
    });
  }

  async resolver(id: number, autorId: number, autorNombre: string, mensaje?: string) {
    const ticket = await this.findOne(id);
    const resueltoAt = new Date();
    const venceCalifAt = new Date(resueltoAt);
    venceCalifAt.setDate(venceCalifAt.getDate() + 3);

    if (mensaje) {
      await (this.prisma as any).ticketMensaje.create({
        data: { ticketId: id, autor: 'SAC', autorId, nombre: autorNombre, contenido: mensaje, interno: false },
      });
    }
    return (this.prisma as any).ticket.update({
      where: { id },
      data:  { estado: 'RESUELTO', resueltoAt, venceCalifAt },
      include: INCLUDE_FULL,
    });
  }

  async calificar(id: number, dto: CalificarTicketDto) {
    const ticket = await this.findOne(id);
    if (ticket.estado !== 'RESUELTO') {
      throw new BadRequestException('Solo se pueden calificar tickets resueltos');
    }
    if (dto.calificacion < 1 || dto.calificacion > 5) {
      throw new BadRequestException('La calificación debe ser entre 1 y 5');
    }
    return (this.prisma as any).ticket.update({
      where: { id },
      data:  {
        calificacion:     dto.calificacion,
        calificadoAt:     new Date(),
        calificacionAuto: false,
        estado:           'CALIFICADO',
      },
      include: INCLUDE_LIST,
    });
  }

  async addMensaje(ticketId: number, dto: CreateMensajeDto, autorId: number, autorNombre: string, autorRol: string) {
    await this.findOne(ticketId);
    const autor = ['ADMIN', 'COMERCIAL'].includes(autorRol) ? 'SAC'
      : autorRol === 'COORDINACION' ? 'SAC'
      : autorRol === 'OPERACION'    ? 'DESARROLLO'
      : 'SAC';

    return (this.prisma as any).ticketMensaje.create({
      data: { ticketId, autor, autorId, nombre: autorNombre, contenido: dto.contenido, interno: dto.interno ?? false },
    });
  }

  async stats() {
    const total = await (this.prisma as any).ticket.count();
    const porEstadoRaw = await (this.prisma as any).ticket.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });
    const porEstado: Record<string, number> = {
      NUEVO: 0, SAC: 0, DESARROLLO: 0, DEVUELTO: 0, RESUELTO: 0, CALIFICADO: 0,
    };
    for (const item of porEstadoRaw) {
      porEstado[item.estado] = item._count.estado;
    }

    const porPrioridadRaw = await (this.prisma as any).ticket.groupBy({
      by: ['prioridad'],
      _count: { prioridad: true },
    });
    const porPrioridad: Record<string, number> = { BAJA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0 };
    for (const item of porPrioridadRaw) {
      porPrioridad[item.prioridad] = item._count.prioridad;
    }

    const calificaciones = await (this.prisma as any).ticket.aggregate({
      where: { calificacion: { not: null } },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });

    return {
      total,
      porEstado,
      porPrioridad,
      calificacionPromedio: calificaciones._avg.calificacion
        ? Math.round(calificaciones._avg.calificacion * 10) / 10
        : null,
      totalCalificados: calificaciones._count.calificacion,
    };
  }
}
