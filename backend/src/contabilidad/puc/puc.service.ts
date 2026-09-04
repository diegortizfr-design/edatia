import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PUC_SEED } from './puc-seed.data'

@Injectable()
export class PucService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: number, nivel?: number, tipo?: string) {
    return this.prisma.cuentaPUC.findMany({
      where: {
        empresaId,
        ...(nivel ? { nivel: Number(nivel) } : {}),
        ...(tipo ? { tipo } : {}),
        activo: true,
      },
      orderBy: { codigo: 'asc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const c = await this.prisma.cuentaPUC.findFirst({ where: { id: Number(id), empresaId } })
    if (!c) throw new NotFoundException('Cuenta no encontrada')
    return c
  }

  async findByCodigo(codigo: string, empresaId: number) {
    return this.prisma.cuentaPUC.findFirst({ where: { codigo: String(codigo).trim(), empresaId } })
  }

  async create(data: any, empresaId: number) {
    const codigo = String(data.codigo || '').trim()
    const nombre = String(data.nombre || '').trim()
    const nivel = Number(data.nivel || 5)
    const codigoPadre = data.codigoPadre?.trim() ? String(data.codigoPadre).trim() : null
    const naturaleza = data.naturaleza === 'CREDITO' ? 'CREDITO' : 'DEBITO'
    const tipo = String(data.tipo || 'ACTIVO').trim()

    if (!codigo || !nombre) {
      throw new BadRequestException('Código y nombre de cuenta son obligatorios')
    }

    const exists = await this.prisma.cuentaPUC.findUnique({
      where: { empresaId_codigo: { empresaId, codigo } },
    })
    if (exists) throw new ConflictException(`Ya existe la cuenta contable con código ${codigo}`)

    return this.prisma.cuentaPUC.create({
      data: {
        empresaId,
        codigo,
        nombre,
        nivel,
        codigoPadre,
        naturaleza,
        tipo,
        activo: data.activo !== false,
      },
    })
  }

  async update(id: number, data: any, empresaId: number) {
    await this.findOne(id, empresaId)
    const updateData: any = {}
    if (data.nombre !== undefined) updateData.nombre = String(data.nombre).trim()
    if (data.nivel !== undefined) updateData.nivel = Number(data.nivel)
    if (data.codigoPadre !== undefined) updateData.codigoPadre = data.codigoPadre?.trim() ? String(data.codigoPadre).trim() : null
    if (data.naturaleza !== undefined) updateData.naturaleza = data.naturaleza === 'CREDITO' ? 'CREDITO' : 'DEBITO'
    if (data.tipo !== undefined) updateData.tipo = String(data.tipo).trim()
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo)

    return this.prisma.cuentaPUC.update({ where: { id: Number(id) }, data: updateData })
  }

  async toggle(id: number, empresaId: number) {
    const c = await this.findOne(id, empresaId)
    return this.prisma.cuentaPUC.update({ where: { id: Number(id) }, data: { activo: !c.activo } })
  }

  /**
   * Sembrar el PUC estándar colombiano para una empresa.
   * Idempotente — omite cuentas que ya existen.
   */
  async seed(empresaId: number) {
    let creadas = 0
    let omitidas = 0
    for (const item of PUC_SEED) {
      const exists = await this.prisma.cuentaPUC.findUnique({
        where: { empresaId_codigo: { empresaId, codigo: item.codigo } },
      })
      if (!exists) {
        await this.prisma.cuentaPUC.create({ data: { ...item, empresaId } })
        creadas++
      } else {
        omitidas++
      }
    }
    return { creadas, omitidas, total: PUC_SEED.length }
  }

  // Árbol de cuentas (para selector jerárquico en UI)
  async arbol(empresaId: number) {
    const cuentas = await this.prisma.cuentaPUC.findMany({
      where: { empresaId, activo: true },
      orderBy: { codigo: 'asc' },
    })

    const map = new Map<string, any>()
    cuentas.forEach(c => map.set(c.codigo, { ...c, hijos: [] }))

    const raices: any[] = []
    cuentas.forEach(c => {
      if (c.codigoPadre && map.has(c.codigoPadre)) {
        map.get(c.codigoPadre).hijos.push(map.get(c.codigo))
      } else if (!c.codigoPadre) {
        raices.push(map.get(c.codigo))
      }
    })
    return raices
  }

  // Cuentas auxiliares (nivel >= 4) para comprobantes
  cuentasAuxiliares(empresaId: number, q?: string) {
    return this.prisma.cuentaPUC.findMany({
      where: {
        empresaId,
        nivel: { gte: 3 },
        activo: true,
        ...(q ? {
          OR: [
            { codigo: { startsWith: q } },
            { nombre: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { codigo: 'asc' },
      take: 50,
    })
  }
}
