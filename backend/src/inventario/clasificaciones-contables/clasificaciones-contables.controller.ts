import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateClasificacionContableDto, UpdateClasificacionContableDto } from './dto/clasificacion-contable.dto';
import { ClasificacionesContablesService } from './clasificaciones-contables.service';

@UseGuards(JwtAuthGuard)
@Controller('clasificaciones-contables')
export class ClasificacionesContablesController {
  constructor(private readonly svc: ClasificacionesContablesService) {}

  @Get()
  findAll(@Req() req: any) {
    const empresaId: number = req.user.empresaId;
    return this.svc.findAll(empresaId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateClasificacionContableDto) {
    const empresaId: number = req.user.empresaId;
    return this.svc.create(empresaId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClasificacionContableDto,
  ) {
    const empresaId: number = req.user.empresaId;
    return this.svc.update(id, empresaId, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const empresaId: number = req.user.empresaId;
    return this.svc.remove(id, empresaId);
  }
}
