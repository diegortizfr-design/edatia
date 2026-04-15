import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto, UpdateColaboradorDto } from './dto/colaborador.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TransferirDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  nuevoPerfilCargoId!: number;
}

function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
}

@ApiTags('Manager - Colaboradores')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/colaboradores')
export class ColaboradoresController {
  constructor(
    private readonly colaboradoresService: ColaboradoresService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Listar todos los colaboradores (ADMIN)' })
  findAll() {
    return this.colaboradoresService.findAll();
  }

  @Get('stats')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Estadísticas de colaboradores (ADMIN)' })
  stats() {
    return this.colaboradoresService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener colaborador (ADMIN: datos completos con PII, otros roles: datos públicos)' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: any }) {
    const isAdmin = req.user?.rol === 'ADMIN';
    const result = await this.colaboradoresService.findOne(id, isAdmin);

    // Registrar acceso a datos PII cuando ADMIN consulta datos completos
    if (isAdmin) {
      void this.auditLog.log({
        accion: 'ACCESS_PII',
        entidad: 'Colaborador',
        entidadId: id,
        colaboradorId: req.user.sub,
        colaboradorEmail: req.user.email,
        ip: extractIp(req),
        userAgent: req.headers['user-agent'],
        detalles: { campos: 'SELECT_FULL (salario, banco, documentos, seguridad social)' },
      });
    }

    return result;
  }

  @Post()
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Crear colaborador (ADMIN)' })
  async create(@Body() dto: CreateColaboradorDto, @Req() req: Request & { user: any }) {
    const result = await this.colaboradoresService.create(dto);

    void this.auditLog.log({
      accion: 'COLABORADOR_CREATE',
      entidad: 'Colaborador',
      entidadId: (result as any).id,
      colaboradorId: req.user.sub,
      colaboradorEmail: req.user.email,
      ip: extractIp(req),
      userAgent: req.headers['user-agent'],
      detalles: { emailNuevo: dto.email, rol: dto.rol },
    });

    return result;
  }

  @Patch(':id')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Actualizar datos del colaborador (ADMIN)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColaboradorDto,
    @Req() req: Request & { user: any },
  ) {
    const result = await this.colaboradoresService.update(id, dto);

    void this.auditLog.log({
      accion: 'COLABORADOR_UPDATE',
      entidad: 'Colaborador',
      entidadId: id,
      colaboradorId: req.user.sub,
      colaboradorEmail: req.user.email,
      ip: extractIp(req),
      userAgent: req.headers['user-agent'],
      detalles: { camposActualizados: Object.keys(dto) },
    });

    return result;
  }

  @Patch(':id/toggle')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Activar/desactivar colaborador (ADMIN)' })
  async toggleActivo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
  ) {
    const result = await this.colaboradoresService.toggleActivo(id);

    void this.auditLog.log({
      accion: 'COLABORADOR_TOGGLE_ACTIVO',
      entidad: 'Colaborador',
      entidadId: id,
      colaboradorId: req.user.sub,
      colaboradorEmail: req.user.email,
      ip: extractIp(req),
      userAgent: req.headers['user-agent'],
      detalles: { nuevoEstado: (result as any).activo ? 'activo' : 'inactivo' },
    });

    return result;
  }

  @Patch(':id/transferir')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Transferir colaborador a otro perfil de cargo (ADMIN)' })
  async transferir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferirDto,
    @Req() req: Request & { user: any },
  ) {
    const result = await this.colaboradoresService.transferir(id, dto.nuevoPerfilCargoId);

    void this.auditLog.log({
      accion: 'COLABORADOR_TRANSFERIR',
      entidad: 'Colaborador',
      entidadId: id,
      colaboradorId: req.user.sub,
      colaboradorEmail: req.user.email,
      ip: extractIp(req),
      userAgent: req.headers['user-agent'],
      detalles: { nuevoPerfilCargoId: dto.nuevoPerfilCargoId },
    });

    return result;
  }
}
