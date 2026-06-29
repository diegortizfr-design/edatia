import { useState, useMemo } from 'react'
import { 
  Wallet, Landmark, Plus, Search, Trash2, Edit3, CheckCircle2, 
  XCircle, SlidersHorizontal, Lock, CheckSquare, Square
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajasBancos, createCajaBanco, updateCajaBanco, deleteCajaBanco } from '../../services/erp.service'
import { getSucursales } from '../../services/configuracion.service'
import { getCuentasPUC } from '../../services/contabilidad.service'
import toast from 'react-hot-toast'

// ─── Interfaces y Estructuras de Datos ────────────────────────────────────────

interface CajaBancoConfig {
  id: string;
  codigo: string;
  descripcion: string;
  sucursalId: string;
  controlOrden: number;
  cuentaContable: string;
  tipo: 'CAJA' | 'BANCO';
  activo: boolean;
  aplicaRecibos: boolean;
  aplicaPagos: boolean;
  aplicaControl: boolean;
  restringida: boolean;
}

interface SucursalSummary {
  id: string;
  codigo: string;
  nombre: string;
}

const PUC_ACCOUNTS = [
  { value: '11050501', label: '11050501 CAJA GENERAL' },
  { value: '11100501', label: '11100501 BANCOLOMBIA HECTOR' },
  { value: '11100502', label: '11100502 BANCOLOMBIA PATRICIA' },
  { value: '11100503', label: '11100503 BANCOLOMBIA MARIA T' },
  { value: '11100504', label: '11100504 BANCOLOMBIA INGRID' },
  { value: '11100505', label: '11100505 CUENTA OSCAR' },
  { value: '11100506', label: '11100506 BANCOLOMBIA DANIEL' },
  { value: '11100507', label: '11100507 DAVIVIENDA HECTOR FABIO' },
  { value: '11200501', label: '11200501 DAVIVIENDA' },
  { value: '11201001', label: '11201001 DAVIVIENDA AHORROS' },
  { value: '12050101', label: '12050101 INVERSIONES TEMPORALES' },
  { value: '13050501', label: '13050501 CLIENTES NACIONALES' },
  { value: '22050502', label: '22050502 JOYEROS FABRICANTES' }
];

const DEFAULT_CAJAS_BANCOS: CajaBancoConfig[] = [
  {
    id: 'caja_1',
    codigo: 'CM1',
    descripcion: 'CAJA MAYOR',
    sucursalId: 'suc_principal',
    controlOrden: 1,
    cuentaContable: '11050501',
    tipo: 'CAJA',
    activo: true,
    aplicaRecibos: true,
    aplicaPagos: true,
    aplicaControl: true,
    restringida: false
  },
  {
    id: 'banco_1',
    codigo: '81',
    descripcion: 'BANCOLOMBIA HECTOR',
    sucursalId: 'suc_principal',
    controlOrden: 1,
    cuentaContable: '11100501',
    tipo: 'BANCO',
    activo: true,
    aplicaRecibos: true,
    aplicaPagos: true,
    aplicaControl: true,
    restringida: false
  },
  {
    id: 'banco_2',
    codigo: '87',
    descripcion: 'DAVIVIENDA',
    sucursalId: 'suc_principal',
    controlOrden: 0,
    cuentaContable: '11200501',
    tipo: 'BANCO',
    activo: true,
    aplicaRecibos: true,
    aplicaPagos: true,
    aplicaControl: true,
    restringida: false
  },
  {
    id: 'caja_2',
    codigo: 'CR1',
    descripcion: 'CREDITOS',
    sucursalId: 'suc_centro',
    controlOrden: 0,
    cuentaContable: '13050501',
    tipo: 'CAJA',
    activo: true,
    aplicaRecibos: false,
    aplicaPagos: false,
    aplicaControl: false,
    restringida: true
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

function Input({ value, onChange, placeholder, type = 'text', disabled = false, min }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      min={min}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  )
}

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (v: any) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white disabled:bg-slate-100 disabled:text-slate-400"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function PremiumCheckboxCard({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`p-4 border rounded-2xl shadow-sm cursor-pointer select-none transition-all flex items-start gap-3.5 ${
        checked 
          ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-100/50' 
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="mt-0.5 shrink-0 text-indigo-600">
        {checked ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-400" />}
      </div>
      <div className="space-y-0.5">
        <div className="text-sm font-bold text-slate-700">{label}</div>
        <div className="text-xs text-slate-400 leading-normal">{description}</div>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigCajasBancos() {
  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['cajas-bancos'], queryFn: getCajasBancos })
  const { data: sucursales = [] } = useQuery({ queryKey: ['sucursales'], queryFn: getSucursales })
  const { data: cuentasPUC = [] } = useQuery<any[]>({ queryKey: ['cuentas-puc-disponible'], queryFn: () => getCuentasPUC() })

  const dynamicPUCOptions = useMemo(() => {
    const filtered = cuentasPUC.filter(c => c.codigo.startsWith('11'))
    if (filtered.length > 0) {
      return filtered.map(c => ({
        value: c.codigo,
        label: `${c.codigo} ${c.nombre}`
      }))
    }
    return PUC_ACCOUNTS.filter(p => p.value.startsWith('11'))
  }, [cuentasPUC])

  const getAccountLabel = (cuenta: string) => {
    const foundReal = cuentasPUC.find(c => c.codigo === cuenta)
    if (foundReal) return `${foundReal.codigo} ${foundReal.nombre}`
    const foundMock = PUC_ACCOUNTS.find(p => p.value === cuenta)
    return foundMock ? foundMock.label : cuenta
  }

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<CajaBancoConfig>>({})

  const createMutation = useMutation({
    mutationFn: (dto: Partial<CajaBancoConfig>) => createCajaBanco(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas-bancos'] })
      toast.success('Caja/Banco creado exitosamente.')
      setViewMode('list')
    },
    onError: () => toast.error('Error al crear la caja/banco.')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CajaBancoConfig> }) => updateCajaBanco(id as any, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas-bancos'] })
      toast.success('Caja/Banco actualizado exitosamente.')
      setViewMode('list')
    },
    onError: () => toast.error('Error al actualizar la caja/banco.')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCajaBanco(id as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas-bancos'] })
      toast.success('Caja/Banco eliminado.')
    },
    onError: () => toast.error('Error al eliminar la caja/banco.')
  })

  // Eventos del Formulario
  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      codigo: '',
      descripcion: '',
      sucursalId: sucursales[0]?.id || 'suc_principal',
      controlOrden: 0,
      cuentaContable: PUC_ACCOUNTS[0]?.value || '11050501',
      tipo: 'CAJA',
      activo: true,
      aplicaRecibos: true,
      aplicaPagos: true,
      aplicaControl: false,
      restringida: false
    })
    setViewMode('form')
  }

  const handleOpenEdit = (item: CajaBancoConfig) => {
    setEditingId(item.id)
    setForm({ ...item })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta caja/banco? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo || !form.descripcion || !form.sucursalId || !form.cuentaContable || !form.tipo) {
      alert('Código, Descripción, Sucursal, Cuenta y Tipo son obligatorios.')
      return
    }

    if (editingId) {
      // Editar existente
      updateMutation.mutate({ id: editingId, dto: { ...form } })
    } else {
      // Crear nuevo
      const newItem: Partial<CajaBancoConfig> = {
        ...form,
        codigo: form.codigo!.toUpperCase(),
        descripcion: form.descripcion!.toUpperCase(),
        sucursalId: form.sucursalId!,
        controlOrden: form.controlOrden || 0,
        cuentaContable: form.cuentaContable!,
        tipo: form.tipo!,
        activo: form.activo !== false,
        aplicaRecibos: form.aplicaRecibos !== false,
        aplicaPagos: form.aplicaPagos !== false,
        aplicaControl: !!form.aplicaControl,
        restringida: !!form.restringida
      }
      createMutation.mutate(newItem)
    }
  }

  // Filtrar
  const filtered = useMemo(() => {
    return items.filter(i => 
      i.codigo.toLowerCase().includes(search.toLowerCase()) ||
      i.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      i.cuentaContable.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Cargando...
      </div>
    )
  }

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
                <span className="text-slate-600 font-medium">Cajas y Bancos</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Wallet size={24} className="text-indigo-600" />
                Cajas / Bancos
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Administración de cuentas financieras, cajas registradoras del POS y anclaje a cuentas contables PUC.
              </p>
            </div>

            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              Crear Caja / Banco
            </button>
          </div>



          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
              <Landmark size={14} className="flex-shrink-0" />
              <span>Cajas/Bancos registrados: <span className="font-extrabold">{items.length}</span></span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código, descripción o cuenta..."
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
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aplica Control</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Orden</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Restringida</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.length > 0 ? (
                    filtered.map(item => {
                      const sucursalName = sucursales.find(s => s.id === item.sucursalId)?.nombre || 'Principal'
                      const accountLabel = getAccountLabel(item.cuentaContable)

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-indigo-600">
                            {item.codigo}
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {item.tipo === 'BANCO' ? <Landmark size={14} className="text-slate-400" /> : <Wallet size={14} className="text-slate-400" />}
                              {item.descripcion}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Sucursal: {sucursalName}</div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold leading-none ${
                              item.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.activo ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex justify-start pl-6">
                              {item.aplicaControl ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                          </td>

                          <td className="p-4 font-bold text-slate-600">
                            {item.controlOrden > 0 ? (
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-bold border border-slate-200">
                                {item.controlOrden}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex justify-start pl-6">
                              {item.restringida ? (
                                <Lock size={15} className="text-amber-500" title="Cuenta restringida a cajero" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                          </td>

                          <td className="p-4 font-semibold text-slate-600 text-xs">
                            {accountLabel}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar parámetros"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar registro"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No se encontraron registros de cajas ni bancos.
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Cajas y Bancos</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Caja / Banco' : 'Crear Caja / Banco'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Completa los datos de la cuenta financiera y asigna sus controles fiscales y de arqueo.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Field label="Código *">
                    <Input
                      value={form.codigo}
                      onChange={(v: string) => setForm(f => ({ ...f, codigo: v }))}
                      placeholder="Ej. CM1 o 81"
                    />
                  </Field>
                </div>

                <div className="md:col-span-5">
                  <Field label="Descripción / Nombre *">
                    <Input
                      value={form.descripcion}
                      onChange={(v: string) => setForm(f => ({ ...f, descripcion: v }))}
                      placeholder="Ej. BANCOLOMBIA DANIEL"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Sucursal *">
                    <Select
                      value={form.sucursalId || ''}
                      onChange={(v) => setForm(f => ({ ...f, sucursalId: v }))}
                      options={sucursales.map(s => ({ value: s.id, label: `[${s.codigo}] ${s.nombre}` }))}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Control Orden">
                    <Input
                      type="number"
                      min={0}
                      value={form.controlOrden}
                      onChange={(v: number) => setForm(f => ({ ...f, controlOrden: v }))}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field label="Cuenta PUC *">
                    <Select
                      value={form.cuentaContable || ''}
                      onChange={(v) => setForm(f => ({ ...f, cuentaContable: v }))}
                      options={dynamicPUCOptions}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Tipo *">
                    <Select
                      value={form.tipo || 'CAJA'}
                      onChange={(v) => setForm(f => ({ ...f, tipo: v }))}
                      options={[
                        { value: 'CAJA', label: 'Caja POS / Física' },
                        { value: 'BANCO', label: 'Cuenta Bancaria' }
                      ]}
                    />
                  </Field>
                </div>
              </div>

              {/* Boolean Checkbox Cards */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Opciones de Operación y Control</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PremiumCheckboxCard
                    checked={!!form.activo}
                    onChange={(v) => setForm(f => ({ ...f, activo: v }))}
                    label="Activo"
                    description="Habilita esta caja/banco para recibir transacciones en el ERP."
                  />
                  <PremiumCheckboxCard
                    checked={!!form.aplicaRecibos}
                    onChange={(v) => setForm(f => ({ ...f, aplicaRecibos: v }))}
                    label="Aplica Recibos"
                    description="Permite que esta cuenta reciba ingresos de caja (Recibos de Caja)."
                  />
                  <PremiumCheckboxCard
                    checked={!!form.aplicaPagos}
                    onChange={(v) => setForm(f => ({ ...f, aplicaPagos: v }))}
                    label="Aplica Pagos"
                    description="Permite realizar desembolsos desde esta cuenta (Comprobantes de Egreso)."
                  />
                  <PremiumCheckboxCard
                    checked={!!form.aplicaControl}
                    onChange={(v) => setForm(f => ({ ...f, aplicaControl: v }))}
                    label="Aplica Control"
                    description="Activa auditoría rigurosa y arqueos periódicos en esta caja."
                  />
                  <PremiumCheckboxCard
                    checked={!!form.restringida}
                    onChange={(v) => setForm(f => ({ ...f, restringida: v }))}
                    label="Restringida"
                    description="Restringe la cuenta de modo que solo cajeros autorizados puedan operarla."
                  />
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
                  Guardar Caja / Banco
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
