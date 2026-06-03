import { Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ConfiguracionService } from './configuracion.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly svc: ConfiguracionService) {}

  // ── Empresa ──────────────────────────────────────────────────
  @Get('empresa')
  getEmpresa(@GetUser() u: JwtPayload) {
    return this.svc.getEmpresa(u.empresaId!)
  }

  @Patch('empresa')
  updateEmpresa(@GetUser() u: JwtPayload, @Body() dto: any) {
    return this.svc.updateEmpresa(u.empresaId!, dto)
  }

  // ── Config ERP (operativa + códigos admin) ───────────────────
  @Get('erp')
  getConfigERP(@GetUser() u: JwtPayload) {
    return this.svc.getConfigERP(u.empresaId!)
  }

  @Patch('erp')
  updateConfigERP(@GetUser() u: JwtPayload, @Body() dto: any) {
    return this.svc.updateConfigERP(u.empresaId!, dto)
  }

  // ── Formatos de Impresión ────────────────────────────────────
  @Get('formatos')
  getFormatos(@GetUser() u: JwtPayload) {
    return this.svc.getFormatos(u.empresaId!)
  }

  @Patch('formatos/:tipo')
  updateFormato(
    @Param('tipo') tipo: string,
    @GetUser() u: JwtPayload,
    @Body() dto: any,
  ) {
    return this.svc.updateFormato(u.empresaId!, tipo, dto)
  }

  // ── Regímenes Fiscales ───────────────────────────────────────
  @Get('regimenes')
  getRegimenes(@GetUser() u: JwtPayload) {
    return this.svc.getRegimenes(u.empresaId!)
  }

  @Post('regimenes')
  createRegimen(@GetUser() u: JwtPayload, @Body() dto: any) {
    return this.svc.createRegimen(u.empresaId!, dto)
  }

  @Patch('regimenes/:id')
  updateRegimen(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
    @Body() dto: any,
  ) {
    return this.svc.updateRegimen(id, u.empresaId!, dto)
  }

  @Delete('regimenes/:id')
  deleteRegimen(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.deleteRegimen(id, u.empresaId!)
  }

  // ── Códigos CIIU ─────────────────────────────────────────────
  @Get('ciiu')
  getCIIU(@GetUser() u: JwtPayload) {
    return this.svc.getCIIU(u.empresaId!)
  }

  @Post('ciiu')
  createCIIU(@GetUser() u: JwtPayload, @Body() dto: any) {
    return this.svc.createCIIU(u.empresaId!, dto)
  }

  @Patch('ciiu/:id')
  updateCIIU(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
    @Body() dto: any,
  ) {
    return this.svc.updateCIIU(id, u.empresaId!, dto)
  }

  @Delete('ciiu/:id')
  deleteCIIU(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.deleteCIIU(id, u.empresaId!)
  }

  // ── Responsabilidades Fiscales ───────────────────────────────
  @Get('responsabilidades')
  getResponsabilidades(@GetUser() u: JwtPayload) {
    return this.svc.getResponsabilidades(u.empresaId!)
  }

  @Post('responsabilidades')
  createResponsabilidad(@GetUser() u: JwtPayload, @Body() dto: any) {
    return this.svc.createResponsabilidad(u.empresaId!, dto)
  }

  @Patch('responsabilidades/:id')
  updateResponsabilidad(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
    @Body() dto: any,
  ) {
    return this.svc.updateResponsabilidad(id, u.empresaId!, dto)
  }

  @Delete('responsabilidades/:id')
  deleteResponsabilidad(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.deleteResponsabilidad(id, u.empresaId!)
  }
}
