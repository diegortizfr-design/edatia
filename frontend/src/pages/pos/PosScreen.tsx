import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSesion, buscarProductosPos, crearVentaPos, anularVentaPos, crearProductoRapidoPos, crearClienteRapidoPos,
} from '../../services/pos.service'
import { getDocumentosConfig, incrementarConsecutivo } from '../../services/configuracion.service'
import {
  ShoppingCart, Search, X, Plus, Minus, Trash2, User, CreditCard,
  Banknote, Smartphone, Printer, ChevronLeft, AlertCircle, CheckCircle2,
  Tag, Scan, Users, Sun, Moon, Zap, PackagePlus, UserPlus, Check, ChevronDown,
} from 'lucide-react'
import { getClientes } from '../../services/ventas.service'
import { getMediosPago } from '../../services/configuracion.service'
import { getMediaUrl } from '../../services/api'

const IVA_RATES: Record<string, number> = {
  IVA_19: 0.19, GRAVADO_19: 0.19,
  IVA_5: 0.05,  GRAVADO_5: 0.05,
  IVA_0: 0,     EXCLUIDO: 0, EXENTO: 0,
}

type CartItem = {
  productoId: number
  nombre: string
  sku: string
  precio: number
  cantidad: number
  descuentoPct: number
  tipoIva: string
  stock: number
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

// Helper para formatear valores monetarios con puntos de miles (ej: 20000 -> "20.000")
const formatMonto = (num: number) => {
  if (!num) return ''
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num)
}

export function PosScreen() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>>()

  const [q, setQ] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPago, setShowPago] = useState(false)
  const [showAnular, setShowAnular] = useState<number | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [rotationTab, setRotationTab] = useState<'alta' | 'baja'>('alta')
  const [pagosPorMedio, setPagosPorMedio] = useState<Record<string, number>>({})
  const [ventaOk, setVentaOk] = useState<any>(null)
  const [descuentoExtra, setDescuentoExtra] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pos_theme')
      return (saved === 'light' || saved === 'dark') ? saved : 'dark'
    } catch {
      return 'dark'
    }
  })

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('pos_theme', next)
      } catch (e) {
        console.error(e)
      }
      return next
    })
  }

  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const isDark = theme === 'dark'

  // Quick Product Creation state
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickSku, setQuickSku] = useState('')
  const [quickNombre, setQuickNombre] = useState('')
  const [quickPrecio, setQuickPrecio] = useState('')
  const [quickIva, setQuickIva] = useState('EXCLUIDO')
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)

  // Quick Client Creation state
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [quickClientTipoDoc, setQuickClientTipoDoc] = useState('CC')
  const [quickClientDoc, setQuickClientDoc] = useState('')
  const [quickClientNombre, setQuickClientNombre] = useState('')
  const [quickClientTelefono, setQuickClientTelefono] = useState('')
  const [quickClientEmail, setQuickClientEmail] = useState('')
  const [quickClientDireccion, setQuickClientDireccion] = useState('')
  const [quickClientLoading, setQuickClientLoading] = useState(false)
  const [quickClientError, setQuickClientError] = useState<string | null>(null)

  // Client search combobox state
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  const clientInputRef = useRef<HTMLInputElement>(null)

  const sesId = parseInt(sesionId ?? '0')

  const { data: sesion } = useQuery(['sesion-pos', sesId], () => getSesion(sesId), {
    enabled: !!sesId,
    refetchInterval: 30000,
  })

  // Reglas de validación de stock negativo en 3 niveles (Empresa -> Bodega -> Caja)
  const empresaPermiteNegativo = Boolean(sesion?.empresa?.permiteStockNegativo)
  const bodegaPermiteNegativo = Boolean(sesion?.caja?.bodega?.permiteStockNegativo)
  const cajaPermiteNegativo = Boolean(sesion?.caja?.permiteStockNegativo)
  const puedeStockNegativo = empresaPermiteNegativo && bodegaPermiteNegativo && cajaPermiteNegativo

  const { data: clientes = [] } = useQuery(['clientes'], () => getClientes())
  const { data: mediosPago = [] } = useQuery(['medios-pago'], getMediosPago)

  const { data: productos = [], refetch: refetchProductos } = useQuery(
    ['pos-productos', q, sesion?.caja?.bodegaId],
    () => buscarProductosPos(q, sesion?.caja?.bodegaId ?? 0),
    { enabled: !!sesion?.caja?.bodegaId, keepPreviousData: true }
  )

  useEffect(() => {
    if (sesion?.caja?.clienteDefault) {
      setSelectedCliente(sesion.caja.clienteDefault)
    } else {
      setSelectedCliente(null)
    }
  }, [sesion])

  const mutVenta = useMutation({
    mutationFn: crearVentaPos,
    onSuccess: async (data) => {
      // Invalidar y refrescar productos de la bodega para reflejar el stock actualizado
      qc.invalidateQueries({ queryKey: ['pos-productos'] })
      qc.invalidateQueries({ queryKey: ['sesion-pos', sesId] })
      refetchProductos()

      const cambioFinal = cambio
      setVentaOk({
        ...data,
        cambio: cambioFinal,
        items: cart.map(i => ({
          producto: { nombre: i.nombre },
          cantidad: i.cantidad,
          precioUnitario: i.precio,
          descuentoPct: i.descuentoPct,
          tipoIva: i.tipoIva,
        })),
        subtotal: totales.subtotal,
        descuento: totales.descuento + descuentoExtra,
        iva19: cart.filter(i => i.tipoIva === 'IVA_19' || i.tipoIva === 'GRAVADO_19').reduce((a, b) => a + calcItem(b).iva, 0),
        iva5: cart.filter(i => i.tipoIva === 'IVA_5' || i.tipoIva === 'GRAVADO_5').reduce((a, b) => a + calcItem(b).iva, 0),
      })
      setCart([])
      setPagosPorMedio({})
      setDescuentoExtra(0)
      if (sesion?.caja?.clienteDefault) {
        setSelectedCliente(sesion.caja.clienteDefault)
      } else {
        setSelectedCliente(null)
      }
      setShowPago(false)
    },
  })

  const handleNuevaVenta = () => {
    setVentaOk(null)
    qc.invalidateQueries({ queryKey: ['pos-productos'] })
    qc.invalidateQueries({ queryKey: ['sesion-pos', sesId] })
    refetchProductos()
  }

  const mutAnular = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularVentaPos(id, motivo),
    onSuccess: () => setShowAnular(null),
  })

  // Lector de código de barras (teclado rápido y atajos F2 y F3)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        setQuickSku(q.trim())
        setQuickNombre('')
        setQuickPrecio('')
        setQuickIva('EXCLUIDO')
        setQuickError(null)
        setShowQuickCreate(true)
        return
      }
      if (e.key === 'F3') {
        e.preventDefault()
        openQuickClientModal('', '')
        return
      }
      if (e.key === 'Escape') {
        setShowQuickCreate(false)
        setShowQuickClient(false)
        setClientSearchOpen(false)
      }
      if (document.activeElement === searchRef.current || document.activeElement === clientInputRef.current) return
      if (e.key === 'Enter' && barcodeBuffer.current.length > 2) {
        setQ(barcodeBuffer.current.trim())
        barcodeBuffer.current = ''
        return
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [q, showQuickCreate, showQuickClient, clientSearchOpen])

  // Cerrar dropdown de búsqueda de cliente al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (q) refetchProductos()
  }, [q])

  // Calcular totales
  const calcItem = (item: CartItem) => {
    const bruto = item.precio * item.cantidad
    const descVal = bruto * item.descuentoPct / 100
    const base = bruto - descVal
    const ivaRate = IVA_RATES[item.tipoIva] ?? 0
    const iva = base * ivaRate
    return { bruto, descVal, base, iva, total: base + iva }
  }
  const filteredProducts = useMemo(() => {
    if (q.length > 0) return productos
    return productos.filter((p: any) => {
      const cat = p.claseAbc?.toUpperCase()
      if (rotationTab === 'alta') {
        return cat === 'A' || cat === 'B' || !cat
      } else {
        return cat === 'C'
      }
    })
  }, [productos, q, rotationTab])
  const activeMedios = useMemo(() => {
    const list = mediosPago.filter((mp: any) => mp.activo)
    if (list.length > 0) return list
    return [
      { codigo: 'EFECTIVO', nombre: 'Efectivo' },
      { codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito' },
      { codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta Crédito' },
      { codigo: 'TRANSFERENCIA', nombre: 'Transferencia' },
      { codigo: 'NEQUI', nombre: 'Nequi / Daviplata' },
    ]
  }, [mediosPago])
  const totales = cart.reduce((acc, item) => {
    const c = calcItem(item)
    acc.subtotal += c.bruto
    acc.descuento += c.descVal
    acc.iva += c.iva
    acc.total += c.total
    return acc
  }, { subtotal: 0, descuento: 0, iva: 0, total: 0 })

  totales.total -= descuentoExtra

  const totalPago = useMemo(() => {
    return Object.values(pagosPorMedio).reduce((acc, val) => acc + (Number(val) || 0), 0)
  }, [pagosPorMedio])

  const efectivoRecibido = useMemo(() => {
    let sum = 0
    activeMedios.forEach((m: any) => {
      const code = (m.codigo || '').toUpperCase()
      const nom = (m.nombre || '').toUpperCase()
      if (code === 'EFECTIVO' || nom.includes('EFECTIVO')) {
        sum += Number(pagosPorMedio[m.codigo]) || 0
      }
    })
    return sum
  }, [activeMedios, pagosPorMedio])

  const cambio = useMemo(() => {
    if (totalPago <= totales.total) return 0
    const excedente = totalPago - totales.total
    return Math.min(excedente, efectivoRecibido)
  }, [totalPago, totales.total, efectivoRecibido])

  const saldoFaltante = Math.max(0, totales.total - totalPago)

  const handleMontoChange = (codigo: string, rawText: string) => {
    const digits = rawText.replace(/\D/g, '')
    const val = digits ? parseInt(digits, 10) : 0
    setPagosPorMedio(prev => ({ ...prev, [codigo]: val }))
  }

  const setSinglePaymentMethod = (targetCodigo: string, amount: number) => {
    const next: Record<string, number> = {}
    activeMedios.forEach((m: any) => {
      next[m.codigo] = m.codigo === targetCodigo ? amount : 0
    })
    setPagosPorMedio(next)
  }

  const handleOpenPagoModal = () => {
    const cashMethod = activeMedios.find((m: any) => {
      const code = (m.codigo || '').toUpperCase()
      const nom = (m.nombre || '').toUpperCase()
      return code === 'EFECTIVO' || nom.includes('EFECTIVO')
    })
    const cashCode = cashMethod?.codigo || 'EFECTIVO'
    const init: Record<string, number> = {}
    activeMedios.forEach((m: any) => {
      init[m.codigo] = m.codigo === cashCode ? totales.total : 0
    })
    setPagosPorMedio(init)
    setShowPago(true)
  }

  const addToCart = useCallback((prod: any) => {
    const resolvedTipoIva = prod.productoExentoIva
      ? 'EXENTO'
      : (prod.liquidarIva === false || (Array.isArray(prod.appliedTaxIds) && prod.appliedTaxIds.length === 0))
        ? 'EXCLUIDO'
        : (prod.tipoIva ?? 'IVA_19')

    setCart(prev => {
      const idx = prev.findIndex(i => i.productoId === prod.id)
      if (idx >= 0) {
        const updated = [...prev]
        if (updated[idx].cantidad < updated[idx].stock) {
          updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 }
        }
        return updated
      }
      return [...prev, {
        productoId: prod.id,
        nombre: prod.nombre,
        sku: prod.sku ?? '',
        precio: prod.precioBase,
        cantidad: 1,
        descuentoPct: 0,
        tipoIva: resolvedTipoIva,
        stock: prod.stock ?? 999,
      }]
    })
    setQ('')
  }, [])

  const removeFromCart = (productoId: number) => setCart(prev => prev.filter(i => i.productoId !== productoId))
  const updateQty = (productoId: number, delta: number) => setCart(prev =>
    prev.map(i => i.productoId === productoId
      ? { ...i, cantidad: Math.max(1, Math.floor(i.cantidad + delta)) }
      : i)
  )
  const updateDescuento = (productoId: number, pct: number) => setCart(prev =>
    prev.map(i => i.productoId === productoId ? { ...i, descuentoPct: Math.max(0, Math.min(100, pct)) } : i)
  )

  const handleSaveQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickSku.trim() || !quickNombre.trim()) {
      setQuickError('El código/SKU y el nombre son obligatorios.')
      return
    }
    const cleanPrice = String(quickPrecio).replace(/\./g, '').replace(/,/g, '')
    const precio = Number(cleanPrice) || 0
    if (precio < 0) {
      setQuickError('El precio de venta no puede ser negativo.')
      return
    }

    if (!puedeStockNegativo) {
      if (!cajaPermiteNegativo) {
        setQuickError(`La caja "${sesion?.caja?.nombre}" no tiene habilitado facturar con stock en negativo en su configuración.`)
      } else if (!bodegaPermiteNegativo) {
        setQuickError(`La bodega "${sesion?.caja?.bodega?.nombre ?? 'asignada'}" no tiene autorizado stock negativo en Configuración > Empresa > Inventario y Compras.`)
      } else {
        setQuickError('La empresa no tiene habilitada la venta con stock en negativo en Configuración > Empresa > Inventario y Compras.')
      }
      return
    }

    setQuickCreating(true)
    setQuickError(null)
    try {
      const created = await crearProductoRapidoPos({
        sesionId: Number(sesId),
        sku: quickSku.trim(),
        nombre: quickNombre.trim(),
        precio,
        tipoIva: quickIva,
      })

      await qc.invalidateQueries({ queryKey: ['pos-productos'] })
      qc.invalidateQueries({ queryKey: ['config_productos'] })
      qc.invalidateQueries({ queryKey: ['productos'] })

      // Agregar inmediatamente al carrito con su stock inicial
      addToCart({
        id: created.id,
        nombre: created.nombre,
        sku: created.sku,
        codigoBarras: created.codigoBarras,
        precioBase: Number(created.precioBase) || precio,
        tipoIva: created.tipoIva || quickIva,
        liquidarIva: created.liquidarIva,
        productoExentoIva: created.productoExentoIva,
        appliedTaxIds: created.appliedTaxIds,
        stock: 0,
      })

      setShowQuickCreate(false)
      setQ('')
      setQuickSku('')
      setQuickNombre('')
      setQuickPrecio('')
    } catch (err: any) {
      setQuickError(err?.response?.data?.message || err?.message || 'Error al guardar el producto rápido')
    } finally {
      setQuickCreating(false)
    }
  }

  const openQuickClientModal = (initialDoc = '', initialNombre = '') => {
    setQuickClientTipoDoc('CC')
    setQuickClientDoc(initialDoc)
    setQuickClientNombre(initialNombre)
    setQuickClientTelefono('')
    setQuickClientEmail('')
    setQuickClientDireccion('')
    setQuickClientError(null)
    setShowQuickClient(true)
    setClientSearchOpen(false)
  }

  const filteredClientes = useMemo(() => {
    const query = clientSearchQuery.trim().toLowerCase()
    if (!query) return clientes.slice(0, 15)
    return clientes.filter((c: any) => {
      const matchDoc = c.numeroDocumento && c.numeroDocumento.toLowerCase().includes(query)
      const matchNom = c.nombre && c.nombre.toLowerCase().includes(query)
      return matchDoc || matchNom
    }).slice(0, 15)
  }, [clientes, clientSearchQuery])

  const handleClientSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const query = clientSearchQuery.trim()
      if (!query) return

      // 1. Coincidencia exacta por documento
      const exactMatch = clientes.find((c: any) =>
        c.numeroDocumento && c.numeroDocumento.trim().toLowerCase() === query.toLowerCase()
      )
      if (exactMatch) {
        setSelectedCliente(exactMatch)
        setClientSearchOpen(false)
        setClientSearchQuery('')
        return
      }

      // 2. Si solo hay 1 cliente coincidente en el filtro
      if (filteredClientes.length === 1) {
        setSelectedCliente(filteredClientes[0])
        setClientSearchOpen(false)
        setClientSearchQuery('')
        return
      }

      // 3. No existe cliente con este dato -> abrir modal con el dato prellenado
      const isNum = /^[0-9]+$/.test(query)
      if (isNum) {
        openQuickClientModal(query, '')
      } else {
        openQuickClientModal('', query)
      }
    }
  }

  const handleSaveQuickClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickClientDoc.trim()) {
      setQuickClientError('El número de documento es obligatorio')
      return
    }
    if (!quickClientNombre.trim()) {
      setQuickClientError('El nombre del cliente es obligatorio')
      return
    }
    try {
      setQuickClientLoading(true)
      setQuickClientError(null)
      const res = await crearClienteRapidoPos({
        tipoDocumento: quickClientTipoDoc,
        numeroDocumento: quickClientDoc.trim(),
        nombre: quickClientNombre.trim(),
        telefono: quickClientTelefono.trim() || undefined,
        email: quickClientEmail.trim() || undefined,
        direccion: quickClientDireccion.trim() || undefined,
      })

      await qc.invalidateQueries({ queryKey: ['clientes'] })
      setSelectedCliente(res)
      setShowQuickClient(false)
      setClientSearchOpen(false)
      setClientSearchQuery('')
    } catch (err: any) {
      setQuickClientError(err?.response?.data?.message || err?.message || 'Error al guardar el cliente')
    } finally {
      setQuickClientLoading(false)
    }
  }

  const handleFinalizarVenta = () => {
    if (cart.length === 0) return
    if (saldoFaltante > 0) return

    let pagoEfectivo = 0
    let pagoTarjetaDebito = 0
    let pagoTarjetaCredito = 0
    let pagoTransferencia = 0
    let pagoNequi = 0

    activeMedios.forEach((m: any) => {
      const monto = Number(pagosPorMedio[m.codigo]) || 0
      if (monto <= 0) return

      const code = (m.codigo || '').toUpperCase()
      const name = (m.nombre || '').toUpperCase()

      if (code === 'EFECTIVO' || name.includes('EFECTIVO')) {
        pagoEfectivo += monto
      } else if (code.includes('DEBITO') || name.includes('DEBITO')) {
        pagoTarjetaDebito += monto
      } else if (code.includes('CREDITO') || name.includes('CREDITO') || code.includes('TARJETA') || name.includes('TARJETA') || code.includes('DATAFONO') || name.includes('DATAFONO')) {
        pagoTarjetaCredito += monto
      } else if (code.includes('NEQUI') || name.includes('NEQUI') || code.includes('DAVIPLATA') || name.includes('DAVIPLATA')) {
        pagoNequi += monto
      } else {
        pagoTransferencia += monto
      }
    })

    mutVenta.mutate({
      sesionId: sesId,
      clienteId: selectedCliente?.id || undefined,
      clienteNombre: selectedCliente?.nombre || 'Consumidor Final',
      clienteDoc: selectedCliente?.numeroDocumento || undefined,
      descuento: descuentoExtra,
      pagoEfectivo,
      pagoTarjetaDebito,
      pagoTarjetaCredito,
      pagoTransferencia,
      pagoNequi,
      cambio,
      tipoDocumento: sesion?.caja?.documentoConfig?.sigla || 'POS',
      items: cart.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
        descuentoPct: i.descuentoPct,
        tipoIva: i.tipoIva,
      })),
    })
  }

  const imprimirTirilla = (venta: any) => {
    const w = window.open('', '_blank', 'width=300,height=600')
    if (!w) return
    
    const fmtVal = (val: any) => fmt(Number(val ?? 0))
    const sucursal = sesion?.caja?.documentoConfig?.sucursal
    const docConfig = sesion?.caja?.documentoConfig

    w.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 11px; margin: 0; padding: 8px; width: 280px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .big { font-size: 14px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:13px">${sesion?.empresa?.nombre ?? 'EDATIA ERP'}</div>
        <div class="center">NIT: ${sesion?.empresa?.nit ?? ''}</div>
        
        ${sucursal ? `
          <div class="center bold">${sucursal.nombre}</div>
          <div class="center">${sucursal.direccion}</div>
          <div class="center">${sucursal.municipio ?? ''} - ${sucursal.departamento ?? ''}</div>
        ` : ''}
        
        <div class="center">${sesion?.caja?.nombre ?? ''}</div>
        <div class="line"></div>
        
        <div class="row"><span>Ticket:</span><span class="bold">${venta.numero}</span></div>
        <div class="row"><span>Fecha:</span><span>${new Date(venta.fecha ?? Date.now()).toLocaleString('es-CO')}</span></div>
        <div class="row"><span>Cliente:</span><span>${venta.clienteNombre}</span></div>
        <div class="row"><span>Vendedor:</span><span>${sesion?.vendedorNombre ?? '-'}</span></div>
        <div class="line"></div>
        
        ${(venta.items ?? []).map((i: any) => `
          <div>
            <div class="bold">${i.producto?.nombre || 'Producto'}</div>
            <div class="row"><span>${Number(i.cantidad)} x ${fmtVal(i.precioUnitario)}</span><span>${fmtVal(Number(i.cantidad) * Number(i.precioUnitario))}</span></div>
          </div>
        `).join('')}
        
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>${fmtVal(venta.subtotal)}</span></div>
        ${Number(venta.descuento) > 0 ? `<div class="row"><span>Descuento:</span><span>-${fmtVal(venta.descuento)}</span></div>` : ''}
        ${Number(venta.iva19) > 0 ? `<div class="row"><span>IVA 19%:</span><span>${fmtVal(venta.iva19)}</span></div>` : ''}
        ${Number(venta.iva5) > 0 ? `<div class="row"><span>IVA 5%:</span><span>${fmtVal(venta.iva5)}</span></div>` : ''}
        <div class="line"></div>
        <div class="row big"><span>TOTAL:</span><span>${fmtVal(venta.total)}</span></div>
        <div class="line"></div>
        
        ${Number(venta.pagoEfectivo) > 0 ? `<div class="row"><span>Efectivo:</span><span>${fmtVal(venta.pagoEfectivo)}</span></div>` : ''}
        ${Number(venta.pagoTarjetaDebito) > 0 ? `<div class="row"><span>T. Débito:</span><span>${fmtVal(venta.pagoTarjetaDebito)}</span></div>` : ''}
        ${Number(venta.pagoTarjetaCredito) > 0 ? `<div class="row"><span>T. Crédito:</span><span>${fmtVal(venta.pagoTarjetaCredito)}</span></div>` : ''}
        ${Number(venta.pagoTransferencia) > 0 ? `<div class="row"><span>Transferencia:</span><span>${fmtVal(venta.pagoTransferencia)}</span></div>` : ''}
        ${Number(venta.pagoNequi) > 0 ? `<div class="row"><span>Nequi:</span><span>${fmtVal(venta.pagoNequi)}</span></div>` : ''}
        ${Number(venta.cambio) > 0 ? `<div class="row bold"><span>Cambio:</span><span>${fmtVal(venta.cambio)}</span></div>` : ''}
        
        ${docConfig?.resolucionDian ? `
          <div class="line"></div>
          <div class="center" style="font-size:9px">
            Resolución DIAN No. ${docConfig.resolucionDian}<br/>
            Autoriza prefijo ${docConfig.prefijo}<br/>
            del No. ${docConfig.rangoDesde ?? 1} al ${docConfig.rangoHasta ?? 999999}
          </div>
        ` : ''}
        
        <div class="line"></div>
        <div class="center">¡Gracias por su compra!</div>
        <div class="center">Edatia ERP</div>
        <br/><br/>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  if (!sesion) return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
        <p>Cargando sesión POS...</p>
      </div>
    </div>
  )

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden transition-colors duration-200 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`} style={{ fontFamily: 'system-ui' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`px-4 py-2 flex items-center justify-between border-b shrink-0 transition-colors duration-200 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')}
            className={`transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-855'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-800'}`}>{sesion.caja?.nombre}</span>
            <span className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {sesion.vendedorNombre}</span>
            {sesion.caja?.bodega && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                isDark 
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Bodega: {sesion.caja.bodega.nombre}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'text-slate-450 hover:text-white bg-slate-700/50'
                : 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200'
            }`}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="text-right">
            <div className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ventas del turno</div>
            <div className={`font-bold text-sm transition-colors duration-200 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{fmt(Number(sesion.totalVentas ?? 0))}</div>
          </div>
          <button onClick={() => navigate(`/pos/cierre/${sesId}`)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
            Cerrar Caja
          </button>
        </div>
      </div>

      {/* ── Cuerpo ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo: productos */}
        <div className={`flex flex-col flex-1 overflow-hidden border-r transition-colors duration-200 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          {/* Búsqueda */}
          <div className={`p-3 shrink-0 flex gap-2 transition-colors duration-200 ${isDark ? 'bg-slate-800' : 'bg-white border-b border-slate-200'}`}>
            <div className="relative flex-1">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <Scan size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                ref={searchRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.length === 0 && q.trim().length > 0) {
                    e.preventDefault()
                    setQuickSku(q.trim())
                    setQuickNombre('')
                    setQuickPrecio('')
                    setQuickIva('EXCLUIDO')
                    setQuickError(null)
                    setShowQuickCreate(true)
                  }
                }}
                placeholder="Buscar por nombre, SKU o escanear código de barras (F2: Crear Rápido)..."
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${isDark ? 'bg-slate-700 text-white placeholder-slate-400' : 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200'}`}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setQuickSku(q.trim())
                setQuickNombre('')
                setQuickPrecio('')
                setQuickIva('EXCLUIDO')
                setQuickError(null)
                setShowQuickCreate(true)
              }}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
              title="Crear producto rápido (Atajo: F2)"
            >
              <Zap size={15} className="text-amber-300" />
              <span className="hidden sm:inline">Nuevo Rápido</span>
            </button>
          </div>

          {/* Grid de productos */}
          <div className={`flex-1 flex flex-col min-h-0 transition-colors duration-200 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {q.length === 0 && (
              <div className={`px-3 py-2 shrink-0 border-b flex gap-2 transition-colors duration-200 ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <button
                  onClick={() => setRotationTab('alta')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rotationTab === 'alta'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-700/40' : 'text-slate-500 hover:text-slate-800 bg-slate-100'
                  }`}
                >
                  🔥 Alta Rotación (Más vendidos)
                </button>
                <button
                  onClick={() => setRotationTab('baja')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rotationTab === 'baja'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-700/40' : 'text-slate-500 hover:text-slate-800 bg-slate-100'
                  }`}
                >
                  ❄️ Baja Rotación
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                    <Scan size={28} />
                  </div>
                  <p className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {q.length > 0 ? `No se encontró "${q}"` : 'No hay productos disponibles'}
                  </p>
                  <p className={`text-xs max-w-xs mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {q.length > 0
                      ? '¿El cliente lo tiene en el mostrador? Créalo en 2 segundos para venderlo ya.'
                      : 'Puedes crear un producto rápido para agregarlo al carrito.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSku(q.trim())
                      setQuickNombre('')
                      setQuickPrecio('')
                      setQuickIva('EXCLUIDO')
                      setQuickError(null)
                      setShowQuickCreate(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
                  >
                    <Plus size={16} />
                    Crear Producto Rápido {q.length > 0 ? `("${q.trim()}")` : ''}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map((prod: any) => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`rounded-xl p-3 text-left transition-all border-2 border-transparent hover:border-indigo-500 active:scale-95 flex flex-col justify-between transition-colors duration-200 ${
                        isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm border-slate-200'
                      }`}
                    >
                      <div>
                        <div className={`w-full aspect-square rounded-lg mb-2 flex items-center justify-center overflow-hidden transition-colors duration-200 ${isDark ? 'bg-slate-600' : 'bg-slate-100'}`}>
                          {prod.imagen && !imgErrors[prod.id] ? (
                            <img
                              src={getMediaUrl(prod.imagen)}
                              alt={prod.nombre}
                              onError={() => setImgErrors(prev => ({ ...prev, [prod.id]: true }))}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Tag size={24} className={isDark ? 'text-slate-400' : 'text-slate-300'} />
                          )}
                        </div>
                        <div className={`text-xs font-semibold leading-tight line-clamp-2 transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-800'}`}>{prod.nombre}</div>
                        {prod.sku && <div className={`text-[10px] font-mono mt-0.5 transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{prod.sku}</div>}
                      </div>
                      <div className="mt-2">
                        <div className={`font-extrabold text-sm transition-colors duration-200 ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}>{fmt(prod.precioBase)}</div>
                        <div className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                          prod.stock <= 0
                            ? (isDark ? 'text-rose-400' : 'text-rose-600')
                            : prod.stock < 5
                              ? (isDark ? 'text-amber-400' : 'text-amber-600')
                              : (isDark ? 'text-slate-400' : 'text-slate-550')
                        }`}>
                          Stock: {prod.stock}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho: carrito */}
        <div className={`w-80 xl:w-96 flex flex-col transition-colors duration-200 ${isDark ? 'bg-slate-800 text-white' : 'bg-white border-l border-slate-200 text-slate-800'}`}>
          {/* Cliente */}
          <div className={`p-3 border-b shrink-0 transition-colors duration-200 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} ref={clientDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <User size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cliente</span>
              </div>
              <button
                type="button"
                onClick={() => openQuickClientModal('', '')}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 transition-all border border-indigo-500/20"
                title="Crear cliente rápido (F3)"
              >
                <UserPlus size={11} />
                <span>+ Nuevo (F3)</span>
              </button>
            </div>

            {/* Selector interactivo de cliente */}
            <div className="relative">
              {clientSearchOpen ? (
                <div>
                  <div className={`flex items-center border rounded-xl px-2.5 py-1.5 transition-colors ${
                    isDark ? 'bg-slate-700 border-indigo-500' : 'bg-white border-indigo-500 shadow-sm'
                  }`}>
                    <Search size={13} className="text-indigo-400 shrink-0 mr-1.5" />
                    <input
                      ref={clientInputRef}
                      type="text"
                      autoFocus
                      value={clientSearchQuery}
                      onChange={e => setClientSearchQuery(e.target.value)}
                      onKeyDown={handleClientSearchKeyDown}
                      placeholder="Cédula, NIT o Nombre..."
                      className={`w-full bg-transparent text-xs font-semibold outline-none ${
                        isDark ? 'text-white placeholder-slate-400' : 'text-slate-800 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearchOpen(false)
                        setClientSearchQuery('')
                      }}
                      className={`p-0.5 rounded-md hover:bg-slate-500/20 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Dropdown flotante con resultados */}
                  <div className={`absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl shadow-2xl border z-30 p-1.5 space-y-1 ${
                    isDark ? 'bg-slate-800 border-slate-700 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-300'
                  }`}>
                    {/* Opción destacada para crear cliente al vuelo con lo digitado */}
                    {clientSearchQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const q = clientSearchQuery.trim()
                          const isNum = /^[0-9]+$/.test(q)
                          if (isNum) openQuickClientModal(q, '')
                          else openQuickClientModal('', q)
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-all border ${
                          isDark
                            ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50 text-indigo-300'
                            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <UserPlus size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold leading-tight truncate">
                            {/^[0-9]+$/.test(clientSearchQuery.trim()) ? (
                              <>Crear cliente con Cédula/NIT <span className="underline font-mono">"{clientSearchQuery.trim()}"</span></>
                            ) : (
                              <>Crear cliente con Nombre <span className="underline">"{clientSearchQuery.trim()}"</span></>
                            )}
                          </div>
                          <div className="text-[9px] opacity-75">Presione Enter o haga clic para abrir registro rápido</div>
                        </div>
                      </button>
                    )}

                    {/* Lista de clientes encontrados */}
                    {filteredClientes.length === 0 && !clientSearchQuery.trim() ? (
                      <div className="p-3 text-center text-xs opacity-60">
                        Escriba la cédula o nombre del cliente
                      </div>
                    ) : filteredClientes.length === 0 ? (
                      <div className="p-2 text-center text-[11px] opacity-60">
                        No se encontró ningún cliente registrado con ese término.
                      </div>
                    ) : (
                      filteredClientes.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCliente(c)
                            setClientSearchOpen(false)
                            setClientSearchQuery('')
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                            selectedCliente?.id === c.id
                              ? isDark ? 'bg-indigo-900/40 text-indigo-300 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold'
                              : isDark ? 'hover:bg-slate-700/60 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="truncate font-semibold">{c.nombre}</div>
                            <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                              {c.tipoDocumento || 'CC'} {c.numeroDocumento || 'Sin doc'}
                              {c.telefono ? ` • Tel: ${c.telefono}` : ''}
                            </div>
                          </div>
                          {selectedCliente?.id === c.id && <Check size={14} className="text-indigo-400 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Card del cliente seleccionado */
                <div
                  onClick={() => setClientSearchOpen(true)}
                  className={`group flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-700/70 border-slate-600 hover:border-indigo-500/80 hover:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white shadow-sm'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedCliente?.nombre || 'Consumidor Final'}
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      {selectedCliente?.numeroDocumento
                        ? `${selectedCliente.tipoDocumento || 'CC'} ${selectedCliente.numeroDocumento}`
                        : '222222222222 (Sin identificación)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-indigo-400 group-hover:underline">
                      Cambiar
                    </span>
                    {selectedCliente && sesion?.caja?.clienteDefault && selectedCliente.id !== sesion.caja.clienteDefault.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCliente(sesion.caja.clienteDefault)
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isDark ? 'hover:bg-slate-600 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-800'
                        }`}
                        title="Restablecer cliente por defecto"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className={`text-center py-12 transition-colors duration-200 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              cart.map(item => {
                const c = calcItem(item)
                return (
                  <div key={item.productoId} className={`rounded-xl p-3 transition-colors duration-200 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold leading-tight truncate transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-850'}`}>{item.nombre}</div>
                        <div className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{fmt(item.precio)} c/u</div>
                      </div>
                      <button onClick={() => removeFromCart(item.productoId)} className={`shrink-0 transition-colors duration-200 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productoId, -1)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          }`}>
                          <Minus size={12} />
                        </button>
                        <span className={`font-bold text-sm w-8 text-center transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.cantidad}</span>
                        <button onClick={() => updateQty(item.productoId, 1)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          }`}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Tag size={10} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                          <input
                            type="number" min={0} max={100} value={item.descuentoPct}
                            onChange={e => updateDescuento(item.productoId, +e.target.value)}
                            className={`w-10 text-xs text-center rounded px-1 py-0.5 outline-none transition-colors duration-200 ${
                              isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-800 border border-slate-250'
                            }`}
                          />
                          <span className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                        </div>
                        <div className={`font-extrabold text-sm transition-colors duration-200 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{fmt(c.total)}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Totales y botón pagar */}
          <div className={`border-t p-3 shrink-0 transition-colors duration-200 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            {cart.length > 0 && (
              <div className="space-y-1 mb-3 text-sm">
                <div className={`flex justify-between transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                  <span>Subtotal</span><span>{fmt(totales.subtotal)}</span>
                </div>
                {totales.descuento > 0 && (
                  <div className={`flex justify-between transition-colors duration-200 ${isDark ? 'text-amber-450' : 'text-amber-600 font-medium'}`}>
                    <span>Descuento</span><span>-{fmt(totales.descuento)}</span>
                  </div>
                )}
                <div className={`flex justify-between transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                  <span>IVA</span><span>{fmt(totales.iva)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>Desc. adicional $</span>
                  <input type="number" min={0} value={descuentoExtra}
                    onChange={e => setDescuentoExtra(+e.target.value)}
                    className={`w-24 text-xs px-2 py-1 rounded outline-none transition-colors duration-200 ${
                      isDark ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-800 border border-slate-250'
                    }`} />
                </div>
                <div className={`flex justify-between font-bold text-lg pt-1 border-t transition-colors duration-200 ${isDark ? 'border-slate-600 text-white' : 'border-slate-200 text-slate-850'}`}>
                  <span>TOTAL</span><span className={`transition-colors duration-200 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{fmt(totales.total)}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleOpenPagoModal}
              disabled={cart.length === 0 || !selectedCliente?.id}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-base transition-colors flex items-center justify-center gap-2 shadow-sm">
              <CreditCard size={20} />
              Cobrar {cart.length > 0 ? fmt(totales.total) : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Pago ─────────────────────────────────────────────────────── */}
      {showPago && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border shadow-2xl overflow-hidden transition-colors duration-200 ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b transition-colors duration-200 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <h2 className="font-bold text-lg">Confirmación de Venta y Pago</h2>
              <button onClick={() => setShowPago(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
              
              {/* Left Side: Payment Options (7 Columns) */}
              <div className="md:col-span-7 p-5 flex flex-col justify-between overflow-y-auto space-y-4 min-h-0">
                <div className="space-y-4">
                  {/* Total indicator */}
                  <div className={`rounded-xl p-4 text-center transition-colors duration-200 ${
                    isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`}>
                    <div className={isDark ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm font-medium'}>Total a cobrar</div>
                    <div className={`font-black text-3xl mt-1 transition-colors duration-200 ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>{fmt(totales.total)}</div>
                  </div>

                  {/* Payment Inputs */}
                  <div className="space-y-2">
                    {activeMedios.map((m: any) => {
                      const isEfectivo = (m.codigo || '').toUpperCase() === 'EFECTIVO' || (m.nombre || '').toLowerCase().includes('efectivo')
                      const isTarjeta = (m.codigo || '').includes('TARJETA') || (m.nombre || '').toLowerCase().includes('tarjeta') || (m.codigo || '').includes('DATAFONO') || (m.nombre || '').toLowerCase().includes('datafono')
                      const isQr = (m.codigo || '').includes('QR') || (m.nombre || '').toLowerCase().includes('qr')
                      const icon = isEfectivo ? <Banknote size={16} /> : (isTarjeta ? <CreditCard size={16} /> : (isQr ? <Scan size={16} /> : <Smartphone size={16} />))
                      const color = isEfectivo 
                        ? (isDark ? 'text-green-400' : 'text-green-600') 
                        : (isTarjeta
                          ? (isDark ? 'text-blue-400' : 'text-blue-600') 
                          : (isDark ? 'text-cyan-400' : 'text-cyan-600'))

                      const monto = Number(pagosPorMedio[m.codigo]) || 0

                      return (
                        <div key={m.codigo} className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                          monto > 0
                            ? isDark ? 'bg-slate-700/60 border-indigo-500/50' : 'bg-indigo-50/50 border-indigo-200'
                            : isDark ? 'bg-slate-700/20 border-transparent hover:bg-slate-700/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <div className={`${color} shrink-0`}>{icon}</div>
                            <span className="text-xs font-bold truncate">{m.nombre}</span>
                            <button
                              type="button"
                              onClick={() => setSinglePaymentMethod(m.codigo, totales.total)}
                              title="Pagar el total con este medio"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold opacity-60 hover:opacity-100 bg-slate-500/20 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                            >
                              Todo
                            </button>
                          </div>
                          
                          {/* Formatted Currency Input with $ and thousands dots */}
                          <div className="relative w-36 sm:w-44 shrink-0">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-xs select-none ${
                              isDark ? 'text-slate-400' : 'text-slate-400'
                            }`}>$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={pagosPorMedio[m.codigo] ? formatMonto(pagosPorMedio[m.codigo]) : ''}
                              onChange={e => handleMontoChange(m.codigo, e.target.value)}
                              placeholder="0"
                              className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-xs font-mono font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                                monto > 0
                                  ? isDark
                                    ? 'bg-slate-600 text-green-300 border border-green-500/50 shadow-sm'
                                    : 'bg-white text-green-700 border border-green-400 shadow-sm'
                                  : isDark
                                    ? 'bg-slate-700 text-white placeholder-slate-500 border border-slate-600'
                                    : 'bg-white text-slate-800 placeholder-slate-400 border border-slate-300'
                              }`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Fast Action Cash Denomination Shortcuts */}
                  <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                    isDark ? 'bg-slate-700/30 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Atajos de Efectivo</span>
                      <span className="text-[10px] text-indigo-400 font-normal">Clic para asignar billete</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const cashCode = activeMedios.find((m: any) => (m.codigo || '').toUpperCase() === 'EFECTIVO' || (m.nombre || '').toLowerCase().includes('efectivo'))?.codigo || 'EFECTIVO'
                          setSinglePaymentMethod(cashCode, totales.total)
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1"
                      >
                        <Zap size={11} className="text-amber-400" />
                        <span>Exacto ({fmt(totales.total)})</span>
                      </button>
                      {[10000, 20000, 50000, 100000].filter(d => d >= totales.total).map(denom => (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => {
                            const cashCode = activeMedios.find((m: any) => (m.codigo || '').toUpperCase() === 'EFECTIVO' || (m.nombre || '').toLowerCase().includes('efectivo'))?.codigo || 'EFECTIVO'
                            setSinglePaymentMethod(cashCode, denom)
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                            isDark
                              ? 'bg-slate-700 hover:bg-slate-650 text-slate-200 border-slate-600'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                          }`}
                        >
                          ${denom.toLocaleString('es-CO')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change or Missing warnings */}
                <div className="space-y-2 pt-2">
                  {cambio > 0 && (
                    <div className={`border-2 rounded-2xl p-4 flex items-center justify-between transition-all shadow-md animate-in fade-in ${
                      isDark
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Banknote size={22} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Valor a Devolver (Cambio)
                          </div>
                          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Efectivo recibido: {fmt(efectivoRecibido)}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-black text-2xl sm:text-3xl text-emerald-500 tracking-tight">
                        {fmt(cambio)}
                      </div>
                    </div>
                  )}

                  {totalPago > 0 && totalPago < totales.total && (
                    <div className={`border rounded-xl p-3 flex items-center gap-2 transition-colors duration-200 ${
                      isDark ? 'bg-amber-900/20 border-amber-600 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <AlertCircle size={16} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                      <span className="text-sm font-medium">Falta por pagar: {fmt(saldoFaltante)}</span>
                    </div>
                  )}

                  {totalPago === totales.total && totalPago > 0 && (
                    <div className={`border rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold ${
                      isDark ? 'bg-slate-700/40 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="flex items-center gap-1.5 text-green-500 font-bold">
                        <Check size={15} /> Pago exacto cubierto
                      </span>
                      <span>Total: {fmt(totales.total)}</span>
                    </div>
                  )}

                  {/* Left Side Modal Actions (integrated at bottom of payment panel) */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                    <button onClick={() => setShowPago(false)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-colors duration-200 ${
                        isDark ? 'bg-slate-700 hover:bg-slate-650 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}>
                      Cancelar
                    </button>
                    <button
                      onClick={handleFinalizarVenta}
                      disabled={!selectedCliente?.id || totalPago < totales.total || mutVenta.isLoading}
                      className="flex-2 flex-grow bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                      {mutVenta.isLoading ? 'Procesando...' : '✓ Finalizar Venta'}
                    </button>
                  </div>
                  {mutVenta.isError && (
                    <p className="text-red-500 text-xs text-center font-semibold pt-2">
                      {(mutVenta.error as any)?.response?.data?.message ?? 'Error al procesar la venta'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Purchase Confirmation (5 Columns) */}
              <div className={`md:col-span-5 p-5 border-t md:border-t-0 md:border-l flex flex-col justify-between overflow-hidden min-h-0 transition-colors duration-200 ${
                isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="shrink-0">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cliente de la Venta</div>
                    <div className="font-extrabold text-sm mt-0.5">{selectedCliente?.nombre || 'Ninguno'}</div>
                    {selectedCliente?.numeroDocumento && (
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Doc: {selectedCliente.numeroDocumento}</div>
                    )}
                  </div>

                  <div className={`border-t pt-2 flex-1 flex flex-col min-h-0 transition-colors duration-200 ${isDark ? 'border-slate-700' : 'border-slate-250'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resumen de Productos</div>
                    
                    {/* List of items */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[30vh]">
                      {cart.map((item) => {
                        const c = calcItem(item)
                        return (
                          <div key={item.productoId} className={`p-2 rounded-lg text-xs flex justify-between gap-3 transition-colors duration-200 ${
                            isDark ? 'bg-slate-700/35 border border-transparent' : 'bg-white border border-slate-200'
                          }`}>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold truncate">{item.nombre}</div>
                              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                                {item.cantidad} x {fmt(item.precio)}
                                {item.descuentoPct > 0 && <span className="text-amber-500 ml-1">(-{item.descuentoPct}%)</span>}
                              </div>
                            </div>
                            <div className="text-right font-extrabold shrink-0">{fmt(c.total)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary of Totals */}
                <div className={`border-t pt-3 mt-4 space-y-1 text-xs shrink-0 transition-colors duration-200 ${isDark ? 'border-slate-700' : 'border-slate-250'}`}>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                    <span className="font-semibold">{fmt(totales.subtotal)}</span>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Descuento</span>
                      <span className="font-semibold">-{fmt(totales.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>IVA</span>
                    <span className="font-semibold">{fmt(totales.iva)}</span>
                  </div>
                  {descuentoExtra > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Descuento Adicional</span>
                      <span className="font-semibold">-{fmt(descuentoExtra)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold text-base pt-2 border-t transition-colors duration-200 ${
                    isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'
                  }`}>
                    <span>TOTAL</span>
                    <span className={isDark ? 'text-green-400' : 'text-green-600'}>{fmt(totales.total)}</span>
                  </div>
                  {cambio > 0 && (
                    <div className={`flex justify-between font-bold text-sm pt-2 border-t border-dashed ${
                      isDark ? 'border-emerald-700/60 text-emerald-400' : 'border-emerald-300 text-emerald-600'
                    }`}>
                      <span>Cambio</span>
                      <span className="font-mono">{fmt(cambio)}</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Modal Venta Exitosa ─────────────────────────────────────────────── */}
      {ventaOk && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-sm border text-center p-8 transition-colors duration-200 ${
            isDark ? 'bg-slate-800 border-green-600 text-white shadow-2xl' : 'bg-white border-green-400 text-slate-800 shadow-xl'
          }`}>
            <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-1">¡Venta completada!</h2>
            <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ventaOk.numero}</p>
            <p className={`font-bold text-2xl mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{fmt(Number(ventaOk.total))}</p>
            {Number(ventaOk.cambio) > 0 && (
              <div className={`my-3 p-3 rounded-xl border text-center ${
                isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <div className="text-[11px] uppercase tracking-wider font-bold">Cambio a entregar al cliente</div>
                <div className="text-2xl font-extrabold font-mono mt-0.5">{fmt(Number(ventaOk.cambio))}</div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => imprimirTirilla(ventaOk)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}>
                <Printer size={16} /> Imprimir
              </button>
              <button onClick={handleNuevaVenta}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Creación Rápida de Producto (Express POS) ───────────────── */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl w-full max-w-md border overflow-hidden shadow-2xl p-6 space-y-5 transition-colors duration-200 animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Creación Rápida de Producto</h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ingresa los datos para venderlo de inmediato
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className={`p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            {quickError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {!puedeStockNegativo && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <AlertCircle size={17} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">Venta sin stock físico no autorizada</strong>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {!cajaPermiteNegativo ? (
                      <>Esta caja POS (<strong>{sesion?.caja?.nombre}</strong>) no tiene habilitada la opción de facturar con stock negativo.</>
                    ) : !bodegaPermiteNegativo ? (
                      <>La bodega de despacho (<strong>{sesion?.caja?.bodega?.nombre ?? 'asignada'}</strong>) no tiene autorizado el stock negativo en <em>Configuración &gt; Empresa &gt; Inventario y Compras</em>.</>
                    ) : (
                      <>La empresa no tiene habilitada la política general de stock negativo en <em>Configuración &gt; Empresa</em>.</>
                    )}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    Para vender este producto recién creado, debe autorizar el stock negativo en la caja y en su bodega asignada.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveQuickProduct} className="space-y-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Código de Barras / SKU *
                </label>
                <input
                  type="text"
                  required
                  value={quickSku}
                  onChange={e => setQuickSku(e.target.value)}
                  placeholder="Escanea o escribe el código"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickNombre}
                  onChange={e => setQuickNombre(e.target.value)}
                  placeholder="Ej. Colonia Arrurrú x 220ml"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Precio de Venta ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={quickPrecio}
                    onChange={e => setQuickPrecio(e.target.value)}
                    placeholder="35000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tipo de IVA
                  </label>
                  <select
                    value={quickIva}
                    onChange={e => setQuickIva(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <option value="EXCLUIDO">EXCLUIDO (0%)</option>
                    <option value="GRAVADO_19">IVA 19%</option>
                    <option value="GRAVADO_5">IVA 5%</option>
                    <option value="EXENTO">EXENTO</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl text-[11px] flex items-start gap-2 ${
                isDark ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}>
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  El producto se guardará en la <strong>bodega por defecto</strong> de esta caja con <strong>costo $0</strong> y podrás asignarle costo, categoría y proveedor más tarde en <strong>Configuración &gt; Productos</strong>.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickCreating || !puedeStockNegativo}
                  title={!puedeStockNegativo ? 'La caja o su bodega asignada no tienen autorizado stock negativo' : ''}
                  className={`flex-2 flex-grow py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    !puedeStockNegativo
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400 opacity-60'
                      : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30'
                  }`}
                >
                  {quickCreating ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Zap size={14} className="text-amber-300" />
                      Guardar y Agregar a la Venta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Creación Rápida de Cliente */}
      {showQuickClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 transition-all ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Creación Rápida de Cliente</h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Asocia o registra el cliente a la venta inmediatamente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickClient(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {quickClientError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{quickClientError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickClient} className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tipo Doc
                  </label>
                  <select
                    value={quickClientTipoDoc}
                    onChange={e => setQuickClientTipoDoc(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                    <option value="PP">PP</option>
                    <option value="TI">TI</option>
                    <option value="DIE">DIE</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus={!quickClientDoc}
                    value={quickClientDoc}
                    onChange={e => setQuickClientDoc(e.target.value)}
                    placeholder="Ej. 1098765432"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  autoFocus={Boolean(quickClientDoc)}
                  value={quickClientNombre}
                  onChange={e => setQuickClientNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez / Inversiones SAS"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Teléfono / Celular
                  </label>
                  <input
                    type="tel"
                    value={quickClientTelefono}
                    onChange={e => setQuickClientTelefono(e.target.value)}
                    placeholder="300 123 4567"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={quickClientEmail}
                    onChange={e => setQuickClientEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={quickClientDireccion}
                  onChange={e => setQuickClientDireccion(e.target.value)}
                  placeholder="Ej. Calle 10 # 5-20"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickClient(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickClientLoading}
                  className="flex-2 flex-grow py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30"
                >
                  {quickClientLoading ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      Guardar y Asociar a la Venta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
