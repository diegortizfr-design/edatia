import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  getClientes, createFactura,
} from '../../services/ventas.service'
import { getProductos, getBodegas } from '../../services/inventario.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const TIPO_IVA_OPTIONS = [
  { value: 'IVA_19',    label: 'IVA 19%' },
  { value: 'IVA_5',     label: 'IVA 5%' },
  { value: 'IVA_0',     label: 'IVA 0%' },
  { value: 'EXCLUIDO',  label: 'Excluido' },
]

const MEDIO_PAGO_OPTIONS = [
  'EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'OTRO',
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
  const bruto = line.cantidad * line.precioUnitario
  const descuento = bruto * (line.descuentoPct / 100)
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

export function FacturaForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [paso, setPaso] = useState<1 | 2>(1)

  // Cabecera
  const [clienteId, setClienteId] = useState('')
  const [clienteQ, setClienteQ] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [formaPago, setFormaPago] = useState('CONTADO')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [notas, setNotas] = useState('')

  // Items
  const [lines, setLines] = useState([LINE_DEFAULT()])
  const [productoQ, setProductoQ] = useState<Record<string, string>>({})

  // Retenciones
  const [retefuente, setRetefuente] = useState('')
  const [reteiva, setReteiva] = useState('')
  const [reteica, setReteica] = useState('')

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
  const esAgente = clienteSeleccionado?.agenteRetenedor ?? false

  const totals = useMemo(() => calcTotals(lines), [lines])

  const mutCreate = useMutation({
    mutationFn: createFactura,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); navigate('/ventas/facturas') },
  })

  const updateLine = (key: string, field: string, value: any) => {
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))
  }

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
    if (lines.some(l => !l.productoId)) return alert('Todos los ítems deben tener un producto')

    const payload: any = {
      clienteId: Number(clienteId),
      bodegaId: bodegaId ? Number(bodegaId) : undefined,
      fecha,
      formaPago,
      medioPago,
      fechaVencimiento: formaPago === 'CREDITO' ? fechaVencimiento || undefined : undefined,
      notas: notas || undefined,
      items: lines.map(l => ({
        productoId: Number(l.productoId),
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
        tipoIva: l.tipoIva,
      })),
    }
    if (esAgente) {
      if (retefuente) payload.retefuente = Number(retefuente)
      if (reteiva)    payload.reteiva    = Number(reteiva)
      if (reteica)    payload.reteica    = Number(reteica)
    }
    mutCreate.mutate(payload)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva Factura</h1>
          <p className="text-slate-500 text-sm mt-0.5">Paso {paso} de 2 — {paso === 1 ? 'Cabecera' : 'Ítems y totales'}</p>
        </div>
        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
          <span className="w-6 h-0.5 bg-slate-200" />
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
        </div>
      </div>

      {/* ── PASO 1: Cabecera ── */}
      {paso === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Datos de cabecera</h2>

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
                <input
                  value={clienteQ}
                  onChange={e => setClienteQ(e.target.value)}
                  placeholder="Buscar cliente por nombre o documento..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Bodega</label>
              <select value={bodegaId} onChange={e => setBodegaId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Sin especificar</option>
                {(bodegas as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Forma de pago *</label>
              <select value={formaPago} onChange={e => setFormaPago(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Medio de pago</label>
              <select value={medioPago} onChange={e => setMedioPago(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {MEDIO_PAGO_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {formaPago === 'CREDITO' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de vencimiento</label>
              <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Observaciones</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => { if (!clienteId) { alert('Seleccione un cliente'); return } setPaso(2) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Ítems ── */}
      {paso === 2 && (
        <div className="space-y-4">
          {/* Tabla de ítems */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Ítems de la factura</h2>
              <button onClick={addLine}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                <Plus size={15} /> Agregar ítem
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2.5 text-left font-semibold w-48">Producto</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Descripción</th>
                    <th className="px-3 py-2.5 text-left font-semibold w-16">Und.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-20">Cant.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28">Precio unit.</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-16">Dto %</th>
                    <th className="px-3 py-2.5 text-left font-semibold w-24">IVA</th>
                    <th className="px-3 py-2.5 text-right font-semibold w-28">Total</th>
                    <th className="px-3 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lines.map(line => {
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
                        {/* Producto */}
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
                              <input
                                value={prodQ}
                                onChange={e => setProductoQ(prev => ({ ...prev, [qKey]: e.target.value }))}
                                placeholder="Buscar..."
                                className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200"
                              />
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
                        {/* Descripción */}
                        <td className="px-3 py-2">
                          <input value={line.descripcion}
                            onChange={e => updateLine(line._key, 'descripcion', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        {/* Unidad */}
                        <td className="px-3 py-2">
                          <input value={line.unidad}
                            onChange={e => updateLine(line._key, 'unidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200 w-14" />
                        </td>
                        {/* Cantidad */}
                        <td className="px-3 py-2">
                          <input type="number" min={0} value={line.cantidad}
                            onChange={e => updateLine(line._key, 'cantidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        {/* Precio */}
                        <td className="px-3 py-2">
                          <input type="number" min={0} value={line.precioUnitario}
                            onChange={e => updateLine(line._key, 'precioUnitario', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        {/* Descuento */}
                        <td className="px-3 py-2">
                          <input type="number" min={0} max={100} value={line.descuentoPct}
                            onChange={e => updateLine(line._key, 'descuentoPct', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                        </td>
                        {/* Tipo IVA */}
                        <td className="px-3 py-2">
                          <select value={line.tipoIva}
                            onChange={e => updateLine(line._key, 'tipoIva', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200 bg-white">
                            {TIPO_IVA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                        {/* Total línea */}
                        <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs whitespace-nowrap">
                          {fmt(calcResult.total)}
                        </td>
                        {/* Eliminar */}
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

          {/* Resumen totales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Retenciones */}
            {esAgente && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-amber-800 text-sm">Retenciones (agente retenedor)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Retefuente', val: retefuente, set: setRetefuente },
                    { label: 'ReteIVA',    val: reteiva,    set: setReteiva },
                    { label: 'ReteICA',    val: reteica,    set: setReteica },
                  ].map(r => (
                    <div key={r.label}>
                      <label className="block text-xs font-medium text-amber-700 mb-1">{r.label}</label>
                      <input type="number" min={0} value={r.val} onChange={e => r.set(e.target.value)}
                        placeholder="0"
                        className="w-full p-2 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de totales */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 ml-auto w-full lg:max-w-sm">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Resumen</h3>
              <div className="space-y-1.5 text-sm">
                {[
                  { label: 'Subtotal bruto',    value: totals.subtotal,  muted: true },
                  { label: 'Descuentos (-)',     value: -totals.descuento, muted: true, skip: totals.descuento === 0 },
                  { label: 'Base IVA 19%',       value: totals.base19,    muted: true, skip: totals.base19 === 0 },
                  { label: 'IVA 19%',            value: totals.iva19,     muted: false, skip: totals.iva19 === 0 },
                  { label: 'Base IVA 5%',        value: totals.base5,     muted: true, skip: totals.base5 === 0 },
                  { label: 'IVA 5%',             value: totals.iva5,      muted: false, skip: totals.iva5 === 0 },
                  ...(esAgente && retefuente ? [{ label: 'Retefuente (-)', value: -Number(retefuente), muted: false }] : []),
                  ...(esAgente && reteiva    ? [{ label: 'ReteIVA (-)',    value: -Number(reteiva),    muted: false }] : []),
                  ...(esAgente && reteica    ? [{ label: 'ReteICA (-)',    value: -Number(reteica),    muted: false }] : []),
                ].filter(r => !r.skip).map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className={r.muted ? 'text-slate-500' : 'text-slate-700 font-medium'}>{r.label}</span>
                    <span className={r.muted ? 'text-slate-600' : 'text-slate-800 font-semibold'}>{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                  <span className="text-slate-800">TOTAL</span>
                  <span className="text-indigo-700 text-base">{fmt(totals.total - (esAgente ? (Number(retefuente || 0) + Number(reteiva || 0) + Number(reteica || 0)) : 0))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error y botones */}
          {mutCreate.isError && (
            <p className="text-red-600 text-sm">
              {(mutCreate.error as any)?.response?.data?.message ?? 'Error al crear la factura'}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(1)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
              <ChevronLeft size={16} /> Volver
            </button>
            <button onClick={handleSubmit} disabled={mutCreate.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mutCreate.isPending ? 'Guardando...' : 'Crear factura'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
