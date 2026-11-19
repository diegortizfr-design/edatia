import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as sharpNamespace from 'sharp';

const sharp = ((sharpNamespace as any).default || sharpNamespace) as typeof sharpNamespace;

/**
 * Normaliza y estandariza las imágenes del catálogo:
 *  - Formato cuadrado 1:1 (1200x1200 px).
 *  - Producto centrado y completo (sin recortes); relleno con el color de fondo detectado,
 *    blanco, o la misma foto desenfocada si tiene fondo real (ver componer()).
 *  - Sin superposición de logos (diseño limpio y profesional).
 */

const LADO = 1200;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

@Injectable()
export class ImagenEstandarService {
  private readonly logger = new Logger(ImagenEstandarService.name);

  /**
   * Detecta si un buffer corresponde a formato HEIC/HEIF de Apple/iPhone
   */
  private esHeic(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp !== 'ftyp') return false;
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    return [
      'heic', 'heix', 'hevc', 'hevx',
      'mif1', 'msf1', 'heim', 'heis',
      'hevm', 'hevs',
    ].includes(brand);
  }

  /**
   * Convierte un buffer HEIC a JPEG de alta fidelidad
   */
  private async convertirHeicAJpeg(buffer: Buffer): Promise<Buffer> {
    const heicConvert = require('heic-convert');
    const jpegRaw = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.95,
    });
    return Buffer.from(jpegRaw);
  }

  /** Corrige orientación EXIF, decodifica HEIC de iPhone, limita tamaño y convierte a JPEG antes de enviar a la IA. */
  async normalizarEntrada(buffer: Buffer): Promise<Buffer> {
    let bufferProcesar = buffer;

    if (this.esHeic(bufferProcesar)) {
      try {
        this.logger.log('Foto en formato HEIC (iPhone) detectada. Convirtiendo a JPEG automáticamente...');
        bufferProcesar = await this.convertirHeicAJpeg(bufferProcesar);
      } catch (e: any) {
        this.logger.warn(`No se pudo convertir HEIC preventivamente: ${e?.message}. Se intentará con sharp.`);
      }
    }

    try {
      return await sharp(bufferProcesar)
        .rotate()
        .resize(1536, 1536, { fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (err: any) {
      // Si falló por HEIC no detectado inicialmente por los primeros 12 bytes
      const esErrorHeif = /heif|heic|plugin|compression format|bad seek/i.test(err?.message || '');
      if (esErrorHeif) {
        try {
          this.logger.log('Reintentando conversión con heic-convert tras error de libvips...');
          const jpeg = await this.convertirHeicAJpeg(buffer);
          return await sharp(jpeg)
            .rotate()
            .resize(1536, 1536, { fit: 'inside', withoutEnlargement: true })
            .flatten({ background: '#ffffff' })
            .jpeg({ quality: 90 })
            .toBuffer();
        } catch (errFallback: any) {
          this.logger.error('Fallo conversión de respaldo con heic-convert:', errFallback?.stack || errFallback?.message);
        }
      }

      this.logger.error('Error al procesar imagen en normalizarEntrada:', err?.stack || err?.message || err);
      throw new BadRequestException('No se pudo leer una de las imágenes. Asegúrate de que sea una foto válida.');
    }
  }

  /**
   * Estandariza la imagen a un lienzo cuadrado 1200x1200 con el producto centrado y completo.
   *  - Fondo uniforme y claro (fotos de catálogo/estudio): se rellena con ese mismo color.
   *  - Fondo no uniforme (fotos tomadas en tienda, degradados): se rellena con una versión
   *    desenfocada de la misma foto, evitando franjas blancas artificiales.
   * Sin superponer logos.
   */
  async componer(buffer: Buffer): Promise<{ imagen: Buffer }> {
    try {
      const fondo = await this.detectarFondo(buffer);

      if (fondo) {
        const imagen = await sharp(buffer)
          .rotate()
          .flatten({ background: fondo })
          .resize(LADO, LADO, {
            fit: 'contain',
            background: fondo,
          })
          .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
          .toBuffer();
        return { imagen };
      }

      const base = await sharp(buffer).rotate().flatten({ background: '#ffffff' }).toBuffer();
      const desenfocado = await sharp(base)
        .resize(LADO, LADO, { fit: 'cover' })
        .blur(45)
        .modulate({ brightness: 1.08, saturation: 0.85 })
        .toBuffer();
      const frente = await sharp(base)
        .resize(LADO, LADO, { fit: 'inside' })
        .toBuffer();

      const imagen = await sharp(desenfocado)
        .composite([{ input: frente, gravity: 'center' }])
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();
      return { imagen };
    } catch (err: any) {
      this.logger.error('Error al estandarizar imagen:', err?.stack || err?.message || err);
      throw new BadRequestException('Error al procesar la imagen estándar.');
    }
  }

  /**
   * Color de fondo predominante analizando las esquinas. Si las esquinas no son uniformes
   * pero la mayoría del contorno es claro, usa blanco. Devuelve null cuando es una foto con
   * fondo real (tienda, degradados): en ese caso se usa relleno desenfocado.
   */
  private async detectarFondo(buffer: Buffer): Promise<Rgb | null> {
    try {
      const N = 32;
      const raw = await sharp(buffer)
        .rotate()
        .flatten({ background: '#ffffff' })
        .resize(N, N, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer();

      const px = (x: number, y: number): Rgb => {
        const i = (y * N + x) * 3;
        return { r: raw[i], g: raw[i + 1], b: raw[i + 2] };
      };

      const muestras = [
        px(0, 0),
        px(N - 1, 0),
        px(0, N - 1),
        px(N - 1, N - 1),
        px(1, 1),
        px(N - 2, 1),
        px(1, N - 2),
        px(N - 2, N - 2),
      ];

      const prom: Rgb = {
        r: Math.round(muestras.reduce((s, m) => s + m.r, 0) / muestras.length),
        g: Math.round(muestras.reduce((s, m) => s + m.g, 0) / muestras.length),
        b: Math.round(muestras.reduce((s, m) => s + m.b, 0) / muestras.length),
      };

      const uniforme = muestras.every(
        (m) =>
          Math.abs(m.r - prom.r) +
            Math.abs(m.g - prom.g) +
            Math.abs(m.b - prom.b) <
          30,
      );
      const claro = Math.min(prom.r, prom.g, prom.b) > 200;

      if (uniforme && claro) return prom;

      // Producto que toca los bordes sobre fondo blanco (p. ej. catálogo recortado):
      // si la mayoría del contorno es claro, se rellena con blanco en vez de desenfocar.
      let claros = 0;
      let total = 0;
      for (let i = 0; i < N; i++) {
        for (const m of [px(i, 0), px(i, N - 1), px(0, i), px(N - 1, i)]) {
          total++;
          if (Math.min(m.r, m.g, m.b) > 215) claros++;
        }
      }
      if (claros / total >= 0.5) return { r: 255, g: 255, b: 255 };

      return null;
    } catch {
      return { r: 255, g: 255, b: 255 };
    }
  }
}
