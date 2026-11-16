import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator';
import { IaProductosService } from './ia-productos.service';
import {
  CrearProductoIaDto,
  RegenerarImagenIaDto,
  ActualizarBorradorIaDto,
  RegistrarCompartidoDto,
} from './dto/ia-productos.dto';

@Controller('digital/ia/productos')
@UseGuards(JwtAuthGuard)
export class IaProductosController {
  constructor(private readonly iaProductosService: IaProductosService) {}

  /**
   * Genera un producto borrador a partir de 1 a 3 fotos y el precio de venta.
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 3, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por archivo
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
          return cb(
            new BadRequestException(
              'Formato no soportado. Solo se admiten fotos JPG, PNG o WEBP.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async crearBorrador(
    @GetUser() user: JwtPayload,
    @UploadedFiles() archivos: Express.Multer.File[],
    @Body() dto: CrearProductoIaDto,
  ) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debes adjuntar al menos una foto del producto.');
    }
    return this.iaProductosService.crearBorrador(user.empresaId!, archivos, dto);
  }

  /**
   * Regenera una imagen de catálogo para el producto borrador
   * (con instrucciones adicionales a la IA o usando la foto original con logo directo).
   */
  @Post(':id/regenerar-imagen')
  async regenerarImagen(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegenerarImagenIaDto,
  ) {
    return this.iaProductosService.regenerarImagen(user.empresaId!, id, dto);
  }

  /**
   * Actualiza los datos del producto borrador antes de su publicación definitiva.
   */
  @Patch(':id')
  async actualizarBorrador(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBorradorIaDto,
  ) {
    return this.iaProductosService.actualizarBorrador(user.empresaId!, id, dto);
  }

  /**
   * Registra cuando el usuario comparte el producto en WhatsApp Estados o Marketplace.
   */
  @Post(':id/compartido')
  async registrarCompartido(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarCompartidoDto,
  ) {
    return this.iaProductosService.registrarCompartido(user.empresaId!, id, dto);
  }
}

