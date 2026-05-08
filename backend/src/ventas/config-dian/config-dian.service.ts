import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConfigDianService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(empresaId: number) {
    let config = await this.prisma.configuracionDIAN.findUnique({
      where: { empresaId },
      include: { resoluciones: { orderBy: { id: 'desc' } } },
    });

    if (!config) {
      config = await this.prisma.configuracionDIAN.create({
        data: { empresaId },
        include: { resoluciones: true },
      });
    }
    return config;
  }

  async upsertConfig(empresaId: number, data: any) {
    const config = await this.prisma.configuracionDIAN.findUnique({ where: { empresaId } });
    if (config) {
      return this.prisma.configuracionDIAN.update({
        where: { empresaId },
        data,
      });
    } else {
      return this.prisma.configuracionDIAN.create({
        data: { empresaId, ...data },
      });
    }
  }

  async addResolucion(empresaId: number, data: any) {
    const config = await this.getConfig(empresaId);
    
    // Parsear fechas al final del día o inicio para DIAN si es necesario
    return this.prisma.resolucionDIAN.create({
      data: {
        configId: config.id,
        tipoDocumento: data.tipoDocumento,
        prefijo: data.prefijo || '',
        numeroInicial: data.rangoInicial,
        numeroFinal: data.rangoFinal,
        numeroCurrent: data.rangoInicial,
        fechaResolucion: new Date(data.fechaResolucion),
        fechaVigencia: new Date(data.fechaVigencia),
        numeroResolucion: data.numeroResolucion,
        claveTecnica: data.claveTecnica || 'PENDIENTE', // Ficticio por ahora
        activo: true,
      },
    });
  }

  async toggleResolucion(empresaId: number, id: number) {
    // Validar propiedad de la resolución a través de configuracionDIAN
    const resolucion = await this.prisma.resolucionDIAN.findUnique({ 
      where: { id },
      include: { config: true }
    });
    
    if (!resolucion || resolucion.config.empresaId !== empresaId) {
      throw new NotFoundException('Resolución no encontrada');
    }
    
    return this.prisma.resolucionDIAN.update({
      where: { id },
      data: { activo: !resolucion.activo },
    });
  }
}
