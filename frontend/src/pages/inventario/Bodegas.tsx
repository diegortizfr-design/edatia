import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, createBodega, updateBodega } from '../../services/inventario.service'
import { Plus, Warehouse, Star, Edit2, X, Check } from 'lucide-react'

const TIPOS = ['ALMACEN', 'PUNTO_VENTA', 'TRANSITO', 'DEVOLUCION', 'VIRTUAL']
const TIPO_LABEL: Record<string, string> = {
  ALMACEN: 'Almacén', PUNTO_VENTA: 'Punto de Venta',
  TRANSITO: 'Tránsito', DEVOLUCION: 'Devolución', VIRTUAL: 'Virtual',
}

export function Bodegas() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', tipo: 'ALMACEN', direccion: '', esPrincipal: false })
  const [error, setError] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const mutation = useMutation({
    mutationFn: (data: any) => editing ? updateBodega(editing.id, data) : createBodega(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bodegas'] })
      setShowForm(false)
      setEditing(null)
      setForm({ codigo: '', nombre: '', tipo: 'ALMACEN', direccion: '', esPrincipal: false })
      setError(null)
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  })

  function openEdit(b: any) {
    setEditing(b)
    setForm({ codigo: b.codigo, nombre: b.nombre, tipo: b.tipo, direccion: b.direccion ?? '', esPrincipal: b.esPrincipal })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate({ ...form, direccion: form.direccion || undefined })
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bodegas</h1>
          <p className="text-slate-500 text-sm">{data.length} bodegas registradas</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ codigo: '', nombre: '', tipo: 'ALMACEN', direccion: '', esPrincipal: false }); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />Nueva bodega
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">{editing ? 'Editar bodega' : 'Nueva bodega'}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">CÓDIGO *</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} required className={inputCls} placeholder="BDG-01" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">NOMBRE *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required className={inputCls} placeholder="Bodega principal" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">TIPO</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">DIRECCIÓN</label>
              <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.esPrincipal} onChange={e => setForm(f => ({ ...f, esPrincipal: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-slate-700">Marcar como bodega principal</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={mutation.isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                <Check size={16} />{mutation.isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p className="text-slate-400 col-span-3 py-10 text-center">Cargando...</p> : data.map(b => (
          <div key={b.id} className={`bg-white rounded-xl border shadow-sm p-5 ${b.esPrincipal ? 'border-indigo-300' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${b.activo ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  <Warehouse size={18} className={b.activo ? 'text-indigo-600' : 'text-slate-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800">{b.nombre}</p>
                    {b.esPrincipal && <Star size={13} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-400">{b.codigo}</p>
                </div>
              </div>
              <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{TIPO_LABEL[b.tipo] ?? b.tipo}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${b.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {b.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {b._count && <p className="mt-2 text-xs text-slate-400">{b._count.stock} referencias en stock</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
