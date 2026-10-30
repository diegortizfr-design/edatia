import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'

import { ComprobantesService } from '../contabilidad/comprobantes/comprobantes.service'
import { MovimientosService } from '../inventario/movimientos/movimientos.service'

@Injectable()
export class PosService implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "VentaPos" ADD COLUMN IF NOT EXISTS "pagosDetalle" JSONB;
      `);
    } catch (err) {
      console.warn('Advertencia asegurando columna pagosDetalle en VentaPos:', err);
    }
  }
  constructor(
    private prisma: PrismaService,
    private comprobantes: ComprobantesService,
    private movimientos: MovimientosService,
  ) {}

  // ─── Cajas ───────────────────────────────────────────────────────────────────

  async getCajas(empresaId: number) {
    return this.prisma.cajaPos.findMany({
      where: { empresaId, activo: true },
      include: {
        bodega: { select: { id: true, nombre: true, codigo: true, permiteStockNegativo: true } },
        cajaBanco: { select: { id: true, nombre: true, cuentaPUC: true } },
        documentoConfig: {
          include: {
            sucursal: { select: { id: true, nombre: true } }
          }
        },
        documentoReciboConfig: {
          select: { id: true, nombre: true, prefijo: true, sigla: true, consecutivoSiguiente: true }
        },
        documentoCierreConfig: {
          select: { id: true, nombre: true, prefijo: true, sigla: true, consecutivoSiguiente: true }
        },
        clienteDefault: { select: { id: true, nombre: true, numeroDocumento: true } },
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
    const { cajaBancoId, documentoConfigId, documentoReciboConfigId, documentoCierreConfigId, clienteDefaultId, bodegaId, ...rest } = dto
    let resolvedBodegaId = bodegaId ? +bodegaId : null
    
    if (!resolvedBodegaId && documentoConfigId) {
      const doc = await this.prisma.documentoConfig.findUnique({
        where: { id: +documentoConfigId }
      })
      if (doc?.sucursalId) {
        const bodega = await this.prisma.bodega.findFirst({
          where: { sucursalId: doc.sucursalId, empresaId, activo: true },
          orderBy: { esPrincipal: 'desc' }
        })
        if (bodega) {
          resolvedBodegaId = bodega.id
        }
      }
    }

    if (!resolvedBodegaId) {
      const principal = await this.prisma.bodega.findFirst({
        where: { empresaId, activo: true },
        orderBy: { esPrincipal: 'desc' }
      })
      resolvedBodegaId = principal ? principal.id : 1
    }

    return this.prisma.cajaPos.create({
      data: {
        ...rest,
        empresaId,
        bodegaId: resolvedBodegaId,
        cajaBancoId: cajaBancoId ? +cajaBancoId : null,
        documentoConfigId: documentoConfigId ? +documentoConfigId : null,
        documentoReciboConfigId: documentoReciboConfigId ? +documentoReciboConfigId : null,
        documentoCierreConfigId: documentoCierreConfigId ? +documentoCierreConfigId : null,
        clienteDefaultId: clienteDefaultId ? +clienteDefaultId : null,
        permiteStockNegativo: dto.permiteStockNegativo !== undefined ? !!dto.permiteStockNegativo : false,
      },
      include: {
        bodega: { select: { id: true, nombre: true, codigo: true, permiteStockNegativo: true } },
        cajaBanco: { select: { id: true, nombre: true } },
        documentoConfig: {
          include: {
            sucursal: { select: { id: true, nombre: true } }
          }
        },
        documentoReciboConfig: {
          select: { id: true, nombre: true, prefijo: true, sigla: true, consecutivoSiguiente: true }
        },
        documentoCierreConfig: {
          select: { id: true, nombre: true, prefijo: true, sigla: true, consecutivoSiguiente: true }
        },
        clienteDefault: { select: { id: true, nombre: true } },
      },
    })
  }

  async updateCaja(empresaId: number, cajaId: number, dto: any) {
    await this.findCaja(empresaId, cajaId)
    const { cajaBancoId, documentoConfigId, documentoReciboConfigId, documentoCierreConfigId, clienteDefaultId, bodegaId, codigo, ...rest } = dto
    const updateData: any = { ...rest }
    
    if (bodegaId !== undefined) updateData.bodegaId = bodegaId ? +bodegaId : undefined
    if (cajaBancoId !== undefined) updateData.cajaBancoId = cajaBancoId ? +cajaBancoId : null
    if (clienteDefaultId !== undefined) updateData.clienteDefaultId = clienteDefaultId ? +clienteDefaultId : null
    if (dto.permiteStockNegativo !== undefined) updateData.permiteStockNegativo = !!dto.permiteStockNegativo
    if (documentoReciboConfigId !== undefined) updateData.documentoReciboConfigId = documentoReciboConfigId ? +documentoReciboConfigId : null
    if (documentoCierreConfigId !== undefined) updateData.documentoCierreConfigId = documentoCierreConfigId ? +documentoCierreConfigId : null
    if (documentoConfigId !== undefined) {
      updateData.documentoConfigId = documentoConfigId ? +documentoConfigId : null
      if (!bodegaId && documentoConfigId) {
        const doc = await this.prisma.documentoConfig.findUnique({
          where: { id: +documentoConfigId }
        })
        if (doc?.sucursalId) {
          const bodega = await this.prisma.bodega.findFirst({
            where: { sucursalId: doc.sucursalId, empresaId, activo: true },
            orderBy: { esPrincipal: 'desc' }
          })
          if (bodega) {
            updateData.bodegaId = bodega.id
          }
        }
      }
    }

    return this.prisma.cajaPos.update({
      where: { id: cajaId },
      data: updateData,
    })
  }

  private async findCaja(empresaId: number, cajaId: number) {
    const caja = await this.prisma.cajaPos.findFirst({ where: { id: cajaId, empresaId } })
    if (!caja) throw new NotFoundException('Caja no encontrada')
    return caja
  }

  async deleteCaja(empresaId: number, cajaId: number, codigoAutorizacion: string, userId?: number) {
    const caja = await this.findCaja(empresaId, cajaId)

    // 1. Validar código de autorización del administrador
    const config = await (this.prisma as any).configuracionERP.findUnique({
      where: { empresaId },
    })
    const codigoCorrecto = config?.codeEliminarCaja ?? 'CAJA123'

    if (!codigoAutorizacion || codigoAutorizacion.trim() !== codigoCorrecto.trim()) {
      throw new ForbiddenException('Código de autorización incorrecto para eliminar la caja')
    }

    // 2. Validar que la caja no tenga un turno o sesión abierta actualmente
    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { cajaId, estado: 'ABIERTA' },
    })
    if (sesionAbierta) {
      throw new BadRequestException(
        `No se puede eliminar la caja "${caja.nombre}" porque tiene un turno o sesión de venta abierto actualmente. Debe cerrar el turno antes de eliminarla.`
      )
    }

    // 3. Evaluar historial de sesiones y ventas
    const totalSesiones = await this.prisma.sesionCaja.count({
      where: { cajaId },
    })

    if (totalSesiones > 0) {
      // Si tiene historial, desactivar lógicamente para preservar integridad referencial y auditoría
      return this.prisma.cajaPos.update({
        where: { id: cajaId },
        data: { activo: false },
      })
    }

    // Si no tiene ningún historial, eliminación física
    return this.prisma.cajaPos.delete({
      where: { id: cajaId },
    })
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
        empresa: {
          select: {
            id: true,
            nombre: true,
            nombreComercial: true,
            nit: true,
            digitoVerificacion: true,
            telefono: true,
            email: true,
            permiteStockNegativo: true,
          }
        },
        caja: {
          include: {
            bodega: { select: { id: true, nombre: true, permiteStockNegativo: true } },
            cajaBanco: { select: { id: true, nombre: true, cuentaPUC: true } },
            documentoConfig: {
              select: {
                id: true,
                nombre: true,
                prefijo: true,
                sigla: true,
                resolucionDian: true,
                fechaResolucion: true,
                rangoDesde: true,
                rangoHasta: true,
                sucursal: {
                  select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                    municipio: true,
                    departamento: true,
                  }
                }
              }
            },
            documentoReciboConfig: {
              select: {
                id: true,
                nombre: true,
                prefijo: true,
                sigla: true,
                consecutivoSiguiente: true,
              }
            },
            documentoCierreConfig: {
              select: {
                id: true,
                nombre: true,
                prefijo: true,
                sigla: true,
                consecutivoSiguiente: true,
              }
            },
            clienteDefault: { select: { id: true, nombre: true, numeroDocumento: true } },
          },
        },
        documentoCierreConfig: {
          select: {
            id: true,
            nombre: true,
            prefijo: true,
            sigla: true,
          }
        },
        ventas: {
          where: { estado: 'COMPLETADA' },
          orderBy: { fecha: 'desc' },
          take: 100,
          select: {
            id: true, numero: true, clienteNombre: true,
            total: true, pagoEfectivo: true, pagoTarjetaDebito: true,
            pagoTarjetaCredito: true, pagoNequi: true, pagoTransferencia: true,
            cambio: true,
            pagosDetalle: true,
            fecha: true, estado: true,
          },
        },
        movimientos: { orderBy: { createdAt: 'asc' } },
        arqueo: true,
      },
    })
    if (!sesion) throw new NotFoundException('Sesión no encontrada')
    const resumenMediosPago = await this.calcularResumenMediosPago(empresaId, sesionId, sesion)
    return { ...sesion, resumenMediosPago }
  }

  private async calcularResumenMediosPago(empresaId: number, sesionId: number, sesion: any) {
    const mediosConfig = await this.prisma.medioPago.findMany({
      where: { empresaId, activo: true },
      orderBy: { id: 'asc' },
    })

    const ventas = await this.prisma.ventaPos.findMany({
      where: { sesionId, estado: 'COMPLETADA' },
      select: {
        id: true,
        total: true,
        pagoEfectivo: true,
        pagoTarjetaDebito: true,
        pagoTarjetaCredito: true,
        pagoTransferencia: true,
        pagoNequi: true,
        cambio: true,
        pagosDetalle: true,
      },
    })

    const detalleTotals: Record<string, number> = {}
    let totalDetalleAcumulado = 0

    for (const v of ventas) {
      if (v.pagosDetalle && typeof v.pagosDetalle === 'object') {
        const pd = v.pagosDetalle as Record<string, number>
        for (const [k, amount] of Object.entries(pd)) {
          const num = Number(amount) || 0
          if (num > 0) {
            const keyUpper = k.toUpperCase()
            detalleTotals[keyUpper] = (detalleTotals[keyUpper] || 0) + num
            totalDetalleAcumulado += num
          }
        }
      }
    }

    const netEfectivo = Math.max(
      0,
      ventas.reduce((acc, v) => acc + Number(v.pagoEfectivo ?? 0) - Number(v.cambio ?? 0), 0) || Number(sesion.totalEfectivo ?? 0)
    )
    const debito = ventas.reduce((acc, v) => acc + Number(v.pagoTarjetaDebito ?? 0), 0)
    const credito = ventas.reduce((acc, v) => acc + Number(v.pagoTarjetaCredito ?? 0), 0)
    const transferencia = ventas.reduce((acc, v) => acc + Number(v.pagoTransferencia ?? 0), 0) || Number(sesion.totalTransferencia ?? 0)
    const nequi = ventas.reduce((acc, v) => acc + Number(v.pagoNequi ?? 0), 0) || Number(sesion.totalNequi ?? 0)
    const totalTarjeta = debito + credito > 0 ? (debito + credito) : Number(sesion.totalTarjeta ?? 0)

    if (mediosConfig.length > 0) {
      const hasSpecificTransfer = mediosConfig.some(m => {
        const nom = (m.nombre || '').toUpperCase()
        const cod = (m.codigo || '').toUpperCase()
        return nom.includes('TRANSFERENCIA') || cod.includes('TRANSFERENCIA') || nom.includes('BANCO') || cod.includes('BANCO') || nom.includes('PSE') || cod.includes('PSE')
      })

      return mediosConfig.map(m => {
        const code = (m.codigo || '').toUpperCase()
        const name = (m.nombre || '').toUpperCase()
        let val = 0

        if (totalDetalleAcumulado > 0) {
          if (detalleTotals[code] !== undefined) {
            val = detalleTotals[code]
          } else if (detalleTotals[name] !== undefined) {
            val = detalleTotals[name]
          } else if (detalleTotals[String(m.id)] !== undefined) {
            val = detalleTotals[String(m.id)]
          } else {
            for (const [k, amount] of Object.entries(detalleTotals)) {
              if (k.includes(code) || code.includes(k) || k.includes(name) || name.includes(k)) {
                val += amount
              }
            }
          }
        }

        if (val === 0) {
          if (code === 'EFECTIVO' || name.includes('EFECTIVO')) {
            val = netEfectivo
          } else if (code.includes('DEBITO') || name.includes('DEBITO')) {
            val = debito
          } else if (code.includes('DATAFONO') || name.includes('DATAFONO')) {
            val = totalTarjeta
          } else if (code.includes('CREDITO') || name.includes('CREDITO')) {
            val = credito
          } else if (code.includes('TARJETA') || name.includes('TARJETA')) {
            val = totalTarjeta
          } else if (code.includes('NEQUI') || name.includes('NEQUI') || code.includes('DAVIPLATA') || name.includes('DAVIPLATA')) {
            val = nequi
          } else if (code.includes('TRANSFERENCIA') || name.includes('TRANSFERENCIA') || code.includes('BANCO') || name.includes('PSE')) {
            val = transferencia
          } else if ((code.includes('QR') || name.includes('QR') || code.includes('BOLD') || name.includes('BOLD')) && !hasSpecificTransfer) {
            val = transferencia
          }
        }

        return {
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          total: val,
        }
      })
    }

    return [
      { codigo: 'EFECTIVO', nombre: 'Efectivo', total: netEfectivo },
      { codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito', total: debito },
      { codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta Crédito', total: credito },
      { codigo: 'TRANSFERENCIA', nombre: 'Transferencia', total: transferencia },
      { codigo: 'NEQUI', nombre: 'Nequi / Daviplata', total: nequi },
    ]
  }

  /*
    const mediosConfig = await this.prisma.medioPago.findMany({
      where: { empresaId, activo: true },
      orderBy: { id: 'asc' },
    })

    const ventasAgg = await this.prisma.ventaPos.aggregate({
      where: { sesionId, estado: 'COMPLETADA' },
      _sum: {
        total: true,
        pagoEfectivo: true,
        pagoTarjetaDebito: true,
        pagoTarjetaCredito: true,
        pagoTransferencia: true,
        pagoNequi: true,
        cambio: true,
      },
    })

    const netEfectivo = Math.max(0, Number(ventasAgg._sum.pagoEfectivo ?? sesion.totalEfectivo ?? 0) - Number(ventasAgg._sum.cambio ?? 0))
    const debito = Number(ventasAgg._sum.pagoTarjetaDebito ?? 0)
    const credito = Number(ventasAgg._sum.pagoTarjetaCredito ?? 0)
    const transferencia = Number(ventasAgg._sum.pagoTransferencia ?? sesion.totalTransferencia ?? 0)
    const nequi = Number(ventasAgg._sum.pagoNequi ?? sesion.totalNequi ?? 0)
    const totalTarjeta = debito + credito > 0 ? (debito + credito) : Number(sesion.totalTarjeta ?? 0)

    if (mediosConfig.length > 0) {
      return mediosConfig.map(m => {
        const code = (m.codigo || '').toUpperCase()
        const name = (m.nombre || '').toUpperCase()
        let val = 0

        if (code === 'EFECTIVO' || name.includes('EFECTIVO')) {
          val = netEfectivo
        } else if (code.includes('DEBITO') || name.includes('DEBITO')) {
          val = debito
        } else if (code.includes('CREDITO') || name.includes('CREDITO')) {
          val = credito
        } else if (code.includes('TARJETA') || name.includes('TARJETA') || code.includes('DATAFONO') || name.includes('DATAFONO')) {
          val = totalTarjeta
        } else if (code.includes('NEQUI') || name.includes('NEQUI') || code.includes('DAVIPLATA') || name.includes('DAVIPLATA')) {
          val = nequi
        } else if (code.includes('TRANSFERENCIA') || name.includes('TRANSFERENCIA') || code.includes('BANCO') || name.includes('PSE')) {
          val = transferencia
        }

        return {
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          total: val,
        }
      })
    }

    return [
      { codigo: 'EFECTIVO', nombre: 'Efectivo', total: netEfectivo },
      { codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito', total: debito },
      { codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta Crédito', total: credito },
      { codigo: 'TRANSFERENCIA', nombre: 'Transferencia', total: transferencia },
      { codigo: 'NEQUI', nombre: 'Nequi / Daviplata', total: nequi },
    ]
  }

  */
  async abrirCaja(empresaId: number, dto: { cajaId: number; montoInicial: number; vendedorId?: number; vendedorNombre?: string }, userId?: number) {
    const caja = await this.findCaja(empresaId, dto.cajaId)

    // Verificar que no hay sesión abierta
    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { cajaId: dto.cajaId, estado: 'ABIERTA' },
    })
    if (sesionAbierta) throw new BadRequestException('Esta caja ya tiene una sesión abierta')

    let resolvedVendedorNombre = dto.vendedorNombre || 'Vendedor'
    if (!dto.vendedorNombre && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { nombre: true, usuario: true }
      })
      if (user) {
        resolvedVendedorNombre = user.nombre || user.usuario
      }
    }

    const sesion = await this.prisma.sesionCaja.create({
      data: {
        empresaId,
        cajaId: dto.cajaId,
        montoInicial: dto.montoInicial,
        vendedorId: dto.vendedorId,
        vendedorNombre: resolvedVendedorNombre,
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
      include: {
        caja: {
          include: {
            documentoCierreConfig: true,
          }
        }
      }
    })
    if (!sesion) throw new BadRequestException('Sesión no encontrada o ya cerrada')

    // Validar documento Comprobante de Cierre [CF]
    let docCierre = sesion.caja?.documentoCierreConfig
    if (!docCierre && sesion.caja?.documentoCierreConfigId) {
      docCierre = await this.prisma.documentoConfig.findUnique({
        where: { id: sesion.caja.documentoCierreConfigId },
      })
    }

    if (!docCierre) {
      throw new BadRequestException(
        'No se puede cerrar la caja: no tiene vinculado un Comprobante de Cierre [CF]. Configure un documento tipo Comprobante de Cierre en la caja POS antes de cerrar.'
      )
    }

    // Generar consecutivo del Comprobante de Cierre
    const consecutivo = docCierre.consecutivoSiguiente ?? 1
    const prefijo = docCierre.prefijo ? docCierre.prefijo.trim() : 'CF'
    const numeroCierre = `${prefijo}-${String(consecutivo).padStart(5, '0')}`

    // Incrementar consecutivo siguiente
    await this.prisma.documentoConfig.update({
      where: { id: docCierre.id },
      data: { consecutivoSiguiente: { increment: 1 } },
    })

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
        concepto: `Cierre de caja - ${numeroCierre}`,
        monto: totalContado,
        referencia: numeroCierre,
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
        numeroCierre,
        documentoCierreConfigId: docCierre.id,
      },
      include: {
        caja: {
          include: {
            documentoConfig: true,
            documentoReciboConfig: true,
            documentoCierreConfig: true,
          }
        },
        arqueo: true,
        documentoCierreConfig: true,
      },
    })

    const resumenMediosPago = await this.calcularResumenMediosPago(empresaId, sesionId, sesionCerrada)
    return { ...sesionCerrada, resumenMediosPago }
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

  async getVentasPos(
    empresaId: number,
    sesionId?: number,
    cajaId?: number,
    desde?: string,
    hasta?: string,
    prefijo?: string,
  ) {
    const where: any = { empresaId }
    if (sesionId) where.sesionId = sesionId
    if (cajaId) where.sesion = { cajaId }
    if (prefijo) {
      where.numero = { startsWith: prefijo, mode: 'insensitive' }
    }
    
    if (desde || hasta) {
      where.fecha = {}
      if (desde) {
        const dDesde = new Date(desde)
        where.fecha.gte = new Date(dDesde.getFullYear(), dDesde.getMonth(), dDesde.getDate())
      }
      if (hasta) {
        const dHasta = new Date(hasta)
        where.fecha.lt = new Date(dHasta.getFullYear(), dHasta.getMonth(), dHasta.getDate() + 1)
      }
    }

    // Auto-reparar en segundo plano ventas completadas que hayan quedado sin comprobante contable
    this.sincronizarVentasSinComprobante(empresaId).catch(() => {})

    return this.prisma.ventaPos.findMany({
      where,
      include: {
        sesion: {
          include: {
            caja: {
              select: { id: true, nombre: true }
            }
          }
        },
        items: { include: { producto: { select: { nombre: true, sku: true } } } }
      },
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
    recargoMedioPago?: number
    pagoEfectivo?: number
    pagoTarjetaDebito?: number
    pagoTarjetaCredito?: number
    pagoTransferencia?: number
    pagoNequi?: number
    cambio?: number
    pagosDetalle?: Record<string, number>
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
      include: {
        caja: {
          include: {
            bodega: true,
            documentoConfig: true,
            documentoReciboConfig: true,
          }
        }
      },
    })
    if (!sesion) throw new BadRequestException('Sesión no encontrada o cerrada')

    // VALIDACIÓN OBLIGATORIA: Todo cobro en el POS debe estar respaldado por un documento de Recibo de Caja
    if (!sesion.caja.documentoReciboConfigId && !sesion.caja.documentoReciboConfig) {
      throw new BadRequestException(
        `La caja "${sesion.caja.nombre}" no tiene anclado un documento de Recibo de Caja. ` +
        `Por política del ERP, todo cobro en el POS debe generar obligatoriamente un Recibo de Caja. ` +
        `Por favor, asigne un documento de Recibo de Caja en la configuración de la caja POS antes de cobrar.`
      )
    }

    // Verificar stock para cada ítem
    for (const item of dto.items) {
      const prod = await this.prisma.producto.findUnique({ where: { id: item.productoId } })
      if (prod && !prod.manejaBodega) continue // No validar stock para servicios o productos sin inventario

      const stock = await this.prisma.stock.findFirst({
        where: { productoId: item.productoId, bodegaId: sesion.caja.bodegaId },
      })
      const disponible = stock ? Number(stock.cantidad) - Number(stock.cantidadReservada) : 0
      if (disponible < item.cantidad) {
        const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId }, select: { permiteStockNegativo: true } })
        const permiteNegativo =
          (empresa?.permiteStockNegativo ?? false) &&
          (sesion.caja.bodega?.permiteStockNegativo ?? false) &&
          (sesion.caja?.permiteStockNegativo ?? false)

        if (!permiteNegativo) {
          if (!sesion.caja?.permiteStockNegativo) {
            throw new BadRequestException(
              `La caja "${sesion.caja.nombre}" no tiene habilitado facturar con stock en negativo en su configuración. Stock disponible para "${prod?.nombre ?? item.productoId}": ${disponible}`
            )
          }
          if (!sesion.caja.bodega?.permiteStockNegativo) {
            throw new BadRequestException(
              `La bodega "${sesion.caja.bodega?.nombre ?? 'Sin bodega'}" asignada a esta caja no tiene autorizado stock negativo en Configuración > Empresa > Inventario y Compras.`
            )
          }
          if (!empresa?.permiteStockNegativo) {
            throw new BadRequestException(
              `La empresa no tiene habilitada la venta con stock en negativo en Configuración > Empresa > Inventario y Compras.`
            )
          }
          throw new BadRequestException(`Stock insuficiente para "${prod?.nombre ?? item.productoId}". Disponible: ${disponible}`)
        }
      }
    }

    // Generar número de venta
    let numero = (dto as any).numero
    if (!numero) {
      if (sesion.caja.documentoConfig) {
        const prefijo = sesion.caja.documentoConfig.prefijo || 'POS'
        const consecutivo = sesion.caja.documentoConfig.consecutivoSiguiente
        numero = `${prefijo}-${consecutivo}`
      } else {
        const prefijo = (dto as any).tipoDocumento || 'POS'
        const año = new Date().getFullYear()
        const ultimaVenta = await this.prisma.ventaPos.findFirst({
          where: { empresaId, numero: { startsWith: `${prefijo}-${año}-` } },
          orderBy: { numero: 'desc' },
        })
        let seq = 1
        if (ultimaVenta) {
          const parts = ultimaVenta.numero.split('-')
          const lastPart = parts[parts.length - 1]
          if (!isNaN(parseInt(lastPart))) {
            seq = parseInt(lastPart) + 1
          }
        }
        numero = `${prefijo}-${año}-${String(seq).padStart(5, '0')}`
      }
    }

    // Calcular totales
    let subtotal = 0, descuentoTotal = 0, baseIva19 = 0, iva19 = 0, baseIva5 = 0, iva5 = 0

    const itemsCalculados = await Promise.all(dto.items.map(async (item) => {
      const prod = await this.prisma.producto.findUnique({ where: { id: item.productoId } })
      let tipoIva = item.tipoIva ?? prod?.tipoIva ?? 'GRAVADO_19'
      if (prod?.productoExentoIva) {
        tipoIva = 'EXENTO'
      } else if (prod?.liquidarIva === false || (Array.isArray(prod?.appliedTaxIds) && prod?.appliedTaxIds.length === 0)) {
        tipoIva = 'EXCLUIDO'
      }
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

    // Descuento adicional sobre total y recargo por medio de pago
    const descuentoExtra = dto.descuento ?? 0
    const recargoMedioPago = Number(dto.recargoMedioPago ?? 0)
    const total = subtotal - descuentoTotal + iva19 + iva5 - descuentoExtra + recargoMedioPago

    // Crear venta en transacción
    const venta = await this.prisma.$transaction(async (tx) => {
      // A. Resolver Documento y consecutivo de Recibo de Caja obligatorio
      const docRcId = sesion.caja.documentoReciboConfigId
      const docRc = docRcId
        ? await tx.documentoConfig.findFirst({ where: { id: docRcId, empresaId } })
        : (sesion.caja.documentoReciboConfig ?? null)

      if (!docRc) {
        throw new BadRequestException(
          `La caja "${sesion.caja.nombre}" no tiene anclado un documento de Recibo de Caja válido. ` +
          `Configure el documento de Recibo de Caja en la configuración de la caja POS.`
        )
      }

      const prefijoRc = docRc.prefijo || 'RC'
      const consecutivoRc = docRc.consecutivoSiguiente
      const numeroRecibo = `${prefijoRc}-${consecutivoRc}`

      // B. Resolver Cliente válido para Recibo de Caja (requiere ID de Tercero)
      let clienteRcId: number | null = dto.clienteId ?? null
      if (!clienteRcId && sesion.caja.clienteDefaultId) {
        clienteRcId = sesion.caja.clienteDefaultId
      }
      if (!clienteRcId) {
        const cExistente = await tx.tercero.findFirst({
          where: { empresaId, esCliente: true },
          orderBy: { id: 'asc' },
        })
        clienteRcId = cExistente ? cExistente.id : null
      }
      if (!clienteRcId) {
        const cNuevo = await tx.tercero.create({
          data: {
            empresaId,
            tipoPersona: 'NATURAL',
            tipoDocumento: 'CC',
            numeroDocumento: '222222222222',
            nombre: 'Consumidor Final',
            esCliente: true,
            activo: true,
          }
        })
        clienteRcId = cNuevo.id
      }

      // C. Medios de pago utilizados para descripción del Recibo
      const mediosList: string[] = []
      if (dto.pagosDetalle && typeof dto.pagosDetalle === 'object') {
        for (const [k, amt] of Object.entries(dto.pagosDetalle)) {
          if ((Number(amt) || 0) > 0) mediosList.push(k)
        }
      }
      if (mediosList.length === 0) {
        if ((dto.pagoEfectivo ?? 0) > 0) mediosList.push('EFECTIVO')
        if ((dto.pagoTarjetaDebito ?? 0) > 0) mediosList.push('TARJETA_DEBITO')
        if ((dto.pagoTarjetaCredito ?? 0) > 0) mediosList.push('TARJETA_CREDITO')
        if ((dto.pagoTransferencia ?? 0) > 0) mediosList.push('TRANSFERENCIA')
        if ((dto.pagoNequi ?? 0) > 0) mediosList.push('NEQUI')
  
  
  
        
        
      }



      
      
      const medioPagoText = mediosList.length === 1 ? mediosList[0] : (mediosList.length > 1 ? 'MIXTO' : 'EFECTIVO')

      // D. Crear Recibo de Caja oficial respaldado por DocumentoConfig
      const reciboCaja = await tx.reciboCaja.create({
        data: {
          empresaId,
          numero: numeroRecibo,
          clienteId: clienteRcId as number,
          valor: total,
          medioPago: medioPagoText,
          referencia: numero,
          concepto: `Recaudo Venta POS ${numero} - ${dto.clienteNombre ?? 'Consumidor Final'}`,
          documentoConfigId: docRc.id,
          usuarioId: dto.vendedorId ?? null,
        }
      })

      // Incrementar consecutivo del documento de Recibo de Caja
      await tx.documentoConfig.update({
        where: { id: docRc.id },
        data: { consecutivoSiguiente: { increment: 1 } },
      })

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
          recargoMedioPago,
          reciboCajaId: reciboCaja.id,
          pagoEfectivo: dto.pagoEfectivo ?? 0,
          pagoTarjetaDebito: dto.pagoTarjetaDebito ?? 0,
          pagoTarjetaCredito: dto.pagoTarjetaCredito ?? 0,
          pagoTransferencia: dto.pagoTransferencia ?? 0,
          pagoNequi: dto.pagoNequi ?? 0,
          cambio: dto.cambio ?? 0,
          pagosDetalle: dto.pagosDetalle ? (dto.pagosDetalle as any) : undefined,
          estado: 'COMPLETADA',
          items: { create: itemsCalculados.map((it, i) => ({ ...it, orden: i })) },
        },
        include: { items: true, reciboCaja: true },
      })

      // 2. Movimientos de inventario (salida)
      for (const item of itemsCalculados) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
        if (!prod?.manejaBodega) continue

        await this.movimientos.registrarSalidaInterna(tx, {
          empresaId,
          productoId: item.productoId,
          bodegaId: sesion.caja.bodegaId,
          cantidad: item.cantidad,
          concepto: `Venta POS ${numero}`,
          tipo: 'VENTA',
          referenciaId: v.numero,
          referenciaTipo: 'VENTA_POS',
          numeroMov: `POS-${numero}-${item.productoId}`,
        })
      }

      // 3. Actualizar totales de la sesión
      const pagoEfectivo = Math.max(0, (dto.pagoEfectivo ?? 0) - (dto.cambio ?? 0))
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

      // 6. Incrementar Consecutivo del Documento Config
      if (sesion.caja.documentoConfig) {
        await tx.documentoConfig.update({
          where: { id: sesion.caja.documentoConfig.id },
          data: { consecutivoSiguiente: { increment: 1 } },
        })
      }

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

      // Anular Recibo de Caja vinculado si existe
      if (venta.reciboCajaId) {
        await tx.reciboCaja.update({
          where: { id: venta.reciboCajaId },
          data: { estado: 'ANULADO' },
        })
      }

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
    const where: any = {
      empresaId,
      activo: true,
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { codigoBarras: { equals: q } },
      ],
    }

    let permiteNegativo = false
    if (bodegaId) {
      const bodega = await this.prisma.bodega.findUnique({
        where: { id: bodegaId },
        select: {
          permiteStockNegativo: true,
          empresa: { select: { permiteStockNegativo: true } }
        }
      })
      permiteNegativo = (bodega?.permiteStockNegativo ?? false) && (bodega?.empresa?.permiteStockNegativo ?? false)
    }

    // Filtrar estrictamente por la bodega anclada a la caja POS
    if (bodegaId) {
      where.AND = [
        {
          OR: [
            { manejaBodega: false }, // Servicios que no manejan inventario físico
            {
              stock: {
                some: {
                  bodegaId,
                  ...(permiteNegativo ? {} : { cantidad: { gt: 0 } }),
                },
              },
            },
          ],
        },
      ]
    }

    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        stock: { where: { bodegaId }, select: { cantidad: true, cantidadReservada: true } },
      },
      take: 60,
    })

    return productos
      .map(p => {
        let effectiveTipoIva = p.tipoIva || 'GRAVADO_19';
        if (p.productoExentoIva) {
          effectiveTipoIva = 'EXENTO';
        } else if (p.liquidarIva === false || (Array.isArray(p.appliedTaxIds) && p.appliedTaxIds.length === 0)) {
          effectiveTipoIva = 'EXCLUIDO';
        }

        const stockDisponible = p.manejaBodega
          ? (p.stock[0] ? Number(p.stock[0].cantidad) - Number(p.stock[0].cantidadReservada ?? 0) : 0)
          : 999;

        return {
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          codigoBarras: p.codigoBarras,
          precioBase: Number(p.precioBase),
          tipoIva: effectiveTipoIva,
          liquidarIva: p.liquidarIva,
          productoExentoIva: p.productoExentoIva,
          appliedTaxIds: p.appliedTaxIds,
          imagen: p.imagen,
          claseAbc: p.claseAbc,
          manejaBodega: p.manejaBodega,
          stock: stockDisponible,
        };
      })
      .filter(p => !p.manejaBodega || permiteNegativo || p.stock > 0);
  }

  // ─── Creación Rápida de Producto en POS ─────────────────────────────────────

  async crearProductoRapidoPos(
    empresaId: number,
    dto: {
      sesionId: number
      sku: string
      nombre: string
      precio: number
      tipoIva?: string
    },
  ) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: dto.sesionId, empresaId, estado: 'ABIERTA' },
      include: {
        empresa: { select: { permiteStockNegativo: true } },
        caja: {
          include: {
            bodega: { select: { id: true, nombre: true, permiteStockNegativo: true } },
          },
        },
      },
    })

    if (!sesion) throw new BadRequestException('Sesión no encontrada o cerrada')

    const empresaPermite = sesion.empresa?.permiteStockNegativo ?? false
    const bodegaPermite = sesion.caja?.bodega?.permiteStockNegativo ?? false
    const cajaPermite = sesion.caja?.permiteStockNegativo ?? false

    if (!cajaPermite) {
      throw new BadRequestException(
        `Esta caja POS ("${sesion.caja.nombre}") no tiene habilitada la opción de facturar con stock en negativo. ` +
        `Para vender productos creados sin existencias, active la opción en la configuración de la caja.`
      )
    }

    if (!bodegaPermite) {
      throw new BadRequestException(
        `La bodega ("${sesion.caja.bodega?.nombre ?? 'Sin bodega'}") asignada a esta caja no tiene autorizado stock negativo en Configuración > Empresa > Inventario y Compras.`
      )
    }

    if (!empresaPermite) {
      throw new BadRequestException(
        `La empresa no tiene habilitada la venta con stock en negativo en Configuración > Empresa > Inventario y Compras.`
      )
    }

    const skuLimpio = dto.sku.trim()
    const nombreLimpio = dto.nombre.trim()
    const precio = Number(dto.precio) || 0

    const existe = await this.prisma.producto.findFirst({
      where: { empresaId, sku: skuLimpio },
    })
    if (existe) {
      throw new ConflictException(`Ya existe un producto con el código o SKU "${skuLimpio}"`)
    }

    const isExempt = dto.tipoIva === 'EXENTO'
    const isExcluded = dto.tipoIva === 'EXCLUIDO'
    const appliedTaxes = isExcluded || isExempt ? [] : (dto.tipoIva === 'GRAVADO_5' ? ['iva_5'] : ['iva_19'])

    // Crear el producto en la BD
    const producto = await this.prisma.producto.create({
      data: {
        empresaId,
        sku: skuLimpio,
        codigoBarras: skuLimpio,
        nombre: nombreLimpio,
        precioBase: precio,
        precioWeb: precio,
        costo: 0,
        costoPromedio: 0,
        costoUltimo: 0,
        costoI: 0,
        tipoIva: dto.tipoIva || 'EXCLUIDO',
        liquidarIva: !isExcluded && !isExempt,
        productoExentoIva: isExempt,
        appliedTaxIds: appliedTaxes,
        precios: [precio, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        manejaBodega: true,
        activo: true,
      },
    })

    await (this.prisma as any).codigoBarras.create({
      data: {
        empresaId,
        productoId: producto.id,
        codigo: skuLimpio,
        tipo: 'EAN13',
        descripcion: 'Código creado en POS',
        esPrincipal: true,
      },
    })

    // Vincular inmediatamente a la bodega por defecto de la caja con stock 0
    await this.prisma.stock.create({
      data: {
        empresaId,
        productoId: producto.id,
        bodegaId: sesion.caja.bodegaId,
        cantidad: 0,
        cantidadReservada: 0,
      },
    })

    return {
      id: producto.id,
      nombre: producto.nombre,
      sku: producto.sku,
      codigoBarras: producto.codigoBarras,
      precioBase: Number(producto.precioBase),
      tipoIva: producto.tipoIva,
      liquidarIva: producto.liquidarIva,
      productoExentoIva: producto.productoExentoIva,
      appliedTaxIds: producto.appliedTaxIds,
      stock: 0,
      manejaBodega: true,
    }
  }

  // ─── Creación Rápida de Cliente en POS ─────────────────────────────────────

  async crearClienteRapidoPos(
    empresaId: number,
    dto: {
      tipoDocumento?: string
      numeroDocumento: string
      nombre: string
      telefono?: string
      email?: string
      direccion?: string
    },
  ) {
    if (!dto.numeroDocumento?.trim()) {
      throw new BadRequestException('El número de documento es obligatorio')
    }
    if (!dto.nombre?.trim()) {
      throw new BadRequestException('El nombre del cliente es obligatorio')
    }

    const docLimpio = dto.numeroDocumento.trim()
    const nombreLimpio = dto.nombre.trim()
    const tipoDoc = dto.tipoDocumento?.toUpperCase() || 'CC'
    const tipoPersona = tipoDoc === 'NIT' ? 'JURIDICA' : 'NATURAL'

    // Buscar si ya existe el tercero en la empresa por documento
    const existente = await this.prisma.tercero.findFirst({
      where: {
        empresaId,
        numeroDocumento: docLimpio,
      },
    })

    if (existente) {
      // Si ya existía, asegurarse de que quede habilitado como cliente y actualizar datos de contacto si se suministraron
      const updated = await this.prisma.tercero.update({
        where: { id: existente.id },
        data: {
          esCliente: true,
          activo: true,
          ...(dto.nombre ? { nombre: nombreLimpio } : {}),
          ...(dto.telefono ? { telefono: dto.telefono.trim(), celular: dto.telefono.trim() } : {}),
          ...(dto.email ? { email: dto.email.trim() } : {}),
          ...(dto.direccion ? { direccion: dto.direccion.trim() } : {}),
        },
      })

      return {
        id: updated.id,
        nombre: updated.nombre,
        numeroDocumento: updated.numeroDocumento,
        tipoDocumento: updated.tipoDocumento,
        telefono: updated.telefono,
        email: updated.email,
        direccion: updated.direccion,
        yaExistia: true,
      }
    }

    // Si no existía, crearlo como nuevo cliente
    const nuevo = await this.prisma.tercero.create({
      data: {
        empresaId,
        tipoPersona,
        tipoDocumento: tipoDoc,
        numeroDocumento: docLimpio,
        nombre: nombreLimpio,
        telefono: dto.telefono ? dto.telefono.trim() : null,
        celular: dto.telefono ? dto.telefono.trim() : null,
        email: dto.email ? dto.email.trim() : null,
        direccion: dto.direccion ? dto.direccion.trim() : null,
        esCliente: true,
        activo: true,
      },
    })

    return {
      id: nuevo.id,
      nombre: nuevo.nombre,
      numeroDocumento: nuevo.numeroDocumento,
      tipoDocumento: nuevo.tipoDocumento,
      telefono: nuevo.telefono,
      email: nuevo.email,
      direccion: nuevo.direccion,
      yaExistia: false,
    }
  }

  // ─── Integración Contable ───────────────────────────────────────────────────

  private async resolverCuentaPUC(
    prismaOrTx: any,
    empresaId: number,
    posiblesCodigos: string[],
    prefijoFallback?: string,
  ): Promise<number | null> {
    if (posiblesCodigos.length > 0) {
      const exacta = await prismaOrTx.cuentaPUC.findFirst({
        where: { empresaId, codigo: { in: posiblesCodigos }, activo: true },
        select: { id: true, codigo: true },
      })
      if (exacta) return exacta.id
    }

    if (prefijoFallback) {
      const porPrefijo = await prismaOrTx.cuentaPUC.findFirst({
        where: { empresaId, codigo: { startsWith: prefijoFallback }, activo: true },
        select: { id: true, codigo: true },
        orderBy: { codigo: 'asc' },
      })
      if (porPrefijo) return porPrefijo.id
    }

    return null
  }

  private async crearAsientoVentaPos(tx: any, venta: any, empresaId: number, sesionId: number) {
    // 1. Obtener sesión y configuración de caja
    const sesion = await tx.sesionCaja.findUnique({
      where: { id: sesionId },
      include: {
        caja: {
          include: {
            cajaBanco: true,
          }
        }
      },
    })

    // 2. Resolver Cuenta de Caja / Efectivo (1105)
    let cCaja: number | null = null

    // A. Si la caja POS tiene vinculada una CajaBanco con cuentaPUC (ej: '11050501')
    if (sesion?.caja?.cajaBanco?.cuentaPUC) {
      const dbAcc = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: sesion.caja.cajaBanco.cuentaPUC, activo: true },
        select: { id: true }
      })
      if (dbAcc) cCaja = dbAcc.id
    }

    // B. Buscar CajaBanco de tipo CAJA
    if (!cCaja) {
      const cbCaja = await tx.cajaBanco.findFirst({
        where: { empresaId, tipo: 'CAJA', activo: true, cuentaPUC: { not: null } },
        orderBy: { id: 'asc' },
      })
      if (cbCaja?.cuentaPUC) {
        const dbAcc = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: cbCaja.cuentaPUC, activo: true },
          select: { id: true }
        })
        if (dbAcc) cCaja = dbAcc.id
      }
    }

    // C. Fallbacks de códigos estándar en Colombia
    if (!cCaja) {
      cCaja = await this.resolverCuentaPUC(tx, empresaId, ['11050501', '110505', '110501', '1105'], '1105')
    }
    if (!cCaja) {
      cCaja = await this.resolverCuentaPUC(tx, empresaId, [], '11')
    }

    // 3. Resolver Cuenta de Ingresos (4135)
    let cIngresos = await this.resolverCuentaPUC(
      tx,
      empresaId,
      ['41350501', '413505', '413536', '4135'],
      '4135',
    )
    if (!cIngresos) {
      cIngresos = await this.resolverCuentaPUC(tx, empresaId, [], '41')
    }

    if (!cCaja || !cIngresos) {
      console.warn('[POS Asiento] No se pudo generar comprobante: faltan cuentas base', { cCaja, cIngresos, empresaId })
      return
    }

    // 4. Resolver Cuentas de IVA (2408)
    const impuestosIVA = await tx.impuesto.findMany({
      where: { empresaId, tipo: 'IVA', activo: true }
    })
    const tax19 = impuestosIVA.find((t: any) => Math.round(Number(t.tarifa)) === 19)
    const tax5 = impuestosIVA.find((t: any) => Math.round(Number(t.tarifa)) === 5)

    let cIva19: number | null = null
    const tax19Code = tax19?.cuentaCredito || tax19?.cuentaDebito
    if (tax19Code) {
      const customAcc = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: tax19Code, activo: true },
        select: { id: true }
      })
      if (customAcc) cIva19 = customAcc.id
    }
    if (!cIva19) {
      cIva19 = await this.resolverCuentaPUC(tx, empresaId, ['24080101', '240801', '2408'], '2408')
    }

    let cIva5: number | null = null
    const tax5Code = tax5?.cuentaCredito || tax5?.cuentaDebito
    if (tax5Code) {
      const customAcc = await tx.cuentaPUC.findFirst({
        where: { empresaId, codigo: tax5Code, activo: true },
        select: { id: true }
      })
      if (customAcc) cIva5 = customAcc.id
    }
    if (!cIva5) {
      cIva5 = await this.resolverCuentaPUC(tx, empresaId, ['24080201', '240802', '2408'], '2408')
    }

    // 5. Resolver Costo de Ventas e Inventario
    const cCostoVta = await this.resolverCuentaPUC(tx, empresaId, ['61350501', '613505', '6135'], '6135') ?? await this.resolverCuentaPUC(tx, empresaId, [], '61')
    const cInventario = await this.resolverCuentaPUC(tx, empresaId, ['14350501', '143505', '1435'], '1435') ?? await this.resolverCuentaPUC(tx, empresaId, [], '14')

    // 6. Preparar líneas del comprobante
    const lineas = []
    const desc = `Venta POS ${venta.numero}`

    // Débitos: Distribución por medio de pago
    const payments = [
      { key: 'pagoEfectivo', code: 'EFECTIVO', name: 'Efectivo', fallbackPrefijo: '1105' },
      { key: 'pagoTarjetaDebito', code: 'TARJETA_DEBITO', name: 'Tarjeta Débito', fallbackPrefijo: '1110' },
      { key: 'pagoTarjetaCredito', code: 'TARJETA_CREDITO', name: 'Tarjeta Crédito', fallbackPrefijo: '1110' },
      { key: 'pagoTransferencia', code: 'TRANSFERENCIA', name: 'Transferencia', fallbackPrefijo: '1110' },
      { key: 'pagoNequi', code: 'NEQUI', name: 'Nequi', fallbackPrefijo: '1110' },
    ]

    for (const p of payments) {
      const val = p.key === 'pagoEfectivo'
        ? Number(venta.pagoEfectivo ?? 0) - Number(venta.cambio ?? 0)
        : Number(venta[p.key] ?? 0)

      if (val > 0) {
        let accountId: number | null = null

        const mp = await tx.medioPago.findFirst({
          where: { empresaId, codigo: p.code },
          include: { cajaBanco: true },
        })

        if (mp?.cajaBanco?.cuentaPUC) {
          const acc = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: mp.cajaBanco.cuentaPUC, activo: true },
            select: { id: true },
          })
          if (acc) accountId = acc.id
        }

        if (!accountId) {
          if (p.code === 'EFECTIVO') {
            accountId = cCaja
          } else {
            accountId = await this.resolverCuentaPUC(tx, empresaId, ['11100501', '11100502', '111005', '1110'], '1110') || cCaja
          }
        }

        if (accountId) {
          lineas.push({
            cuentaId: accountId,
            descripcion: `${desc} - Pago ${p.name}`,
            debito: val,
            credito: 0,
            terceroNit: venta.clienteDoc,
            terceroNombre: venta.clienteNombre,
          })
        }
      }
    }

    // Débito a Descuentos en Ventas si aplica
    if (Number(venta.descuento) > 0) {
      const cDesc = await this.resolverCuentaPUC(tx, empresaId, ['53053501', '530535', '5305'], '5305') || cIngresos
      lineas.push({
        cuentaId: cDesc,
        descripcion: `${desc} - Descuento en venta`,
        debito: Number(venta.descuento),
        credito: 0,
        terceroNit: venta.clienteDoc,
        terceroNombre: venta.clienteNombre,
      })
    }

    // Crédito a Ingresos por Recargo en Medio de Pago si aplica
    if (Number(venta.recargoMedioPago) > 0) {
      const cRecargo = await this.resolverCuentaPUC(tx, empresaId, ['42100501', '421005', '4210'], '42') || cIngresos
      lineas.push({
        cuentaId: cRecargo,
        descripcion: `${desc} - Recargo por medio de pago`,
        debito: 0,
        credito: Number(venta.recargoMedioPago),
        terceroNit: venta.clienteDoc,
        terceroNombre: venta.clienteNombre,
      })
    }

    // Créditos: Ingresos base por ítem
    for (const item of (venta.items || [])) {
      const product = await tx.producto.findUnique({
        where: { id: item.productoId },
        include: { grupo: true }
      })

      let cIngresoItem = cIngresos
      const customIngresoCode = (product?.grupo?.contable as any)?.ingresoEnVentas
      if (customIngresoCode) {
        const customAcc = await tx.cuentaPUC.findFirst({
          where: { empresaId, codigo: customIngresoCode, activo: true },
          select: { id: true }
        })
        if (customAcc) cIngresoItem = customAcc.id
      }

      const itemBase = Number(item.subtotal || (Number(item.cantidad) * Number(item.precioUnitario)))
      if (itemBase > 0 && cIngresoItem) {
        lineas.push({
          cuentaId: cIngresoItem,
          descripcion: `${desc} - ${item.descripcion}`,
          debito: 0,
          credito: itemBase,
          terceroNit: venta.clienteDoc,
          terceroNombre: venta.clienteNombre,
        })
      }
    }

    // Crédito a IVA 19%
    if (Number(venta.iva19) > 0 && cIva19) {
      lineas.push({
        cuentaId: cIva19,
        descripcion: `${desc} - IVA 19%`,
        debito: 0,
        credito: Number(venta.iva19),
        terceroNit: venta.clienteDoc,
        terceroNombre: venta.clienteNombre,
      })
    }

    // Crédito a IVA 5%
    if (Number(venta.iva5) > 0 && cIva5) {
      lineas.push({
        cuentaId: cIva5,
        descripcion: `${desc} - IVA 5%`,
        debito: 0,
        credito: Number(venta.iva5),
        terceroNit: venta.clienteDoc,
        terceroNombre: venta.clienteNombre,
      })
    }

    // Costo de Ventas e Inventario por producto
    for (const item of (venta.items || [])) {
      const cTotal = Number(item.costoTotal || 0)
      if (cTotal > 0) {
        const product = await tx.producto.findUnique({
          where: { id: item.productoId },
          include: { clasificacion: true, grupo: true }
        })

        let cInvId = cInventario
        const customInvCode = (product?.grupo?.contable as any)?.inventarioVenta
        if (customInvCode) {
          const customInv = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: customInvCode, activo: true },
            select: { id: true }
          })
          if (customInv) cInvId = customInv.id
        } else if (product?.clasificacion?.pucCuenta) {
          const customInv = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: product.clasificacion.pucCuenta, activo: true },
            select: { id: true }
          })
          if (customInv) cInvId = customInv.id
        }

        let cCostoVtaId = cCostoVta
        const customCostoCode = (product?.grupo?.contable as any)?.costoEnVentas
        if (customCostoCode) {
          const customCosto = await tx.cuentaPUC.findFirst({
            where: { empresaId, codigo: customCostoCode, activo: true },
            select: { id: true }
          })
          if (customCosto) cCostoVtaId = customCosto.id
        }

        if (cCostoVtaId && cInvId) {
          lineas.push({
            cuentaId: cCostoVtaId,
            descripcion: `Costo ${item.descripcion} - POS ${venta.numero}`,
            debito: cTotal,
            credito: 0,
            terceroNit: venta.clienteDoc,
            terceroNombre: venta.clienteNombre,
          })
          lineas.push({
            cuentaId: cInvId,
            descripcion: `Salida Inv ${item.descripcion} - POS ${venta.numero}`,
            debito: 0,
            credito: cTotal,
            terceroNit: venta.clienteDoc,
            terceroNombre: venta.clienteNombre,
          })
        }
      }
    }

    // Validar y ajustar diferencia menor al peso
    const totalDb = lineas.reduce((acc, l) => acc + l.debito, 0)
    const totalCr = lineas.reduce((acc, l) => acc + l.credito, 0)
    const diff = Math.round((totalDb - totalCr) * 100) / 100

    if (Math.abs(diff) > 0 && Math.abs(diff) <= 2) {
      if (diff > 0) {
        lineas.push({
          cuentaId: cIngresos,
          descripcion: `${desc} - Ajuste al peso`,
          debito: 0,
          credito: diff,
          terceroNit: venta.clienteDoc,
          terceroNombre: venta.clienteNombre,
        })
      } else {
        lineas.push({
          cuentaId: cCaja,
          descripcion: `${desc} - Ajuste al peso`,
          debito: Math.abs(diff),
          credito: 0,
          terceroNit: venta.clienteDoc,
          terceroNombre: venta.clienteNombre,
        })
      }
    } else if (Math.abs(diff) > 2) {
      console.warn('[POS Asiento] Partida doble descuadrada, omitido:', { totalDb, totalCr, diff, venta: venta.numero })
      return
    }

    // Crear o asegurar período contable
    const fecha = new Date(venta.fecha)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const periodo = await tx.periodoContable.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, estado: 'ABIERTO' },
      update: {},
    })

    const ultimo = await tx.comprobante.findFirst({
      where: { empresaId, tipo: 'POS' },
      orderBy: { id: 'desc' },
      select: { numero: true }
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

    await tx.ventaPos.update({
      where: { id: venta.id },
      data: { comprobanteId: comprobante.id },
    })
  }

  /**
   * Sincroniza automáticamente cualquier venta POS completada que no tenga comprobante contable
   */
  async sincronizarVentasSinComprobante(empresaId: number) {
    try {
      const ventasSinComp = await this.prisma.ventaPos.findMany({
        where: {
          empresaId,
          estado: 'COMPLETADA',
          comprobanteId: null,
        },
        include: { items: true },
        take: 50,
      })

      for (const v of ventasSinComp) {
        await this.prisma.$transaction(async (tx) => {
          await this.crearAsientoVentaPos(tx, v, empresaId, v.sesionId)
        })
      }
    } catch (err) {
      console.error('[POS Sincronización Comprobantes] Error:', err)
    }
  }
}
