import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { GeolocalizacionService } from './geolocalizacion.service'
import { CreatePaisDto, CreateDepartamentoDto, CreateCiudadDto, CreateComunaDto, CreateBarrioDto } from './dto/geolocalizacion.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('configuracion/geolocalizacion')
export class GeolocalizacionController {
  constructor(private readonly svc: GeolocalizacionService) {}

  @Get()
  getGeolocationState() {
    return this.svc.getGeolocationState()
  }

  @Post('reset')
  resetToDefaults() {
    return this.svc.resetToDefaults().then(() => ({ success: true, message: 'Datos geográficos restablecidos a la plantilla oficial' }))
  }

  // ── Paises ──
  @Post('paises')
  createPais(@Body() dto: CreatePaisDto) {
    return this.svc.createPais(dto)
  }

  @Patch('paises/:id')
  updatePais(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.updatePais(id, dto)
  }

  @Delete('paises/:id')
  deletePais(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deletePais(id)
  }

  // ── Departamentos ──
  @Post('departamentos')
  createDepartamento(@Body() dto: CreateDepartamentoDto) {
    return this.svc.createDepartamento(dto)
  }

  @Patch('departamentos/:id')
  updateDepartamento(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.updateDepartamento(id, dto)
  }

  @Delete('departamentos/:id')
  deleteDepartamento(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteDepartamento(id)
  }

  // ── Ciudades ──
  @Post('ciudades')
  createCiudad(@Body() dto: CreateCiudadDto) {
    return this.svc.createCiudad(dto)
  }

  @Patch('ciudades/:id')
  updateCiudad(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.updateCiudad(id, dto)
  }

  @Delete('ciudades/:id')
  deleteCiudad(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCiudad(id)
  }

  // ── Comunas ──
  @Post('comunas')
  createComuna(@Body() dto: CreateComunaDto) {
    return this.svc.createComuna(dto)
  }

  @Patch('comunas/:id')
  updateComuna(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.updateComuna(id, dto)
  }

  @Delete('comunas/:id')
  deleteComuna(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteComuna(id)
  }

  // ── Barrios ──
  @Post('barrios')
  createBarrio(@Body() dto: CreateBarrioDto) {
    return this.svc.createBarrio(dto)
  }

  @Patch('barrios/:id')
  updateBarrio(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.updateBarrio(id, dto)
  }

  @Delete('barrios/:id')
  deleteBarrio(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteBarrio(id)
  }
}
