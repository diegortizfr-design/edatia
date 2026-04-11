import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModulosSoftwareService } from './modulos-software.service';
import { CreateModuloSoftwareDto, UpdateModuloSoftwareDto } from './dto/modulo-software.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Módulos de Software')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/modulos')
export class ModulosSoftwareController {
  constructor(private readonly modulosSoftwareService: ModulosSoftwareService) {}

  @Get()
  @ApiOperation({ summary: 'Listar módulos de software (todos los roles)' })
  findAll() {
    return this.modulosSoftwareService.findAll();
  }

  @Post()
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Crear módulo de software (ADMIN)' })
  create(@Body() dto: CreateModuloSoftwareDto) {
    return this.modulosSoftwareService.create(dto);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Actualizar módulo de software (ADMIN)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuloSoftwareDto,
  ) {
    return this.modulosSoftwareService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Activar/desactivar módulo de software (ADMIN)' })
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.modulosSoftwareService.toggleActivo(id);
  }
}
