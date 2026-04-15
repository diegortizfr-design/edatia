import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventario/stock')
export class StockController {
  constructor(private readonly svc: StockService) {}

  @Get()
  findAll(
    @GetUser() user: JwtPayload,
    @Query('bodegaId') bodegaId?: string,
    @Query('soloAlertas') soloAlertas?: string,
  ) {
    return this.svc.findAll(user.empresaId!, {
      bodegaId: bodegaId ? +bodegaId : undefined,
      soloAlertas: soloAlertas === 'true',
    });
  }

  @Get('alertas')
  getAlertas(@GetUser() user: JwtPayload) {
    return this.svc.getAlertas(user.empresaId!);
  }

  @Get('valoracion')
  getValoracion(@GetUser() user: JwtPayload) {
    return this.svc.getValoracion(user.empresaId!);
  }

  @Get('producto/:id')
  findByProducto(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.svc.findByProducto(id, user.empresaId!);
  }
}
