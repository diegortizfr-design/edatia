import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientesManagerService } from './clientes-manager.service';
import { CreateClienteDto, UpdateClienteDto, AsignarModuloDto } from './dto/cliente.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Clientes')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/clientes')
export class ClientesManagerController {
  constructor(private readonly clientesManagerService: ClientesManagerService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes — COMERCIAL ve solo los suyos, ADMIN ve todos' })
  @ApiQuery({ name: 'estado', required: false, enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @ApiQuery({ name: 'asesorId', required: false, type: Number })
  findAll(
    @Query('estado') estado?: string,
    @Query('asesorId') asesorId?: string,
    @Request() req?: any,
  ) {
    return this.clientesManagerService.findAll(
      { estado, asesorId: asesorId ? Number(asesorId) : undefined },
      req?.user,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de clientes (todos los roles)' })
  stats() {
    return this.clientesManagerService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID — COMERCIAL solo accede a los suyos' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientesManagerService.findOne(id, req.user);
  }

  @Post()
  @ManagerRoles('ADMIN', 'COMERCIAL')
  @ApiOperation({ summary: 'Crear cliente — COMERCIAL queda asignado automáticamente como asesor' })
  create(@Body() dto: CreateClienteDto, @Request() req: any) {
    return this.clientesManagerService.create(dto, req.user);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN', 'COMERCIAL')
  @ApiOperation({ summary: 'Actualizar cliente — COMERCIAL solo puede editar los suyos y no reasignar asesor' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
    @Request() req: any,
  ) {
    return this.clientesManagerService.update(id, dto, req.user);
  }

  @Post(':id/modulos')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Asignar módulo a cliente (ADMIN)' })
  asignarModulo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarModuloDto,
  ) {
    return this.clientesManagerService.asignarModulo(id, dto);
  }

  @Delete(':id/modulos/:moduloId')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Desactivar módulo de cliente (ADMIN)' })
  desactivarModulo(
    @Param('id', ParseIntPipe) id: number,
    @Param('moduloId', ParseIntPipe) moduloId: number,
  ) {
    return this.clientesManagerService.desactivarModulo(id, moduloId);
  }
}
