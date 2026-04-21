import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSeriales, getStatsSeriales, ingresarSeriales, actualizarEstadoSerial,
  getProductos, getBodegas,
} from '../../services/inventario.service'
import { Hash, Plus, Search, CheckCircle, ShoppingBag, RotateCcw, Slash, X } from 'lucide-react'

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DISPONIBLE: { label: 'Disponible', color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  VENDIDO:    { label: 'Vendido',    color: 'bg-blue-100  text-blue-700',   icon: ShoppingBag },
  DEVUELTO:   { label: 'Devuelto',   color: 'bg-amber-100 text-amber-700',  icon: RotateCcw },
  BAJA:       { label: 'Baja',       color: 'bg-red-100   text-red-700',    icon: Slash },
}

export function Seriales() {
  const qc = useQueryClient()
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [busquedaSerial, setBusquedaSerial] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)

  const { data: seriales = [], isLoading } = useQuery({
    queryKey: ['seriales', filtroEstado, filtroProducto],
    queryFn: () => getSeriales({
      estado: filtroEstado || undefined,
      productoId: filtroProducto ? +filtroProducto : undefined,
    }),
  })

  const { data: stats } = useQuery({ queryKey: ['seriales-stats'], queryFn: getStatsSeriales })
  const { data: productos = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const productosConSerial = (productos as any[]).filter(p => p.manejaSerial)

  const mutIngresar = useMutation({
    mutationFn: ingresarSeriales,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seriales'] }); qc.invalidateQueries({ queryKey: ['seriales-stats'] }); setShowForm(false) },
  })

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: any) => actualizarEstadoSerial(id, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seriales'] }); qc.invalidateQueries({ queryKey: ['seriales-stats'] }); setEditando(null) },
  })

  const serialesFiltrados = busquedaSerial
    ? (seriales as any[]).filter(s => s.serial.toLowerCase().includes(busquedaSerial.toLowerCase()))
    : seriales as any[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Números de Serie</h1>
          <p className="text-slate-500 text-sm mt-0.5">Trazabilidad individual por número de serie</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Ingresar seriales
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          {Object.entries(ESTADO_CONFIG).map(([estado, cfg]) => (
            <div key={estado} className={`rounded-xl border p-4 text-center shadow-sm ${cfg.color.replace('text-', 'border-').replace('-700', '-200').replace('bg-', 'bg-')}`}>
              <p className="text-xs font-medium">{cfg.label}</p>
              <p className="text-2xl font-bold">{(stats as any)[estado] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busquedaSerial} onChange={e => setBusquedaSerial(e.target.value)}
            placeholder="Buscar serial..."
            className="pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-52" />
        </div>
        <div>
          <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
            <option value="">Todos los productos</option>
            {productosConSerial.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <span className="ml-auto text-xs text-slate-400">{serialesFiltrados.length} serial(es)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && <p className="text-center py-16 text-slate-400">Cargando seriales...</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Serial', 'Producto', 'Bodega', 'Lote', 'Estado', 'Registrado', 'Acción'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {serialesFiltrados.map((s: any) => {
                  const cfg = ESTADO_CONFIG[s.estado] ?? ESTADO_CONFIG.DISPONIBLE
                  const Ico = cfg.icon
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                        <Hash size={12} className="text-slate-400" />{s.serial}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">{s.producto?.nombre}<p className="text-xs text-slate-400">{s.producto?.sku}</p></td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{s.bodega?.nombre ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{s.lote?.numero ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <Ico size={11} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{new Date(s.createdAt).toLocaleDateString('es-CO')}</td>
                      <td className="px-5 py-3">
                        {editando?.id === s.id ? (
                          <div className="flex items-center gap-1">
                            {Object.keys(ESTADO_CONFIG).filter(e => e !== s.estado).map(e => (
                              <button key={e} onClick={() => mutEstado.mutate({ id: s.id, estado: e })}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_CONFIG[e].color} hover:opacity-80`}>
                                {ESTADO_CONFIG[e].label}
                              </button>
                            ))}
                            <button onClick={() => setEditando(null)} className="text-slate-400 ml-1"><X size={13} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditando(s)}
                            className="text-xs text-indigo-600 hover:underline font-medium">
                            Cambiar estado
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {serialesFiltrados.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No hay seriales registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ingresar seriales */}
      {showForm && (
        <IngresarSerialesModal
          productos={productosConSerial}
          bodegas={bodegas as any[]}
          onClose={() => setShowForm(false)}
          onSubmit={(data: any) => mutIngresar.mutate(data)}
          isLoading={mutIngresar.isPending}
          error={mutIngresar.error as any}
        />
      )}
    </div>
  )
}

function IngresarSerialesModal({ productos, bodegas, onClose, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({ productoId: '', bodegaId: '', seriales: '', notas: '' })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const lista = form.seriales.split('\n').map(s => s.trim()).filter(Boolean)
    if (lista.length === 0) return
    onSubmit({ productoId: +form.productoId, bodegaId: +form.bodegaId, seriales: lista, notas: form.notas || undefined })
  }

  const lista = form.seriales.split('\n').map(s => s.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Ingresar Números de Serie</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Producto *</label>
              <select required value={form.productoId} onChange={set('productoId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Selecciona...</option>
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
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Números de serie * <span className="text-slate-400 font-normal">(uno por línea)</span>
            </label>
            <textarea required value={form.seriales} onChange={set('seriales')} rows={6}
              placeholder={'SN-001\nSN-002\nSN-003'}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
            {lista.length > 0 && (
              <p className="text-xs text-indigo-600 mt-1 font-medium">{lista.length} serial(es) detectado(s)</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
            <input value={form.notas} onChange={set('notas')}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          {error && <p className="text-red-600 text-sm">{error?.response?.data?.message ?? 'Error al ingresar seriales'}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isLoading || lista.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Ingresando...' : `Ingresar ${lista.length > 0 ? lista.length : ''} serial(es)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
