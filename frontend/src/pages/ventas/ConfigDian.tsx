import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Plus, X, AlertTriangle, CheckCircle, Shield } from 'lucide-react'
import {
  getConfigDian, upsertConfigDian, addResolucionDian, toggleResolucionDian,
} from '../../services/ventas.service'

const PROVEEDOR_OPTIONS = ['DIRECTO', 'CARVAJAL', 'GOSOCKET', 'EDICOM']

const TIPO_DOC_OPTIONS = ['FACTURA_VENTA', 'NOTA_CREDITO', 'NOTA_DEBITO']

const RESOLUCION_DEFAULT = {
  tipoDocumento: 'FACTURA_VENTA',
  prefijo: '',
  rangoInicial: '',
  rangoFinal: '',
  fechaResolucion: '',
  fechaVigencia: '',
  numeroResolucion: '',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export function ConfigDian() {
  const qc = useQueryClient()
  const [showResolucionModal, setShowResolucionModal] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['config-dian'], queryFn: getConfigDian })

  // Form estado config
  const [ambiente, setAmbiente] = useState<string | null>(null)
  const [softwareId, setSoftwareId] = useState('')
  const [softwarePin, setSoftwarePin] = useState('')
  const [proveedorTec, setProveedorTec] = useState('DIRECTO')
  const [proveedorApiKey, setProveedorApiKey] = useState('')
  const [proveedorUrl, setProveedorUrl] = useState('')
  const [activo, setActivo] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Inicializar form con datos del server
  if (data && !initialized) {
    setAmbiente(data.ambiente ?? 'PRUEBAS')
    setSoftwareId(data.softwareId ?? '')
    setSoftwarePin(data.softwarePin ?? '')
    setProveedorTec(data.proveedorTec ?? 'DIRECTO')
    setProveedorApiKey(data.proveedorApiKey ?? '')
    setProveedorUrl(data.proveedorUrl ?? '')
    setActivo(data.activo ?? false)
    setInitialized(true)
  }

  const mutUpsert = useMutation({
    mutationFn: upsertConfigDian,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config-dian'] }),
  })

  const mutToggleRes = useMutation({
    mutationFn: (id: number) => toggleResolucionDian(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config-dian'] }),
  })

  const handleSubmitConfig = (e: any) => {
    e.preventDefault()
    mutUpsert.mutate({ ambiente, softwareId, softwarePin, proveedorTec, proveedorApiKey, proveedorUrl, activo })
  }

  const resoluciones: any[] = data?.resoluciones ?? []
  const ambienteActivo = ambiente ?? data?.ambiente ?? 'PRUEBAS'

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando configuración DIAN...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 rounded-lg">
          <Shield size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración DIAN</h1>
          <p className="text-slate-500 text-sm mt-0.5">Facturación electrónica — proveedor tecnológico y resoluciones</p>
        </div>
      </div>

      {/* ── Sección 1: Datos de software ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Settings size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-slate-800">Datos de software</h2>
        </div>
        <form onSubmit={handleSubmitConfig} className="p-6 space-y-5">
          {/* Banner producción */}
          {ambienteActivo === 'PRODUCCION' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Ambiente de PRODUCCION activo</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Las facturas emitidas en este modo son legalmente vinculantes ante la DIAN.
                  Asegúrese de que toda la configuración sea correcta antes de facturar.
                </p>
              </div>
            </div>
          )}

          {/* Ambiente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Ambiente *</label>
            <div className="flex gap-4">
              {['PRUEBAS', 'PRODUCCION'].map(amb => (
                <label key={amb}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                    ambienteActivo === amb
                      ? amb === 'PRODUCCION' ? 'border-red-400 bg-red-50' : 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <input type="radio" name="ambiente" value={amb}
                    checked={ambienteActivo === amb}
                    onChange={() => setAmbiente(amb)}
                    className="accent-indigo-600" />
                  <span className={`text-sm font-medium ${
                    ambienteActivo === amb
                      ? amb === 'PRODUCCION' ? 'text-red-700' : 'text-indigo-700'
                      : 'text-slate-600'
                  }`}>{amb}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Software ID</label>
              <input value={softwareId} onChange={e => setSoftwareId(e.target.value)}
                placeholder="UUID del software registrado en DIAN"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Software PIN</label>
              <input type="password" value={softwarePin} onChange={e => setSoftwarePin(e.target.value)}
                placeholder="PIN de seguridad"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Proveedor tecnológico</label>
            <select value={proveedorTec} onChange={e => setProveedorTec(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white max-w-xs">
              {PROVEEDOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {proveedorTec !== 'DIRECTO' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API Key del proveedor</label>
                <input type="password" value={proveedorApiKey} onChange={e => setProveedorApiKey(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">URL del proveedor</label>
                <input type="url" value={proveedorUrl} onChange={e => setProveedorUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Toggle checked={activo} onChange={() => setActivo(v => !v)} />
            <span className="text-sm text-slate-700 font-medium">
              Facturación electrónica {activo ? 'activa' : 'inactiva'}
            </span>
            {activo ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Activo
              </span>
            ) : null}
          </div>

          {mutUpsert.isError && (
            <p className="text-red-600 text-sm">
              {(mutUpsert.error as any)?.response?.data?.message ?? 'Error al guardar configuración'}
            </p>
          )}
          {mutUpsert.isSuccess && (
            <p className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle size={14} /> Configuración guardada correctamente
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={mutUpsert.isPending}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mutUpsert.isPending ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Sección 2: Resoluciones ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800">Resoluciones autorizadas</h2>
          </div>
          <button onClick={() => setShowResolucionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={13} /> Agregar resolución
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                {['Tipo doc.', 'Prefijo', 'Rango', 'Actual', 'Nº Resolución', 'F. Resolución', 'Vigencia', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {resoluciones.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-600 font-medium">{r.tipoDocumento}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{r.prefijo || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                    {r.rangoInicial} – {r.rangoFinal}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold text-xs font-mono">
                    {r.numeroCurrent ?? r.rangoInicial}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{r.numeroResolucion}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {r.fechaResolucion ? new Date(r.fechaResolucion).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {r.fechaVigencia ? new Date(r.fechaVigencia).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => mutToggleRes.mutate(r.id)}
                      disabled={mutToggleRes.isPending}
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                        r.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}>
                      {r.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                </tr>
              ))}
              {resoluciones.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No hay resoluciones configuradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showResolucionModal && (
        <ResolucionModal
          onClose={() => setShowResolucionModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['config-dian'] })
            setShowResolucionModal(false)
          }}
        />
      )}
    </div>
  )
}

function ResolucionModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({ ...RESOLUCION_DEFAULT })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const mutAdd = useMutation({
    mutationFn: addResolucionDian,
    onSuccess,
  })

  const handleSubmit = (e: any) => {
    e.preventDefault()
    mutAdd.mutate({
      tipoDocumento: form.tipoDocumento,
      prefijo: form.prefijo || undefined,
      rangoInicial: Number(form.rangoInicial),
      rangoFinal: Number(form.rangoFinal),
      fechaResolucion: form.fechaResolucion,
      fechaVigencia: form.fechaVigencia,
      numeroResolucion: form.numeroResolucion,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Agregar Resolución</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo documento *</label>
              <select required value={form.tipoDocumento} onChange={set('tipoDocumento')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {TIPO_DOC_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prefijo</label>
              <input value={form.prefijo} onChange={set('prefijo')} maxLength={4}
                placeholder="Ej: SETP"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rango inicial *</label>
              <input type="number" required min={1} value={form.rangoInicial} onChange={set('rangoInicial')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rango final *</label>
              <input type="number" required min={1} value={form.rangoFinal} onChange={set('rangoFinal')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Número de resolución DIAN *</label>
            <input required value={form.numeroResolucion} onChange={set('numeroResolucion')}
              placeholder="Ej: 18764000001234"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha resolución *</label>
              <input type="date" required value={form.fechaResolucion} onChange={set('fechaResolucion')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha vigencia *</label>
              <input type="date" required value={form.fechaVigencia} onChange={set('fechaVigencia')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          {mutAdd.isError && (
            <p className="text-red-600 text-sm">
              {(mutAdd.error as any)?.response?.data?.message ?? 'Error al agregar resolución'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={mutAdd.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mutAdd.isPending ? 'Agregando...' : 'Agregar resolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
