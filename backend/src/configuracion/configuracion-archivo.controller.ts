import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator';
import { Response } from 'express';

function getDirSize(dirPath: string): number {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return size;
}

@Controller('configuracion/archivo')
export class ConfiguracionArchivoController {

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const user = req.user;
          const empresaId = user?.empresaId || 'public';
          const uploadPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `file-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any, @GetUser() u: JwtPayload) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    const empresaId = u.empresaId!;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `edatia_erp/empresa_${empresaId}`,
        resource_type: 'auto',
      });

      return {
        nombre: file.originalname,
        filename: file.filename,
        url: result.secure_url,
        size: result.bytes,
        tipo: this.detectFileType(file.originalname),
      };
    } catch (error) {
      console.error("Cloudinary error:", error);
      throw new BadRequestException('Error subiendo archivo a la nube.');
    } finally {
      // Garantizar que el archivo temporal siempre se elimine del disco duro local
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  @Get('ver/:empresaId/:filename')
  serveDocument(
    @Param('empresaId') empresaId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    return res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get('storage')
  getStorageUsage(@GetUser() u: JwtPayload) {
    const empresaId = u.empresaId!;
    const dirPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
    const usedBytes = getDirSize(dirPath);
    const limitBytes = 5 * 1024 * 1024 * 1024; // 5 GB
    return {
      usedBytes,
      limitBytes,
      percentage: Number(((usedBytes / limitBytes) * 100).toFixed(2)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('general')
  getGeneralFiles(@GetUser() u: JwtPayload) {
    const empresaId = u.empresaId!;
    const dirPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
    const metaPath = join(dirPath, 'general_metadata.json');
    if (!fs.existsSync(metaPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(metaPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('general')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const user = req.user;
          const empresaId = user?.empresaId || 'public';
          const uploadPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `general-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  uploadGeneralFile(@UploadedFile() file: any, @GetUser() u: JwtPayload) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }
    const empresaId = u.empresaId!;
    const dirPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
    const metaPath = join(dirPath, 'general_metadata.json');

    let metadataList: any[] = [];
    if (fs.existsSync(metaPath)) {
      try {
        metadataList = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (err) {
        metadataList = [];
      }
    }

    const fileType = this.detectFileType(file.originalname);
    const newEntry = {
      id: String(Date.now()),
      nombre: file.originalname,
      filename: file.filename,
      url: `/api/v1/configuracion/archivo/ver/${empresaId}/${file.filename}`,
      size: file.size,
      tipo: fileType,
      fecha: new Date().toISOString(),
    };

    metadataList.push(newEntry);
    fs.writeFileSync(metaPath, JSON.stringify(metadataList, null, 2), 'utf8');

    return newEntry;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('general/:filename')
  deleteGeneralFile(@Param('filename') filename: string, @GetUser() u: JwtPayload) {
    const empresaId = u.empresaId!;
    const dirPath = join(__dirname, '..', '..', 'uploads', `empresa_${empresaId}`);
    const filePath = join(dirPath, filename);
    const metaPath = join(dirPath, 'general_metadata.json');

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore delete failure
      }
    }

    if (fs.existsSync(metaPath)) {
      try {
        let metadataList = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        metadataList = metadataList.filter((item: any) => item.filename !== filename);
        fs.writeFileSync(metaPath, JSON.stringify(metadataList, null, 2), 'utf8');
      } catch (err) {
        // ignore
      }
    }
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cloudinary')
  async deleteCloudinaryFile(@Body('url') url: string, @GetUser() u: JwtPayload) {
    if (!url || !url.includes('res.cloudinary.com')) {
      return { success: false, message: 'URL no válida o no pertenece a Cloudinary' };
    }
    try {
      const parts = url.split('/upload/');
      if (parts.length > 1) {
        let pathPart = parts[1];
        // Encontrar la carpeta base del ERP para saltar transformaciones y versiones
        const folderIndex = pathPart.indexOf('edatia_erp/');
        if (folderIndex !== -1) {
          pathPart = pathPart.substring(folderIndex);
        }
        // Quitar la extensión del archivo para obtener el public_id real
        const lastDot = pathPart.lastIndexOf('.');
        const publicId = lastDot !== -1 ? pathPart.substring(0, lastDot) : pathPart;
        
        // Seguridad: Verificar que solo borren fotos de su propia empresa
        if (publicId.includes(`empresa_${u.empresaId}`)) {
          await cloudinary.uploader.destroy(publicId);
          return { success: true, message: 'Imagen eliminada de la nube' };
        } else {
          throw new BadRequestException('No tienes permisos para eliminar este archivo.');
        }
      }
      return { success: false, message: 'No se pudo parsear el public_id' };
    } catch (error) {
      console.error('Error al eliminar de Cloudinary:', error);
      throw new BadRequestException('Error al intentar eliminar el archivo de la nube');
    }
  }

  private detectFileType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    if (ext === '.pdf') return 'PDF';
    if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'Excel';
    if (['.doc', '.docx'].includes(ext)) return 'Word';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'Imagen';
    if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return 'Video';
    return 'Otro';
  }
}
