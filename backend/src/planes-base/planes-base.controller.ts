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
import { PlanesBaseService } from './planes-base.service';
import { CreatePlanBaseDto, UpdatePlanBaseDto } from './dto/plan-base.dto';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Planes Base')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@Controller('manager/planes-base')
export class PlanesBaseController {
  constructor(private readonly planesBaseService: PlanesBaseService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planes base (todos los roles)' })
  findAll() {
    return this.planesBaseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan base por ID (todos los roles)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planesBaseService.findOne(id);
  }

  @Post()
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Crear plan base (ADMIN)' })
  create(@Body() dto: CreatePlanBaseDto) {
    return this.planesBaseService.create(dto);
  }

  @Patch(':id')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Actualizar plan base (ADMIN)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanBaseDto,
  ) {
    return this.planesBaseService.update(id, dto);
  }

  @Delete(':id')
  @ManagerRoles('ADMIN')
  @ApiOperation({ summary: 'Eliminar plan base (ADMIN)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.planesBaseService.remove(id);
  }
}
