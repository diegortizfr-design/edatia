import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCuentasPUC, seedPUC, createCuentaPUC, toggleCuentaPUC } from '../../services/contabilidad.service'
import { BookOpen, Plus, Search, CheckCircle, X } from 'lucide-react'

const NIVEL_CFG: Record<number, { label: string; color: string }> = {
  1: { label: 'Clase',     color: 'bg-purple-100 text-purple-700' },
  2: { label: 'Grupo',     color: 'bg-blue-100 text-blue-700' },
  3: { label: 'Cuenta',    color: 'bg-green-100 text-green-700' },
  4: { label: 'Subcuenta', color: 'bg-amber-100 text-amber-700' },
  5: { label: 'Auxiliar',  color: 'bg-slate-100 text-slate-600' },
}

const TIPO_COLOR: Record<string, string> = {
  ACTIVO:     'bg-teal-100 text-teal-700',
  PASIVO:     'bg-orange-100 text-orange-700',
  PATRIMONIO: 'bg-violet-100 text-violet-700',
  INGRESO:    'bg-green-100 text-green-700',
  GASTO:      'bg-red-100 text-red-700',
  COSTO:      'bg-amber-100 text-amber-700',
}

export function PUC() {
  const qc = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)

  const { data: cuentasData, isLoading } = useQuery({ queryKey: ['puc'], queryFn: getCuentasPUC })
  const cuentas: any[] = (cuentasData as any[]) ?? []

  const mutSeed = useMutation({
    mutationFn: seedPUC,
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['puc'] }); setSeedResult(r) },
  })

  const mutToggle = useMutation({
    mutationFn: toggleCuentaPUC,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['puc'] }),
  })

  const filtradas = (cuentas as any[]).filter(c => {
    const matchBusq = !busqueda || c.codigo.startsWith(busqueda) || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchNivel = !filtroNivel || c.nivel === +filtroNivel
    const matchTipo  = !filtroTipo  || c.tipo === filtroTipo
    return matchBusq && matchNivel && matchTipo
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PUC — Plan Único de Cuentas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Decreto 2650 — Estructura contable colombiana</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => mutSeed.mutate()} disabled={mutSeed.isPending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            {mutSeed.isPending ? 'Sembrando...' : 'Sembrar PUC estándar'}
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Nueva cuenta
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <span className="text-green-800 text-sm font-medium">
            Siembra completada: <strong>{seedResult.creadas}</strong> cuentas creadas,{' '}
            <strong>{seedResult.omitidas}</strong> omitidas (ya existían)
          </span>
          <button onClick={() => setSeedResult(null)} className="ml-auto"><X size={14} className="text-green-500" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Código o nombre..." className="pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-52" />
        </div>
        <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="">Todos los niveles</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{NIVEL_CFG[n]?.label}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="">Todos los tipos</option>
          {['ACTIVO','PASIVO','PATRIMONIO','INGRESO','GASTO','COSTO'].map(t =>
            <option key={t} value={t}>{t}</option>
          )}
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtradas.length} cuenta(s)</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && <p className="text-center py-16 text-slate-400">Cargando PUC...</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Código','Nombre','Nivel','Naturaleza','Tipo','Activo'].map(h =>
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtradas.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700"
                        style={{ paddingLeft: `${(c.nivel - 1) * 12 + 16}px` }}>
                      {c.codigo}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 text-xs">{c.nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NIVEL_CFG[c.nivel]?.color ?? ''}`}>
                        {NIVEL_CFG[c.nivel]?.label ?? c.nivel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.naturaleza === 'DEBITO' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {c.naturaleza}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[c.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => mutToggle.mutate(c.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${c.activo ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${c.activo ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    {(cuentas as any[]).length === 0
                      ? 'No hay cuentas. Usa "Sembrar PUC estándar" para cargar el PUC colombiano.'
                      : 'No hay resultados para el filtro aplicado.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <NuevaCuentaModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['puc'] }); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function NuevaCuentaModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    codigo: '', nombre: '', nivel: '3', codigoPadre: '',
    naturaleza: 'DEBITO', tipo: 'ACTIVO',
  })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const mut = useMutation({ mutationFn: createCuentaPUC, onSuccess })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={16} />Nueva Cuenta PUC</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(form) }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
              <input required value={form.codigo} onChange={set('codigo')} placeholder="ej: 110505"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Código padre</label>
              <input value={form.codigoPadre} onChange={set('codigoPadre')} placeholder="ej: 1105"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
            <input required value={form.nombre} onChange={set('nombre')}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nivel</label>
              <select value={form.nivel} onChange={set('nivel')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{NIVEL_CFG[n]?.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Naturaleza</label>
              <select value={form.naturaleza} onChange={set('naturaleza')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="DEBITO">DÉBITO</option>
                <option value="CREDITO">CRÉDITO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {['ACTIVO','PASIVO','PATRIMONIO','INGRESO','GASTO','COSTO'].map(t =>
                  <option key={t} value={t}>{t}</option>
                )}
              </select>
            </div>
          </div>
          {mut.isError && <p className="text-red-600 text-sm">{(mut.error as any)?.response?.data?.message ?? 'Error'}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={mut.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mut.isPending ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
