import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrdenCompra, aprobarOrdenCompra, anularOrdenCompra, recibirOrdenCompra,
} from '../../services/inventario.service'
import { ArrowLeft, CheckCircle, XCircle, Package, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

const ESTADOS: Record<string, { label: string; color: string }> = {
  BORRADOR:         { label: 'Borrador',    color: 'bg-slate-100 text-slate-600' },
  APROBADA:         { label: 'Aprobada',    color: 'bg-blue-100 text-blue-700' },
  ENVIADA:          { label: 'Enviada',     color: 'bg-indigo-100 text-indigo-700' },
  RECIBIDA_PARCIAL: { label: 'Parcial',     color: 'bg-amber-100 text-amber-700' },
  RECIBIDA:         { label: 'Recibida',    color: 'bg-green-100 text-green-700' },
  ANULADA:          { label: 'Anulada',     color: 'bg-red-100 text-red-600' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function OrdenCompraDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showRecepcion, setShowRecepcion] = useState(false)
  const [recItems, setRecItems] = useState<Record<number, string>>({})
  const [recNotas, setRecNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showRecepciones, setShowRecepciones] = useState(false)

  const { data: oc, isLoading } = useQuery({
    queryKey: ['orden-compra', id],
    queryFn: () => getOrdenCompra(Number(id)),
  })

  const aprobar = useMutation({
    mutationFn: () => aprobarOrdenCompra(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden-compra', id] }); qc.invalidateQueries({ queryKey: ['ordenes-compra'] }) },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al aprobar'),
  })

  const anular = useMutation({
    mutationFn: () => anularOrdenCompra(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orden-compra', id] }); qc.invalidateQueries({ queryKey: ['ordenes-compra'] }); navigate('/inventario/ordenes-compra') },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al anular'),
  })

  const recibir = useMutation({
    mutationFn: (data: any) => recibirOrdenCompra(Number(id), data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orden-compra', id] })
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      setShowRecepcion(false)
      setRecItems({})
      setSuccessMsg(res.message)
      setTimeout(() => setSuccessMsg(null), 5000)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar recepción'))
    },
  })

  function handleRecibir(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const itemsToSend = Object.entries(recItems)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([ocItemId, cantidadRecibida]) => ({
        ordenCompraItemId: +ocItemId,
        cantidadRecibida: parseFloat(cantidadRecibida),
      }))
    if (itemsToSend.length === 0) return setError('Ingresa al menos una cantidad a recibir')
    recibir.mutate({ items: itemsToSend, notas: recNotas || undefined })
  }

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando...</div>
  if (!oc) return <div className="text-center py-20 text-slate-400">Orden no encontrada</div>

  const estadoCfg = ESTADOS[oc.estado] ?? ESTADOS.BORRADOR
  const puedeAprobar = oc.estado === 'BORRADOR'
  const puedeAnular = !['RECIBIDA', 'ANULADA'].includes(oc.estado)
  const puedeRecibir = ['APROBADA', 'RECIBIDA_PARCIAL'].includes(oc.estado)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 font-mono">{oc.numero}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoCfg.color}`}>{estadoCfg.label}</span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {oc.proveedor?.nombre} · {oc.bodega?.nombre} · {new Date(oc.fechaEmision).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 shrink-0">
          {puedeAprobar && (
            <button onClick={() => aprobar.mutate()} disabled={aprobar.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <CheckCircle size={15} /> {aprobar.isLoading ? 'Aprobando...' : 'Aprobar'}
            </button>
          )}
          {puedeRecibir && (
            <button onClick={() => setShowRecepcion(!showRecepcion)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <Package size={15} /> Recibir mercancía
            </button>
          )}
          {puedeAnular && (
            <button onClick={() => { if (confirm('¿Seguro que deseas anular esta OC?')) anular.mutate() }} disabled={anular.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
              <XCircle size={15} /> Anular
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle size={15} />{error}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle size={15} />{successMsg}</div>}

      {/* Panel de recepción */}
      {showRecepcion && puedeRecibir && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-1">Registrar recepción de mercancía</h2>
          <p className="text-xs text-amber-700 mb-4">Ingresa las cantidades recibidas. Puedes recibir parcialmente.</p>
          <form onSubmit={handleRecibir} className="space-y-3">
            <div className="space-y-2">
              {oc.items.map(item => {
                const pendiente = parseFloat(String(item.cantidad)) - parseFloat(String(item.cantidadRecibida))
                if (pendiente <= 0.001) return null
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-amber-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.producto?.nombre}</p>
                      <p className="text-xs text-slate-400">{item.producto?.sku} · Pendiente: <span className="font-semibold text-amber-700">{pendiente.toFixed(3)}</span> {item.producto?.unidadMedida?.abreviatura ?? 'und'}</p>
                    </div>
                    <div className="w-32 shrink-0">
                      <input
                        type="number" min="0" max={pendiente} step="0.001"
                        value={recItems[item.id] ?? ''}
                        onChange={e => setRecItems(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={String(pendiente.toFixed(3))}
                        className="w-full text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-700 uppercase mb-1">Notas de recepción</label>
              <input value={recNotas} onChange={e => setRecNotas(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Remisión #, observaciones..." />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowRecepcion(false)} className="px-3 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={recibir.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                <Package size={15} /> {recibir.isLoading ? 'Registrando...' : 'Confirmar recepción'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ítems de la OC */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Productos</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Cant.</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Recibido</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Costo u.</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {oc.items.map(item => {
                const pct = parseFloat(String(item.cantidad)) > 0
                  ? (parseFloat(String(item.cantidadRecibida)) / parseFloat(String(item.cantidad))) * 100
                  : 0
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.producto?.nombre}</p>
                      <p className="text-xs text-slate-400">{item.producto?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{parseFloat(String(item.cantidad)).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${pct >= 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {parseFloat(String(item.cantidadRecibida)).toFixed(2)}
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1 ml-auto">
                        <div className={`h-1 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">{fmt(Number(item.costoUnitario))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmt(Number(item.total))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen + datos */}
        <div className="space-y-4">
          {/* Totales */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Resumen financiero</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(Number(oc.subtotal))}</span></div>
              {Number(oc.descuento) > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{fmt(Number(oc.descuento))}</span></div>}
              <div className="flex justify-between text-slate-600"><span>IVA</span><span>{fmt(Number(oc.iva))}</span></div>
              <div className="flex justify-between font-bold text-slate-800 text-base pt-2 border-t border-slate-100"><span>Total</span><span>{fmt(Number(oc.total))}</span></div>
            </div>
          </div>

          {/* Proveedor */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Proveedor</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{oc.proveedor?.nombre}</p>
              {oc.proveedor?.email && <p className="text-xs">{oc.proveedor.email}</p>}
              {oc.proveedor?.telefono && <p className="text-xs">{oc.proveedor.telefono}</p>}
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock size={14} />Fechas</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Emisión</span>
                <span>{new Date(oc.fechaEmision).toLocaleDateString('es-CO')}</span>
              </div>
              {oc.fechaEsperada && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Esperada</span>
                  <span>{new Date(oc.fechaEsperada).toLocaleDateString('es-CO')}</span>
                </div>
              )}
              {oc.fechaRecepcion && (
                <div className="flex justify-between text-green-600">
                  <span>Recibida</span>
                  <span>{new Date(oc.fechaRecepcion).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de recepciones */}
      {oc.recepciones && oc.recepciones.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setShowRecepciones(!showRecepciones)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <h2 className="font-semibold text-slate-800">Recepciones ({oc.recepciones.length})</h2>
            {showRecepciones ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {showRecepciones && (
            <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
              {oc.recepciones.map(rec => (
                <div key={rec.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm font-semibold text-slate-700">{rec.numero}</p>
                    <p className="text-xs text-slate-400">{new Date(rec.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {rec.notas && <p className="text-xs text-slate-500 mb-2">{rec.notas}</p>}
                  <div className="space-y-1">
                    {rec.items.map(ri => (
                      <div key={ri.id} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{ri.ordenCompraItem?.producto?.nombre ?? `Ítem #${ri.ordenCompraItemId}`}</span>
                        <span className="font-semibold">{parseFloat(String(ri.cantidadRecibida)).toFixed(3)} · {fmt(Number(ri.costoUnitario))}/u</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
