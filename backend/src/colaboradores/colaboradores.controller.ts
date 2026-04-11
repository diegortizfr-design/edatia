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
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto, UpdateColaboradorDto } from './dto/colaborador.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Colaboradores')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/colaboradores')
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

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
  @ApiOperation({ summary: 'Obtener colaborador por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.colaboradoresService.findOne(id);
  }

  @Post()
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Crear colaborador (ADMIN)' })
  create(@Body() dto: CreateColaboradorDto) {
    return this.colaboradoresService.create(dto);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Actualizar colaborador (ADMIN)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColaboradorDto,
  ) {
    return this.colaboradoresService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Activar/desactivar colaborador (ADMIN)' })
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.colaboradoresService.toggleActivo(id);
  }
}
