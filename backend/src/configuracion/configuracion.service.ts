import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmpresa(empresaId: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        // Identificación
        nit: true,
        digitoVerificacion: true,
        nombre: true,
        nombreComercial: true,
        tipoPersona: true,
        representanteLegal: true,
        representanteLegalDoc: true,
        // Cámara de comercio
        matriculaMercantil: true,
        fechaMatriculaMercantil: true,
        ciudadMatricula: true,
        // Tributario
        regimenFiscal: true,
        actividadEconomica: true,
        responsabilidades: true,
        granContribuyente: true,
        autoretenedor: true,
        agenteRetencion: true,
        // Ubicación
        direccion: true,
        municipio: true,
        departamento: true,
        codigoDane: true,
        codigoPostal: true,
        pais: true,
        // Contacto
        telefono: true,
        email: true,
        correoFacturacion: true,
        web: true,
        // Marca
        logo: true,
        colorPrimario: true,
        slogan: true,
        // Operativa
        permiteStockNegativo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!empresa) throw new NotFoundException('Empresa no encontrada')
    return empresa
  }

  async updateEmpresa(empresaId: number, dto: any) {
    // No permitir cambiar el NIT desde el ERP (solo el Manager puede)
    const { nit, id, createdAt, ...data } = dto

    // Convertir fecha si viene como string (manejar vacíos como null)
    if (typeof data.fechaMatriculaMercantil === 'string') {
      data.fechaMatriculaMercantil = data.fechaMatriculaMercantil.trim() === ''
        ? null
        : new Date(data.fechaMatriculaMercantil)
    }

    return this.prisma.empresa.update({
      where: { id: empresaId },
      data,
    })
  }
}
