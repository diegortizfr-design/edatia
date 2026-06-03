import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuditoriaErpService } from './auditoria-erp.service';
import { QueryAuditoriaDto } from './dto/query-auditoria.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('auditoria-erp')
export class AuditoriaErpController {
  constructor(private readonly auditoriaErpService: AuditoriaErpService) {}

  /**
   * GET /auditoria-erp
   * Lista paginada de logs de auditoría ERP de la empresa del usuario autenticado.
   *
   * Query params:
   *   - modulo?  : filtrar por módulo (VENTAS, INVENTARIO, etc.)
   *   - accion?  : filtrar por acción (CREAR, EDITAR, ELIMINAR, etc.)
   *   - from?    : fecha inicio YYYY-MM-DD
   *   - to?      : fecha fin YYYY-MM-DD
   *   - page?    : número de página (default: 1)
   *   - limit?   : registros por página (default: 50, máx: 200)
   */
  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('modulo')  modulo?: string,
    @Query('accion')  accion?: string,
    @Query('from')    from?: string,
    @Query('to')      to?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page?:  number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.auditoriaErpService.findAll(user.empresaId!, {
      modulo,
      accion,
      from,
      to,
      page,
      limit,
    });
  }
}
