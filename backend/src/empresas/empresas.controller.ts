import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Empresas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las empresas' })
  findAll() {
    return this.empresasService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de empresas' })
  stats() {
    return this.empresasService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa por ID con sus usuarios' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva empresa' })
  @ApiResponse({ status: 201, description: 'Empresa creada' })
  @ApiResponse({ status: 409, description: 'NIT ya registrado' })
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar empresa' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
  ) {
    return this.empresasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar empresa (solo si no tiene usuarios)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.remove(id);
  }
}
