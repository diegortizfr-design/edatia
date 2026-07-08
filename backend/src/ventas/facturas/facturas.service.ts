import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateFacturaDto } from './dto/factura.dto'
import { CufeService } from './cufe.service'
import { UblService } from './ubl.service'
import { MovimientosService } from '../../inventario/movimientos/movimientos.service'
import { calcularItem, calcularTotales } from '../cotizaciones/cotizaciones.service'

const INCLUDE_FULL = {
  cliente: true,
  empresa: true,
  bodega: { select: { nombre: true, codigo: true } },
  resolucion: true,
  pedido: true,
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
    private movimientos: MovimientosService,
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

    // ── 1. Cargar Configuración DIAN y resoluciones activas ──────────────────────
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

    return this.prisma.$transaction(async (tx) => {
      let cufe: string | null = null
      let qrUrl: string | null = null
      let xmlDIAN: string | null = null
      let numeroDIAN: number | null = null
      let prefijoDIAN: string | null = null
      let resolucionId: number | null = null
      let numero = dto.numero

      if (config?.activo && config.resoluciones.length > 0) {
        const res = config.resoluciones[0]
        const updated = await tx.resolucionDIAN.update({
          where: { id: res.id },
          data: { numeroCurrent: { increment: 1 } },
        })
        numeroDIAN = updated.numeroCurrent
        prefijoDIAN = res.prefijo
        resolucionId = res.id
        numero = `${prefijoDIAN}${numeroDIAN}`
      }

      if (!numero) {
        numero = await this.generarNumero(empresaId, dto.tipoDocumento || 'FV', tx)
      }

      // Obtener costos actuales (CPP) para el asiento contable
      const productosIds = [...new Set(dto.items.map(i => i.productoId))]
      const productos = await tx.producto.findMany({
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

      const factura = await tx.facturaVenta.create({
        data: {
          empresaId,
          numero,
          clienteId: dto.clienteId,
          bodegaId: dto.bodegaId,
          cotizacionId: dto.cotizacionId,
          pedidoId: dto.pedidoId,
          fecha: new Date(dto.fecha),
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
          formaPago: dto.formaPago,
          medioPago: dto.medioPago,
          retefuente: dto.retefuente ?? 0,
          reteiva: dto.reteiva ?? 0,
          reteica: dto.reteica ?? 0,
          notas: dto.notas,
          usuarioId,
          estado: 'CREADA',
          saldo,
          vendedorNombre: dto.vendedorNombre,
          vendedorId: dto.vendedorId,
          atendidoPor: dto.atendidoPor,
          canal: dto.canal,
          nivel: dto.nivel,
          imprimeDcto: dto.imprimeDcto ?? true,
          tipoDocumento: dto.tipoDocumento ?? 'FV',
          direccion: dto.direccion,
          sucursalCliente: dto.sucursalCliente,
          cufe,
          qrUrl,
          xmlDIAN,
          estadoDIAN: 'PENDIENTE',
          numeroDIAN,
          prefijoDIAN,
          resolucionId,
          ...totales,
          items: { create: itemsConCosto },
        },
        include: INCLUDE_FULL,
      })

      // Si viene de cotización, marcarla como FACTURADA
      if (dto.cotizacionId) {
        await tx.cotizacion.update({
          where: { id: dto.cotizacionId },
          data: { estado: 'FACTURADA' },
        })
      }

      // Si viene de pedido, marcarlo como FACTURADO
      if (dto.pedidoId) {
        await tx.pedidoVenta.update({
          where: { id: dto.pedidoId },
          data: { estado: 'FACTURADO' },
        })
      }

      // ── 3. Descontar inventario (Kardex) ───────────────────────────────────────
      for (const item of factura.items as any[]) {
        await this.movimientos.registrarSalidaInterna(tx, {
          empresaId,
          productoId: item.productoId,
          bodegaId: factura.bodegaId,
          cantidad: Number(item.cantidad),
          concepto: `Factura ${factura.numero}`,
          tipo: 'VENTA',
          usuarioId,
          referenciaId: String(factura.id),
          referenciaTipo: 'FACTURA_VENTA',
          numeroMov: `VTA-${factura.numero}-${item.id}`,
        })
      }

      // ── 4. Generar asiento contable automático ────────────────────────────────
      await this.crearAsientoFactura(factura as any, empresaId, usuarioId, tx)

      return factura
    })
  }

  async emitir(id: number, empresaId: number, usuarioId: number) {
    const factura = await this.findOne(id, empresaId)
    if (factura.estado !== 'CREADA') {
      throw new BadRequestException('Solo se pueden emitir facturas en estado CREADA')
    }

    // ── 1. Generar CUFE + XML DIAN ────────────────────────────────────────────
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
    let numeroDIAN: number | null = factura.numeroDIAN
    let prefijoDIAN: string | null = factura.prefijoDIAN
    let resolucionId: number | null = factura.resolucionId

    if (config?.activo && config.resoluciones.length > 0) {
      let res = config.resoluciones[0]
      if (!resolucionId) {
        const updated = await this.prisma.resolucionDIAN.update({
          where: { id: res.id },
          data: { numeroCurrent: { increment: 1 } },
        })
        numeroDIAN = updated.numeroCurrent
        prefijoDIAN = res.prefijo
        resolucionId = res.id
      } else {
        const specificRes = await this.prisma.resolucionDIAN.findUnique({
          where: { id: resolucionId },
        })
        if (specificRes) {
          res = specificRes
        }
      }

      const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } })
      const cliente = factura.cliente as any
      const nitOFE = empresa!.nit.replace(/[^0-9]/g, '').replace(/-.*/, '')
      const ambiente = config.ambiente === 'PRODUCCION' ? '1' : '2'
      const numFac = `${prefijoDIAN}${numeroDIAN}`
      const now = new Date()
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
        empresa: { ...empresa!, digitoVerificacion: empresa!.digitoVerificacion },
        cliente,
        factura: { 
          ...factura, 
          numeroDIAN, 
          prefijoDIAN,
          numero: numFac, 
          formaPago: factura.formaPago, 
          medioPago: factura.medioPago,
          fecha: now,
        },
        items: factura.items as any[],
        resolucion: res,
        config,
        cufe,
        qrUrl,
        softwareSecurityCode: secCode,
      })
    }

    // Nota: El descuento de inventario y el asiento contable ya se crearon en el método `create` al quedar la factura en estado `CREADA`

    // ── 2. Actualizar factura a EMITIDA ────────────────────────────────────────
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
        numero: (numeroDIAN && prefijoDIAN !== null)
          ? `${prefijoDIAN}${numeroDIAN}`
          : factura.numero,
      },
      include: INCLUDE_FULL,
    })
  }

  async anular(id: number, empresaId: number) {
    const f = await this.findOne(id, empresaId)
    if (!['CREADA', 'EMITIDA'].includes(f.estado)) {
      throw new BadRequestException('No se puede anular una factura PAGADA o ya ANULADA')
    }
    return this.prisma.facturaVenta.update({ where: { id }, data: { estado: 'ANULADA' } })
  }

  async getXml(id: number, empresaId: number): Promise<string> {
    const f = await this.findOne(id, empresaId)
    if (!f.xmlDIAN) throw new NotFoundException('Esta factura no tiene XML DIAN generado')
    return f.xmlDIAN
  }
  private async crearAsientoFactura(factura: any, empresaId: number, usuarioId: number, tx?: any) {
    const client = tx || this.prisma;
    // ── 1. Determinar cuenta de cargo (Clientes o Caja/Banco) ─────────────────
    let cuentaCargoId: number | null = null;
    let cuentaCargoCodigo = '1305'; // fallback por defecto si no cuadra nada

    // Consultar Forma de Pago
    const fp = await client.formaPago.findFirst({
      where: { empresaId, codigo: factura.formaPago },
    });

    const esCredito = fp ? fp.generaCartera : (factura.formaPago !== 'CONTADO');

    if (esCredito) {
      cuentaCargoCodigo = '1305';
    } else {
      const mp = await client.medioPago.findFirst({
        where: { empresaId, codigo: factura.medioPago },
        include: { cajaBanco: true },
      });

      if (mp?.cajaBanco?.cuentaPUC) {
        cuentaCargoCodigo = mp.cajaBanco.cuentaPUC;
      } else {
        cuentaCargoCodigo = '110505';
      }
    }

    // Asegurar que la cuenta contable existe en el PUC
    let dbCuentaCargo = await client.cuentaPUC.findFirst({
      where: { empresaId, codigo: cuentaCargoCodigo, activo: true },
      select: { id: true },
    });

    if (!dbCuentaCargo) {
      dbCuentaCargo = await client.cuentaPUC.findFirst({
        where: { empresaId, codigo: esCredito ? '1305' : '1105', activo: true },
        select: { id: true },
      }) ?? await client.cuentaPUC.findFirst({
        where: { empresaId, codigo: { startsWith: esCredito ? '13' : '11' }, activo: true },
        select: { id: true },
      });
    }

    cuentaCargoId = dbCuentaCargo?.id ?? null;

    // Buscar cuentas PUC necesarias
    const codigos = ['135515', '135517', '135518', '413505', '4135', '240801', '240802', '613505', '1435']
    const cuentas = await client.cuentaPUC.findMany({
      where: { empresaId, codigo: { in: codigos }, activo: true },
      select: { id: true, codigo: true },
    })
    const byCode = new Map<string, number>(cuentas.map((c: any) => [c.codigo as string, c.id as number]))

    const get = (pref: string) => byCode.get(pref) ?? null

    const cClientes  = cuentaCargoId
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

    const lineas: { cuentaId: number; descripcion: string; debito: number; credito: number }[] = []

    const push = (cuentaId: number | null, descripcion: string, debito: number, credito: number) => {
      if (!cuentaId || (debito === 0 && credito === 0)) return
      lineas.push({ cuentaId, descripcion, debito, credito })
    }

    // Débitos
    push(cClientes,  `Factura ${factura.numero}`, saldo,      0)
    push(cRete,      `ReteFuente Fact ${factura.numero}`,  retefuente, 0)
    push(cReteIva,   `ReteIVA Fact ${factura.numero}`,     reteiva,    0)
    push(cReteIca,   `ReteICA Fact ${factura.numero}`,     reteica,    0)

    // Créditos
    // Crédito a Ingresos por producto (Grupo contable)
    for (const item of factura.items) {
      const product = await client.producto.findUnique({
        where: { id: item.productoId },
        include: { grupo: true }
      })

      let cIngresoItem = cIngresos
      const customIngresoCode = (product?.grupo?.contable as any)?.ingresoEnVentas
      if (customIngresoCode) {
        const customAcc = await client.cuentaPUC.findFirst({
          where: { empresaId, codigo: customIngresoCode }
        })
        if (customAcc) cIngresoItem = customAcc.id
      }

      const itemMonto = Number(item.subtotal) - Number(item.descuentoValor || 0)
      if (itemMonto > 0 && cIngresoItem) {
        push(cIngresoItem, `Venta Fact ${factura.numero} - ${item.descripcion}`, 0, itemMonto)
      }
    }

    push(cIva19,     `IVA 19% Fact ${factura.numero}`,     0, iva19)
    push(cIva5,      `IVA 5% Fact ${factura.numero}`,      0, iva5)

    // Asiento de costo de ventas por producto (Grupo contable / Clasificación)
    for (const item of factura.items) {
      const cTotal = Number(item.costoTotal || 0)
      if (cTotal > 0) {
        const product = await client.producto.findUnique({
          where: { id: item.productoId },
          include: { clasificacion: true, grupo: true }
        })

        let cInvId = cInventario
        const customInvCode = (product?.grupo?.contable as any)?.inventarioVenta
        if (customInvCode) {
          const customInv = await client.cuentaPUC.findFirst({
            where: { empresaId, codigo: customInvCode }
          })
          if (customInv) cInvId = customInv.id
        } else if (product?.clasificacion?.pucCuenta) {
          const customInv = await client.cuentaPUC.findFirst({
            where: { empresaId, codigo: product.clasificacion.pucCuenta }
          })
          if (customInv) cInvId = customInv.id
        }

        let cCostoVtaId = cCostoVta
        const customCostoCode = (product?.grupo?.contable as any)?.costoEnVentas
        if (customCostoCode) {
          const customCosto = await client.cuentaPUC.findFirst({
            where: { empresaId, codigo: customCostoCode }
          })
          if (customCosto) cCostoVtaId = customCosto.id
        }

        push(cCostoVtaId, `Costo Venta Fact ${factura.numero} - ${item.descripcion}`, cTotal, 0)
        push(cInvId, `Salida inventario Fact ${factura.numero} - ${item.descripcion}`, 0, cTotal)
      }
    }

    if (lineas.length < 2) return // No hay PUC sembrado, omitir silenciosamente

    const totalDB = lineas.reduce((a, l) => a + l.debito,  0)
    const totalCR = lineas.reduce((a, l) => a + l.credito, 0)
    if (Math.abs(totalDB - totalCR) > 0.01) return // No cuadra (datos incompletos), omitir

    // Encontrar o crear período contable
    const fecha = new Date(factura.fecha)
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()
    const periodo = await client.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTO' },
      update: {},
    })

    // Número de comprobante
    const ultimo = await client.comprobante.findFirst({
      where: { empresaId, tipo: 'VENTA' },
      orderBy: { id: 'desc' },
      select: { numero: true },
    })
    const seq = ultimo ? parseInt(ultimo.numero.split('-').pop() ?? '0') + 1 : 1
    const numero = `VTA-${anio}-${String(seq).padStart(5, '0')}`

    await client.comprobante.create({
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

  private async generarNumero(empresaId: number, tipoDocumento = 'FV', tx?: any): Promise<string> {
    const client = tx || this.prisma
    const last = await client.facturaVenta.findFirst({
      where: { empresaId, tipoDocumento },
      orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    const prefix = tipoDocumento === 'FVE' ? 'FVE' : 'FV'
    return `${prefix}-${year}-${String(seq).padStart(5, '0')}`
  }
}
