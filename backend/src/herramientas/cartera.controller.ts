import { Controller, Post, Body } from '@nestjs/common';
import { CarteraService } from './cartera.service';
import { GuardarCarteraDto, RecuperarCarteraDto } from './dto/cartera.dto';

@Controller('herramientas/cartera')
export class CarteraController {
  constructor(private readonly carteraService: CarteraService) {}

  @Post('guardar')
  async guardar(@Body() dto: GuardarCarteraDto) {
    await this.carteraService.guardar(dto);
    return { success: true, message: 'Cartera guardada exitosamente' };
  }

  @Post('recuperar')
  async recuperar(@Body() dto: RecuperarCarteraDto) {
    return this.carteraService.recuperar(dto);
  }
}
