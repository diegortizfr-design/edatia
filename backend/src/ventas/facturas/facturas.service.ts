import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateFacturaDto } from './dto/factura.dto'
import { CufeService } from './cufe.service'
import { UblService } from './ubl.service'
import { calcularItem, calcularTotales } from '../cotizaciones/cotizaciones.service'

const INCLUDE_FULL = {
  cliente: true,
  bodega: { select: { nombre: true, codigo: true } },
  resolucion: true,
  items: {
    include: { producto: { select: { sku: true, nombre: true, costoPromedio: true, unidadMedida: { select: { abreviatura: true } } } } },
    orderBy: { orden: 'asc' as const },
  },
  recibos: { include: { recibo: { select: { numero: true, fecha: true, valor: true } } } },
}

@Injectable()
export class FacturasService {
  constructor(
    private prisma: PrismaService,
    private cufeService: CufeService,
    private ublService: UblService,
  ) {}

  findAll(empresaId: number, params?: { clienteId?: number; estado?: string; desde?: string; hasta?: string }) {
    return this.prisma.facturaVenta.findMany({
      where: {
        empresaId,
        ...(params?.clienteId ? { clienteId: params.clienteId } : {}),
        ...(params?.estado ? { estado: params.estado } : {}),
        ...(params?.desde || params?.hasta ? {
          fecha: {
            ...(params.desde ? { gte: new Date(params.desde) } : {}),
            ...(params.hasta ? { lte: new Date(params.hasta) } : {}),
          },
        } : {}),
      },
      include: {
        cliente: { select: { nombre: true, numeroDocumento: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const f = await this.prisma.facturaVenta.findFirst({
      where: { id, empresaId },
      include: INCLUDE_FULL,
    })
    if (!f) throw new NotFoundException('Factura no encontrada')
    return f
  }

  async create(dto: CreateFacturaDto, empresaId: number, usuarioId: number) {
    const totales = calcularTotales(dto.items)
    const numero = await this.generarNumero(empresaId)

    // Obtener costos actuales (CPP) para el asiento contable
    const productosIds = [...new Set(dto.items.map(i => i.productoId))]
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productosIds }, empresaId },
      select: { id: true, costoPromedio: true },
    })
    const costoMap = new Map(productos.map(p => [p.id, Number(p.costoPromedio)]))

    const itemsConCosto = dto.items.map((item, idx) => {
      const r = calcularItem(item)
      const costoUnit = costoMap.get(item.productoId) ?? 0
      return {
        productoId: item.productoId,
        descripcion: item.descripcion,
        unidad: item.unidad ?? 'UND',
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuentoPct: item.descuentoPct ?? 0,
        descuentoValor: r.descuentoValor,
        tipoIva: item.tipoIva,
        baseIva: r.baseIva,
        ivaValor: r.ivaValor,
        subtotal: r.subtotal,
        total: r.total,
        costoUnitario: costoUnit,
        costoTotal: costoUnit * Number(item.cantidad),
        orden: item.orden ?? idx,
      }
    })

    const saldo = totales.total - Number(dto.retefuente ?? 0) - Number(dto.reteiva ?? 0) - Number(dto.reteica ?? 0)

    const factura = await this.prisma.facturaVenta.create({
      data: {
        empresaId,
        numero,
        clienteId: dto.clienteId,
        bodegaId: dto.bodegaId,
        cotizacionId: dto.cotizacionId,
        fecha: new Date(dto.fecha),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        formaPago: dto.formaPago,
        medioPago: dto.medioPago,
        retefuente: dto.retefuente ?? 0,
        reteiva: dto.reteiva ?? 0,
        reteica: dto.reteica ?? 0,
        notas: dto.notas,
        usuarioId,
        estado: 'BORRADOR',
        saldo,
        ...totales,
        items: { create: itemsConCosto },
      },
      include: INCLUDE_FULL,
    })

    // Si viene de cotización, marcarla como FACTURADA
    if (dto.cotizacionId) {
      await this.prisma.cotizacion.update({
        where: { id: dto.cotizacionId },
        data: { estado: 'FACTURADA' },
      })
    }

    return factura
  }

  /**
   * Emitir factura: descuenta inventario, genera CUFE/XML y cambia estado a EMITIDA
   */
  async emitir(id: number, empresaId: number, usuarioId: number) {
    const factura = await this.findOne(id, empresaId)
    if (factura.estado !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden emitir facturas en estado BORRADOR')
    }

    // ── 1. Descontar inventario ───────────────────────────────────────────────
    for (const item of factura.items as any[]) {
      const stock = await this.prisma.stock.findUnique({
        where: { productoId_bodegaId: { productoId: item.productoId, bodegaId: factura.bodegaId } },
      })
      const disponible = Number(stock?.cantidad ?? 0)
      const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId }, select: { permiteStockNegativo: true } })

      if (!empresa?.permiteStockNegativo && disponible < Number(item.cantidad)) {
        throw new BadRequestException(`Stock insuficiente para ${item.producto?.nombre ?? item.productoId}`)
      }

      // Movimiento de salida (VENTA)
      const ultimoMov = await this.prisma.movimientoInventario.findFirst({
        where: { empresaId, productoId: item.productoId },
        orderBy: { fechaMovimiento: 'desc' },
        select: { saldoCantidad: true, saldoCostoTotal: true, saldoCpp: true },
      })
      const saldoAnt = Number(ultimoMov?.saldoCantidad ?? disponible)
      const nuevoSaldo = saldoAnt - Number(item.cantidad)
      const cpp = Number(ultimoMov?.saldoCpp ?? item.costoUnitario)

      await this.prisma.stock.upsert({
        where: { productoId_bodegaId: { productoId: item.productoId, bodegaId: factura.bodegaId } },
        create: { empresaId, productoId: item.productoId, bodegaId: factura.bodegaId, cantidad: -Number(item.cantidad) },
        update: { cantidad: { decrement: Number(item.cantidad) } },
      })

      await this.prisma.movimientoInventario.create({
        data: {
          empresaId,
          numero: `VTA-${factura.numero}-${item.id}`,
          tipo: 'VENTA',
          concepto: `Factura ${factura.numero}`,
          productoId: item.productoId,
          bodegaOrigenId: factura.bodegaId,
          cantidad: Number(item.cantidad),
          costoUnitario: cpp,
          costoTotal: cpp * Number(item.cantidad),
          saldoCantidad: nuevoSaldo,
          saldoCostoTotal: nuevoSaldo * cpp,
          saldoCpp: cpp,
          usuarioId,
          referenciaId: String(factura.id),
          referenciaTipo: 'FACTURA_VENTA',
        },
      })
    }

    // ── 2. Generar CUFE + XML DIAN ────────────────────────────────────────────
    const config = await this.prisma.configuracionDIAN.findUnique({
      where: { empresaId },
      include: {
        resoluciones: {
          where: { tipoDocumento: '01', activo: true, fechaVigencia: { gte: new Date() } },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    })

    let cufe: string | null = null
    let qrUrl: string | null = null
    let xmlDIAN: string | null = null
    let numeroDIAN: number | null = null
    let prefijoDIAN: string | null = null
    let resolucionId: number | null = null

    if (config?.activo && config.resoluciones.length > 0) {
      const res = config.resoluciones[0]
      const updated = await this.prisma.resolucionDIAN.update({
        where: { id: res.id },
        data: { numeroCurrent: { increment: 1 } },
      })
      numeroDIAN = updated.numeroCurrent
      prefijoDIAN = res.prefijo
      resolucionId = res.id

      const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } })!
      const cliente = factura.cliente as any
      const nitOFE = empresa!.nit.replace(/[^0-9]/g, '').replace(/-.*/, '')
      const ambiente = config.ambiente === 'PRODUCCION' ? '1' : '2'
      const numFac = `${res.prefijo}${numeroDIAN}`
      const now = new Date(factura.fecha)
      const fecFac = now.toISOString().split('T')[0]
      const horFac = now.toTimeString().split(' ')[0] + '-05:00'

      cufe = this.cufeService.calcularCufe({
        numFac,
        fecFac,
        horFac,
        valFac: Number(factura.subtotal) - Number(factura.descuento),
        valImp1: Number(factura.iva19) + Number(factura.iva5),
        valImp2: 0,
        valImp3: 0,
        valTot: Number(factura.total),
        nitOFE,
        numAdq: cliente.numeroDocumento,
        claveTecnica: res.claveTecnica,
        ambiente,
      })

      const secCode = this.cufeService.calcularSoftwareSecurityCode(
        config.softwareId ?? '', config.softwarePin ?? '', numFac
      )
      qrUrl = this.cufeService.qrUrl(cufe, ambiente)

      xmlDIAN = this.ublService.buildFacturaXml({
        empresa: { ...empresa, digitoVerificacion: empresa!.digitoVerificacion },
        cliente,
        factura: { ...factura, numeroDIAN, formaPago: factura.formaPago, medioPago: factura.medioPago },
        items: factura.items as any[],
        resolucion: res,
        config,
        cufe,
        qrUrl,
        softwareSecurityCode: secCode,
      })
    }

    // ── 3. Asiento contable automático ───────────────────────────────────────
    await this.crearAsientoFactura(factura as any, empresaId, usuarioId)

    // ── 4. Actualizar factura ─────────────────────────────────────────────────
    return this.prisma.facturaVenta.update({
      where: { id },
      data: {
        estado: 'EMITIDA',
        cufe,
        qrUrl,
        xmlDIAN,
        estadoDIAN: cufe ? 'GENERADA' : 'PENDIENTE',
        numeroDIAN,
        prefijoDIAN,
        resolucionId,
        numero: numeroDIAN && prefijoDIAN !== null
          ? `${prefijoDIAN}${numeroDIAN}`
          : factura.numero,
      },
      include: INCLUDE_FULL,
    })
  }

  async anular(id: number, empresaId: number) {
    const f = await this.findOne(id, empresaId)
    if (!['BORRADOR', 'EMITIDA'].includes(f.estado)) {
      throw new BadRequestException('No se puede anular una factura PAGADA o ya ANULADA')
    }
    return this.prisma.facturaVenta.update({ where: { id }, data: { estado: 'ANULADA' } })
  }

  async getXml(id: number, empresaId: number): Promise<string> {
    const f = await this.findOne(id, empresaId)
    if (!f.xmlDIAN) throw new NotFoundException('Esta factura no tiene XML DIAN generado')
    return f.xmlDIAN
  }

  private async crearAsientoFactura(factura: any, empresaId: number, usuarioId: number) {
    // Buscar cuentas PUC necesarias
    const codigos = ['1305', '135515', '135517', '135518', '413505', '4135', '240801', '240802', '613505', '1435']
    const cuentas = await this.prisma.cuentaPUC.findMany({
      where: { empresaId, codigo: { in: codigos }, activo: true },
      select: { id: true, codigo: true },
    })
    const byCode = new Map(cuentas.map(c => [c.codigo, c.id]))

    const get = (pref: string) => byCode.get(pref) ?? null

    const cClientes  = get('1305')
    const cRete      = get('135515')
    const cReteIva   = get('135517')
    const cReteIca   = get('135518')
    const cIngresos  = get('413505') ?? get('4135')
    const cIva19     = get('240801')
    const cIva5      = get('240802')
    const cCostoVta  = get('613505')
    const cInventario = get('1435')

    // Valores
    const iva19      = Number(factura.iva19 ?? 0)
    const iva5       = Number(factura.iva5  ?? 0)
    const base       = Number(factura.subtotal) - Number(factura.descuento ?? 0)
    const retefuente = Number(factura.retefuente ?? 0)
    const reteiva    = Number(factura.reteiva    ?? 0)
    const reteica    = Number(factura.reteica    ?? 0)
    const saldo      = Number(factura.total) - retefuente - reteiva - reteica
    const costoTotal = factura.items.reduce((s: number, i: any) => s + Number(i.costoTotal ?? 0), 0)

    const lineas: { cuentaId: number; concepto: string; debito: number; credito: number }[] = []

    const push = (cuentaId: number | null, concepto: string, debito: number, credito: number) => {
      if (!cuentaId || (debito === 0 && credito === 0)) return
      lineas.push({ cuentaId, concepto, debito, credito })
    }

    // Débitos
    push(cClientes,  `Factura ${factura.numero}`, saldo,      0)
    push(cRete,      `ReteFuente Fact ${factura.numero}`,  retefuente, 0)
    push(cReteIva,   `ReteIVA Fact ${factura.numero}`,     reteiva,    0)
    push(cReteIca,   `ReteICA Fact ${factura.numero}`,     reteica,    0)
    // Créditos
    push(cIngresos,  `Venta Fact ${factura.numero}`,       0, base)
    push(cIva19,     `IVA 19% Fact ${factura.numero}`,     0, iva19)
    push(cIva5,      `IVA 5% Fact ${factura.numero}`,      0, iva5)

    // Asiento de costo de ventas
    push(cCostoVta,   `Costo Venta Fact ${factura.numero}`, costoTotal, 0)
    push(cInventario, `Salida inventario Fact ${factura.numero}`, 0,    costoTotal)

    if (lineas.length < 2) return // No hay PUC sembrado, omitir silenciosamente

    const totalDB = lineas.reduce((a, l) => a + l.debito,  0)
    const totalCR = lineas.reduce((a, l) => a + l.credito, 0)
    if (Math.abs(totalDB - totalCR) > 0.01) return // No cuadra (datos incompletos), omitir

    // Encontrar o crear período contable
    const fecha = new Date(factura.fecha)
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()
    const periodo = await this.prisma.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTO' },
      update: {},
    })

    // Número de comprobante
    const ultimo = await this.prisma.comprobante.findFirst({
      where: { empresaId, tipo: 'VENTA' },
      orderBy: { id: 'desc' },
      select: { numero: true },
    })
    const seq = ultimo ? parseInt(ultimo.numero.split('-').pop() ?? '0') + 1 : 1
    const numero = `VTA-${anio}-${String(seq).padStart(5, '0')}`

    await this.prisma.comprobante.create({
      data: {
        empresaId,
        tipo: 'VENTA',
        numero,
        fecha,
        concepto: `Factura de venta ${factura.numero}`,
        estado: 'ACTIVO',
        periodoId: periodo.id,
        usuarioId,
        lineas: { create: lineas },
      },
    })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.facturaVenta.findFirst({
      where: { empresaId },
      orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `FV-${year}-${String(seq).padStart(5, '0')}`
  }
}
