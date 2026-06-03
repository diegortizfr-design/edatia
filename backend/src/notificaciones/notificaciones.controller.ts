import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  /**
   * GET /notificaciones
   * Returns up to 100 notifications for this empresa.
   * Optionally filter by ?usuarioId=X to also include global notifications (usuarioId IS NULL).
   */
  @Get()
  findAll(
    @Req() req: any,
    @Query('usuarioId') usuarioId?: string,
  ) {
    const empresaId: number = req.user.empresaId;
    const parsedUsuarioId = usuarioId ? parseInt(usuarioId, 10) : undefined;
    return this.notificacionesService.findAll(empresaId, parsedUsuarioId);
  }

  /**
   * POST /notificaciones
   * Creates a new notification (intended for admin/internal usage).
   */
  @Post()
  create(@Req() req: any, @Body() dto: CreateNotificacionDto) {
    const empresaId: number = req.user.empresaId;
    return this.notificacionesService.create(empresaId, dto);
  }

  /**
   * PATCH /notificaciones/leer-todas
   * Marks ALL unread notifications for this empresa as read.
   * Must be declared BEFORE /:id/leer to avoid route collision.
   */
  @Patch('leer-todas')
  @HttpCode(HttpStatus.OK)
  marcarTodasLeidas(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.notificacionesService.marcarTodasLeidas(empresaId);
  }

  /**
   * PATCH /notificaciones/:id/leer
   * Marks a single notification as read (leida=true, leidaAt=now).
   */
  @Patch(':id/leer')
  marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const empresaId: number = req.user.empresaId;
    return this.notificacionesService.marcarLeida(id, empresaId);
  }

  /**
   * DELETE /notificaciones/:id
   * Deletes a notification by id.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const empresaId: number = req.user.empresaId;
    return this.notificacionesService.remove(id, empresaId);
  }
}
