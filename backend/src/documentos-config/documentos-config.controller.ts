import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { DocumentosConfigService } from './documentos-config.service'
import { CreateDocumentoConfigDto, UpdateDocumentoConfigDto, DeleteDocumentoConfigDto } from './dto/documento-config.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('configuracion/documentos')
export class DocumentosConfigController {
  constructor(private readonly svc: DocumentosConfigService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload) {
    return this.svc.findAll(u.empresaId!)
  }

  @Get('eliminados')
  findDeleted(@GetUser() u: JwtPayload) {
    return this.svc.findDeleted(u.empresaId!)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateDocumentoConfigDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentoConfigDto,
    @GetUser() u: JwtPayload,
  ) {
    return this.svc.update(id, dto, u.empresaId!)
  }

  @Post(':id/incrementar-consecutivo')
  incrementarConsecutivo(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() u: JwtPayload,
  ) {
    return this.svc.incrementarConsecutivo(id, u.empresaId!)
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteDocumentoConfigDto,
    @GetUser() u: JwtPayload,
  ) {
    return this.svc.softDelete(id, u.empresaId!, dto.codigoAutorizacion, u.sub)
  }
}
