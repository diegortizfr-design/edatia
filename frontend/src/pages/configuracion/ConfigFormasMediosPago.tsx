import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFormasPago,
  createFormaPago,
  updateFormaPago,
  deleteFormaPago,
  getMediosPago,
  createMedioPago,
  updateMedioPago,
  deleteMedioPago,
} from '../../services/configuracion.service'
import { getCajasBancos } from '../../services/erp.service'
import { getApiError } from '../../services/api'
import toast from 'react-hot-toast'
import { CreditCard, Coins, Plus, Trash2, Edit3, X, Check } from 'lucide-react'

interface FormaPago {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  generaCartera: boolean;
}

interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  cajaBancoId?: number | null;
  cajaBanco?: { id: number; nombre: string } | null;
}

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

function Input({ value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  )
}

export default function ConfigFormasMediosPago() {
  const queryClient = useQueryClient()

  // Queries
  const { data: formas = [], isLoading: isLoadingFormas } = useQuery<FormaPago[]>({
    queryKey: ['config-formas-pago'],
    queryFn: getFormasPago,
  })

  const { data: medios = [], isLoading: isLoadingMedios } = useQuery<MedioPago[]>({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  })

  const { data: cajasBancos = [] } = useQuery<any[]>({
    queryKey: ['cajas-bancos'],
    queryFn: getCajasBancos,
  })

  // Modals / Form State
  const [modalType, setModalType] = useState<'forma' | 'medio' | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', activo: true, generaCartera: true, cajaBancoId: '' })

  // Mutations - Formas de Pago
  const createFormaMutation = useMutation({
    mutationFn: createFormaPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-formas-pago'] })
      toast.success('Forma de pago creada correctamente')
      closeModal()
    },
    onError: (e) => toast.error(getApiError(e, 'Error al crear la forma de pago')),
  })

  const updateFormaMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateFormaPago(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-formas-pago'] })
      toast.success('Forma de pago actualizada correctamente')
      closeModal()
    },
    onError: (e) => toast.error(getApiError(e, 'Error al actualizar la forma de pago')),
  })

  const deleteFormaMutation = useMutation({
    mutationFn: deleteFormaPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-formas-pago'] })
      toast.success('Forma de pago eliminada correctamente')
    },
    onError: (e) => toast.error(getApiError(e, 'Error al eliminar la forma de pago')),
  })

  // Mutations - Medios de Pago
  const createMedioMutation = useMutation({
    mutationFn: createMedioPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-medios-pago'] })
      toast.success('Medio de pago creado correctamente')
      closeModal()
    },
    onError: (e) => toast.error(getApiError(e, 'Error al crear el medio de pago')),
  })

  const updateMedioMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateMedioPago(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-medios-pago'] })
      toast.success('Medio de pago actualizado correctamente')
      closeModal()
    },
    onError: (e) => toast.error(getApiError(e, 'Error al actualizar el medio de pago')),
  })

  const deleteMedioMutation = useMutation({
    mutationFn: deleteMedioPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-medios-pago'] })
      toast.success('Medio de pago eliminado correctamente')
    },
    onError: (e) => toast.error(getApiError(e, 'Error al eliminar el medio de pago')),
  })

  // Handlers
  const openModal = (type: 'forma' | 'medio', mode: 'create' | 'edit', item?: any) => {
    setModalType(type)
    setModalMode(mode)
    if (mode === 'edit' && item) {
      setEditingItem(item)
      setForm({
        codigo: item.codigo,
        nombre: item.nombre,
        activo: item.activo,
        generaCartera: item.generaCartera ?? true,
        cajaBancoId: item.cajaBancoId ? String(item.cajaBancoId) : '',
      })
    } else {
      setEditingItem(null)
      setForm({ codigo: '', nombre: '', activo: true, generaCartera: true, cajaBancoId: '' })
    }
  }

  const closeModal = () => {
    setModalType(null)
    setEditingItem(null)
    setForm({ codigo: '', nombre: '', activo: true, generaCartera: true, cajaBancoId: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    const payload: any = {
      codigo: form.codigo.toUpperCase().trim(),
      nombre: form.nombre.trim(),
      activo: form.activo,
    }

    if (modalType === 'forma') {
      payload.generaCartera = form.generaCartera
      if (modalMode === 'edit' && editingItem) {
        updateFormaMutation.mutate({ id: editingItem.id, dto: payload })
      } else {
        createFormaMutation.mutate(payload)
      }
    } else if (modalType === 'medio') {
      payload.cajaBancoId = form.cajaBancoId ? Number(form.cajaBancoId) : null
      if (modalMode === 'edit' && editingItem) {
        updateMedioMutation.mutate({ id: editingItem.id, dto: payload })
      } else {
        createMedioMutation.mutate(payload)
      }
    }
  }

  const toggleStatus = (type: 'forma' | 'medio', item: any) => {
    const nextActivo = !item.activo
    const payload = { activo: nextActivo }
    if (type === 'forma') {
      updateFormaMutation.mutate({ id: item.id, dto: payload })
    } else {
      updateMedioMutation.mutate({ id: item.id, dto: payload })
    }
  }

  const handleDelete = (type: 'forma' | 'medio', id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este elemento? Esta acción podría fallar si está asociado a facturas existentes.')) {
      if (type === 'forma') {
        deleteFormaMutation.mutate(id)
      } else {
        deleteMedioMutation.mutate(id)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Coins size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Formas / Medios de Pago</h1>
          </div>
          <p className="text-sm text-slate-500">
            Administra las opciones de pago que aparecen dinámicamente al crear facturas de venta.
          </p>
        </div>
      </div>

      {/* Grid side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Formas de Pago */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-500" />
              <h2 className="font-bold text-slate-800">Formas de Pago</h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {formas.length}
              </span>
            </div>
            <button
              onClick={() => openModal('forma', 'create')}
              className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus size={14} /> Nueva Forma
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingFormas ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando formas de pago...</div>
            ) : formas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No hay formas de pago registradas.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th className="p-4 pl-6">Código</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formas.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-semibold text-slate-700">{item.codigo}</td>
                      <td className="p-4 text-slate-600 font-medium">{item.nombre}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.generaCartera ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {item.generaCartera ? 'Crédito' : 'Contado'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus('forma', item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            item.activo
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => openModal('forma', 'edit', item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all inline-flex"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete('forma', item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all inline-flex"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Column 2: Medios de Pago */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Coins size={18} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800">Medios de Pago</h2>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {medios.length}
              </span>
            </div>
            <button
              onClick={() => openModal('medio', 'create')}
              className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus size={14} /> Nuevo Medio
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingMedios ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando medios de pago...</div>
            ) : medios.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No hay medios de pago registrados.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <th className="p-4 pl-6">Código</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Caja / Banco</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medios.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-semibold text-slate-700">{item.codigo}</td>
                      <td className="p-4 text-slate-600 font-medium">{item.nombre}</td>
                      <td className="p-4">
                        {item.cajaBanco ? (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                            {item.cajaBanco.nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">Caja General (Por Defecto)</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus('medio', item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            item.activo
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => openModal('medio', 'edit', item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all inline-flex"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete('medio', item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all inline-flex"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>



      {/* Modal - Create/Edit */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === 'create' ? 'Agregar' : 'Editar'}{' '}
                {modalType === 'forma' ? 'Forma de Pago' : 'Medio de Pago'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Field
                label="Código"
                hint="Ej: CONTADO, TARJETA_DEBITO, NEQUI. Se guardará en mayúsculas."
              >
                <Input
                  value={form.codigo}
                  onChange={(v: string) => setForm(prev => ({ ...prev, codigo: v }))}
                  placeholder="Escribe el código..."
                  disabled={modalMode === 'edit'}
                />
              </Field>

              <Field
                label="Nombre descriptivo"
                hint="Ej: Contado Inmediato, Transferencia Bancaria, Pago con QR Nequi"
              >
                <Input
                  value={form.nombre}
                  onChange={(v: string) => setForm(prev => ({ ...prev, nombre: v }))}
                  placeholder="Escribe el nombre..."
                />
              </Field>

              {modalType === 'forma' && (
                <div className="flex items-center gap-3 select-none cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    id="generacartera-checkbox"
                    checked={form.generaCartera}
                    onChange={e => setForm(prev => ({ ...prev, generaCartera: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 bg-slate-50 border-slate-200 rounded focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                  />
                  <label htmlFor="generacartera-checkbox" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Genera cartera (Cuentas por Cobrar / Crédito)
                  </label>
                </div>
              )}

              {modalType === 'medio' && (
                <Field
                  label="Caja o Banco de Tesorería"
                  hint="Determina la cuenta PUC que se debitará en ventas de contado."
                >
                  <select
                    value={form.cajaBancoId}
                    onChange={e => setForm(prev => ({ ...prev, cajaBancoId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- No vinculada (Caja General) --</option>
                    {cajasBancos.map((cb: any) => (
                      <option key={cb.id} value={cb.id}>
                        {cb.nombre} ({cb.tipo === 'CAJA' ? 'Caja' : `Banco: ${cb.banco ?? ''}`} - {cb.cuentaPUC ?? 'Sin PUC'})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <div className="flex items-center gap-3 select-none cursor-pointer pt-2">
                <input
                  type="checkbox"
                  id="activo-checkbox"
                  checked={form.activo}
                  onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 bg-slate-50 border-slate-200 rounded focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0"
                />
                <label htmlFor="activo-checkbox" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Habilitar opción en el ERP (Activo)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createFormaMutation.isPending || updateFormaMutation.isPending || createMedioMutation.isPending || updateMedioMutation.isPending}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
