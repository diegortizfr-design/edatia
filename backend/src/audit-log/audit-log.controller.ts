import {
  Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuditLogService } from './audit-log.service';
import { ManagerJwtAuthGuard } from '../manager-auth/manager-jwt-auth.guard';
import { ManagerRolesGuard } from '../manager-auth/roles.guard';
import { ManagerRoles } from '../manager-auth/roles.decorator';

@ApiTags('Manager - Audit Log')
@ApiBearerAuth()
@UseGuards(ManagerJwtAuthGuard, ManagerRolesGuard)
@ManagerRoles('ADMIN')
@SkipThrottle()
@Controller('manager/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos de auditoría con filtros (ADMIN)' })
  @ApiQuery({ name: 'accion',           required: false })
  @ApiQuery({ name: 'colaboradorEmail', required: false })
  @ApiQuery({ name: 'ip',              required: false })
  @ApiQuery({ name: 'dateFrom',        required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo',          required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page',            required: false, type: Number })
  @ApiQuery({ name: 'limit',           required: false, type: Number })
  findAll(
    @Query('accion')           accion?: string,
    @Query('colaboradorEmail') colaboradorEmail?: string,
    @Query('ip')               ip?: string,
    @Query('dateFrom')         dateFrom?: string,
    @Query('dateTo')           dateTo?: string,
    @Query('page',    new DefaultValuePipe(1),  ParseIntPipe) page?:  number,
    @Query('limit',   new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.auditLogService.findAll({
      accion, colaboradorEmail, ip, dateFrom, dateTo, page, limit,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas rápidas del AuditLog (ADMIN)' })
  stats() {
    return this.auditLogService.stats();
  }
}
