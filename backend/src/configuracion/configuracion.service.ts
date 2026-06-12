import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────
  // EMPRESA (datos legales y de contacto)
  // ──────────────────────────────────────────────────────────────

  async getEmpresa(empresaId: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nit: true,
        digitoVerificacion: true,
        nombre: true,
        nombreComercial: true,
        tipoPersona: true,
        representanteLegal: true,
        representanteLegalDoc: true,
        matriculaMercantil: true,
        fechaMatriculaMercantil: true,
        ciudadMatricula: true,
        regimenFiscal: true,
        actividadEconomica: true,
        responsabilidades: true,
        granContribuyente: true,
        autoretenedor: true,
        agenteRetencion: true,
        direccion: true,
        municipio: true,
        departamento: true,
        codigoDane: true,
        codigoPostal: true,
        pais: true,
        telefono: true,
        email: true,
        correoFacturacion: true,
        web: true,
        logo: true,
        colorPrimario: true,
        slogan: true,
        permiteStockNegativo: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!empresa) throw new NotFoundException('Empresa no encontrada')
    return empresa
  }

  async updateEmpresa(empresaId: number, dto: any) {
    const { nit, id, createdAt, ...data } = dto
    if (typeof data.fechaMatriculaMercantil === 'string') {
      data.fechaMatriculaMercantil = data.fechaMatriculaMercantil.trim() === ''
        ? null
        : new Date(data.fechaMatriculaMercantil)
    }
    return this.prisma.empresa.update({ where: { id: empresaId }, data })
  }

  // ──────────────────────────────────────────────────────────────
  // CONFIGURACIÓN ERP (operativa: contabilidad, costos, ventas, etc.)
  // ──────────────────────────────────────────────────────────────

  async getConfigERP(empresaId: number) {
    let config = await (this.prisma as any).configuracionERP.findUnique({
      where: { empresaId },
    })
    // Si no existe, la creamos con defaults
    if (!config) {
      config = await (this.prisma as any).configuracionERP.create({
        data: { empresaId },
      })
    }
    return config
  }

  async updateConfigERP(empresaId: number, dto: any) {
    const { id, empresaId: _eid, createdAt, updatedAt, ...data } = dto
    return (this.prisma as any).configuracionERP.upsert({
      where: { empresaId },
      update: data,
      create: { empresaId, ...data },
    })
  }

  // ──────────────────────────────────────────────────────────────
  // FORMATOS DE IMPRESIÓN
  // ──────────────────────────────────────────────────────────────

  async getFormatos(empresaId: number) {
    const tipos = ['CARTA', 'POS_80', 'POS_58']
    const existing = await (this.prisma as any).formatoImpresion.findMany({
      where: { empresaId },
    })
    // Asegurar que existan los 3 tipos con defaults
    const missing = tipos.filter(t => !existing.find((e: any) => e.tipo === t))
    if (missing.length > 0) {
      await (this.prisma as any).formatoImpresion.createMany({
        data: missing.map(tipo => ({ empresaId, tipo })),
        skipDuplicates: true,
      })
      return (this.prisma as any).formatoImpresion.findMany({ where: { empresaId } })
    }
    return existing
  }

  async updateFormato(empresaId: number, tipo: string, dto: any) {
    const { id, empresaId: _eid, ...data } = dto
    return (this.prisma as any).formatoImpresion.upsert({
      where: { empresaId_tipo: { empresaId, tipo } },
      update: data,
      create: { empresaId, tipo, ...data },
    })
  }

  // ──────────────────────────────────────────────────────────────
  // CATÁLOGOS CONTABLES
  // ──────────────────────────────────────────────────────────────

  // Regímenes Fiscales
  async getRegimenes(empresaId: number) {
    return (this.prisma as any).regimenFiscal.findMany({
      where: { empresaId },
      orderBy: { codigo: 'asc' },
    })
  }

  async createRegimen(empresaId: number, dto: { codigo: string; nombre: string }) {
    return (this.prisma as any).regimenFiscal.create({
      data: { empresaId, ...dto },
    })
  }

  async updateRegimen(id: number, empresaId: number, dto: any) {
    await (this.prisma as any).regimenFiscal.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).regimenFiscal.update({ where: { id }, data: dto })
  }

  async deleteRegimen(id: number, empresaId: number) {
    await (this.prisma as any).regimenFiscal.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).regimenFiscal.delete({ where: { id } })
  }

  // Códigos CIIU
  async getCIIU(empresaId: number) {
    return (this.prisma as any).codigoCIIU.findMany({
      where: { empresaId },
      orderBy: { codigo: 'asc' },
    })
  }

  async createCIIU(empresaId: number, dto: { codigo: string; descripcion: string }) {
    return (this.prisma as any).codigoCIIU.create({
      data: { empresaId, ...dto },
    })
  }

  async updateCIIU(id: number, empresaId: number, dto: any) {
    await (this.prisma as any).codigoCIIU.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).codigoCIIU.update({ where: { id }, data: dto })
  }

  async deleteCIIU(id: number, empresaId: number) {
    await (this.prisma as any).codigoCIIU.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).codigoCIIU.delete({ where: { id } })
  }

  // Responsabilidades Fiscales
  async getResponsabilidades(empresaId: number) {
    return (this.prisma as any).responsabilidadFiscal.findMany({
      where: { empresaId },
      orderBy: { codigo: 'asc' },
    })
  }

  async createResponsabilidad(empresaId: number, dto: { codigo: string; descripcion: string }) {
    return (this.prisma as any).responsabilidadFiscal.create({
      data: { empresaId, ...dto },
    })
  }

  async updateResponsabilidad(id: number, empresaId: number, dto: any) {
    await (this.prisma as any).responsabilidadFiscal.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).responsabilidadFiscal.update({ where: { id }, data: dto })
  }

  async deleteResponsabilidad(id: number, empresaId: number) {
    await (this.prisma as any).responsabilidadFiscal.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).responsabilidadFiscal.delete({ where: { id } })
  }

  // Tipos de Identificación
  async getTiposIdentificacion(empresaId: number) {
    return (this.prisma as any).tipoIdentificacion.findMany({
      where: { empresaId },
      orderBy: { codigoDian: 'asc' },
    })
  }

  async createTipoIdentificacion(empresaId: number, dto: { codigoDian: string; nombreCorto: string; descripcion: string; activo?: boolean }) {
    return (this.prisma as any).tipoIdentificacion.create({
      data: { empresaId, ...dto },
    })
  }

  async updateTipoIdentificacion(id: number, empresaId: number, dto: any) {
    await (this.prisma as any).tipoIdentificacion.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).tipoIdentificacion.update({ where: { id }, data: dto })
  }

  async deleteTipoIdentificacion(id: number, empresaId: number) {
    await (this.prisma as any).tipoIdentificacion.findFirstOrThrow({ where: { id, empresaId } })
    return (this.prisma as any).tipoIdentificacion.delete({ where: { id } })
  }
}
