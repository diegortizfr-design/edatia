import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSesion, buscarProductosPos, crearVentaPos, anularVentaPos,
} from '../../services/pos.service'
import { getDocumentosConfig, incrementarConsecutivo } from '../../services/configuracion.service'
import {
  ShoppingCart, Search, X, Plus, Minus, Trash2, User, CreditCard,
  Banknote, Smartphone, Printer, ChevronLeft, AlertCircle, CheckCircle2,
  Tag, Scan, Users, Sun, Moon,
} from 'lucide-react'
import { getClientes } from '../../services/ventas.service'
import { getMediosPago } from '../../services/configuracion.service'

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

type PayMethod = { efectivo: number; tarjetaDebito: number; tarjetaCredito: number; transferencia: number; nequi: number }

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const mapCodeToKey = (code: string): keyof PayMethod => {
  const c = code.toUpperCase()
  if (c === 'EFECTIVO') return 'efectivo'
  if (c === 'TARJETA_DEBITO' || c.includes('DEBITO')) return 'tarjetaDebito'
  if (c === 'TARJETA_CREDITO' || c.includes('CREDITO') || c.includes('TARJETA')) return 'tarjetaCredito'
  if (c === 'TRANSFERENCIA') return 'transferencia'
  if (c === 'NEQUI' || c === 'DAVIPLATA') return 'nequi'
  return 'efectivo'
}

export function PosScreen() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>>()

  const [q, setQ] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showPago, setShowPago] = useState(false)
  const [showAnular, setShowAnular] = useState<number | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [rotationTab, setRotationTab] = useState<'alta' | 'baja'>('alta')
  const [pago, setPago] = useState<PayMethod>({ efectivo: 0, tarjetaDebito: 0, tarjetaCredito: 0, transferencia: 0, nequi: 0 })
  const [ventaOk, setVentaOk] = useState<any>(null)
  const [descuentoExtra, setDescuentoExtra] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const sesId = parseInt(sesionId ?? '0')

  const { data: sesion } = useQuery(['sesion-pos', sesId], () => getSesion(sesId), {
    enabled: !!sesId,
    refetchInterval: 30000,
  })

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
      setVentaOk({
        ...data,
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
      setPago({ efectivo: 0, tarjetaDebito: 0, tarjetaCredito: 0, transferencia: 0, nequi: 0 })
      setDescuentoExtra(0)
      if (sesion?.caja?.clienteDefault) {
        setSelectedCliente(sesion.caja.clienteDefault)
      } else {
        setSelectedCliente(null)
      }
      setShowPago(false)
    },
  })

  const mutAnular = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularVentaPos(id, motivo),
    onSuccess: () => setShowAnular(null),
  })

  // Lector de código de barras (teclado rápido)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement === searchRef.current) return
      if (e.key === 'Enter' && barcodeBuffer.current.length > 3) {
        setQ(barcodeBuffer.current)
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
  const totalPago = pago.efectivo + pago.tarjetaDebito + pago.tarjetaCredito + pago.transferencia + pago.nequi
  const cambio = Math.max(0, pago.efectivo - totales.total)

  const addToCart = useCallback((prod: any) => {
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
        tipoIva: prod.tipoIva ?? 'IVA_19',
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

  const handleFinalizarVenta = () => {
    if (cart.length === 0) return
    mutVenta.mutate({
      sesionId: sesId,
      clienteId: selectedCliente?.id || undefined,
      clienteNombre: selectedCliente?.nombre || 'Consumidor Final',
      clienteDoc: selectedCliente?.numeroDocumento || undefined,
      descuento: descuentoExtra,
      pagoEfectivo: pago.efectivo,
      pagoTarjetaDebito: pago.tarjetaDebito,
      pagoTarjetaCredito: pago.tarjetaCredito,
      pagoTransferencia: pago.transferencia,
      pagoNequi: pago.nequi,
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

    w.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 11px; margin: 0; padding: 8px; width: 280px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .big { font-size: 14px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:14px">${sesion?.empresa?.nombre ?? 'EDATIA ERP'}</div>
        <div class="center">NIT: ${sesion?.empresa?.nit ?? ''}</div>
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
          <div>
            <span className={`font-bold text-sm transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-800'}`}>{sesion.caja?.nombre}</span>
            <span className={`text-xs ml-2 transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {sesion.vendedorNombre}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
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
          <div className={`p-3 shrink-0 transition-colors duration-200 ${isDark ? 'bg-slate-800' : 'bg-white border-b border-slate-200'}`}>
            <div className="relative">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <Scan size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                ref={searchRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU o escanear código de barras..."
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${isDark ? 'bg-slate-700 text-white placeholder-slate-400' : 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200'}`}
                autoFocus
              />
            </div>
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
                <div className={`text-center py-16 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>{q.length > 0 ? `Sin resultados para "${q}"` : 'No hay productos en esta categoría'}</p>
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
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover rounded-lg" />
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
          <div className={`p-3 border-b shrink-0 transition-colors duration-200 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className={isDark ? 'text-slate-400' : 'text-slate-550'} />
              <span className={`text-xs font-semibold uppercase tracking-wide transition-colors duration-200 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>Cliente</span>
            </div>
            <select
              value={selectedCliente?.id || ''}
              onChange={e => {
                const val = e.target.value
                const found = clientes.find((c: any) => String(c.id) === val)
                setSelectedCliente(found || null)
              }}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors duration-200 ${
                isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50 text-slate-800 border-slate-250'
              }`}
            >
              <option value="">Seleccione un cliente...</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.numeroDocumento || 'Sin doc'})
                </option>
              ))}
            </select>
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
              onClick={() => {
                // Pre-populate cash exact option default value
                setPago({ efectivo: totales.total, tarjetaDebito: 0, tarjetaCredito: 0, transferencia: 0, nequi: 0 })
                setShowPago(true)
              }}
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
                  <div className="space-y-3">
                    {activeMedios.map((m: any) => {
                      const key = mapCodeToKey(m.codigo)
                      const isEfectivo = m.codigo === 'EFECTIVO'
                      const isTarjeta = m.codigo.includes('TARJETA')
                      const icon = isEfectivo ? <Banknote size={16} /> : (isTarjeta ? <CreditCard size={16} /> : <Smartphone size={16} />)
                      const color = isEfectivo 
                        ? (isDark ? 'text-green-400' : 'text-green-600') 
                        : (m.codigo.includes('DEBITO') 
                          ? (isDark ? 'text-blue-450' : 'text-blue-600') 
                          : (m.codigo.includes('CREDITO') 
                            ? (isDark ? 'text-purple-450' : 'text-purple-600') 
                            : (isDark ? 'text-cyan-450' : 'text-cyan-600')))
                      
                      return (
                        <div key={m.codigo} className="flex items-center gap-3">
                          <div className={`${color} w-8 shrink-0 flex justify-center`}>{icon}</div>
                          <span className="text-sm font-semibold w-36 shrink-0">{m.nombre}</span>
                          <input
                            type="number" min={0}
                            value={(pago as any)[key] || ''}
                            onChange={e => setPago(prev => ({ ...prev, [key]: +e.target.value }))}
                            placeholder="$ 0"
                            className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${
                              isDark ? 'bg-slate-700 text-white placeholder-slate-500 border border-transparent' : 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-205'
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* Fast Action exact cash button */}
                  <button
                    onClick={() => setPago(prev => ({ ...prev, efectivo: totales.total, tarjetaDebito: 0, tarjetaCredito: 0, transferencia: 0, nequi: 0 }))}
                    className={`w-full text-xs py-2 rounded-lg font-bold transition-all transition-colors duration-200 ${
                      isDark ? 'text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-650' : 'text-slate-600 hover:text-slate-850 bg-slate-100 hover:bg-slate-200'
                    }`}>
                    ⚡ Pago exacto en efectivo
                  </button>
                </div>

                {/* Change or Missing warnings */}
                <div className="space-y-2 pt-2">
                  {pago.efectivo > 0 && cambio > 0 && (
                    <div className={`border rounded-xl p-3 flex items-center justify-between transition-colors duration-200 ${
                      isDark ? 'bg-green-900/20 border-green-600 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                      <span className="text-sm font-medium">Cambio a devolver</span>
                      <span className="font-extrabold text-2xl">{fmt(cambio)}</span>
                    </div>
                  )}

                  {totalPago > 0 && totalPago < totales.total && (
                    <div className={`border rounded-xl p-3 flex items-center gap-2 transition-colors duration-200 ${
                      isDark ? 'bg-amber-900/20 border-amber-600 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <AlertCircle size={16} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                      <span className="text-sm font-medium">Falta por pagar: {fmt(totales.total - totalPago)}</span>
                    </div>
                  )}

                  {/* Left Side Modal Actions (integrated at bottom of payment panel) */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                    <button onClick={() => setShowPago(false)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-colors duration-200 ${
                        isDark ? 'bg-slate-700 hover:bg-slate-650 text-white' : 'bg-slate-100 hover:bg-slate-205 text-slate-800'
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
            <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-555'}`}>{ventaOk.numero}</p>
            <p className={`font-bold text-2xl mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{fmt(Number(ventaOk.total))}</p>
            {cambio > 0 && <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>Cambio: {fmt(cambio)}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => imprimirTirilla(ventaOk)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark ? 'bg-slate-700 hover:bg-slate-650 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}>
                <Printer size={16} /> Imprimir
              </button>
              <button onClick={() => setVentaOk(null)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
