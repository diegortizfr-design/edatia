import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrdenCompra, aprobarOrdenCompra, rechazarOrdenCompra, anularOrdenCompra, recibirOrdenCompra,
} from '../../services/inventario.service'
import { ArrowLeft, CheckCircle, XCircle, Package, Clock, AlertTriangle, ChevronDown, ChevronUp, Printer, FileText } from 'lucide-react'

const ESTADOS: Record<string, { label: string; color: string }> = {
  BORRADOR:         { label: 'Borrador',    color: 'bg-slate-100 text-slate-600' },
  APROBADA:         { label: 'Aprobada',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  RECHAZADA:        { label: 'Rechazada',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
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
  const [recLotes, setRecLotes] = useState<Record<number, string>>({})
  const [recVencimientos, setRecVencimientos] = useState<Record<number, string>>({})
  const [recSeriales, setRecSeriales] = useState<Record<number, string>>({})
  const [recNotas, setRecNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showRecepciones, setShowRecepciones] = useState(false)

  // Modals state
  const [showAprobarModal, setShowAprobarModal] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [notasAprobacion, setNotasAprobacion] = useState('')
  const [notasRechazo, setNotasRechazo] = useState('')
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  const { data: oc, isLoading } = useQuery({
    queryKey: ['orden-compra', id],
    queryFn: () => getOrdenCompra(Number(id)),
  })

  const aprobar = useMutation({
    mutationFn: (data: { notasAprobacion?: string }) => aprobarOrdenCompra(Number(id), data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['orden-compra', id] }); 
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] });
      setShowAprobarModal(false);
      setNotasAprobacion('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al aprobar'),
  })

  const rechazar = useMutation({
    mutationFn: (data: { notasRechazo?: string }) => rechazarOrdenCompra(Number(id), data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['orden-compra', id] }); 
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] });
      setShowRechazarModal(false);
      setNotasRechazo('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al rechazar'),
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
    
    // Check validations for batches and serials
    for (const item of oc.items) {
      const cantStr = recItems[item.id]
      const qty = parseFloat(cantStr)
      if (qty > 0) {
        if (item.producto?.manejaLotes && !recLotes[item.id]?.trim()) {
          return setError(`Debe especificar el número de lote para ${item.producto.nombre}`)
        }
        if (item.producto?.manejaSerial) {
          const serialList = (recSeriales[item.id] || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
          if (!recSeriales[item.id]?.trim()) {
            return setError(`Debe especificar los seriales para ${item.producto.nombre}`)
          }
          if (serialList.length !== Math.ceil(qty)) {
            return setError(`La cantidad de seriales (${serialList.length}) no coincide con la cantidad a recibir (${Math.ceil(qty)}) para ${item.producto.nombre}`)
          }
        }
      }
    }

    const itemsToSend = Object.entries(recItems)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([ocItemId, cantidadRecibida]) => {
        const idNum = +ocItemId
        const itemObj = oc.items.find((i: any) => i.id === idNum)
        const serialsParsed = itemObj?.producto?.manejaSerial 
          ? (recSeriales[idNum] || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
          : undefined

        return {
          ordenCompraItemId: idNum,
          cantidadRecibida: parseFloat(cantidadRecibida),
          loteNumero: itemObj?.producto?.manejaLotes ? recLotes[idNum] : undefined,
          fechaVencimiento: itemObj?.producto?.manejaLotes && recVencimientos[idNum] ? recVencimientos[idNum] : undefined,
          seriales: serialsParsed
        }
      })

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
    <>
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
        <div className="flex gap-2 shrink-0 animate-fade-in">
          {puedeAprobar && (
            <>
              <button onClick={() => setShowAprobarModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all active:scale-95">
                <CheckCircle size={15} /> Aprobar
              </button>
              <button onClick={() => setShowRechazarModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-bold transition-all active:scale-95">
                <XCircle size={15} /> Rechazar
              </button>
            </>
          )}
          {['APROBADA', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA'].includes(oc.estado) && (
            <button onClick={() => setShowPrintPreview(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all active:scale-95">
              <Printer size={15} /> Formato Gráfico
            </button>
          )}
          {puedeRecibir && (
            <button onClick={() => setShowRecepcion(!showRecepcion)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95">
              <Package size={15} /> Recibir mercancía
            </button>
          )}
          {puedeAnular && (
            <button onClick={() => { if (confirm('¿Seguro que deseas anular esta OC?')) anular.mutate() }} disabled={anular.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-50">
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
                  <div key={item.id} className="space-y-3 bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-3">
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

                    {/* Lotes inputs if product manejaLotes */}
                    {item.producto?.manejaLotes && parseFloat(recItems[item.id] || '0') > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Lote *</label>
                          <input
                            value={recLotes[item.id] ?? ''}
                            onChange={e => setRecLotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Lote..."
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de Vencimiento</label>
                          <input
                            type="date"
                            value={recVencimientos[item.id] ?? ''}
                            onChange={e => setRecVencimientos(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Seriales textarea if product manejaSerial */}
                    {item.producto?.manejaSerial && parseFloat(recItems[item.id] || '0') > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Números de Serie *
                        </label>
                        <textarea
                          value={recSeriales[item.id] ?? ''}
                          onChange={e => setRecSeriales(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Ingrese un serial por línea o separados por comas..."
                          rows={2}
                          required
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                        />
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Ingrese exactamente {Math.ceil(parseFloat(recItems[item.id] || '0'))} seriales.
                        </span>
                      </div>
                    )}
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
              <button type="submit" disabled={recibir.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                <Package size={15} /> {recibir.isPending ? 'Registrando...' : 'Confirmar recepción'}
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

          {/* Auditoría Aprobación/Rechazo */}
          {(oc.aprobadoPor || oc.rechazadoPor) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-fade-in">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle size={14} className={oc.estado === 'RECHAZADA' ? 'text-rose-600' : 'text-indigo-600'} />
                Auditoría de Estado
              </h3>
              <div className="space-y-2 text-xs">
                {oc.aprobadoPor && (
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Aprobación</p>
                    <p className="text-slate-700">
                      <strong>Por:</strong> {oc.aprobadoPor.nombre || oc.aprobadoPor.usuario}
                    </p>
                    <p className="text-slate-500">
                      <strong>Fecha:</strong> {new Date(oc.fechaAprobacion).toLocaleDateString('es-CO')} {new Date(oc.fechaAprobacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {oc.notasAprobacion && (
                      <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 italic">
                        "{oc.notasAprobacion}"
                      </p>
                    )}
                  </div>
                )}
                {oc.rechazadoPor && (
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Rechazo</p>
                    <p className="text-slate-700">
                      <strong>Por:</strong> {oc.rechazadoPor.nombre || oc.rechazadoPor.usuario}
                    </p>
                    <p className="text-slate-500">
                      <strong>Fecha:</strong> {new Date(oc.fechaRechazo).toLocaleDateString('es-CO')} {new Date(oc.fechaRechazo).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {oc.notasRechazo && (
                      <p className="text-slate-600 bg-rose-50/50 p-2 rounded-lg border border-rose-100 mt-1 italic">
                        "{oc.notasRechazo}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* Modal de Aprobación */}
      {showAprobarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-indigo-600" size={18} />
                Aprobar Orden de Compra
              </h3>
              <p className="text-xs text-slate-400 mt-1">La orden se marcará como APROBADA y quedará disponible para recibir mercancía y facturar.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observación / Notas de Aprobación</label>
                <textarea
                  value={notasAprobacion}
                  onChange={e => setNotasAprobacion(e.target.value)}
                  placeholder="Escribe comentarios u observaciones sobre la aprobación..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none outline-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowAprobarModal(false); setNotasAprobacion('') }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => aprobar.mutate({ notasAprobacion })}
                disabled={aprobar.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {aprobar.isPending ? 'Aprobando...' : 'Confirmar Aprobación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRechazarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div>
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <XCircle size={18} />
                Rechazar Orden de Compra
              </h3>
              <p className="text-xs text-slate-400 mt-1">La orden se marcará como RECHAZADA. Deberás justificar el motivo del rechazo.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Justificación / Notas de Rechazo *</label>
                <textarea
                  value={notasRechazo}
                  onChange={e => setNotasRechazo(e.target.value)}
                  placeholder="Por favor, escribe detalladamente el motivo del rechazo..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none outline-none"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowRechazarModal(false); setNotasRechazo('') }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!notasRechazo.trim()) return alert('Debes justificar el rechazo')
                  rechazar.mutate({ notasRechazo })
                }}
                disabled={rechazar.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {rechazar.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Impresión / Formato Gráfico (Voucher) */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-start items-center overflow-y-auto z-50 p-4 md:p-8 select-text">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4">
            
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Formato Gráfico de Orden de Compra (OC)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-voucher" className="p-8 md:p-12 bg-white space-y-6 text-slate-800 select-text overflow-y-auto">
              
              {/* Header Grid */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-indigo-700">EDATIA S.A.S</h2>
                  <p className="text-xs text-slate-500">NIT: 900.123.456-7 · Régimen Común</p>
                  <p className="text-xs text-slate-400">Teléfono: (601) 555-0199 · info@edatia.com</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold inline-block border border-indigo-150">
                    ORDEN DE COMPRA
                  </div>
                  <h1 className="text-xl font-bold font-mono text-slate-800 mt-1">{oc.numero}</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Documento Oficial</p>
                </div>
              </div>

              {/* Informative Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">PROVEEDOR</h4>
                  <div className="space-y-1 text-slate-600">
                    <p className="font-bold text-slate-800 text-sm">{oc.proveedor?.nombre}</p>
                    {oc.proveedor?.nombreComercial && <p className="italic text-xs">({oc.proveedor.nombreComercial})</p>}
                    <p>Nit: {oc.proveedor?.numeroDocumento || 'N/A'}</p>
                    <p>Correo: {oc.proveedor?.email || 'N/A'}</p>
                    <p>Teléfono: {oc.proveedor?.telefono || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">DETALLE DE ENTREGA</h4>
                  <div className="space-y-1 text-slate-600">
                    <p><strong>Bodega Destino:</strong> {oc.bodega?.nombre} ({oc.bodega?.codigo})</p>
                    <p><strong>Fecha Emisión:</strong> {new Date(oc.fechaEmision).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    {oc.fechaEsperada && (
                      <p><strong>Fecha Esperada:</strong> {new Date(oc.fechaEsperada).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    )}
                    <p><strong>Estado OC:</strong> <span className="font-bold uppercase text-indigo-600">{oc.estado}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detalle de Productos Solicitados</h4>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-2 text-left">SKU</th>
                      <th className="py-2.5 px-2 text-left">Descripción del Producto</th>
                      <th className="py-2.5 px-2 text-right">Cant.</th>
                      <th className="py-2.5 px-2 text-right">Costo Unitario</th>
                      <th className="py-2.5 px-2 text-right">Dcto. %</th>
                      <th className="py-2.5 px-2 text-right">IVA %</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {oc.items.map((item: any) => {
                      const cant = parseFloat(String(item.cantidad))
                      const costo = parseFloat(String(item.costoUnitario))
                      const dcto = parseFloat(String(item.descuentoPct || 0))
                      const tasaIva = item.producto?.tipoIva === 'GRAVADO_19' ? 19 : item.producto?.tipoIva === 'GRAVADO_5' ? 5 : 0
                      return (
                        <tr key={item.id} className="text-slate-700">
                          <td className="py-3 px-2 font-mono text-slate-500">{item.producto?.sku}</td>
                          <td className="py-3 px-2 font-semibold text-slate-800">{item.producto?.nombre}</td>
                          <td className="py-3 px-2 text-right">{cant.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right">{fmt(costo)}</td>
                          <td className="py-3 px-2 text-right">{dcto > 0 ? `${dcto.toFixed(1)}%` : '0%'}</td>
                          <td className="py-3 px-2 text-right">{tasaIva}%</td>
                          <td className="py-3 px-2 text-right font-semibold text-slate-900">{fmt(Number(item.total))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl space-y-1">
                  <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Notas / Observaciones</h5>
                  <p className="italic">{oc.notas || 'Sin observaciones adicionales en esta orden de compra.'}</p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 ml-auto w-full max-w-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{fmt(Number(oc.subtotal))}</span>
                  </div>
                  {Number(oc.descuento) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-{fmt(Number(oc.descuento))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>IVA liquidado:</span>
                    <span>{fmt(Number(oc.iva))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
                    <span>Total Orden:</span>
                    <span>{fmt(Number(oc.total))}</span>
                  </div>
                </div>
              </div>

              {/* Signatures / Audit Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-slate-100 text-center text-xs text-slate-500">
                <div className="space-y-2 border-t border-dashed border-slate-300 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Autorizado Por (Gerencia/Auditoría)</p>
                  <p className="text-[10px] text-slate-400">Usuario: {oc.aprobadoPor?.nombre || oc.aprobadoPor?.usuario || 'N/A'}</p>
                  <p className="text-[10px] text-slate-400">Fecha: {oc.fechaAprobacion ? new Date(oc.fechaAprobacion).toLocaleString('es-CO') : 'N/A'}</p>
                </div>
                <div className="space-y-2 border-t border-dashed border-slate-300 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Firma Recibido / Proveedor</p>
                  <p className="text-[10px] text-slate-400">Nombre:</p>
                  <p className="text-[10px] text-slate-400">Fecha aceptación:</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
