import {
  Controller, Get, Post, Patch, Param, Body,
  ParseIntPipe, UseGuards, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto, UpdateTicketDto, CalificarTicketDto, CreateMensajeDto,
} from './dto/ticket.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Tickets Soporte')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas generales de tickets' })
  stats() {
    return this.ticketsService.stats();
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets con filtros opcionales' })
  findAll(
    @Query('estado')          estado?: string,
    @Query('prioridad')       prioridad?: string,
    @Query('asesorSacId')     asesorSacId?: string,
    @Query('desarrolladorId') desarrolladorId?: string,
    @Query('clienteId')       clienteId?: string,
  ) {
    return this.ticketsService.findAll({
      estado,
      prioridad,
      asesorSacId:     asesorSacId     ? Number(asesorSacId)     : undefined,
      desarrolladorId: desarrolladorId ? Number(desarrolladorId) : undefined,
      clienteId:       clienteId       ? Number(clienteId)       : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID con mensajes' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ManagerRoles('ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION')
  @ApiOperation({ summary: 'Crear nuevo ticket' })
  create(@Body() dto: CreateTicketDto, @Request() req: any) {
    return this.ticketsService.create(dto, req.user.id, req.user.nombre);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN', 'COORDINACION')
  @ApiOperation({ summary: 'Actualizar ticket (admin/coordinación)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Patch(':id/escalar-sac')
  @ManagerRoles('ADMIN', 'COORDINACION')
  @ApiOperation({ summary: 'Asignar/reasignar asesor SAC' })
  escalarSAC(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { asesorSacId: number },
  ) {
    return this.ticketsService.escalarSAC(id, body.asesorSacId);
  }

  @Patch(':id/escalar-desarrollo')
  @ManagerRoles('ADMIN', 'COORDINACION', 'OPERACION')
  @ApiOperation({ summary: 'Escalar ticket a Desarrollo' })
  escalarDesarrollo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { desarrolladorId: number; nota?: string },
    @Request() req: any,
  ) {
    return this.ticketsService.escalarDesarrollo(
      id, body.desarrolladorId, req.user.id, req.user.nombre, body.nota,
    );
  }

  @Patch(':id/devolver-sac')
  @ManagerRoles('ADMIN', 'COORDINACION', 'OPERACION')
  @ApiOperation({ summary: 'Desarrollo devuelve ticket a SAC con respuesta' })
  devolverSAC(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { respuesta: string },
    @Request() req: any,
  ) {
    return this.ticketsService.devolverSAC(id, req.user.id, req.user.nombre, body.respuesta);
  }

  @Patch(':id/resolver')
  @ManagerRoles('ADMIN', 'COORDINACION', 'OPERACION')
  @ApiOperation({ summary: 'Marcar ticket como resuelto' })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { mensaje?: string },
    @Request() req: any,
  ) {
    return this.ticketsService.resolver(id, req.user.id, req.user.nombre, body.mensaje);
  }

  @Patch(':id/calificar')
  @ApiOperation({ summary: 'Calificar ticket (cliente o sistema)' })
  calificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CalificarTicketDto,
  ) {
    return this.ticketsService.calificar(id, dto);
  }

  @Post(':id/mensajes')
  @ManagerRoles('ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION')
  @ApiOperation({ summary: 'Agregar mensaje a un ticket' })
  addMensaje(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMensajeDto,
    @Request() req: any,
  ) {
    return this.ticketsService.addMensaje(id, dto, req.user.id, req.user.nombre, req.user.rol);
  }
}
