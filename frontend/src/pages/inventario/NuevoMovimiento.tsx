import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  buscarProductos, getBodegas,
  postEntrada, postSalida, postAjuste, postTraslado,
} from '../../services/inventario.service'
import { ArrowLeft, Search } from 'lucide-react'

type TipoMov = 'entrada' | 'salida' | 'ajuste' | 'traslado'

export function NuevoMovimiento() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tipo, setTipo] = useState<TipoMov>('entrada')
  const [q, setQ] = useState('')
  const [producto, setProducto] = useState<any | null>(null)
  const [form, setForm] = useState({ bodegaId: '', bodegaOrigenId: '', bodegaDestinoId: '', cantidad: '', costoUnitario: '', notas: '' })
  const [error, setError] = useState<string | null>(null)

  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-producto', q],
    queryFn: () => buscarProductos(q),
    enabled: q.length >= 2 && !producto,
  })

  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const activeBodegas = bodegas.filter(b => b.activo)

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (tipo === 'entrada') return postEntrada(data)
      if (tipo === 'salida') return postSalida(data)
      if (tipo === 'ajuste') return postAjuste(data)
      return postTraslado(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      navigate('/inventario/movimientos')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar el movimiento'))
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!producto) return setError('Selecciona un producto')

    const base = { productoId: producto.id, cantidad: +form.cantidad, notas: form.notas || undefined }
    if (tipo === 'entrada') {
      mutation.mutate({ ...base, bodegaId: +form.bodegaId, costoUnitario: +form.costoUnitario })
    } else if (tipo === 'salida') {
      mutation.mutate({ ...base, bodegaId: +form.bodegaId })
    } else if (tipo === 'ajuste') {
      const cantAjuste = form.cantidad ? +form.cantidad : 0
      mutation.mutate({ productoId: producto.id, bodegaId: +form.bodegaId, cantidad: cantAjuste, notas: form.notas || undefined })
    } else {
      mutation.mutate({ ...base, bodegaOrigenId: +form.bodegaOrigenId, bodegaDestinoId: +form.bodegaDestinoId })
    }
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const TIPO_LABELS: Record<TipoMov, string> = { entrada: 'Entrada de mercancía', salida: 'Salida', ajuste: 'Ajuste de inventario', traslado: 'Traslado entre bodegas' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Nuevo movimiento</h1>
      </div>

      {/* Tipo de movimiento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tipo de movimiento</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['entrada', 'salida', 'ajuste', 'traslado'] as TipoMov[]).map(t => (
            <button key={t} onClick={() => { setTipo(t); setForm(f => ({ ...f, bodegaId: '', bodegaOrigenId: '', bodegaDestinoId: '' })) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${tipo === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
              {TIPO_LABELS[t].split(' ')[0]}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">{TIPO_LABELS[tipo]}</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Búsqueda de producto */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Producto *</label>
          {producto ? (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-indigo-800">{producto.nombre}</p>
                <p className="text-xs text-indigo-600">{producto.sku} · CPP: ${Number(producto.costoPromedio).toLocaleString('es-CO')}</p>
              </div>
              <button type="button" onClick={() => { setProducto(null); setQ('') }} className="text-xs text-indigo-600 hover:underline">Cambiar</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barras..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {q.length >= 2 && !buscando && sugerencias.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {sugerencias.map(p => (
                    <button key={p.id} type="button" onClick={() => { setProducto(p); setQ('') }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0">
                      <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.sku} · CPP: ${Number(p.costoPromedio).toLocaleString('es-CO')}</p>
                    </button>
                  ))}
                </div>
              )}
              {q.length >= 2 && !buscando && sugerencias.length === 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-3 text-sm text-slate-400">
                  Sin resultados para "{q}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bodega(s) */}
        {tipo !== 'traslado' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Bodega *</label>
            <select value={form.bodegaId} onChange={e => setForm(f => ({ ...f, bodegaId: e.target.value }))} required className={inputCls}>
              <option value="">— Seleccionar bodega —</option>
              {activeBodegas.map(b => <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>)}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Bodega origen *</label>
              <select value={form.bodegaOrigenId} onChange={e => setForm(f => ({ ...f, bodegaOrigenId: e.target.value }))} required className={inputCls}>
                <option value="">— Origen —</option>
                {activeBodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Bodega destino *</label>
              <select value={form.bodegaDestinoId} onChange={e => setForm(f => ({ ...f, bodegaDestinoId: e.target.value }))} required className={inputCls}>
                <option value="">— Destino —</option>
                {activeBodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Cantidad */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {tipo === 'ajuste' ? 'Ajuste de cantidad (positivo o negativo) *' : 'Cantidad *'}
          </label>
          <input type="number" step="0.001"
            value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
            required={tipo !== 'ajuste'} className={inputCls}
            placeholder={tipo === 'ajuste' ? 'Ej: -5 para restar, +10 para sumar' : '0'} />
        </div>

        {/* Costo unitario solo para entrada */}
        {tipo === 'entrada' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Costo unitario de compra *</label>
            <input type="number" min="0" step="0.01"
              value={form.costoUnitario} onChange={e => setForm(f => ({ ...f, costoUnitario: e.target.value }))}
              required className={inputCls} placeholder="0.00" />
            <p className="text-xs text-slate-400 mt-1">Se recalculará el CPP del producto automáticamente.</p>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notas (opcional)</label>
          <input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className={inputCls} placeholder="Observaciones del movimiento..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={mutation.isLoading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {mutation.isLoading ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </div>
  )
}
