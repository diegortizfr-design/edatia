import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft, FileText, CheckCircle } from 'lucide-react'
import {
  getClientes, getCotizacion, createCotizacion, createFactura,
} from '../../services/ventas.service'
import { getProductos, getBodegas } from '../../services/inventario.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const TIPO_IVA_OPTIONS = [
  { value: 'IVA_19', label: 'IVA 19%' },
  { value: 'IVA_5',  label: 'IVA 5%' },
  { value: 'IVA_0',  label: 'IVA 0%' },
  { value: 'EXCLUIDO', label: 'Excluido' },
]

const LINE_DEFAULT = () => ({
  _key: Math.random().toString(36).slice(2),
  productoId: '',
  descripcion: '',
  unidad: 'UND',
  cantidad: 1,
  precioUnitario: 0,
  descuentoPct: 0,
  tipoIva: 'IVA_19',
})

function calcLine(line: any) {
  const bruto = Number(line.cantidad) * Number(line.precioUnitario)
  const descuento = bruto * (Number(line.descuentoPct) / 100)
  const base = bruto - descuento
  const ivaPct = line.tipoIva === 'IVA_19' ? 0.19 : line.tipoIva === 'IVA_5' ? 0.05 : 0
  const iva = base * ivaPct
  return { bruto, descuento, base, iva, total: base + iva }
}

function calcTotals(lines: any[]) {
  let subtotal = 0, descuento = 0
  let base19 = 0, iva19 = 0, base5 = 0, iva5 = 0
  lines.forEach(l => {
    const c = calcLine(l)
    subtotal += c.bruto
    descuento += c.descuento
    if (l.tipoIva === 'IVA_19') { base19 += c.base; iva19 += c.iva }
    if (l.tipoIva === 'IVA_5')  { base5  += c.base; iva5  += c.iva }
  })
  return { subtotal, descuento, base19, iva19, base5, iva5, total: subtotal - descuento + iva19 + iva5 }
}

export function CotizacionForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const qc = useQueryClient()
  const isView = !!id

  const [paso, setPaso] = useState<1 | 2>(1)
  const [convertidaOk, setConvertidaOk] = useState(false)

  // Cabecera
  const [clienteId, setClienteId] = useState('')
  const [clienteQ, setClienteQ] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [validezDias, setValidezDias] = useState('30')
  const [notas, setNotas] = useState('')
  const [condicionesPago, setCondicionesPago] = useState('')

  // Items
  const [lines, setLines] = useState([LINE_DEFAULT()])
  const [productoQ, setProductoQ] = useState<Record<string, string>>({})

  const { data: cotizacionData } = useQuery<any>({
    queryKey: ['cotizacion', id],
    queryFn: () => getCotizacion(Number(id)),
    enabled: isView,
    onSuccess: (d: any) => {
      setClienteId(String(d.clienteId))
      setClienteQ(d.cliente?.nombre ?? '')
      setFecha(d.fecha?.slice(0, 10) ?? '')
      setFechaVencimiento(d.fechaVencimiento?.slice(0, 10) ?? '')
      setNotas(d.notas ?? '')
      setCondicionesPago(d.condicionesPago ?? '')
      if (d.items?.length) {
        setLines(d.items.map((it: any) => ({
          _key: Math.random().toString(36).slice(2),
          productoId: String(it.productoId ?? ''),
          descripcion: it.descripcion ?? '',
          unidad: it.unidad ?? 'UND',
          cantidad: it.cantidad,
          precioUnitario: Number(it.precioUnitario),
          descuentoPct: Number(it.descuentoPct ?? 0),
          tipoIva: it.tipoIva ?? 'IVA_19',
        })))
      }
    },
  } as any)

  const { data: clientesAll = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => getClientes() })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const { data: productosAll = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })

  const clientesFiltrados = useMemo(() =>
    clienteQ
      ? (clientesAll as any[]).filter((c: any) =>
          c.nombre.toLowerCase().includes(clienteQ.toLowerCase()) ||
          c.numeroDocumento?.includes(clienteQ))
      : clientesAll as any[]
  , [clientesAll, clienteQ])

  const clienteSeleccionado = (clientesAll as any[]).find((c: any) => String(c.id) === clienteId)
  const totals = useMemo(() => calcTotals(lines), [lines])

  const mutCreate = useMutation({
    mutationFn: createCotizacion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cotizaciones'] }); navigate('/ventas/cotizaciones') },
  })

  const mutConvertir = useMutation({
    mutationFn: (cot: any) => createFactura({
      clienteId: cot.clienteId,
      bodegaId: cot.bodegaId,
      fecha: new Date().toISOString().slice(0, 10),
      formaPago: 'CONTADO',
      medioPago: 'EFECTIVO',
      notas: `Generada desde cotización ${cot.numero}`,
      items: (cot.items ?? []).map((it: any) => ({
        productoId: it.productoId,
        descripcion: it.descripcion,
        unidad: it.unidad,
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
        descuentoPct: Number(it.descuentoPct ?? 0),
        tipoIva: it.tipoIva,
      })),
    }),
    onSuccess: (factura: any) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      qc.invalidateQueries({ queryKey: ['facturas'] })
      setConvertidaOk(true)
      setTimeout(() => navigate(`/ventas/facturas`), 1500)
    },
  })

  const updateLine = (key: string, field: string, value: any) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key))
  const addLine = () => setLines(prev => [...prev, LINE_DEFAULT()])

  const selectProducto = (key: string, prod: any) => {
    setLines(prev => prev.map(l => l._key === key ? {
      ...l,
      productoId: prod.id,
      descripcion: prod.nombre,
      unidad: prod.unidad ?? 'UND',
      precioUnitario: Number(prod.precioBase ?? 0),
      tipoIva: prod.tipoIva === 'GRAVADO_19' ? 'IVA_19'
              : prod.tipoIva === 'GRAVADO_5' ? 'IVA_5'
              : prod.tipoIva === 'EXENTO' ? 'IVA_0'
              : 'EXCLUIDO',
    } : l))
    setProductoQ(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = () => {
    if (!clienteId) return alert('Seleccione un cliente')
    if (lines.some(l => !l.productoId && !l.descripcion)) return alert('Todos los ítems deben tener producto o descripción')
    mutCreate.mutate({
      clienteId: Number(clienteId),
      bodegaId: bodegaId ? Number(bodegaId) : undefined,
      fecha,
      fechaVencimiento: fechaVencimiento || undefined,
      validezDias: Number(validezDias),
      notas: notas || undefined,
      condicionesPago: condicionesPago || undefined,
      items: lines.map(l => ({
        productoId: l.productoId ? Number(l.productoId) : undefined,
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
        tipoIva: l.tipoIva,
      })),
    })
  }

  if (convertidaOk) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-lg font-semibold text-slate-800">Factura creada con éxito</p>
        <p className="text-sm text-slate-500">Redirigiendo a facturas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isView ? `Cotización ${cotizacionData?.numero ?? ''}` : 'Nueva Cotización'}
          </h1>
          {!isView && (
            <p className="text-slate-500 text-sm mt-0.5">
              Paso {paso} de 2 — {paso === 1 ? 'Cabecera' : 'Ítems y totales'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isView && cotizacionData?.estado === 'ACEPTADA' && (
            <button
              onClick={() => mutConvertir.mutate(cotizacionData)}
              disabled={mutConvertir.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <FileText size={15} />
              {mutConvertir.isPending ? 'Creando factura...' : 'Convertir a Factura'}
            </button>
          )}
          {!isView && (
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
              <span className="w-6 h-0.5 bg-slate-200" />
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PASO 1 ── */}
      {(paso === 1 || isView) && !isView && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Datos generales</h2>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cliente *</label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-3 p-2.5 border border-indigo-200 bg-indigo-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-800">{clienteSeleccionado.nombre}</p>
                  <p className="text-xs text-indigo-600">{clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento}</p>
                </div>
                <button onClick={() => { setClienteId(''); setClienteQ('') }}
                  className="text-xs text-red-500 hover:text-red-700">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <input value={clienteQ} onChange={e => setClienteQ(e.target.value)}
                  placeholder="Buscar cliente por nombre o documento..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                {clienteQ && clientesFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {clientesFiltrados.slice(0, 10).map((c: any) => (
                      <button key={c.id} type="button"
                        onClick={() => { setClienteId(String(c.id)); setClienteQ(c.nombre) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm">
                        <p className="font-medium text-slate-800">{c.nombre}</p>
                        <p className="text-xs text-slate-400">{c.tipoDocumento} {c.numeroDocumento}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Válida hasta</label>
              <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bodega</label>
              <select value={bodegaId} onChange={e => setBodegaId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Sin especificar</option>
                {(bodegas as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Validez (días)</label>
              <input type="number" min={1} value={validezDias} onChange={e => setValidezDias(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Condiciones de pago</label>
            <input value={condicionesPago} onChange={e => setCondicionesPago(e.target.value)}
              placeholder="ej: 50% anticipo, 50% contraentrega"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Observaciones</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => { if (!clienteId) { alert('Seleccione un cliente'); return } setPaso(2) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Vista de detalle (isView) */}
      {isView && cotizacionData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 text-sm">Información</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400 text-xs">Cliente</span><p className="font-medium text-slate-800">{cotizacionData.cliente?.nombre}</p></div>
              <div><span className="text-slate-400 text-xs">Fecha</span><p className="font-medium text-slate-800">{cotizacionData.fecha?.slice(0,10)}</p></div>
              <div><span className="text-slate-400 text-xs">Vence</span><p className="font-medium text-slate-800">{cotizacionData.fechaVencimiento?.slice(0,10) ?? '—'}</p></div>
              <div><span className="text-slate-400 text-xs">Estado</span><p className="font-medium text-slate-800">{cotizacionData.estado}</p></div>
              {cotizacionData.condicionesPago && <div className="col-span-2"><span className="text-slate-400 text-xs">Condiciones pago</span><p className="font-medium text-slate-800">{cotizacionData.condicionesPago}</p></div>}
              {cotizacionData.notas && <div className="col-span-2"><span className="text-slate-400 text-xs">Notas</span><p className="text-slate-600 text-xs">{cotizacionData.notas}</p></div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
            <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 text-sm">Totales</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(Number(cotizacionData.subtotal ?? 0))}</span></div>
              {Number(cotizacionData.descuento ?? 0) > 0 && <div className="flex justify-between text-slate-500"><span>Descuento</span><span>-{fmt(Number(cotizacionData.descuento))}</span></div>}
              {Number(cotizacionData.iva ?? 0) > 0 && <div className="flex justify-between text-slate-600 font-medium"><span>IVA</span><span>{fmt(Number(cotizacionData.iva))}</span></div>}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                <span className="text-slate-800">TOTAL</span>
                <span className="text-indigo-700 text-base">{fmt(Number(cotizacionData.total ?? 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de ítems (vista o paso 2) */}
      {(paso === 2 || isView) && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Ítems</h2>
              {!isView && (
                <button onClick={addLine}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <Plus size={15} /> Agregar ítem
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2.5 text-left font-semibold">Producto</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Descripción</th>
                    <th className="px-3 py-2.5 text-left font-semibold w-16">Und.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-20">Cant.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28">Precio unit.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-16">Dto %</th>
                    <th className="px-3 py-2.5 text-left font-semibold w-24">IVA</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28">Total</th>
                    {!isView && <th className="px-3 py-2.5 w-8" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(isView ? (cotizacionData?.items ?? []) : lines).map((line: any) => {
                    if (isView) {
                      const c = calcLine(line)
                      return (
                        <tr key={line.id ?? line._key} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{line.producto?.nombre ?? '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{line.descripcion}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{line.unidad}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-slate-700">{line.cantidad}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-slate-700">{fmt(Number(line.precioUnitario))}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-slate-600">{line.descuentoPct}%</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{line.tipoIva}</td>
                          <td className="px-3 py-2.5 text-xs text-right font-semibold text-slate-700">{fmt(c.total)}</td>
                        </tr>
                      )
                    }
                    const calcResult = calcLine(line)
                    const qKey = line._key
                    const prodQ = productoQ[qKey] ?? ''
                    const prodsFiltrados = prodQ
                      ? (productosAll as any[]).filter((p: any) =>
                          p.nombre.toLowerCase().includes(prodQ.toLowerCase()) ||
                          p.sku.toLowerCase().includes(prodQ.toLowerCase()))
                      : []

                    return (
                      <tr key={line._key} className="align-top">
                        <td className="px-3 py-2 relative">
                          {line.productoId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                                {(productosAll as any[]).find((p: any) => String(p.id) === String(line.productoId))?.nombre ?? `ID ${line.productoId}`}
                              </span>
                              <button onClick={() => updateLine(line._key, 'productoId', '')}
                                className="text-slate-300 hover:text-red-400 shrink-0">×</button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input value={prodQ}
                                onChange={e => setProductoQ(prev => ({ ...prev, [qKey]: e.target.value }))}
                                placeholder="Buscar..."
                                className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200" />
                              {prodQ && prodsFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-xl z-30 min-w-[220px] max-h-40 overflow-y-auto">
                                  {prodsFiltrados.slice(0, 8).map((p: any) => (
                                    <button key={p.id} type="button"
                                      onClick={() => selectProducto(line._key, p)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs">
                                      <p className="font-medium">{p.nombre}</p>
                                      <p className="text-slate-400">{p.sku}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input value={line.descripcion}
                            onChange={e => updateLine(line._key, 'descripcion', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        <td className="px-3 py-2">
                          <input value={line.unidad}
                            onChange={e => updateLine(line._key, 'unidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200 w-14" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} value={line.cantidad}
                            onChange={e => updateLine(line._key, 'cantidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} value={line.precioUnitario}
                            onChange={e => updateLine(line._key, 'precioUnitario', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} max={100} value={line.descuentoPct}
                            onChange={e => updateLine(line._key, 'descuentoPct', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={line.tipoIva}
                            onChange={e => updateLine(line._key, 'tipoIva', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200 bg-white">
                            {TIPO_IVA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs whitespace-nowrap">
                          {fmt(calcResult.total)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {lines.length > 1 && (
                            <button onClick={() => removeLine(line._key)} className="text-slate-300 hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen y botones solo en modo creación */}
          {!isView && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 ml-auto w-full lg:max-w-sm">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Resumen</h3>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: 'Subtotal bruto', value: totals.subtotal, muted: true },
                    { label: 'Descuentos (-)', value: -totals.descuento, muted: true, skip: totals.descuento === 0 },
                    { label: 'IVA 19%', value: totals.iva19, muted: false, skip: totals.iva19 === 0 },
                    { label: 'IVA 5%',  value: totals.iva5,  muted: false, skip: totals.iva5  === 0 },
                  ].filter(r => !r.skip).map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className={r.muted ? 'text-slate-500' : 'text-slate-700 font-medium'}>{r.label}</span>
                      <span className={r.muted ? 'text-slate-600' : 'text-slate-800 font-semibold'}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                    <span className="text-slate-800">TOTAL</span>
                    <span className="text-indigo-700 text-base">{fmt(totals.total)}</span>
                  </div>
                </div>
              </div>

              {mutCreate.isError && (
                <p className="text-red-600 text-sm">
                  {(mutCreate.error as any)?.response?.data?.message ?? 'Error al crear la cotización'}
                </p>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setPaso(1)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                  <ChevronLeft size={16} /> Volver
                </button>
                <button onClick={handleSubmit} disabled={mutCreate.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {mutCreate.isPending ? 'Guardando...' : 'Crear cotización'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
