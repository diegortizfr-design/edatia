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
  Tag, Scan, Users,
} from 'lucide-react'
import { getClientes } from '../../services/ventas.service'

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

  const sesId = parseInt(sesionId ?? '0')

  const { data: sesion } = useQuery(['sesion-pos', sesId], () => getSesion(sesId), {
    enabled: !!sesId,
    refetchInterval: 30000,
  })

  const { data: clientes = [] } = useQuery(['clientes'], () => getClientes())

  const { data: productos = [], refetch: refetchProductos } = useQuery(
    ['pos-productos', q, sesion?.caja?.bodegaId],
    () => buscarProductosPos(q, sesion?.caja?.bodegaId ?? 0),
    { enabled: !!sesion?.caja?.bodegaId, keepPreviousData: true }
  )

  useEffect(() => {
    if (sesion?.caja?.clienteDefault) {
      setSelectedCliente(sesion.caja.clienteDefault)
    } else {
      setSelectedCliente({ nombre: 'Consumidor Final', numeroDocumento: '' })
    }
  }, [sesion])

  const mutIncrementConsecutive = useMutation({
    mutationFn: (id: number) => incrementarConsecutivo(id)
  })

  const mutVenta = useMutation({
    mutationFn: crearVentaPos,
    onSuccess: async (data) => {
      const docId = sesion?.caja?.documentoConfigId
      if (docId) {
        try {
          await mutIncrementConsecutive.mutateAsync(docId)
        } catch (e) {
          console.error("Error updating consecutive on server:", e)
        }
      }
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
        setSelectedCliente({ nombre: 'Consumidor Final', numeroDocumento: '' })
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
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden" style={{ fontFamily: 'system-ui' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')}
            className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <span className="text-white font-bold text-sm">{sesion.caja?.nombre}</span>
            <span className="text-slate-400 text-xs ml-2">• {sesion.vendedorNombre}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Ventas del turno</div>
            <div className="text-green-400 font-bold text-sm">{fmt(Number(sesion.totalVentas ?? 0))}</div>
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
        <div className="flex flex-col flex-1 overflow-hidden border-r border-slate-700">
          {/* Búsqueda */}
          <div className="p-3 bg-slate-800 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Scan size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU o escanear código de barras..."
                className="w-full bg-slate-700 text-white placeholder-slate-400 pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Grid de productos */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            {q.length === 0 && (
              <div className="px-3 py-2 shrink-0 bg-slate-800 border-b border-slate-700/50 flex gap-2">
                <button
                  onClick={() => setRotationTab('alta')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rotationTab === 'alta'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-700/40'
                  }`}
                >
                  🔥 Alta Rotación (Más vendidos)
                </button>
                <button
                  onClick={() => setRotationTab('baja')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rotationTab === 'baja'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-700/40'
                  }`}
                >
                  ❄️ Baja Rotación
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-slate-500 py-16">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>{q.length > 0 ? `Sin resultados para "${q}"` : 'No hay productos en esta categoría'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map((prod: any) => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="bg-slate-700 hover:bg-slate-600 rounded-xl p-3 text-left transition-all border-2 border-transparent hover:border-indigo-500 active:scale-95 flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-full aspect-square bg-slate-600 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Tag size={24} className="text-slate-400" />
                          )}
                        </div>
                        <div className="text-white text-xs font-semibold leading-tight line-clamp-2">{prod.nombre}</div>
                        {prod.sku && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.sku}</div>}
                      </div>
                      <div className="mt-2">
                        <div className="text-indigo-400 font-extrabold text-sm">{fmt(prod.precioBase)}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${prod.stock <= 0 ? 'text-rose-400' : prod.stock < 5 ? 'text-amber-400' : 'text-slate-400'}`}>
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
        <div className="w-80 xl:w-96 flex flex-col bg-slate-800">
          {/* Cliente */}
          <div className="p-3 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-slate-400" />
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Cliente</span>
            </div>
            <select
              value={selectedCliente?.id || ''}
              onChange={e => {
                const val = e.target.value
                const found = clientes.find((c: any) => String(c.id) === val)
                setSelectedCliente(found || { nombre: 'Consumidor Final', numeroDocumento: '' })
              }}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Consumidor Final</option>
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
              <div className="text-center text-slate-600 py-12">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              cart.map(item => {
                const c = calcItem(item)
                return (
                  <div key={item.productoId} className="bg-slate-700 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium leading-tight truncate">{item.nombre}</div>
                        <div className="text-slate-400 text-xs">{fmt(item.precio)} c/u</div>
                      </div>
                      <button onClick={() => removeFromCart(item.productoId)} className="text-slate-500 hover:text-red-400 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productoId, -1)}
                          className="w-6 h-6 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-white">
                          <Minus size={12} />
                        </button>
                        <span className="text-white font-bold text-sm w-8 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQty(item.productoId, 1)}
                          className="w-6 h-6 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-white">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Tag size={10} className="text-slate-400" />
                          <input
                            type="number" min={0} max={100} value={item.descuentoPct}
                            onChange={e => updateDescuento(item.productoId, +e.target.value)}
                            className="w-10 bg-slate-600 text-white text-xs text-center rounded px-1 py-0.5 outline-none"
                          />
                          <span className="text-slate-400 text-xs">%</span>
                        </div>
                        <div className="text-green-400 font-bold text-sm">{fmt(c.total)}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Totales y botón pagar */}
          <div className="border-t border-slate-700 p-3 shrink-0">
            {cart.length > 0 && (
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span><span>{fmt(totales.subtotal)}</span>
                </div>
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Descuento</span><span>-{fmt(totales.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>IVA</span><span>{fmt(totales.iva)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Desc. adicional $</span>
                  <input type="number" min={0} value={descuentoExtra}
                    onChange={e => setDescuentoExtra(+e.target.value)}
                    className="w-24 bg-slate-700 text-white text-xs px-2 py-1 rounded outline-none" />
                </div>
                <div className="flex justify-between text-white font-bold text-lg pt-1 border-t border-slate-600">
                  <span>TOTAL</span><span className="text-green-400">{fmt(totales.total)}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowPago(true)}
              disabled={cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
              <CreditCard size={20} />
              Cobrar {cart.length > 0 ? fmt(totales.total) : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Pago ─────────────────────────────────────────────────────── */}
      {showPago && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-600">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-white font-bold text-lg">Cobro</h2>
              <button onClick={() => setShowPago(false)}><X size={20} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-slate-700 rounded-xl p-3 text-center mb-2">
                <div className="text-slate-400 text-sm">Total a cobrar</div>
                <div className="text-green-400 font-bold text-3xl">{fmt(totales.total)}</div>
              </div>



              {/* Medios de pago */}
              {[
                { key: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} />, color: 'text-green-400' },
                { key: 'tarjetaDebito', label: 'Tarjeta Débito', icon: <CreditCard size={16} />, color: 'text-blue-400' },
                { key: 'tarjetaCredito', label: 'Tarjeta Crédito', icon: <CreditCard size={16} />, color: 'text-purple-400' },
                { key: 'transferencia', label: 'Transferencia', icon: <Smartphone size={16} />, color: 'text-cyan-400' },
                { key: 'nequi', label: 'Nequi / Daviplata', icon: <Smartphone size={16} />, color: 'text-pink-400' },
              ].map(m => (
                <div key={m.key} className="flex items-center gap-3">
                  <div className={`${m.color} w-8 shrink-0 flex justify-center`}>{m.icon}</div>
                  <span className="text-white text-sm w-36 shrink-0">{m.label}</span>
                  <input
                    type="number" min={0}
                    value={(pago as any)[m.key] || ''}
                    onChange={e => setPago(prev => ({ ...prev, [m.key]: +e.target.value }))}
                    placeholder="$ 0"
                    className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}

              {/* Acceso rápido efectivo exacto */}
              <button
                onClick={() => setPago(prev => ({ ...prev, efectivo: totales.total }))}
                className="w-full text-xs text-slate-400 hover:text-white bg-slate-700 py-1.5 rounded-lg transition-colors">
                Pago exacto en efectivo
              </button>

              {pago.efectivo > 0 && cambio > 0 && (
                <div className="bg-green-900/40 border border-green-600 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-green-300 text-sm font-medium">Cambio a devolver</span>
                  <span className="text-green-400 font-bold text-xl">{fmt(cambio)}</span>
                </div>
              )}

              {totalPago > 0 && totalPago < totales.total && (
                <div className="bg-amber-900/40 border border-amber-600 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400" />
                  <span className="text-amber-300 text-sm">Falta: {fmt(totales.total - totalPago)}</span>
                </div>
              )}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setShowPago(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleFinalizarVenta}
                disabled={totalPago < totales.total || mutVenta.isLoading}
                className="flex-2 flex-grow bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {mutVenta.isLoading ? 'Procesando...' : '✓ Finalizar Venta'}
              </button>
            </div>
            {mutVenta.isError && (
              <p className="text-red-400 text-sm text-center px-5 pb-4">
                {(mutVenta.error as any)?.response?.data?.message ?? 'Error al procesar la venta'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Venta Exitosa ─────────────────────────────────────────────── */}
      {ventaOk && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-green-600 text-center p-8">
            <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-1">¡Venta completada!</h2>
            <p className="text-slate-400 text-sm mb-2">{ventaOk.numero}</p>
            <p className="text-green-400 font-bold text-2xl mb-1">{fmt(Number(ventaOk.total))}</p>
            {cambio > 0 && <p className="text-slate-300 text-sm mb-4">Cambio: {fmt(cambio)}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => imprimirTirilla(ventaOk)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Printer size={16} /> Imprimir
              </button>
              <button onClick={() => setVentaOk(null)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
