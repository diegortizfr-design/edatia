import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AliadosService } from './aliados.service';

@Controller('public/tiendas/:slug/aliados')
export class AliadosPublicController {
  constructor(private readonly aliadosService: AliadosService) {}

  @Get('config-publica')
  getConfigPublica(@Param('slug') slug: string) {
    return this.aliadosService.getConfigPublica(slug);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('registro')
  registrar(@Param('slug') slug: string, @Body() body: any) {
    return this.aliadosService.registrarAliado(slug, body);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('login')
  login(@Param('slug') slug: string, @Body() body: any) {
    return this.aliadosService.loginAliado(slug, body);
  }

  @Get('perfil')
  getPerfil(
    @Param('slug') slug: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.aliadosService.getPerfilYResumen(slug, authHeader);
  }

  @Get('catalogo')
  getCatalogo(
    @Param('slug') slug: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.aliadosService.getCatalogoAliado(slug, authHeader);
  }

  @Throttle({ default: { limit: 25, ttl: 60000 } })
  @Post('productos/:productoId/copy-ia')
  generarCopyIa(
    @Param('slug') slug: string,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Headers('authorization') authHeader?: string,
    @Body() body?: any,
    @Query('regenerar') regenerar?: string,
  ) {
    return this.aliadosService.generarCopyProductoIa(
      slug,
      authHeader,
      productoId,
      body?.estilo,
      regenerar === 'true' || body?.regenerar === true,
    );
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('pedidos')
  crearPedido(
    @Param('slug') slug: string,
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: any,
  ) {
    return this.aliadosService.crearPedidoDesdeAliado(slug, authHeader, body);
  }
}

