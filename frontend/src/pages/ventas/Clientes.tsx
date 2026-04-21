import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, Eye, Pencil, X } from 'lucide-react'
import {
  getClientes, createCliente, updateCliente,
} from '../../services/ventas.service'

const REGIMEN_CONFIG: Record<string, { label: string; color: string }> = {
  '48': { label: 'Resp. IVA', color: 'bg-green-100 text-green-700' },
  '49': { label: 'No Resp.',  color: 'bg-slate-100 text-slate-600' },
}

function RegimenBadge({ regimen }: { regimen?: string }) {
  const cfg = regimen ? (REGIMEN_CONFIG[regimen] ?? { label: regimen, color: 'bg-blue-100 text-blue-700' }) : null
  if (!cfg) return <span className="text-slate-400 text-xs">—</span>
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const TIPO_DOCUMENTO_OPTIONS = ['NIT', 'CC', 'CE', 'PASAPORTE', 'PEP']
const TIPO_PERSONA_OPTIONS = ['NATURAL', 'JURIDICA']
const REGIMEN_OPTIONS = [{ value: '48', label: 'Responsable de IVA (48)' }, { value: '49', label: 'No responsable de IVA (49)' }]

const CAMPO_DEFAULT = {
  tipoPersona: 'NATURAL',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  digitoVerificacion: '',
  nombre: '',
  nombreComercial: '',
  regimenFiscal: '49',
  email: '',
  telefono: '',
  municipio: '',
  departamento: '',
  codigoDane: '',
  direccion: '',
  plazoCredito: '',
  notas: '',
}

export function Clientes() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes', q],
    queryFn: () => getClientes(q || undefined),
  })

  const mutCreate = useMutation({
    mutationFn: createCliente,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); setShowModal(false) },
  })
  const mutUpdate = useMutation({
    mutationFn: ({ id, data }: any) => updateCliente(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); setEditando(null) },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(clientes as any[]).length} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, documento..."
            className="pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-16 text-slate-400">Cargando clientes...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Nombre', 'Documento', 'Municipio', 'Régimen', 'Email', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(clientes as any[]).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.nombre}</p>
                      {c.nombreComercial && <p className="text-xs text-slate-400">{c.nombreComercial}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-mono">
                      {c.tipoDocumento} {c.numeroDocumento}
                      {c.digitoVerificacion ? `-${c.digitoVerificacion}` : ''}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{c.municipio || '—'}</td>
                    <td className="px-5 py-3"><RegimenBadge regimen={c.regimenFiscal} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{c.email || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditando({ ...c, _view: true })}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                          <Eye size={13} /> Ver
                        </button>
                        <button
                          onClick={() => setEditando(c)}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium">
                          <Pencil size={13} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(clientes as any[]).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Users size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400">No hay clientes{q ? ` para "${q}"` : ''}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear */}
      {showModal && (
        <ClienteModal
          onClose={() => setShowModal(false)}
          onSubmit={(data: any) => mutCreate.mutate(data)}
          isLoading={mutCreate.isPending}
          error={mutCreate.error as any}
        />
      )}

      {/* Modal editar */}
      {editando && (
        <ClienteModal
          initial={editando}
          readOnly={editando._view}
          onClose={() => setEditando(null)}
          onSubmit={(data: any) => mutUpdate.mutate({ id: editando.id, data })}
          isLoading={mutUpdate.isPending}
          error={mutUpdate.error as any}
        />
      )}
    </div>
  )
}

function ClienteModal({ initial, readOnly, onClose, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({ ...CAMPO_DEFAULT, ...(initial ?? {}) })
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (readOnly) { onClose(); return }
    const payload: any = { ...form }
    if (form.tipoDocumento !== 'NIT') delete payload.digitoVerificacion
    if (form.plazoCredito !== '') payload.plazoCredito = Number(form.plazoCredito)
    onSubmit(payload)
  }

  const isNit = form.tipoDocumento === 'NIT'
  const title = readOnly ? 'Detalle cliente' : initial?.id ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo persona *</label>
              <select required disabled={readOnly} value={form.tipoPersona} onChange={set('tipoPersona')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white disabled:bg-slate-50">
                {TIPO_PERSONA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo documento *</label>
              <select required disabled={readOnly} value={form.tipoDocumento} onChange={set('tipoDocumento')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white disabled:bg-slate-50">
                {TIPO_DOCUMENTO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Número de documento *</label>
              <input required readOnly={readOnly} value={form.numeroDocumento} onChange={set('numeroDocumento')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
            {isNit && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dígito verificación</label>
                <input readOnly={readOnly} value={form.digitoVerificacion} onChange={set('digitoVerificacion')} maxLength={1}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre / Razón social *</label>
              <input required readOnly={readOnly} value={form.nombre} onChange={set('nombre')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre comercial</label>
              <input readOnly={readOnly} value={form.nombreComercial} onChange={set('nombreComercial')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Régimen fiscal *</label>
              <select required disabled={readOnly} value={form.regimenFiscal} onChange={set('regimenFiscal')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white disabled:bg-slate-50">
                {REGIMEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" readOnly={readOnly} value={form.email} onChange={set('email')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <input readOnly={readOnly} value={form.telefono} onChange={set('telefono')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Plazo crédito (días)</label>
              <input type="number" min={0} readOnly={readOnly} value={form.plazoCredito} onChange={set('plazoCredito')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Municipio</label>
              <input readOnly={readOnly} value={form.municipio} onChange={set('municipio')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Departamento</label>
              <input readOnly={readOnly} value={form.departamento} onChange={set('departamento')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Código DANE</label>
              <input readOnly={readOnly} value={form.codigoDane} onChange={set('codigoDane')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
            <input readOnly={readOnly} value={form.direccion} onChange={set('direccion')}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 read-only:bg-slate-50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
            <textarea readOnly={readOnly} value={form.notas} onChange={set('notas')} rows={2}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none read-only:bg-slate-50" />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error?.response?.data?.message ?? 'Error al guardar cliente'}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button type="submit" disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {isLoading ? 'Guardando...' : initial?.id ? 'Actualizar' : 'Crear cliente'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
