import { useState, useEffect } from 'react'
import { Coins, Plus, Search, Trash2, Edit3, CheckCircle2, SlidersHorizontal, Info } from 'lucide-react'

// ─── Tipos y Monedas Predeterminadas ──────────────────────────────────────────

interface MonedaConfig {
  id: string;
  nombre: string;
  codigoIso: string; // ej: COP, USD, EUR
  simbolo: string; // ej: $, €, US$
  tasaCambio: number; // respecto a la moneda base
  esPrincipal: boolean; // solo una moneda puede ser la base del sistema
  estado: 'ACTIVO' | 'INACTIVO';
}

const DEFAULT_MONEDAS: MonedaConfig[] = [
  {
    id: 'cop',
    nombre: 'Peso Colombiano',
    codigoIso: 'COP',
    simbolo: '$',
    tasaCambio: 1,
    esPrincipal: true,
    estado: 'ACTIVO'
  },
  {
    id: 'usd',
    nombre: 'Dólar Estadounidense',
    codigoIso: 'USD',
    simbolo: 'US$',
    tasaCambio: 4000,
    esPrincipal: false,
    estado: 'ACTIVO'
  },
  {
    id: 'eur',
    nombre: 'Euro',
    codigoIso: 'EUR',
    simbolo: '€',
    tasaCambio: 4300,
    esPrincipal: false,
    estado: 'ACTIVO'
  }
];

// ─── Componentes Helper Estilizados ──────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled = false, min, step }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      min={min}
      step={step}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-3 select-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigMonedas() {
  const [monedas, setMonedas] = useState<MonedaConfig[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<MonedaConfig>>({})

  useEffect(() => {
    const saved = localStorage.getItem('edatia_config_monedas')
    if (saved) {
      try {
        setMonedas(JSON.parse(saved))
      } catch (e) {
        setMonedas(DEFAULT_MONEDAS)
      }
    } else {
      setMonedas(DEFAULT_MONEDAS)
      localStorage.setItem('edatia_config_monedas', JSON.stringify(DEFAULT_MONEDAS))
    }
  }, [])

  const saveToLocalStorage = (items: MonedaConfig[]) => {
    setMonedas(items)
    localStorage.setItem('edatia_config_monedas', JSON.stringify(items))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      codigoIso: '',
      simbolo: '',
      tasaCambio: 1,
      esPrincipal: false,
      estado: 'ACTIVO'
    })
    setViewMode('form')
  }

  const handleOpenEdit = (mon: MonedaConfig) => {
    setEditingId(mon.id)
    setForm({ ...mon })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    const coin = monedas.find(m => m.id === id)
    if (coin?.esPrincipal) {
      alert('La moneda principal del sistema no puede ser eliminada. Por favor, designe otra moneda como principal antes.')
      return
    }
    const isBase = DEFAULT_MONEDAS.some(m => m.id === id)
    if (isBase) {
      alert('Las monedas base del sistema no pueden ser eliminadas, solo inhabilitadas cambiándolas a estado INACTIVO.')
      return
    }
    if (window.confirm('¿Está seguro de que desea eliminar esta moneda? Esta acción no se puede deshacer.')) {
      const updated = monedas.filter(m => m.id !== id)
      saveToLocalStorage(updated)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.codigoIso || !form.simbolo || form.tasaCambio === undefined) {
      alert('Nombre, Código ISO, Símbolo y Tasa de Cambio son campos obligatorios.')
      return
    }

    let updated: MonedaConfig[]
    const isPrincipal = !!form.esPrincipal

    if (editingId) {
      updated = monedas.map(m => {
        if (m.id === editingId) {
          return { ...m, ...form, esPrincipal: isPrincipal } as MonedaConfig
        }
        // Si el editado pasa a ser principal, los demás dejan de serlo
        return isPrincipal ? { ...m, esPrincipal: false } : m
      })
    } else {
      const newId = `coin_${Date.now()}`
      const newCoin: MonedaConfig = {
        ...form,
        id: newId,
        nombre: form.nombre!,
        codigoIso: form.codigoIso!.toUpperCase(),
        simbolo: form.simbolo!,
        tasaCambio: Number(form.tasaCambio),
        esPrincipal: isPrincipal,
        estado: form.estado || 'ACTIVO'
      } as MonedaConfig

      if (isPrincipal) {
        updated = monedas.map(m => ({ ...m, esPrincipal: false }))
        updated = [...updated, newCoin]
      } else {
        updated = [...monedas, newCoin]
      }
    }

    // Asegurarse de que al menos una moneda quede como principal
    const hasPrincipal = updated.some(m => m.esPrincipal)
    if (!hasPrincipal && updated.length > 0) {
      updated[0].esPrincipal = true
    }

    saveToLocalStorage(updated)
    setViewMode('list')
  }

  const filtered = monedas.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.codigoIso.toLowerCase().includes(search.toLowerCase())
  )

  const baseCurrency = monedas.find(m => m.esPrincipal)

  return (
    <div className="w-full space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Monedas</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Coins size={24} className="text-indigo-600" />
                Configuración de Monedas
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Define las monedas admitidas por el ERP, configura los símbolos y tasas de cambio para operaciones multi-moneda.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAlert && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold animate-bounce">
                  <CheckCircle2 size={16} /> Configuración actualizada
                </div>
              )}
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Crear Moneda
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
              <Info size={14} className="flex-shrink-0" />
              <span>Moneda Base del ERP: <span className="font-extrabold">{baseCurrency?.nombre} ({baseCurrency?.codigoIso})</span>. Todas las tasas se definen en base a esta moneda.</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o sigla ISO..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código ISO</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Moneda</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Símbolo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Cambio</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo Moneda</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.length > 0 ? (
                    filtered.map(mon => (
                      <tr key={mon.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">
                          {mon.codigoIso}
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          {mon.nombre}
                        </td>

                        <td className="p-4 font-mono text-slate-600">
                          {mon.simbolo}
                        </td>

                        <td className="p-4">
                          {mon.esPrincipal ? (
                            <span className="text-xs text-slate-400 italic">Moneda Base (1.0)</span>
                          ) : (
                            <span className="font-mono text-slate-700 font-semibold">
                              1 {mon.codigoIso} = {mon.tasaCambio} {baseCurrency?.codigoIso}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {mon.esPrincipal ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 leading-none">
                              Principal / Base
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500 leading-none">
                              Secundaria
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                            mon.estado === 'ACTIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${mon.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-400'}`} />
                            {mon.estado}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(mon)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar moneda"
                            >
                              <Edit3 size={15} />
                            </button>
                            {!mon.esPrincipal && (
                              <button
                                onClick={() => handleDelete(mon.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar moneda"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No se encontraron monedas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Monedas</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Moneda' : 'Crear Moneda'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Configura los parámetros, el símbolo y la equivalencia del valor de cambio.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Nombre de la Moneda *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. Dólar Canadiense"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Código ISO (Sigla) *">
                    <Input
                      value={form.codigoIso}
                      onChange={(v: string) => setForm(f => ({ ...f, codigoIso: v }))}
                      placeholder="Ej. CAD"
                      disabled={editingId && form.esPrincipal}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Símbolo *">
                    <Input
                      value={form.simbolo}
                      onChange={(v: string) => setForm(f => ({ ...f, simbolo: v }))}
                      placeholder="Ej. C$"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Tasa de Cambio (Equivalente en Moneda Base) *" hint={`¿Cuántos pesos (${baseCurrency?.codigoIso}) equivale a 1 unidad de esta moneda?`}>
                    <Input
                      type="number"
                      min={0.0001}
                      step={0.0001}
                      value={form.tasaCambio}
                      onChange={(v: number) => setForm(f => ({ ...f, tasaCambio: v }))}
                      placeholder="1.00"
                      disabled={form.esPrincipal}
                    />
                  </Field>
                </div>

                <div className="md:col-span-8 flex items-center pt-6">
                  <Toggle
                    checked={!!form.esPrincipal}
                    onChange={(v) => setForm(f => ({ ...f, esPrincipal: v, tasaCambio: v ? 1 : f.tasaCambio }))}
                    label="Establecer como Moneda Principal / Base del ERP"
                    disabled={editingId && form.esPrincipal} // no se puede desmarcar la principal desde sí misma si es la única
                  />
                </div>

                <div className="md:col-span-4">
                  <Field label="Estado">
                    <Select
                      value={form.estado || 'ACTIVO'}
                      onChange={(v) => setForm(f => ({ ...f, estado: v }))}
                      options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' }
                      ]}
                      disabled={editingId && form.esPrincipal}
                    />
                  </Field>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                  Guardar Moneda
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
