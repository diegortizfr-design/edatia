import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProveedor, createProveedor, updateProveedor } from '../../services/inventario.service'
import { ArrowLeft, Save } from 'lucide-react'

const TIPOS_DOC = ['NIT', 'CC', 'CE', 'PASAPORTE']
const CONDICIONES_PAGO = ['CONTADO', '30D', '60D', '90D']

export function ProveedorForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tipoDocumento: 'NIT', numeroDocumento: '',
    nombre: '', nombreComercial: '',
    email: '', telefono: '', contactoNombre: '',
    direccion: '', ciudad: '', pais: 'Colombia',
    plazoEntregaDias: '', condicionesPago: 'CONTADO',
    descuentoBase: '', notas: '', activo: true,
  })

  const { data: proveedor } = useQuery({
    queryKey: ['proveedor', id],
    queryFn: () => getProveedor(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (proveedor) {
      setForm({
        tipoDocumento: proveedor.tipoDocumento ?? 'NIT',
        numeroDocumento: proveedor.numeroDocumento ?? '',
        nombre: proveedor.nombre,
        nombreComercial: proveedor.nombreComercial ?? '',
        email: proveedor.email ?? '',
        telefono: proveedor.telefono ?? '',
        contactoNombre: proveedor.contactoNombre ?? '',
        direccion: proveedor.direccion ?? '',
        ciudad: proveedor.ciudad ?? '',
        pais: proveedor.pais ?? 'Colombia',
        plazoEntregaDias: proveedor.plazoEntregaDias ? String(proveedor.plazoEntregaDias) : '',
        condicionesPago: proveedor.condicionesPago ?? 'CONTADO',
        descuentoBase: proveedor.descuentoBase ? String(proveedor.descuentoBase) : '',
        notas: proveedor.notas ?? '',
        activo: proveedor.activo,
      })
    }
  }, [proveedor])

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateProveedor(Number(id), data) : createProveedor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      navigate('/inventario/proveedores')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'))
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate({
      tipoDocumento: form.tipoDocumento || undefined,
      numeroDocumento: form.numeroDocumento || undefined,
      nombre: form.nombre,
      nombreComercial: form.nombreComercial || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      contactoNombre: form.contactoNombre || undefined,
      direccion: form.direccion || undefined,
      ciudad: form.ciudad || undefined,
      pais: form.pais || 'Colombia',
      plazoEntregaDias: form.plazoEntregaDias ? +form.plazoEntregaDias : undefined,
      condicionesPago: form.condicionesPago || undefined,
      descuentoBase: form.descuentoBase ? +form.descuentoBase : undefined,
      notas: form.notas || undefined,
      ...(isEdit ? { activo: form.activo } : {}),
    })
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificación */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Identificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo documento</label>
              <select value={form.tipoDocumento} onChange={f('tipoDocumento')} className={inputCls}>
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número</label>
              <input value={form.numeroDocumento} onChange={f('numeroDocumento')} className={inputCls} placeholder="900.123.456-7" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Razón social / Nombre *</label>
              <input value={form.nombre} onChange={f('nombre')} required className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre comercial</label>
              <input value={form.nombreComercial} onChange={f('nombreComercial')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
              <input type="email" value={form.email} onChange={f('email')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
              <input value={form.telefono} onChange={f('telefono')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Persona de contacto</label>
              <input value={form.contactoNombre} onChange={f('contactoNombre')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ciudad</label>
              <input value={form.ciudad} onChange={f('ciudad')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dirección</label>
              <input value={form.direccion} onChange={f('direccion')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Condiciones comerciales */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Condiciones comerciales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Condiciones de pago</label>
              <select value={form.condicionesPago} onChange={f('condicionesPago')} className={inputCls}>
                {CONDICIONES_PAGO.map(c => <option key={c} value={c}>{c === 'CONTADO' ? 'Contado' : `Crédito ${c}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Lead time (días)</label>
              <input type="number" min="1" value={form.plazoEntregaDias} onChange={f('plazoEntregaDias')} className={inputCls} placeholder="7" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descuento base (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.descuentoBase} onChange={f('descuentoBase')} className={inputCls} placeholder="0" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas</label>
              <textarea value={form.notas} onChange={f('notas') as any} rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {isEdit && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">Proveedor activo</p>
                <p className="text-xs text-slate-400">Los proveedores inactivos no aparecen en nuevas órdenes de compra</p>
              </div>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={mutation.isLoading} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save size={16} />
            {mutation.isLoading ? 'Guardando...' : 'Guardar proveedor'}
          </button>
        </div>
      </form>
    </div>
  )
}
