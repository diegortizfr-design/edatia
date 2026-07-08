import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateNotaCreditoDto } from './dto/nota-credito.dto'
import { calcularItem } from '../cotizaciones/cotizaciones.service'
import { MovimientosService } from '../../inventario/movimientos/movimientos.service'

@Injectable()
export class NotasCreditoService {
  constructor(
    private prisma: PrismaService,
    private movimientos: MovimientosService,
  ) {}

  findAll(empresaId: number, facturaId?: number) {
    return this.prisma.notaCredito.findMany({
      where: { empresaId, ...(facturaId ? { facturaId } : {}) },
      include: {
        cliente: { select: { nombre: true } },
        factura: { select: { numero: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number, empresaId: number) {
    const nc = await this.prisma.notaCredito.findFirst({
      where: { id, empresaId },
      include: { cliente: true, factura: true, items: true, empresa: true },
    })
    if (!nc) throw new NotFoundException('Nota crédito no encontrada')
    return nc
  }

  async create(dto: CreateNotaCreditoDto, empresaId: number, usuarioId: number) {
    let clienteId: number
    let facturaBodegaId: number | null = null

    if (dto.facturaId) {
      const factura = await this.prisma.facturaVenta.findFirst({
        where: { id: dto.facturaId, empresaId },
      })
      if (!factura) throw new NotFoundException('Factura no encontrada')
      if (factura.estado === 'ANULADA') throw new BadRequestException('La factura está anulada')
      clienteId = factura.clienteId
      facturaBodegaId = factura.bodegaId
    } else {
      if (!dto.clienteId) throw new BadRequestException('Debe proporcionar un cliente para la nota crédito')
      const cliente = await this.prisma.tercero.findFirst({
        where: { id: dto.clienteId, empresaId },
      })
      if (!cliente) throw new NotFoundException('Cliente no encontrado')
      clienteId = dto.clienteId
    }

    let subtotal = 0, iva = 0
    const itemsData = dto.items.map(item => {
      const r = calcularItem(item)
      subtotal += r.subtotal
      iva += r.ivaValor
      return {
        productoId: item.productoId ?? null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        tipoIva: item.tipoIva,
        ivaValor: r.ivaValor,
        subtotal: r.subtotal,
        total: r.total,
      }
    })
    const total = subtotal + iva
    const numero = dto.numero || await this.generarNumero(empresaId)

    // Ejecutar todo el registro en una transacción
    const nc = await this.prisma.$transaction(async (tx) => {
      // 1. Crear registro de Nota de Crédito en estado CREADA
      const record = await tx.notaCredito.create({
        data: {
          empresaId,
          numero,
          facturaId: dto.facturaId ?? null,
          clienteId,
          motivo: dto.motivo,
          descripcion: dto.descripcion,
          subtotal,
          iva,
          total,
          estado: 'CREADA',
          estadoDIAN: 'PENDIENTE',
          usuarioId,
          items: { create: itemsData },
        },
        include: { items: true, cliente: true, factura: true },
      })

      // 2. Si viene de una factura, cruzar el saldo financiero de la factura de forma inmediata
      if (dto.facturaId) {
        const factura = await tx.facturaVenta.findFirst({
          where: { id: dto.facturaId, empresaId },
        })
        if (!factura) throw new NotFoundException('Factura de referencia no encontrada')

        const valorNota = Number(record.total)
        const nuevoSaldo = Math.max(0, Number(factura.saldo) - valorNota)
        const nuevoEstado = nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL'

        await tx.facturaVenta.update({
          where: { id: dto.facturaId },
          data: {
            saldo: nuevoSaldo,
            estado: nuevoEstado,
            totalPagado: { increment: valorNota },
          },
        })
      }

      // 3. Registrar retorno al Kardex (inventario) si aplica (motivo DEVOLUCION o ANULACION)
      const retornaInventario = dto.motivo === 'DEVOLUCION' || dto.motivo === 'ANULACION'
      if (retornaInventario) {
        // Resolver bodega de destino
        let bodegaDestinoId = dto.bodegaId

        if (!bodegaDestinoId) {
          // Intentar buscar bodega de devoluciones
          const bodegaDevoluciones = await tx.bodega.findFirst({
            where: { empresaId, nombre: { contains: 'devoluciones', mode: 'insensitive' } }
          })
          if (bodegaDevoluciones) {
            bodegaDestinoId = bodegaDevoluciones.id
          } else {
            // Usar bodega origen de la factura o la primera bodega activa
            bodegaDestinoId = facturaBodegaId || undefined
            if (!bodegaDestinoId) {
              const primeraBodega = await tx.bodega.findFirst({ where: { empresaId, activo: true } })
              if (primeraBodega) bodegaDestinoId = primeraBodega.id
            }
          }
        }

        if (bodegaDestinoId) {
          for (const item of record.items) {
            if (!item.productoId) continue
            await this.movimientos.registrarEntradaInterna(tx, {
              empresaId,
              productoId: item.productoId,
              bodegaId: bodegaDestinoId,
              cantidad: Number(item.cantidad),
              concepto: `Devolución Nota Crédito ${record.numero}`,
              tipo: 'ENTRADA',
              usuarioId,
              referenciaId: String(record.id),
              referenciaTipo: 'NOTA_CREDITO',
              numeroMov: `NC-${record.numero}-${item.id}`,
            })
          }
        }
      }

      // 4. Crear Asiento Contable Automático
      await this.crearAsientoNotaCredito(tx, record, empresaId, usuarioId)

      return record
    })

    return nc
  }

  async emitir(id: number, empresaId: number, usuarioId: number) {
    const nc = await this.findOne(id, empresaId)
    if (nc.estado !== 'CREADA') {
      throw new BadRequestException('Solo se pueden emitir notas crédito en estado CREADA')
    }

    // Emisión DIAN (actualización de estado para firma electrónica)
    return this.prisma.notaCredito.update({
      where: { id },
      data: {
        estado: 'EMITIDA',
        estadoDIAN: 'ACEPTADA',
      },
      include: { items: true, cliente: true, factura: true },
    })
  }

  async anular(id: number, empresaId: number) {
    const nc = await this.findOne(id, empresaId)
    if (nc.estado === 'ANULADA') throw new BadRequestException('La nota crédito ya está anulada')
    if (nc.estado === 'EMITIDA') {
      throw new BadRequestException('No se puede anular/revertir una nota crédito ya emitida electrónicamente')
    }

    return this.prisma.$transaction(async (tx) => {
      // Revertir cruce de saldo en factura
      if (nc.facturaId) {
        const factura = await tx.facturaVenta.findFirst({
          where: { id: nc.facturaId, empresaId },
        })
        if (factura) {
          const total = Number(nc.total)
          const nuevoSaldo = Number(factura.saldo) + total
          const nuevoTotalPagado = Math.max(0, Number(factura.totalPagado) - total)
          const nuevoEstado = nuevoSaldo === Number(factura.total) ? 'EMITIDA' : 'PARCIAL'

          await tx.facturaVenta.update({
            where: { id: nc.facturaId },
            data: {
              saldo: nuevoSaldo,
              totalPagado: nuevoTotalPagado,
              estado: nuevoEstado,
            },
          })
        }
      }

      // Revertir inventario si se ingresó stock
      const retornaInventario = nc.motivo === 'DEVOLUCION' || nc.motivo === 'ANULACION'
      if (retornaInventario) {
        // Encontrar la bodega a la que se devolvió stock
        const primerMov = await tx.movimientoInventario.findFirst({
          where: { referenciaId: String(nc.id), referenciaTipo: 'NOTA_CREDITO', tipo: 'ENTRADA' }
        })
        const bodegaDestinoId = primerMov?.bodegaDestinoId
        if (bodegaDestinoId) {
          for (const item of nc.items) {
            if (!item.productoId) continue
            await this.movimientos.registrarSalidaInterna(tx, {
              empresaId,
              productoId: item.productoId,
              bodegaId: bodegaDestinoId,
              cantidad: Number(item.cantidad),
              concepto: `Anulación Nota Crédito ${nc.numero}`,
              tipo: 'SALIDA',
              referenciaId: String(nc.id),
              referenciaTipo: 'NOTA_CREDITO_ANULADA',
              numeroMov: `NC-ANUL-${nc.numero}-${item.id}`,
            })
          }
        }
      }

      // Anular comprobante contable si existe
      const comprobante = await tx.comprobante.findFirst({
        where: { empresaId, referenciaId: nc.id, referenciaTipo: 'NOTA_CREDITO' }
      })
      if (comprobante) {
        await tx.comprobante.update({
          where: { id: comprobante.id },
          data: { estado: 'ANULADO' }
        })
      }

      return tx.notaCredito.update({
        where: { id },
        data: { estado: 'ANULADA' },
        include: { items: true, cliente: true, factura: true },
      })
    })
  }

  private async generarNumero(empresaId: number): Promise<string> {
    const last = await this.prisma.notaCredito.findFirst({
      where: { empresaId }, orderBy: { id: 'desc' },
    })
    const year = new Date().getFullYear()
    const seq = last ? parseInt(last.numero.split('-').pop() ?? '0') + 1 : 1
    return `NC-${year}-${String(seq).padStart(5, '0')}`
  }

  private async crearAsientoNotaCredito(tx: any, nc: any, empresaId: number, usuarioId: number) {
    // 1. Obtener códigos contables
    const codigos = ['1305', '4175', '4135', '240801', '240802', '6135', '1435']
    const cuentas = await tx.cuentaPUC.findMany({
      where: { empresaId, codigo: { in: codigos }, activo: true },
      select: { id: true, codigo: true },
    })
    const byCode = new Map<string, number>(cuentas.map((c: any) => [c.codigo as string, c.id as number]))

    let cuentaCreditoId: number | null = null
    let cuentaCreditoCodigo = '1305' // Fallback por defecto

    if (nc.facturaId) {
      const factura = await tx.facturaVenta.findFirst({
        where: { id: nc.facturaId, empresaId },
      })
      if (factura) {
        const fp = await tx.formaPago.findFirst({
          where: { empresaId, codigo: factura.formaPago },
        })
        const esCredito = fp ? fp.generaCartera : (factura.formaPago !== 'CONTADO')
        if (!esCredito) {
          const mp = await tx.medioPago.findFirst({
            where: { empresaId, codigo: factura.medioPago },
            include: { cajaBanco: true },
          })
          if (mp?.cajaBanco?.cuentaPUC) {
            cuentaCreditoCodigo = mp.cajaBanco.cuentaPUC
          } else {
            cuentaCreditoCodigo = '110505'
          }
        }
      }
    }

    let dbCuentaCredito = await tx.cuentaPUC.findFirst({
      where: { empresaId, codigo: cuentaCreditoCodigo, activo: true },
      select: { id: true },
    })
    if (!dbCuentaCredito) {
      dbCuentaCredito = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: '1305', activo: true },
        select: { id: true },
      })
    }
    cuentaCreditoId = dbCuentaCredito?.id ?? null

    const lineas = []
    const desc = `Nota Crédito ${nc.numero}`

    // Acreditación a Clientes/Caja/Banco (Total reversado)
    if (cuentaCreditoId) {
      lineas.push({
        cuentaId: cuentaCreditoId,
        descripcion: desc,
        debito: 0,
        credito: Number(nc.total),
        terceroNit: nc.cliente?.nit || null,
        terceroNombre: nc.cliente?.nombre || null,
      })
    }

    // Débito a Devoluciones de Ingresos
    const cIngresosFallback = byCode.get('4175') || byCode.get('4135')

    for (const item of nc.items) {
      if (!item.productoId) continue
      const product = await tx.producto.findUnique({
        where: { id: item.productoId },
        include: { grupo: true }
      })

      let cIngresoItem = cIngresosFallback
      const customIngresoCode = (product?.grupo?.contable as any)?.ingresoEnVentas
      if (customIngresoCode) {
        const customAcc = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: customIngresoCode }
        })
        if (customAcc) cIngresoItem = customAcc.id
      }

      const itemMonto = Number(item.subtotal)
      if (itemMonto > 0 && cIngresoItem) {
        lineas.push({
          cuentaId: cIngresoItem,
          descripcion: `${desc} - Devolución ${item.descripcion}`,
          debito: itemMonto,
          credito: 0,
          terceroNit: nc.cliente?.nit || null,
          terceroNombre: nc.cliente?.nombre || null,
        })
      }
    }

    // Débito a IVA devuelto
    const cIva19 = byCode.get('240801')
    const cIva5 = byCode.get('240802')

    let iva19Acum = 0
    let iva5Acum = 0

    for (const item of nc.items) {
      const ivaVal = Number(item.ivaValor || 0)
      if (ivaVal > 0) {
        if (item.tipoIva === 'IVA_19' || item.tipoIva === 'GRAVADO_19') iva19Acum += ivaVal
        else if (item.tipoIva === 'IVA_5' || item.tipoIva === 'GRAVADO_5') iva5Acum += ivaVal
      }
    }

    if (iva19Acum > 0 && cIva19) {
      lineas.push({
        cuentaId: cIva19,
        descripcion: `${desc} - IVA 19% Devuelto`,
        debito: iva19Acum,
        credito: 0,
        terceroNit: nc.cliente?.nit || null,
        terceroNombre: nc.cliente?.nombre || null,
      })
    }
    if (iva5Acum > 0 && cIva5) {
      lineas.push({
        cuentaId: cIva5,
        descripcion: `${desc} - IVA 5% Devuelto`,
        debito: iva5Acum,
        credito: 0,
        terceroNit: nc.cliente?.nit || null,
        terceroNombre: nc.cliente?.nombre || null,
      })
    }

    // Kardex Contable (inventario) si aplica (motivo DEVOLUCION o ANULACION)
    const retornaInventario = nc.motivo === 'DEVOLUCION' || nc.motivo === 'ANULACION'
    if (retornaInventario) {
      const cInventario = byCode.get('1435')
      const cCostoVta = byCode.get('6135')

      for (const item of nc.items) {
        if (!item.productoId) continue
        const product = await tx.producto.findUnique({
          where: { id: item.productoId },
          include: { clasificacion: true, grupo: true }
        })
        const cpp = Number(product?.costoPromedio ?? 0)
        const costoTotalItem = cpp * Number(item.cantidad)

        if (costoTotalItem > 0) {
          let cInvId = cInventario
          const customInvCode = (product?.grupo?.contable as any)?.inventarioVenta
          if (customInvCode) {
            const customInv = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: customInvCode }
            })
            if (customInv) cInvId = customInv.id
          } else if (product?.clasificacion?.pucCuenta) {
            const customInv = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: product.clasificacion.pucCuenta }
            })
            if (customInv) cInvId = customInv.id
          }

          let cCostoVtaId = cCostoVta
          const customCostoCode = (product?.grupo?.contable as any)?.costoEnVentas
          if (customCostoCode) {
            const customCosto = await tx.cuentaPUC.findFirst({
              where: { empresaId, codigo: customCostoCode }
            })
            if (customCosto) cCostoVtaId = customCosto.id
          }

          if (cInvId && cCostoVtaId) {
            // Débito a Inventario (entra mercancía)
            lineas.push({
              cuentaId: cInvId,
              descripcion: `${desc} - Ingreso Inv ${item.descripcion}`,
              debito: costoTotalItem,
              credito: 0,
              terceroNit: nc.cliente?.nit || null,
              terceroNombre: nc.cliente?.nombre || null,
            })
            // Crédito a Costo de Ventas (se reduce costo)
            lineas.push({
              cuentaId: cCostoVtaId,
              descripcion: `${desc} - Reversión Costo ${item.descripcion}`,
              debito: 0,
              credito: costoTotalItem,
              terceroNit: nc.cliente?.nit || null,
              terceroNombre: nc.cliente?.nombre || null,
            })
          }
        }
      }
    }

    if (lineas.length < 2) return // Sin configuración base de PUC

    const totalDb = lineas.reduce((acc, l) => acc + l.debito, 0)
    const totalCr = lineas.reduce((acc, l) => acc + l.credito, 0)
    if (Math.abs(totalDb - totalCr) > 0.1) return // No cuadra

    const fecha = new Date(nc.fecha)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const periodo = await tx.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTO' },
      update: {},
    })

    const ultimo = await tx.comprobante.findFirst({
      where: { empresaId, tipo: 'NC' },
      orderBy: { id: 'desc' },
      select: { numero: true },
    })
    const seq = ultimo ? parseInt(ultimo.numero.split('-').pop() ?? '0') + 1 : 1
    const numeroComp = `NC-${anio}-${String(seq).padStart(5, '0')}`

    await tx.comprobante.create({
      data: {
        empresaId,
        tipo: 'NC',
        numero: numeroComp,
        fecha,
        concepto: `Nota Crédito ${nc.numero} - ${nc.cliente?.nombre}`,
        estado: 'ACTIVO',
        periodoId: periodo.id,
        usuarioId,
        referenciaId: nc.id,
        referenciaTipo: 'NOTA_CREDITO',
        lineas: {
          create: lineas.map((l, idx) => ({ ...l, orden: idx })),
        },
      },
    })
  }
}
