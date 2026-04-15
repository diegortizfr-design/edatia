import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCategorias, createCategoria, updateCategoria,
  getMarcas, createMarca, updateMarca,
  getUnidades, createUnidad, updateUnidad,
} from '../../services/inventario.service'
import { Plus, Check, X, Edit2 } from 'lucide-react'

type Tab = 'categorias' | 'marcas' | 'unidades'

const TIPOS_UNIDAD = ['UNIDAD', 'PESO', 'VOLUMEN', 'LONGITUD']

export function Maestros() {
  const [tab, setTab] = useState<Tab>('categorias')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Maestros de inventario</h1>
        <p className="text-slate-500 text-sm">Categorías, marcas y unidades de medida</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['categorias', 'Categorías'], ['marcas', 'Marcas'], ['unidades', 'Unidades de Medida']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'marcas' && <MarcasTab />}
      {tab === 'unidades' && <UnidadesTab />}
    </div>
  )
}

// ── Categorías ──────────────────────────────────────────────────────────────

function CategoriasTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ nombre: '', slug: '', descripcion: '', parentId: '' })
  const [error, setError] = useState<string | null>(null)

  const { data = [] } = useQuery({ queryKey: ['categorias'], queryFn: getCategorias })

  const mutation = useMutation({
    mutationFn: (d: any) => editing ? updateCategoria(editing.id, d) : createCategoria(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setShowForm(false); setEditing(null); setForm({ nombre: '', slug: '', descripcion: '', parentId: '' }) },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error'),
  })

  function openEdit(c: any) {
    setEditing(c)
    setForm({ nombre: c.nombre, slug: c.slug, descripcion: c.descripcion ?? '', parentId: c.parentId ? String(c.parentId) : '' })
    setShowForm(true)
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  const categoriasPadre = data.filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setForm({ nombre: '', slug: '', descripcion: '', parentId: '' }); setShowForm(!showForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} />Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={e => { e.preventDefault(); mutation.mutate({ nombre: form.nombre, slug: form.slug, descripcion: form.descripcion || undefined, parentId: form.parentId ? +form.parentId : undefined }) }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">NOMBRE *</label>
              <input value={form.nombre} onChange={e => { const n = e.target.value; setForm(f => ({ ...f, nombre: n, slug: n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })) }} required className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">SLUG *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">DESCRIPCIÓN</label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">CATEGORÍA PADRE</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className={inputCls}>
                <option value="">— Ninguna (categoría raíz) —</option>
                {categoriasPadre.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select></div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"><X size={14} /></button>
              <button type="submit" disabled={mutation.isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"><Check size={14} />Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Padre</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Productos</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500">{c.parent?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c._count?.productos ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{c.activo ? 'Activa' : 'Inactiva'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay categorías aún</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Marcas ──────────────────────────────────────────────────────────────────

function MarcasTab() {
  const qc = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data = [] } = useQuery({ queryKey: ['marcas'], queryFn: getMarcas })

  const mutation = useMutation({
    mutationFn: (d: any) => editing ? updateMarca(editing.id, d) : createMarca(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marcas'] }); setShowForm(false); setNombre(''); setEditing(null) },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error'),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setNombre(''); setShowForm(!showForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} />Nueva marca
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={e => { e.preventDefault(); mutation.mutate({ nombre }) }} className="flex gap-3 items-end">
            <div className="flex-1"><label className="block text-xs font-semibold text-slate-500 mb-1">NOMBRE *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"><X size={14} /></button>
            <button type="submit" disabled={mutation.isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"><Check size={14} />Guardar</button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Marca</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Productos</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                <td className="px-4 py-3 text-center text-slate-600">{m._count?.productos ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{m.activo ? 'Activa' : 'Inactiva'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(m); setNombre(m.nombre); setShowForm(true) }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No hay marcas aún</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Unidades de Medida ───────────────────────────────────────────────────────

function UnidadesTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ nombre: '', abreviatura: '', tipo: 'UNIDAD', factorBase: '1' })
  const [error, setError] = useState<string | null>(null)

  const { data = [] } = useQuery({ queryKey: ['unidades'], queryFn: getUnidades })

  const mutation = useMutation({
    mutationFn: (d: any) => editing ? updateUnidad(editing.id, d) : createUnidad(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['unidades'] }); setShowForm(false); setEditing(null); setForm({ nombre: '', abreviatura: '', tipo: 'UNIDAD', factorBase: '1' }) },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error'),
  })

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setForm({ nombre: '', abreviatura: '', tipo: 'UNIDAD', factorBase: '1' }); setShowForm(!showForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} />Nueva unidad
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={e => { e.preventDefault(); mutation.mutate({ nombre: form.nombre, abreviatura: form.abreviatura, tipo: form.tipo, factorBase: +form.factorBase }) }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1">NOMBRE *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required className={inputCls} placeholder="Unidad, Caja x12..." /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">ABREVIATURA *</label>
              <input value={form.abreviatura} onChange={e => setForm(f => ({ ...f, abreviatura: e.target.value }))} required className={inputCls} placeholder="und, cja, kg..." /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">TIPO</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                {TIPOS_UNIDAD.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"><X size={14} /></button>
              <button type="submit" disabled={mutation.isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"><Check size={14} />Guardar</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Abreviatura</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Tipo</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.abreviatura}</td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500">{u.tipo}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{u.activo ? 'Activa' : 'Inactiva'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(u); setForm({ nombre: u.nombre, abreviatura: u.abreviatura, tipo: u.tipo, factorBase: String(u.factorBase) }); setShowForm(true) }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No hay unidades de medida aún</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
