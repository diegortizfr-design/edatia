import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { PosService } from './pos.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser } from '../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly pos: PosService) {}

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  @Get('dashboard')
  dashboard(@GetUser() u: any) {
    return this.pos.getDashboard(u.empresaId)
  }

  // ─── Búsqueda rápida de productos ────────────────────────────────────────────
  @Get('productos')
  buscarProductos(
    @GetUser() u: any,
    @Query('q') q: string,
    @Query('bodegaId', ParseIntPipe) bodegaId: number,
  ) {
    return this.pos.buscarProductosPos(u.empresaId, q ?? '', bodegaId)
  }

  // ─── Cajas ───────────────────────────────────────────────────────────────────
  @Get('cajas')
  getCajas(@GetUser() u: any) {
    return this.pos.getCajas(u.empresaId)
  }

  @Post('cajas')
  createCaja(@GetUser() u: any, @Body() dto: any) {
    return this.pos.createCaja(u.empresaId, dto)
  }

  @Patch('cajas/:id')
  updateCaja(@GetUser() u: any, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.pos.updateCaja(u.empresaId, id, dto)
  }

  // ─── Sesiones ────────────────────────────────────────────────────────────────
  @Get('sesiones')
  getSesiones(
    @GetUser() u: any,
    @Query('cajaId') cajaId: string,
    @Query('estado') estado: string,
  ) {
    return this.pos.getSesiones(u.empresaId, cajaId ? +cajaId : undefined, estado)
  }

  @Get('sesiones/:id')
  getSesion(@GetUser() u: any, @Param('id', ParseIntPipe) id: number) {
    return this.pos.getSesion(u.empresaId, id)
  }

  @Post('sesiones/abrir')
  abrirCaja(@GetUser() u: any, @Body() dto: any) {
    return this.pos.abrirCaja(u.empresaId, dto)
  }

  @Post('sesiones/:id/cerrar')
  cerrarCaja(@GetUser() u: any, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.pos.cerrarCaja(u.empresaId, id, dto)
  }

  @Post('sesiones/:id/movimiento')
  movimientoCaja(@GetUser() u: any, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.pos.movimientoCaja(u.empresaId, id, dto)
  }

  // ─── Ventas POS ──────────────────────────────────────────────────────────────
  @Get('ventas')
  getVentas(
    @GetUser() u: any,
    @Query('sesionId') sesionId: string,
    @Query('fecha') fecha: string,
  ) {
    return this.pos.getVentasPos(u.empresaId, sesionId ? +sesionId : undefined, fecha)
  }

  @Post('ventas')
  crearVenta(@GetUser() u: any, @Body() dto: any) {
    return this.pos.crearVentaPos(u.empresaId, dto)
  }

  @Patch('ventas/:id/anular')
  anularVenta(
    @GetUser() u: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
  ) {
    return this.pos.anularVentaPos(u.empresaId, id, motivo ?? 'Sin motivo')
  }
}
