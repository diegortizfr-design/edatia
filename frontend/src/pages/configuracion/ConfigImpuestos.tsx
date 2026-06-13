import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getImpuestos, createImpuesto, updateImpuesto, deleteImpuesto } from '../../services/erp.service'
import { getCuentasPUC } from '../../services/contabilidad.service'
import { 
  Percent, Plus, Search, Trash2, Edit3, CheckCircle2, 
  SlidersHorizontal, CheckSquare, Square, FileText, ArrowRightLeft,
  ChevronDown, HelpCircle
} from 'lucide-react'

// ─── Tipos e Impuestos Predeterminados ────────────────────────────────────────

interface ImpuestoConfig {
  id: string;
  codigo: string;
  nombre: string;
  sigla: string;
  tipo: 'IVA' | 'RETE_RENTA' | 'RETE_IVA' | 'RETE_ICA' | 'CONSUMO';
  dianCod: string;
  tipoCalculo: 'PORCENTAJE' | 'VALOR';
  tarifa: number;
  retencionCompra: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
  cuentaVenta?: string;
  cuentaDevolucionVenta?: string;
  cuentaCompra?: string;
  cuentaDevolucionCompra?: string;
}

const TIPO_LABELS: Record<string, string> = {
  'IVA': 'IVA (Valor Agregado)',
  'RETE_RENTA': 'Retención de Renta',
  'RETE_IVA': 'Retención de IVA',
  'RETE_ICA': 'Retención de ICA',
  'CONSUMO': 'Impuesto al Consumo'
};

const DIAN_TAX_CODES = [
  { value: '01', label: '01 - IVA' },
  { value: '02', label: '02 - IC (Impuesto al Consumo)' },
  { value: '03', label: '03 - ICA (Impuesto de Industria y Comercio)' },
  { value: '04', label: '04 - INC (Impuesto Nacional al Consumo)' },
  { value: '05', label: '05 - Retención sobre el IVA' },
  { value: '06', label: '06 - Retención de Fuente (ReteFuente)' },
  { value: '07', label: '07 - Retención de ICA (ReteICA)' },
  { value: '08', label: '08 - Impuesto Ad Valorem' }
];

const PUC_ACCOUNTS = [
  { value: '', label: '-- Seleccione Cuenta PUC --' },
  { value: '24080501', label: '24080501 IVA GENERADO EN VENTA 19%' },
  { value: '24080502', label: '24080502 IVA GENERADO EN VENTA 5%' },
  { value: '24080216', label: '24080216 IVA DESC.COMPRA 19%' },
  { value: '24080205', label: '24080205 IVA DESC.COMPRA 5%' },
  { value: '13551501', label: '13551501 RETENCION EN LA FUENTE 2.5%' },
  { value: '13551502', label: '13551502 RETENCION EN LA FUENTE 3.5%' },
  { value: '23654001', label: '23654001 RETENCION DE ICA 0.4%' },
  { value: '11050501', label: '11050501 CAJA GENERAL' },
  { value: '11100501', label: '11100501 BANCOLOMBIA HECTOR' },
  { value: '11100502', label: '11100502 BANCOLOMBIA PATRICIA' },
  { value: '11100503', label: '11100503 BANCOLOMBIA MARIA T' },
  { value: '11100504', label: '11100504 BANCOLOMBIA INGRID' }
];

const DEFAULT_IMPUESTOS: ImpuestoConfig[] = [
  {
    id: 'iva_19',
    codigo: '0',
    nombre: 'IVA 19%',
    sigla: 'IVA19',
    tipo: 'IVA',
    dianCod: '01',
    tipoCalculo: 'PORCENTAJE',
    tarifa: 19,
    retencionCompra: false,
    estado: 'ACTIVO',
    descripcion: 'Impuesto al valor agregado general del 19%',
    cuentaVenta: '24080501',
    cuentaDevolucionVenta: '24080501',
    cuentaCompra: '24080216',
    cuentaDevolucionCompra: '24080216'
  },
  {
    id: 'iva_5',
    codigo: '1',
    nombre: 'IVA 5%',
    sigla: 'IVA5',
    tipo: 'IVA',
    dianCod: '01',
    tipoCalculo: 'PORCENTAJE',
    tarifa: 5,
    retencionCompra: false,
    estado: 'ACTIVO',
    descripcion: 'Impuesto al valor agregado reducido del 5%',
    cuentaVenta: '24080502',
    cuentaDevolucionVenta: '24080502',
    cuentaCompra: '24080205',
    cuentaDevolucionCompra: '24080205'
  },
  {
    id: 'ret_fuente_25',
    codigo: '2',
    nombre: 'Retención Fuente 2.5%',
    sigla: 'RTF2.5',
    tipo: 'RETE_RENTA',
    dianCod: '06',
    tipoCalculo: 'PORCENTAJE',
    tarifa: 2.5,
    retencionCompra: true,
    estado: 'ACTIVO',
    descripcion: 'Retención en la fuente general para declarantes de renta',
    cuentaVenta: '13551501',
    cuentaDevolucionVenta: '13551501',
    cuentaCompra: '13551501',
    cuentaDevolucionCompra: '13551501'
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

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (v: any) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
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

export function ConfigImpuestos() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('TODOS')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ImpuestoConfig>>({})

  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['impuestos'],
    queryFn: getImpuestos,
  })

  const { data: pucData = [] } = useQuery({
    queryKey: ['puc_cuentas'],
    queryFn: getCuentasPUC
  })

  const activePucCuentas = Array.isArray(pucData) ? pucData.filter((c: any) => c.nivel >= 3 && c.activo) : []
  const pucOptions = activePucCuentas.length > 0
    ? [
        { value: '', label: '-- Seleccione Cuenta PUC --' },
        ...activePucCuentas.map((c: any) => ({
          value: c.codigo,
          label: `${c.codigo} - ${c.nombre}`
        }))
      ]
    : PUC_ACCOUNTS;

  const createMutation = useMutation({
    mutationFn: (dto: Partial<ImpuestoConfig>) => createImpuesto(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impuestos'] })
      toast.success('Impuesto creado')
      setSavedAlert(true)
      setTimeout(() => setSavedAlert(false), 3000)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<ImpuestoConfig> }) => updateImpuesto(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impuestos'] })
      toast.success('Impuesto actualizado')
      setSavedAlert(true)
      setTimeout(() => setSavedAlert(false), 3000)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteImpuesto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impuestos'] })
      toast.success('Impuesto eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      codigo: '',
      nombre: '',
      sigla: '',
      tipo: 'IVA',
      dianCod: '01',
      tipoCalculo: 'PORCENTAJE',
      tarifa: 0,
      retencionCompra: false,
      estado: 'ACTIVO',
      descripcion: '',
      cuentaVenta: '',
      cuentaDevolucionVenta: '',
      cuentaCompra: '',
      cuentaDevolucionCompra: ''
    })
    setViewMode('form')
  }

  const handleOpenEdit = (imp: ImpuestoConfig) => {
    setEditingId(imp.id)
    setForm({ ...imp })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    const isBase = DEFAULT_IMPUESTOS.some(i => i.id === id)
    if (isBase) {
      alert('Los impuestos base del sistema no pueden ser eliminados, solo inhabilitados.')
      return
    }
    if (window.confirm('¿Está seguro de que desea eliminar este impuesto? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const siglaValue = form.sigla || form.nombre?.substring(0, 8).toUpperCase().replace(/\s+/g, '') || 'IMP'

    if (!form.dianCod || !form.nombre || !siglaValue || form.tarifa === undefined) {
      alert('Código DIAN, Nombre y Tarifa son campos obligatorios.')
      return
    }

    const finalForm = {
      ...form,
      codigo: form.dianCod,
      sigla: siglaValue.toUpperCase()
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: finalForm as Partial<ImpuestoConfig> }, {
        onSuccess: () => setViewMode('list'),
      })
    } else {
      const newImp: Partial<ImpuestoConfig> = {
        ...finalForm,
        codigo: finalForm.codigo!,
        nombre: finalForm.nombre!,
        sigla: finalForm.sigla!,
        tipo: finalForm.tipo || 'IVA',
        dianCod: finalForm.dianCod || '01',
        tipoCalculo: finalForm.tipoCalculo || 'PORCENTAJE',
        tarifa: Number(finalForm.tarifa),
        retencionCompra: !!finalForm.retencionCompra,
        estado: finalForm.estado || 'ACTIVO',
        descripcion: finalForm.descripcion || '',
        cuentaVenta: finalForm.cuentaVenta || '',
        cuentaDevolucionVenta: finalForm.cuentaDevolucionVenta || '',
        cuentaCompra: finalForm.cuentaCompra || '',
        cuentaDevolucionCompra: finalForm.cuentaDevolucionCompra || ''
      }
      createMutation.mutate(newImp, {
        onSuccess: () => setViewMode('list'),
      })
    }
  }

  if (isLoading) return <div className="p-8 text-center text-slate-400">Cargando impuestos...</div>

  const filtered = items.filter((i: ImpuestoConfig) => {
    const matchesSearch =
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.sigla.toLowerCase().includes(search.toLowerCase()) ||
      (i.descripcion || '').toLowerCase().includes(search.toLowerCase())
    const matchesTab = tab === 'TODOS' || i.tipo === tab
    return matchesSearch && matchesTab
  })

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
                <span className="text-slate-600 font-medium">Impuestos</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Percent size={24} className="text-indigo-600" />
                Configuración de Impuestos
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Crea y administra las tasas de impuestos, anclaje a cuentas contables del PUC y vinculación de códigos DIAN.
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
                Crear Impuesto
              </button>
            </div>
          </div>

          {pucData.length === 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <HelpCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-amber-800">Catálogo PUC sin inicializar</h4>
                  <p className="text-xs text-amber-600 leading-normal">
                    Tu Plan Único de Cuentas (PUC) está vacío. Para vincular los impuestos a tus asientos contables reales, debes sembrar las cuentas en el módulo contable.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => navigate('/contabilidad/puc')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-md shadow-amber-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                Sembrar PUC Ahora
              </button>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-0.5">
            <nav className="flex items-center gap-6 overflow-x-auto custom-scrollbar scrollbar-none pb-2 sm:pb-0">
              {['TODOS', 'IVA', 'RETE_RENTA', 'RETE_IVA', 'RETE_ICA', 'CONSUMO'].map(t => {
                const isActive = tab === t
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                      isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t === 'TODOS' ? 'Todos' : TIPO_LABELS[t] || t}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                  </button>
                )
              })}
            </nav>

            <div className="relative w-full sm:w-72 pb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, sigla..."
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
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Impuesto</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">DIAN Fact. Electrónica</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarifa / Porcentaje</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas Contables Mapeadas</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.length > 0 ? (
                    filtered.map(imp => {
                      const dianLabel = DIAN_TAX_CODES.find(d => d.value === imp.dianCod)?.label || imp.dianCod || 'No especificado'
                      
                      const findAccountLabel = (val: string) => {
                        if (!val) return 'No configurada'
                        const dbAcc = pucData.find((p: any) => p.codigo === val)
                        if (dbAcc) return `${dbAcc.codigo} - ${dbAcc.nombre}`
                        const mockAcc = PUC_ACCOUNTS.find(p => p.value === val)
                        return mockAcc ? mockAcc.label : val
                      }
                      
                      const cVentaLabel = findAccountLabel(imp.cuentaVenta)
                      const cCompraLabel = findAccountLabel(imp.cuentaCompra)

                      return (
                        <tr key={imp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{imp.nombre}</div>
                            <div className="text-[10px] font-mono text-indigo-600 uppercase mt-0.5">
                              SIGLA: {imp.sigla}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/50 text-slate-700 text-xs font-semibold">
                              <FileText size={12} className="text-slate-400" />
                              {dianLabel}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-700">
                            {imp.tarifa}% {imp.retencionCompra && <span className="text-[10px] text-amber-600 font-semibold">(ReteCompra)</span>}
                          </td>

                          <td className="p-4 text-xs text-slate-600 leading-normal">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-400">Ventas:</span>
                              <span className="truncate max-w-[200px]" title={cVentaLabel}>{cVentaLabel}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-bold text-slate-400">Compras:</span>
                              <span className="truncate max-w-[200px]" title={cCompraLabel}>{cCompraLabel}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                              imp.estado === 'ACTIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${imp.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {imp.estado}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(imp)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar parámetros"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(imp.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar impuesto"
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
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No se encontraron impuestos registrados.
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Impuestos</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Impuesto' : 'Crear Impuesto'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Establece la tarifa, códigos fiscales de facturación DIAN y el mapeo contable de las cuentas PUC.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                 <div className="md:col-span-8">
                  <Field label="Descripción / Nombre *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. IVA 19% o RTF 2.5%"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Impuesto Cod (Fact. Electrónica) *" hint="Ej: 01, 02, 005, etc.">
                    <input
                      type="text"
                      list="dian-tax-codes"
                      value={form.dianCod || ''}
                      onChange={e => setForm(f => ({ ...f, dianCod: e.target.value }))}
                      placeholder="Ej. 01 o 005"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    />
                    <datalist id="dian-tax-codes">
                      {DIAN_TAX_CODES.map(code => (
                        <option key={code.value} value={code.value}>{code.label}</option>
                      ))}
                    </datalist>
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Tipo *">
                    <Select
                      value={form.tipoCalculo || 'PORCENTAJE'}
                      onChange={(v) => setForm(f => ({ ...f, tipoCalculo: v }))}
                      options={[
                        { value: 'PORCENTAJE', label: 'Porcentaje %' },
                        { value: 'VALOR', label: 'Valor Fijo ($)' }
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Porcentaje o Valor *">
                    <Input
                      type="number"
                      min={0}
                      step={0.00001}
                      value={form.tarifa}
                      onChange={(v: number) => setForm(f => ({ ...f, tarifa: v }))}
                      placeholder="19.00000"
                    />
                  </Field>
                </div>

                {/* Checkboxes aligned beside rate */}
                <div className="md:col-span-3 pt-5">
                  <PremiumCheckboxCard
                    checked={form.estado === 'ACTIVO'}
                    onChange={(v) => setForm(f => ({ ...f, estado: v ? 'ACTIVO' : 'INACTIVO' }))}
                    label="Activo"
                    description="Impuesto disponible"
                  />
                </div>

                <div className="md:col-span-3 pt-5">
                  <PremiumCheckboxCard
                    checked={!!form.retencionCompra}
                    onChange={(v) => setForm(f => ({ ...f, retencionCompra: v }))}
                    label="Retención en Compra"
                    description="Aplica retención fiscal"
                  />
                </div>

                {/* Sigla/Código interno (hidden helper) */}
                <div className="hidden">
                  <Input
                    value={form.sigla || 'IMP_T'}
                    onChange={(v: string) => setForm(f => ({ ...f, sigla: v }))}
                  />
                </div>
              </div>

              {/* 4 Colored Panels for PUC Accounting Mappings */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <ArrowRightLeft size={16} className="text-indigo-600" />
                    Mapeo de Cuentas Contables en el PUC
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vincula los asientos contables correspondientes para compras, ventas y sus devoluciones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PANEL 1: VENTAS (Green) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-emerald-600 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center gap-1.5">
                      <ArrowRightLeft size={14} />
                      Ventas
                    </div>
                    <div className="p-4 bg-white">
                      <Field label="Cuenta Venta">
                        <Select
                          value={form.cuentaVenta || ''}
                          onChange={(v) => setForm(f => ({ ...f, cuentaVenta: v }))}
                          options={pucOptions}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* PANEL 2: DEVOLUCIONES EN VENTA (Teal) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-cyan-600 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center gap-1.5">
                      <ArrowRightLeft size={14} />
                      Devoluciones en Venta
                    </div>
                    <div className="p-4 bg-white">
                      <Field label="Cuenta Devolución Venta">
                        <Select
                          value={form.cuentaDevolucionVenta || ''}
                          onChange={(v) => setForm(f => ({ ...f, cuentaDevolucionVenta: v }))}
                          options={pucOptions}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* PANEL 3: COMPRAS (Dark Blue) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-blue-900 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center gap-1.5">
                      <ArrowRightLeft size={14} />
                      Compras
                    </div>
                    <div className="p-4 bg-white">
                      <Field label="Cuenta Compra">
                        <Select
                          value={form.cuentaCompra || ''}
                          onChange={(v) => setForm(f => ({ ...f, cuentaCompra: v }))}
                          options={pucOptions}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* PANEL 4: DEVOLUCIONES EN COMPRA (Purple) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-violet-600 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center gap-1.5">
                      <ArrowRightLeft size={14} />
                      Devoluciones en Compra
                    </div>
                    <div className="p-4 bg-white">
                      <Field label="Cuenta Devolución Compra">
                        <Select
                          value={form.cuentaDevolucionCompra || ''}
                          onChange={(v) => setForm(f => ({ ...f, cuentaDevolucionCompra: v }))}
                          options={pucOptions}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Description / Details */}
              <div className="pt-2">
                <Field label="Descripción de Notas">
                  <Input
                    value={form.descripcion}
                    onChange={(v: string) => setForm(f => ({ ...f, descripcion: v }))}
                    placeholder="Ej. Tarifa general del 19% aplicable para IVA generado en facturas."
                  />
                </Field>
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
                  Guardar Impuesto
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
