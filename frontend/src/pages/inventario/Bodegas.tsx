import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, createBodega, updateBodega } from '../../services/inventario.service'
import { getSucursales } from '../../services/configuracion.service'
import { Plus, Warehouse, Star, Edit2, X, Check, MapPin, AlertCircle } from 'lucide-react'

const TIPOS = ['ALMACEN', 'PUNTO_VENTA', 'TRANSITO', 'DEVOLUCION', 'VIRTUAL']
const TIPO_LABEL: Record<string, string> = {
  ALMACEN: 'Almacén', PUNTO_VENTA: 'Punto de Venta',
  TRANSITO: 'Tránsito', DEVOLUCION: 'Devolución', VIRTUAL: 'Virtual',
}

export function Bodegas() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', tipo: 'ALMACEN', sucursalId: '', esPrincipal: false })
  const [error, setError] = useState<string | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const { data: sucursales = [], isLoading: loadingSucursales } = useQuery({ queryKey: ['sucursales'], queryFn: getSucursales })

  const mutation = useMutation({
    mutationFn: (data: any) => editing ? updateBodega(editing.id, data) : createBodega(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bodegas'] })
      setShowForm(false)
      setEditing(null)
      setForm({ codigo: '', nombre: '', tipo: 'ALMACEN', sucursalId: '', esPrincipal: false })
      setError(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      if (typeof msg === 'string') {
        setError(msg)
      } else if (Array.isArray(msg)) {
        setError(msg.join(', '))
      } else {
        setError('Error al guardar la bodega. Por favor verifica que las migraciones de base de datos hayan sido aplicadas en el servidor.')
      }
    },
  })

  function openEdit(b: any) {
    setEditing(b)
    setForm({ 
      codigo: b.codigo, 
      nombre: b.nombre, 
      tipo: b.tipo, 
      sucursalId: b.sucursalId ? String(b.sucursalId) : '', 
      esPrincipal: b.esPrincipal 
    })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.sucursalId) {
      setError('La vinculación a una sucursal es obligatoria.')
      return
    }
    mutation.mutate({ 
      codigo: form.codigo, 
      nombre: form.nombre, 
      tipo: form.tipo, 
      sucursalId: Number(form.sucursalId), 
      esPrincipal: form.esPrincipal 
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Inventario</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Gestión de Bodegas</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5 tracking-tight">
            <Warehouse size={24} className="text-indigo-600" />
            Bodegas de Inventario
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Administra los almacenes de almacenamiento lógico y físico, vinculados a cada sucursal de la empresa.
          </p>
        </div>
        <button 
          onClick={() => { 
            setEditing(null); 
            setForm({ codigo: '', nombre: '', tipo: 'ALMACEN', sucursalId: '', esPrincipal: false }); 
            setShowForm(true) 
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-600/10 transition-all"
        >
          <Plus size={15} />
          Nueva bodega
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 text-base">{editing ? 'Editar Bodega' : 'Crear Nueva Bodega'}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Código *</label>
              <input 
                value={form.codigo} 
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} 
                required 
                className={inputCls} 
                placeholder="BDG-01" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de Bodega *</label>
              <input 
                value={form.nombre} 
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} 
                required 
                className={inputCls} 
                placeholder="Bodega Principal" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Almacén</label>
              <select 
                value={form.tipo} 
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} 
                className={inputCls}
              >
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sucursal Asociada *</label>
              <select 
                value={form.sucursalId} 
                onChange={e => setForm(f => ({ ...f, sucursalId: e.target.value }))} 
                required
                className={inputCls}
              >
                <option value="">Seleccione una sucursal...</option>
                {sucursales.filter((s: any) => s.estado === 'ACTIVO').map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={form.esPrincipal} 
                  onChange={e => setForm(f => ({ ...f, esPrincipal: e.target.checked }))} 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600 transition-all" 
                />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Marcar como bodega principal de despacho</span>
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={mutation.isLoading} 
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm shadow-indigo-600/10"
              >
                <Check size={14} />
                {mutation.isLoading ? 'Guardando...' : 'Guardar Bodega'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Bodegas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-400 text-xs animate-pulse">Cargando catálogo de bodegas...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Warehouse className="mx-auto text-slate-300 mb-3" size={36} />
          <h3 className="font-bold text-slate-700 text-sm">No hay bodegas registradas</h3>
          <p className="text-slate-400 text-xs mt-1">Crea tu primera bodega asociándola a una sucursal para gestionar stocks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((b: any) => (
            <div 
              key={b.id} 
              className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative group ${
                b.esPrincipal ? 'border-indigo-400/70 shadow-sm shadow-indigo-100' : 'border-slate-200/80'
              }`}
            >
              {/* Star Badge for Principal */}
              {b.esPrincipal && (
                <span className="absolute top-4 right-12 flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200/50">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  Principal
                </span>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    b.activo ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Warehouse size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{b.nombre}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{b.codigo}</p>
                  </div>
                </div>
                <button 
                  onClick={() => openEdit(b)} 
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors absolute top-4 right-4"
                >
                  <Edit2 size={13} />
                </button>
              </div>

              {/* Badges row */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {TIPO_LABEL[b.tipo] ?? b.tipo}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500'
                }`}>
                  {b.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Sucursal and References */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{b.sucursal?.nombre || 'Sin Sucursal'}</span>
                </div>
                {b._count && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {b._count.stock} ref. en stock
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
