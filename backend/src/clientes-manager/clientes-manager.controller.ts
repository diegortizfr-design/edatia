import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
  @ApiOperation({ summary: 'Listar clientes (todos los roles)' })
  @ApiQuery({ name: 'estado', required: false, enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @ApiQuery({ name: 'asesorId', required: false, type: Number })
  findAll(
    @Query('estado') estado?: string,
    @Query('asesorId') asesorId?: string,
  ) {
    return this.clientesManagerService.findAll({
      estado,
      asesorId: asesorId ? Number(asesorId) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de clientes (todos los roles)' })
  stats() {
    return this.clientesManagerService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID (todos los roles)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesManagerService.findOne(id);
  }

  @Post()
  @ManagerRoles('ADMIN', 'COMERCIAL')
  @ApiOperation({ summary: 'Crear cliente (ADMIN, COMERCIAL)' })
  create(@Body() dto: CreateClienteDto) {
    return this.clientesManagerService.create(dto);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN', 'COMERCIAL')
  @ApiOperation({ summary: 'Actualizar cliente (ADMIN, COMERCIAL)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesManagerService.update(id, dto);
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
