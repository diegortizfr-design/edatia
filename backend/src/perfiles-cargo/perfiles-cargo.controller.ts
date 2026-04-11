import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerfilesCargoService } from './perfiles-cargo.service';
import { CreatePerfilCargoDto, UpdatePerfilCargoDto } from './dto/perfil-cargo.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Perfiles de Cargo')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@ManagerRoles('ADMIN')
@Controller('manager/perfiles-cargo')
export class PerfilesCargoController {
  constructor(private readonly perfilesCargoService: PerfilesCargoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar perfiles de cargo (ADMIN)' })
  findAll() {
    return this.perfilesCargoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de cargo por ID (ADMIN)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesCargoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear perfil de cargo (ADMIN)' })
  create(@Body() dto: CreatePerfilCargoDto) {
    return this.perfilesCargoService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar perfil de cargo (ADMIN)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerfilCargoDto,
  ) {
    return this.perfilesCargoService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar perfil de cargo (ADMIN)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesCargoService.remove(id);
  }
}
