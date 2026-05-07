import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'

import { ComprobantesService } from '../contabilidad/comprobantes/comprobantes.service'

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private comprobantes: ComprobantesService,
  ) {}

  // ─── Cajas ───────────────────────────────────────────────────────────────────

  async getCajas(empresaId: number) {
    return this.prisma.cajaPos.findMany({
      where: { empresaId },
      include: {
        bodega: { select: { id: true, nombre: true, codigo: true } },
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
        sesiones: {
          where: { estado: 'ABIERTA' },
          select: { id: true, vendedorNombre: true, abiertaAt: true, montoInicial: true },
          take: 1,
        },
      },
      orderBy: { nombre: 'asc' },
    })
  }

  async createCaja(empresaId: number, dto: any) {
    return this.prisma.cajaPos.create({
      data: { ...dto, empresaId },
      include: {
        bodega: { select: { id: true, nombre: true } },
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
      },
    })
  }

  async updateCaja(empresaId: number, cajaId: number, dto: any) {
    await this.findCaja(empresaId, cajaId)
    return this.prisma.cajaPos.update({
      where: { id: cajaId },
      data: dto,
    })
  }

  private async findCaja(empresaId: number, cajaId: number) {
    const caja = await this.prisma.cajaPos.findFirst({ where: { id: cajaId, empresaId } })
    if (!caja) throw new NotFoundException('Caja no encontrada')
    return caja
  }

  // ─── Sesiones ────────────────────────────────────────────────────────────────

  async getSesiones(empresaId: number, cajaId?: number, estado?: string) {
    return this.prisma.sesionCaja.findMany({
      where: {
        empresaId,
        ...(cajaId ? { cajaId } : {}),
        ...(estado ? { estado } : {}),
      },
      include: {
        caja: { select: { id: true, nombre: true } },
        arqueo: true,
      },
      orderBy: { abiertaAt: 'desc' },
      take: 50,
    })
  }

  async getSesion(empresaId: number, sesionId: number) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: sesionId, empresaId },
      include: {
        caja: {
          include: {
            bodega: { select: { id: true, nombre: true } },
            cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
          },
        },
        ventas: {
          where: { estado: 'COMPLETADA' },
          orderBy: { fecha: 'desc' },
          take: 100,
          select: {
            id: true, numero: true, clienteNombre: true,
            total: true, pagoEfectivo: true, pagoTarjetaDebito: true,
            pagoTarjetaCredito: true, pagoNequi: true, pagoTransferencia: true,
            fecha: true, estado: true,
          },
        },
        movimientos: { orderBy: { createdAt: 'asc' } },
        arqueo: true,
      },
    })
    if (!sesion) throw new NotFoundException('Sesión no encontrada')
    return sesion
  }

  async abrirCaja(empresaId: number, dto: { cajaId: number; montoInicial: number; vendedorId?: number; vendedorNombre?: string }) {
    const caja = await this.findCaja(empresaId, dto.cajaId)

    // Verificar que no hay sesión abierta
    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { cajaId: dto.cajaId, estado: 'ABIERTA' },
    })
    if (sesionAbierta) throw new BadRequestException('Esta caja ya tiene una sesión abierta')

    const sesion = await this.prisma.sesionCaja.create({
      data: {
        empresaId,
        cajaId: dto.cajaId,
        montoInicial: dto.montoInicial,
        vendedorId: dto.vendedorId,
        vendedorNombre: dto.vendedorNombre ?? 'Vendedor',
        estado: 'ABIERTA',
      },
    })

    // Movimiento de apertura
    await this.prisma.movimientoCaja.create({
      data: {
        sesionId: sesion.id,
        tipo: 'APERTURA',
        concepto: 'Apertura de caja',
        monto: dto.montoInicial,
      },
    })

    return { ...sesion, caja }
  }

  async cerrarCaja(empresaId: number, sesionId: number, dto: {
    arqueo: {
      b100000?: number; b50000?: number; b20000?: number; b10000?: number
      b5000?: number; b2000?: number; b1000?: number
      m1000?: number; m500?: number; m200?: number; m100?: number; m50?: number
    }
    observaciones?: string
  }) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: sesionId, empresaId, estado: 'ABIERTA' },
    })
    if (!sesion) throw new BadRequestException('Sesión no encontrada o ya cerrada')

    // Calcular total contado
    const a = dto.arqueo
    const totalContado = new Decimal(0)
      .plus((a.b100000 ?? 0) * 100000)
      .plus((a.b50000 ?? 0) * 50000)
      .plus((a.b20000 ?? 0) * 20000)
      .plus((a.b10000 ?? 0) * 10000)
      .plus((a.b5000 ?? 0) * 5000)
      .plus((a.b2000 ?? 0) * 2000)
      .plus((a.b1000 ?? 0) * 1000)
      .plus((a.m1000 ?? 0) * 1000)
      .plus((a.m500 ?? 0) * 500)
      .plus((a.m200 ?? 0) * 200)
      .plus((a.m100 ?? 0) * 100)
      .plus((a.m50 ?? 0) * 50)

    const totalSistema = new Decimal(sesion.montoInicial).plus(sesion.totalEfectivo)
    const diferencia = totalContado.minus(totalSistema)

    // Crear arqueo
    await this.prisma.arqueoCaja.create({
      data: {
        sesionId,
        ...a,
        totalContado,
        totalSistema,
        diferencia,
        observaciones: dto.observaciones,
      },
    })

    // Movimiento de cierre
    await this.prisma.movimientoCaja.create({
      data: {
        sesionId,
        tipo: 'CIERRE',
        concepto: 'Cierre de caja',
        monto: totalContado,
      },
    })

    // Cerrar sesión
    const sesionCerrada = await this.prisma.sesionCaja.update({
      where: { id: sesionId },
      data: {
        estado: 'CERRADA',
        montoFinalDeclarado: totalContado,
        diferencia,
        observacionesCierre: dto.observaciones,
        cerradaAt: new Date(),
      },
      include: { caja: true, arqueo: true },
    })

    return sesionCerrada
  }

  async movimientoCaja(empresaId: number, sesionId: number, dto: { tipo: 'INGRESO' | 'RETIRO'; concepto: string; monto: number }) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: sesionId, empresaId, estado: 'ABIERTA' },
    })
    if (!sesion) throw new BadRequestException('Sesión no encontrada o cerrada')

    await this.prisma.movimientoCaja.create({
      data: { sesionId, ...dto },
    })

    // Actualizar total efectivo de la sesión
    const delta = dto.tipo === 'INGRESO' ? dto.monto : -dto.monto
    return this.prisma.sesionCaja.update({
      where: { id: sesionId },
      data: { totalEfectivo: { increment: delta } },
    })
  }

  // ─── Ventas POS ──────────────────────────────────────────────────────────────

  async getVentasPos(empresaId: number, sesionId?: number, fecha?: string) {
    const where: any = { empresaId }
    if (sesionId) where.sesionId = sesionId
    if (fecha) {
      const d = new Date(fecha)
      const desde = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const hasta = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      where.fecha = { gte: desde, lt: hasta }
    }
    return this.prisma.ventaPos.findMany({
      where,
      include: { items: { include: { producto: { select: { nombre: true, sku: true } } } } },
      orderBy: { fecha: 'desc' },
      take: 100,
    })
  }

  async crearVentaPos(empresaId: number, dto: {
    sesionId: number
    clienteId?: number
    clienteNombre?: string
    clienteDoc?: string
    vendedorId?: number
    vendedorNombre?: string
    descuento?: number
    pagoEfectivo?: number
    pagoTarjetaDebito?: number
    pagoTarjetaCredito?: number
    pagoTransferencia?: number
    pagoNequi?: number
    cambio?: number
    items: {
      productoId: number
      cantidad: number
      precioUnitario: number
      descuentoPct?: number
      tipoIva?: string
    }[]
  }) {
    // Verificar sesión abierta
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: dto.sesionId, empresaId, estado: 'ABIERTA' },
      include: { caja: { include: { bodega: true } } },
    })
    if (!sesion) throw new BadRequestException('Sesión no encontrada o cerrada')

    // Verificar stock para cada ítem
    for (const item of dto.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { productoId: item.productoId, bodegaId: sesion.caja.bodegaId },
      })
      const disponible = stock ? Number(stock.cantidad) - Number(stock.cantidadReservada) : 0
      if (disponible < item.cantidad) {
        const prod = await this.prisma.producto.findUnique({ where: { id: item.productoId } })
        const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId }, select: { permiteStockNegativo: true } })
        if (!empresa?.permiteStockNegativo) {
          throw new BadRequestException(`Stock insuficiente para "${prod?.nombre ?? item.productoId}". Disponible: ${disponible}`)
        }
      }
    }

    // Generar número de venta
    const año = new Date().getFullYear()
    const ultimaVenta = await this.prisma.ventaPos.findFirst({
      where: { empresaId, numero: { startsWith: `POS-${año}-` } },
      orderBy: { numero: 'desc' },
    })
    let seq = 1
    if (ultimaVenta) {
      const parts = ultimaVenta.numero.split('-')
      seq = parseInt(parts[parts.length - 1]) + 1
    }
    const numero = `POS-${año}-${String(seq).padStart(5, '0')}`

    // Calcular totales
    let subtotal = 0, descuentoTotal = 0, baseIva19 = 0, iva19 = 0, baseIva5 = 0, iva5 = 0

    const itemsCalculados = await Promise.all(dto.items.map(async (item) => {
      const prod = await this.prisma.producto.findUnique({ where: { id: item.productoId } })
      const tipoIva = item.tipoIva ?? prod?.tipoIva ?? 'GRAVADO_19'
      const descPct = item.descuentoPct ?? 0
      const bruto = item.cantidad * item.precioUnitario
      const descVal = bruto * descPct / 100
      const base = bruto - descVal

      let ivaVal = 0
      let baseIvaItem = 0
      if (tipoIva === 'GRAVADO_19' || tipoIva === 'IVA_19') { baseIvaItem = base; ivaVal = base * 0.19 }
      else if (tipoIva === 'GRAVADO_5' || tipoIva === 'IVA_5') { baseIvaItem = base; ivaVal = base * 0.05 }

      subtotal += bruto
      descuentoTotal += descVal
      if (tipoIva === 'GRAVADO_19' || tipoIva === 'IVA_19') { baseIva19 += baseIvaItem; iva19 += ivaVal }
      if (tipoIva === 'GRAVADO_5' || tipoIva === 'IVA_5') { baseIva5 += baseIvaItem; iva5 += ivaVal }

      return {
        productoId: item.productoId,
        descripcion: prod?.nombre ?? '',
        sku: prod?.sku,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuentoPct: descPct,
        descuentoValor: descVal,
        tipoIva: tipoIva.replace('GRAVADO_', 'IVA_'),
        baseIva: baseIvaItem,
        ivaValor: ivaVal,
        subtotal: base,
        total: base + ivaVal,
        costoUnitario: Number(prod?.costoPromedio ?? 0),
        costoTotal: Number(prod?.costoPromedio ?? 0) * item.cantidad,
      }
    }))

    // Descuento adicional sobre total
    const descuentoExtra = dto.descuento ?? 0
    const total = subtotal - descuentoTotal + iva19 + iva5 - descuentoExtra

    // Crear venta en transacción
    const venta = await this.prisma.$transaction(async (tx) => {
      // 1. Crear venta POS
      const v = await tx.ventaPos.create({
        data: {
          empresaId,
          sesionId: dto.sesionId,
          numero,
          clienteId: dto.clienteId ?? null,
          clienteNombre: dto.clienteNombre ?? 'Consumidor Final',
          clienteDoc: dto.clienteDoc,
          vendedorId: dto.vendedorId,
          vendedorNombre: dto.vendedorNombre,
          subtotal,
          descuento: descuentoTotal + descuentoExtra,
          baseIva19,
          iva19,
          baseIva5,
          iva5,
          total,
          pagoEfectivo: dto.pagoEfectivo ?? 0,
          pagoTarjetaDebito: dto.pagoTarjetaDebito ?? 0,
          pagoTarjetaCredito: dto.pagoTarjetaCredito ?? 0,
          pagoTransferencia: dto.pagoTransferencia ?? 0,
          pagoNequi: dto.pagoNequi ?? 0,
          cambio: dto.cambio ?? 0,
          estado: 'COMPLETADA',
          items: { create: itemsCalculados.map((it, i) => ({ ...it, orden: i })) },
        },
        include: { items: true },
      })

      // 2. Movimientos de inventario (salida)
      for (const item of itemsCalculados) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
        if (!prod?.manejaBodega) continue

        const stockRec = await tx.stock.findFirst({
          where: { productoId: item.productoId, bodegaId: sesion.caja.bodegaId },
        })
        const saldoAnt = stockRec ? Number(stockRec.cantidad) : 0
        const saldoNuevo = saldoAnt - item.cantidad
        const saldoCostoNuevo = saldoNuevo * item.costoUnitario

        await tx.movimientoInventario.create({
          data: {
            empresaId,
            numero: `POS-${numero}-${item.productoId}`,
            tipo: 'SALIDA',
            concepto: `Venta POS ${numero}`,
            productoId: item.productoId,
            bodegaOrigenId: sesion.caja.bodegaId,
            cantidad: -item.cantidad,
            costoUnitario: item.costoUnitario,
            costoTotal: -(item.costoTotal),
            saldoCantidad: saldoNuevo,
            saldoCostoTotal: saldoCostoNuevo,
            saldoCpp: item.costoUnitario,
            referenciaId: String(v.id),
            referenciaTipo: 'VENTA_POS',
          },
        })

        await tx.stock.upsert({
          where: { productoId_bodegaId: { productoId: item.productoId, bodegaId: sesion.caja.bodegaId } },
          create: { empresaId, productoId: item.productoId, bodegaId: sesion.caja.bodegaId, cantidad: saldoNuevo },
          update: { cantidad: { decrement: item.cantidad } },
        })
      }

      // 3. Actualizar totales de la sesión
      const pagoEfectivo = dto.pagoEfectivo ?? 0
      const pagoTarjeta = (dto.pagoTarjetaDebito ?? 0) + (dto.pagoTarjetaCredito ?? 0)
      const pagoTransferencia = dto.pagoTransferencia ?? 0
      const pagoNequi = dto.pagoNequi ?? 0

      await tx.sesionCaja.update({
        where: { id: dto.sesionId },
        data: {
          totalVentas: { increment: total },
          numTransacciones: { increment: 1 },
          totalEfectivo: { increment: pagoEfectivo },
          totalTarjeta: { increment: pagoTarjeta },
          totalTransferencia: { increment: pagoTransferencia },
          totalNequi: { increment: pagoNequi },
        },
      })

      // 4. Movimiento de caja
      await tx.movimientoCaja.create({
        data: {
          sesionId: dto.sesionId,
          tipo: 'VENTA',
          concepto: `Venta POS ${numero} - ${dto.clienteNombre ?? 'Consumidor Final'}`,
          monto: total,
          referencia: numero,
        },
      })

      // 5. Crear Asiento Contable Automático
      await this.crearAsientoVentaPos(tx, v, empresaId, dto.sesionId)

      return v
    })

    return venta
  }

  async anularVentaPos(empresaId: number, ventaId: number, motivo: string) {
    const venta = await this.prisma.ventaPos.findFirst({
      where: { id: ventaId, empresaId, estado: 'COMPLETADA' },
      include: { items: true, sesion: { include: { caja: true } } },
    })
    if (!venta) throw new NotFoundException('Venta no encontrada o ya anulada')
    if (venta.sesion.estado !== 'ABIERTA') throw new BadRequestException('Solo se puede anular en sesión abierta')

    await this.prisma.$transaction(async (tx) => {
      // Anular venta
      await tx.ventaPos.update({
        where: { id: ventaId },
        data: { estado: 'ANULADA', motivoAnulacion: motivo },
      })

      // Revertir inventario
      for (const item of venta.items) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
        if (!prod?.manejaBodega) continue

        await tx.stock.upsert({
          where: { productoId_bodegaId: { productoId: item.productoId, bodegaId: venta.sesion.caja.bodegaId } },
          create: { empresaId, productoId: item.productoId, bodegaId: venta.sesion.caja.bodegaId, cantidad: item.cantidad },
          update: { cantidad: { increment: Number(item.cantidad) } },
        })
      }

      // Revertir totales sesión
      await tx.sesionCaja.update({
        where: { id: venta.sesionId },
        data: {
          totalVentas: { decrement: Number(venta.total) },
          numTransacciones: { decrement: 1 },
          totalEfectivo: { decrement: Number(venta.pagoEfectivo) },
          totalTarjeta: { decrement: Number(venta.pagoTarjetaDebito) + Number(venta.pagoTarjetaCredito) },
          totalTransferencia: { decrement: Number(venta.pagoTransferencia) },
          totalNequi: { decrement: Number(venta.pagoNequi) },
          totalAnuladas: { increment: Number(venta.total) },
        },
      })

      await tx.movimientoCaja.create({
        data: {
          sesionId: venta.sesionId,
          tipo: 'ANULACION',
          concepto: `Anulación POS ${venta.numero}: ${motivo}`,
          monto: -Number(venta.total),
          referencia: venta.numero,
        },
      })
    })

    return { ok: true }
  }

  // ─── Dashboard POS ───────────────────────────────────────────────────────────

  async getDashboard(empresaId: number) {
    const hoy = new Date()
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)

    const [sesionesAbiertas, ventasHoy, cajas] = await Promise.all([
      this.prisma.sesionCaja.findMany({
        where: { empresaId, estado: 'ABIERTA' },
        include: { caja: { select: { nombre: true } } },
      }),
      this.prisma.ventaPos.aggregate({
        where: { empresaId, fecha: { gte: desde, lt: hasta }, estado: 'COMPLETADA' },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.cajaPos.findMany({
        where: { empresaId, activo: true },
        select: { id: true, nombre: true },
      }),
    ])

    return {
      sesionesAbiertas: sesionesAbiertas.length,
      detallesSesiones: sesionesAbiertas,
      ventasHoy: Number(ventasHoy._sum.total ?? 0),
      transaccionesHoy: ventasHoy._count.id,
      totalCajas: cajas.length,
    }
  }

  // ─── Búsqueda de productos para POS ──────────────────────────────────────────

  async buscarProductosPos(empresaId: number, q: string, bodegaId: number) {
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { codigoBarras: { equals: q } },
        ],
      },
      include: {
        stock: { where: { bodegaId }, select: { cantidad: true, cantidadReservada: true } },
      },
      take: 20,
    })

    return productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      sku: p.sku,
      codigoBarras: p.codigoBarras,
      precioBase: Number(p.precioBase),
      tipoIva: p.tipoIva,
      imagen: p.imagen,
      stock: p.stock[0] ? Number(p.stock[0].cantidad) - Number(p.stock[0].cantidadReservada) : 0,
    }))
  }

  // ─── Integración Contable ───────────────────────────────────────────────────

  private async crearAsientoVentaPos(tx: any, venta: any, empresaId: number, sesionId: number) {
    // 1. Obtener configuración de la sesión/caja para la cuenta de efectivo
    const sesion = await tx.sesionCaja.findUnique({
      where: { id: sesionId },
      include: { caja: true },
    })

    // 2. Definir cuentas (códigos estándar PUC Colombia)
    const codigos = ['1105', '4135', '240801', '240802', '6135', '1435']
    const cuentas = await tx.cuentaPUC.findMany({
      where: { empresaId, codigo: { in: codigos } },
    })
    const byCode = new Map(cuentas.map((c: any) => [c.codigo, c.id]))

    const cCaja = sesion?.caja?.cuentaPUCId || byCode.get('1105')
    const cIngresos = byCode.get('4135')
    const cIva19 = byCode.get('240801')
    const cIva5 = byCode.get('240802')
    const cCostoVta = byCode.get('6135')
    const cInventario = byCode.get('1435')

    if (!cCaja || !cIngresos) return // Sin configuración contable base, omitir

    // 3. Preparar líneas del asiento
    const lineas = []
    const desc = `Venta POS ${venta.numero}`

    // Débito a Caja (Total recibido)
    lineas.push({
      cuentaId: cCaja,
      descripcion: desc,
      debito: Number(venta.total),
      credito: 0,
      terceroNit: venta.clienteDoc,
      terceroNombre: venta.clienteNombre,
    })

    // Crédito a Ingresos (Base)
    lineas.push({
      cuentaId: cIngresos,
      descripcion: desc,
      debito: 0,
      credito: Number(venta.subtotal) - Number(venta.descuento),
      terceroNit: venta.clienteDoc,
      terceroNombre: venta.clienteNombre,
    })

    // Crédito a IVA
    if (Number(venta.iva19) > 0 && cIva19) {
      lineas.push({ cuentaId: cIva19, descripcion: `${desc} - IVA 19%`, debito: 0, credito: Number(venta.iva19) })
    }
    if (Number(venta.iva5) > 0 && cIva5) {
      lineas.push({ cuentaId: cIva5, descripcion: `${desc} - IVA 5%`, debito: 0, credito: Number(venta.iva5) })
    }

    // Costo de Ventas (si hay costo registrado)
    const costoTotal = venta.items.reduce((acc: number, item: any) => acc + Number(item.costoTotal || 0), 0)
    if (costoTotal > 0 && cCostoVta && cInventario) {
      lineas.push({ cuentaId: cCostoVta, descripcion: `Costo ${desc}`, debito: costoTotal, credito: 0 })
      lineas.push({ cuentaId: cInventario, descripcion: `Salida Inv ${desc}`, debito: 0, credito: costoTotal })
    }

    // 4. Validar partida doble (margen de error 0.01)
    const totalDb = lineas.reduce((acc, l) => acc + l.debito, 0)
    const totalCr = lineas.reduce((acc, l) => acc + l.credito, 0)
    if (Math.abs(totalDb - totalCr) > 0.1) return // No cuadra, no crear asiento para evitar errores

    // 5. Crear el comprobante
    const fecha = new Date(venta.fecha)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const periodo = await tx.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTA' },
      update: {},
    })

    const ultimo = await tx.comprobante.findFirst({
      where: { empresaId, tipo: 'POS' },
      orderBy: { id: 'desc' },
    })
    const seq = ultimo ? parseInt(ultimo.numero.split('-').pop() || '0') + 1 : 1
    const numeroComp = `POS-${anio}-${String(seq).padStart(5, '0')}`

    const comprobante = await tx.comprobante.create({
      data: {
        empresaId,
        numero: numeroComp,
        tipo: 'POS',
        concepto: `Venta POS ${venta.numero} - ${venta.clienteNombre}`,
        fecha,
        periodoId: periodo.id,
        referenciaId: venta.id,
        referenciaTipo: 'VENTA_POS',
        lineas: {
          create: lineas.map((l, idx) => ({ ...l, orden: idx })),
        },
      },
    })

    // 6. Vincular comprobante a la venta
    await tx.ventaPos.update({
      where: { id: venta.id },
      data: { comprobanteId: comprobante.id },
    })
  }
}
