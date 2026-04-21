import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLotes, getProximosVencer, getLoteFefo, createLote,
  getProductos, getBodegas,
} from '../../services/inventario.service'
import {
  Package, Plus, AlertTriangle, Calendar, Layers,
  ChevronDown, ChevronUp, X, CheckCircle,
} from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}
function fmtFecha(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO')
}
function diasParaVencer(fecha: string | null) {
  if (!fecha) return null
  const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
  return diff
}

export function Lotes() {
  const qc = useQueryClient()
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroSoloStock, setFiltroSoloStock] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showFefo, setShowFefo] = useState(false)
  const [fefoData, setFefoData] = useState<any>(null)
  const [fefoForm, setFefoForm] = useState({ productoId: '', bodegaId: '', cantidad: '' })

  const { data: lotes = [], isLoading } = useQuery({
    queryKey: ['lotes', filtroProducto, filtroSoloStock],
    queryFn: () => getLotes({
      productoId: filtroProducto ? +filtroProducto : undefined,
      soloConStock: filtroSoloStock,
    }),
  })

  const { data: proximosVencer = [] } = useQuery({
    queryKey: ['lotes-proximos'],
    queryFn: () => getProximosVencer(30),
  })

  const { data: productos = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const productosManejaLotes = (productos as any[]).filter(p => p.manejaLotes)

  const mutCreate = useMutation({
    mutationFn: createLote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes'] }); setShowForm(false) },
  })

  const buscarFefo = async () => {
    if (!fefoForm.productoId || !fefoForm.bodegaId || !fefoForm.cantidad) return
    const res = await getLoteFefo(+fefoForm.productoId, +fefoForm.bodegaId, parseFloat(fefoForm.cantidad))
    setFefoData(res)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Lotes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de lotes y fechas de vencimiento (FEFO)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFefo(v => !v)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            <Layers size={15} /> Consulta FEFO
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Nuevo lote
          </button>
        </div>
      </div>

      {/* Alerta proximos a vencer */}
      {(proximosVencer as any[]).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="font-semibold text-amber-800 text-sm">
              {(proximosVencer as any[]).length} lote(s) vencen en los próximos 30 días
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(proximosVencer as any[]).slice(0, 5).map((l: any) => (
              <span key={l.id} className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                {l.producto?.nombre} · Lote {l.numero} · {fmtFecha(l.fechaVencimiento)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Consulta FEFO */}
      {showFefo && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" /> Consulta FEFO — ¿Qué lotes consumir?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
              <select value={fefoForm.productoId} onChange={e => setFefoForm(f => ({ ...f, productoId: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona...</option>
                {productosManejaLotes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bodega</label>
              <select value={fefoForm.bodegaId} onChange={e => setFefoForm(f => ({ ...f, bodegaId: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona...</option>
                {(bodegas as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad requerida</label>
              <input type="number" min={0.001} step={0.001} value={fefoForm.cantidad}
                onChange={e => setFefoForm(f => ({ ...f, cantidad: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="0.000" />
            </div>
          </div>
          <button onClick={buscarFefo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Calcular FEFO
          </button>
          {fefoData && (
            <div className="mt-3 space-y-2">
              <div className={`flex items-center gap-2 text-sm font-semibold ${fefoData.stockSuficiente ? 'text-green-700' : 'text-red-600'}`}>
                {fefoData.stockSuficiente
                  ? <><CheckCircle size={15} /> Stock suficiente</>
                  : <><AlertTriangle size={15} /> Stock insuficiente — solo hay {fmt(fefoData.cantidadDisponible)}</>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      {['Lote', 'Vence', 'Disponible', 'Consumir'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fefoData.sugeridos.map((s: any) => {
                      const dias = diasParaVencer(s.fechaVencimiento)
                      return (
                        <tr key={s.loteId} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-800">{s.numero}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs font-semibold ${dias !== null && dias <= 7 ? 'text-red-600' : dias !== null && dias <= 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {fmtFecha(s.fechaVencimiento)}
                              {dias !== null && ` (${dias}d)`}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-700">{fmt(s.disponible)}</td>
                          <td className="px-4 py-2 font-bold text-indigo-700">{fmt(s.cantidadSugerida)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Filtrar por producto</label>
          <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white min-w-[200px]">
            <option value="">Todos los productos</option>
            {productosManejaLotes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mt-4">
          <input type="checkbox" checked={filtroSoloStock} onChange={e => setFiltroSoloStock(e.target.checked)}
            className="w-4 h-4 accent-indigo-600" />
          Solo lotes con stock
        </label>
        <span className="ml-auto text-xs text-slate-400">{(lotes as any[]).length} lote(s)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && <p className="text-center py-16 text-slate-400">Cargando lotes...</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Lote', 'Producto', 'Bodega', 'Cant. inicial', 'Disponible', 'Fabricación', 'Vencimiento', 'Estado'].map(h => (
                    <th key={h} className={`px-5 py-2.5 font-semibold ${['Cant. inicial', 'Disponible'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(lotes as any[]).map((l: any) => {
                  const dias = diasParaVencer(l.fechaVencimiento)
                  const vencido = dias !== null && dias < 0
                  const urgente = dias !== null && dias >= 0 && dias <= 7
                  const proximo = dias !== null && dias > 7 && dias <= 30
                  return (
                    <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${vencido ? 'bg-red-50/30' : urgente ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">{l.numero}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{l.producto?.nombre}<p className="text-xs text-slate-400">{l.producto?.sku}</p></td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{l.bodega?.nombre}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{fmt(parseFloat(l.cantidadInicial))}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800">{fmt(parseFloat(l.cantidad))}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{fmtFecha(l.fechaFabricacion)}</td>
                      <td className="px-5 py-3">
                        {l.fechaVencimiento ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                            ${vencido ? 'bg-red-100 text-red-700' : urgente ? 'bg-red-100 text-red-700' : proximo ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            <Calendar size={10} />
                            {fmtFecha(l.fechaVencimiento)}
                            {dias !== null && ` · ${dias < 0 ? 'VENCIDO' : `${dias}d`}`}
                          </span>
                        ) : <span className="text-slate-400 text-xs">Sin vencimiento</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {l.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {(lotes as any[]).length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No hay lotes registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo lote */}
      {showForm && (
        <NuevoLoteModal
          productos={productosManejaLotes}
          bodegas={bodegas as any[]}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => mutCreate.mutate(data)}
          isLoading={mutCreate.isPending}
          error={mutCreate.error as any}
        />
      )}
    </div>
  )
}

function NuevoLoteModal({ productos, bodegas, onClose, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({
    productoId: '', bodegaId: '', numero: '',
    cantidadInicial: '', fechaVencimiento: '', fechaFabricacion: '',
    proveedor: '', notas: '',
  })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit({
      productoId: +form.productoId,
      bodegaId: +form.bodegaId,
      numero: form.numero,
      cantidadInicial: parseFloat(form.cantidadInicial),
      fechaVencimiento: form.fechaVencimiento || undefined,
      fechaFabricacion: form.fechaFabricacion || undefined,
      proveedor: form.proveedor || undefined,
      notas: form.notas || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Nuevo Lote</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Producto *</label>
              <select required value={form.productoId} onChange={set('productoId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona un producto...</option>
                {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bodega *</label>
              <select required value={form.bodegaId} onChange={set('bodegaId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona...</option>
                {bodegas.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Número de lote *</label>
              <input required value={form.numero} onChange={set('numero')} placeholder="LOT-2026-001"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad inicial *</label>
              <input required type="number" min={0.001} step={0.001} value={form.cantidadInicial} onChange={set('cantidadInicial')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha vencimiento</label>
              <input type="date" value={form.fechaVencimiento} onChange={set('fechaVencimiento')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha fabricación</label>
              <input type="date" value={form.fechaFabricacion} onChange={set('fechaFabricacion')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor</label>
              <input value={form.proveedor} onChange={set('proveedor')} placeholder="Nombre del proveedor"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
              <textarea value={form.notas} onChange={set('notas')} rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error?.response?.data?.message ?? 'Error al crear el lote'}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Crear lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
