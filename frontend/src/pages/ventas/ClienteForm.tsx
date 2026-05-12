import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCliente, createCliente, updateCliente } from '../../services/ventas.service'
import { ArrowLeft, Save, User, Building2, MapPin, CreditCard, Info, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPO_DOCUMENTO_OPTIONS = ['NIT', 'CC', 'CE', 'PASAPORTE', 'PEP']
const TIPO_PERSONA_OPTIONS = ['NATURAL', 'JURIDICA']
const REGIMEN_OPTIONS = [
  { value: '48', label: 'Responsable de IVA (48)' }, 
  { value: '49', label: 'No responsable de IVA (49)' }
]

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"

export function ClienteForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState(CAMPO_DEFAULT)

  const { data: cliente, isLoading: loadingData } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getCliente(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (cliente) {
      setForm({
        ...CAMPO_DEFAULT,
        ...cliente,
        plazoCredito: cliente.plazoCredito ? String(cliente.plazoCredito) : '',
      })
    }
  }, [cliente])

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateCliente(Number(id), data) : createCliente(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado correctamente')
      navigate('/ventas/clientes')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al guardar el cliente')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...form }
    if (form.tipoDocumento !== 'NIT') delete payload.digitoVerificacion
    if (form.plazoCredito !== '') payload.plazoCredito = Number(form.plazoCredito)
    mutation.mutate(payload)
  }

  const set = (k: keyof typeof form) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  if (loadingData) return <div className="p-10 text-center text-slate-400">Cargando datos del cliente...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ventas/clientes')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
          <p className="text-xs text-slate-400">Completa la información tributaria y de contacto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección Identificación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
              <User size={18} />
              IDENTIFICACIÓN
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo Persona *">
                <select required value={form.tipoPersona} onChange={set('tipoPersona')} className={inputCls}>
                  {TIPO_PERSONA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Tipo Documento *">
                <select required value={form.tipoDocumento} onChange={set('tipoDocumento')} className={inputCls}>
                  {TIPO_DOCUMENTO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Número Documento *">
                <input required value={form.numeroDocumento} onChange={set('numeroDocumento')} className={inputCls} placeholder="Ej: 900.123.456" />
              </Field>
              {form.tipoDocumento === 'NIT' && (
                <Field label="DV">
                  <input value={form.digitoVerificacion} onChange={set('digitoVerificacion')} maxLength={1} className={inputCls} placeholder="0" />
                </Field>
              )}
            </div>
            <Field label="Nombre / Razón Social *">
              <input required value={form.nombre} onChange={set('nombre')} className={inputCls} placeholder="Ej: Juan Perez o Edatia SAS" />
            </Field>
            <Field label="Nombre Comercial">
              <input value={form.nombreComercial} onChange={set('nombreComercial')} className={inputCls} placeholder="Nombre de fantasía" />
            </Field>
          </div>

          {/* Sección Tributaria y Crédito */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
              <CreditCard size={18} />
              FISCAL Y CRÉDITO
            </div>
            <Field label="Régimen Fiscal *">
              <select required value={form.regimenFiscal} onChange={set('regimenFiscal')} className={inputCls}>
                {REGIMEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Plazo de Crédito (Días)">
              <input type="number" min={0} value={form.plazoCredito} onChange={set('plazoCredito')} className={inputCls} placeholder="0 para contado" />
            </Field>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-2">Notas Internas</label>
              <textarea value={form.notas} onChange={set('notas')} rows={4} className={`${inputCls} resize-none`} placeholder="Observaciones especiales sobre este cliente..." />
            </div>
          </div>
        </div>

        {/* Sección Ubicación y Contacto */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
            <MapPin size={18} />
            UBICACIÓN Y CONTACTO
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={set('email')} className={`${inputCls} pl-9`} placeholder="correo@ejemplo.com" />
              </div>
            </Field>
            <Field label="Teléfono">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.telefono} onChange={set('telefono')} className={`${inputCls} pl-9`} placeholder="+57 300 000 0000" />
              </div>
            </Field>
            <Field label="Municipio">
              <input value={form.municipio} onChange={set('municipio')} className={inputCls} placeholder="Ej: Bogotá" />
            </Field>
            <Field label="Departamento">
              <input value={form.departamento} onChange={set('departamento')} className={inputCls} placeholder="Ej: Cundinamarca" />
            </Field>
            <Field label="Dirección">
              <input value={form.direccion} onChange={set('direccion')} className={`${inputCls} md:col-span-2`} placeholder="Calle 123 # 45-67" />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate('/ventas/clientes')} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : <><Save size={18} /> {isEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
