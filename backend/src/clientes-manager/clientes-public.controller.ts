import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ClientesManagerService } from './clientes-manager.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Manager Public - Clientes')
@Controller('manager/public-clientes')
export class ClientesPublicController {
  constructor(
    private readonly service: ClientesManagerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('validate-commercial')
  @ApiOperation({ summary: 'Validar código de asesor comercial (cédula) y contraseña' })
  validateCommercial(@Body() dto: { code: string; password?: string }) {
    if (!dto.code || !dto.password) {
      throw new BadRequestException('El código (cédula) y la contraseña son obligatorios.');
    }
    return this.service.validateCommercial(dto.code, dto.password);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir un documento adjunto' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(__dirname, '..', '..', 'uploads', 'clientes');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    return {
      filename: file.filename,
      filepath: `uploads/clientes/${file.filename}`,
      originalname: file.originalname,
    };
  }

  @Post('registro')
  @ApiOperation({ summary: 'Registrar un cliente desde el formulario público' })
  registro(@Body() dto: any) {
    return this.service.createPublic(dto);
  }

  @Get('planes-base')
  @ApiOperation({ summary: 'Listar planes base y sus módulos para auto-registro' })
  async getPlanesBase() {
    const planes = await (this.prisma as any).planBase.findMany({
      include: {
        modulos: {
          include: {
            modulo: true,
          },
        },
      },
      orderBy: { precioMensualFinal: 'asc' },
    });
    return planes;
  }

  @Get('modulos-software')
  @ApiOperation({ summary: 'Listar todos los módulos de software disponibles' })
  async getModulos() {
    const modulos = await (this.prisma as any).moduloSoftware.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return modulos;
  }

  @Get('documento/:filename')
  @ApiOperation({ summary: 'Descargar/visualizar un archivo adjunto de cliente' })
  serveDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '..', '..', 'uploads', 'clientes', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    return res.sendFile(filePath);
  }
}
