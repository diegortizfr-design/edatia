import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DigitalService {
  constructor(private prisma: PrismaService) {}

  async getConfig(empresaId: number) {
    let config = await this.prisma.configuracionTienda.findUnique({
      where: { empresaId },
    });

    if (!config) {
      // Crear configuración inicial si no existe
      const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
      config = await this.prisma.configuracionTienda.create({
        data: {
          empresaId,
          slugTienda: `tienda-${empresaId}-${Math.random().toString(36).substring(7)}`,
          nombreTienda: empresa?.nombre || 'Mi Tienda Virtual',
        },
      });
    }

    return config;
  }

  async updateConfig(empresaId: number, data: any) {
    return this.prisma.configuracionTienda.update({
      where: { empresaId },
      data,
    });
  }

  async getProductosWeb(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { empresaId },
      select: {
        id: true,
        nombre: true,
        sku: true,
        precioBase: true,
        precioWeb: true,
        publicadoWeb: true,
        slug: true,
        imagen: true,
      },
    });
  }

  async toggleProductoWeb(empresaId: number, productoId: number, publicado: boolean) {
    return this.prisma.producto.update({
      where: { id: productoId, empresaId },
      data: { publicadoWeb: publicado },
    });
  }
}
