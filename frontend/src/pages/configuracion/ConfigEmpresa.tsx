import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmpresaConfig, updateEmpresaConfig } from '../../services/configuracion.service'
import {
  Building2, FileText, MapPin, Phone, Palette, ShieldCheck,
  Save, CheckCircle2, AlertCircle, ChevronRight,
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'identificacion', label: 'Identificación',    icon: Building2 },
  { id: 'tributario',     label: 'Tributario',         icon: ShieldCheck },
  { id: 'camara',         label: 'Cámara de Comercio', icon: FileText },
  { id: 'ubicacion',      label: 'Ubicación',           icon: MapPin },
  { id: 'contacto',       label: 'Contacto',            icon: Phone },
  { id: 'marca',          label: 'Marca / Branding',    icon: Palette },
]

const REGIMENES = [
  { value: '48', label: '48 — Responsable de IVA' },
  { value: '49', label: '49 — No responsable de IVA (Régimen Simple)' },
]

const RESPONSABILIDADES = [
  { code: 'O-13', label: 'O-13 — Gran contribuyente' },
  { code: 'O-15', label: 'O-15 — Autorretenedor' },
  { code: 'O-23', label: 'O-23 — Agente de retención en la fuente' },
  { code: 'O-47', label: 'O-47 — Régimen simple de tributación' },
  { code: 'R-99-PN', label: 'R-99-PN — No aplica — Otros' },
]

// ─── Componentes helper ───────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
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
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ConfigEmpresa() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('identificacion')
  const [form, setForm] = useState<any>({})
  const [saved, setSaved] = useState(false)

  const { data: empresa, isLoading } = useQuery(['config-empresa'], getEmpresaConfig)

  useEffect(() => {
    if (empresa) {
      setForm({
        ...empresa,
        fechaMatriculaMercantil: empresa.fechaMatriculaMercantil
          ? empresa.fechaMatriculaMercantil.split('T')[0]
          : '',
      })
    }
  }, [empresa])

  const set = (key: string) => (val: any) => setForm((f: any) => ({ ...f, [key]: val }))
  const setCheck = (key: string) => (val: boolean) => setForm((f: any) => ({ ...f, [key]: val }))

  const toggleResp = (code: string) => {
    const current: string[] = form.responsabilidades ?? []
    const next = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code]
    setForm((f: any) => ({ ...f, responsabilidades: next }))
  }

  const mutSave = useMutation({
    mutationFn: () => updateEmpresaConfig(form),
    onSuccess: () => {
      qc.invalidateQueries(['config-empresa'])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-3" />
      Cargando configuración...
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Configuración</span>
            <ChevronRight size={12} />
            <span className="text-slate-600 font-medium">Mi Empresa</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600" />
            Configuración de Empresa
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {form.nombre} — NIT {form.nit}{form.digitoVerificacion ? `-${form.digitoVerificacion}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} /> Guardado correctamente
            </div>
          )}
          {mutSave.isError && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle size={16} /> Error al guardar
            </div>
          )}
          <button
            onClick={() => mutSave.mutate()}
            disabled={mutSave.isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Save size={16} />
            {mutSave.isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar de tabs */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                    tab === t.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenido */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          {/* ── Identificación ──────────────────────────────────────── */}
          {tab === 'identificacion' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Identificación Legal
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="NIT *" hint="No editable desde el ERP. Contacta a soporte para cambiarlo.">
                    <Input value={form.nit} onChange={() => {}} disabled placeholder="900123456" />
                  </Field>
                </div>
                <Field label="Dígito de verificación">
                  <Input value={form.digitoVerificacion} onChange={set('digitoVerificacion')} placeholder="7" />
                </Field>
              </div>

              <Field label="Razón social / Nombre legal *">
                <Input value={form.nombre} onChange={set('nombre')} placeholder="Mi Empresa S.A.S." />
              </Field>

              <Field label="Nombre comercial" hint="Cómo se conoce la empresa al público (aparece en facturas y tirillas)">
                <Input value={form.nombreComercial} onChange={set('nombreComercial')} placeholder="Mi Empresa" />
              </Field>

              <Field label="Tipo de persona">
                <Select
                  value={form.tipoPersona ?? 'JURIDICA'}
                  onChange={set('tipoPersona')}
                  options={[
                    { value: 'JURIDICA', label: 'Persona Jurídica' },
                    { value: 'NATURAL', label: 'Persona Natural' },
                  ]}
                />
              </Field>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Representante Legal</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre completo">
                    <Input value={form.representanteLegal} onChange={set('representanteLegal')} placeholder="Juan Pérez García" />
                  </Field>
                  <Field label="Cédula">
                    <Input value={form.representanteLegalDoc} onChange={set('representanteLegalDoc')} placeholder="1234567890" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── Tributario ──────────────────────────────────────────── */}
          {tab === 'tributario' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Información Tributaria
              </h2>

              <Field label="Régimen fiscal *">
                <Select
                  value={form.regimenFiscal ?? '48'}
                  onChange={set('regimenFiscal')}
                  options={REGIMENES}
                />
              </Field>

              <Field label="Actividad económica (código CIIU)" hint="Ejemplo: 4711 — Comercio al por menor en establecimientos no especializados">
                <Input value={form.actividadEconomica} onChange={set('actividadEconomica')} placeholder="4711" />
              </Field>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Responsabilidades tributarias DIAN
                </label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  {RESPONSABILIDADES.map(r => (
                    <label key={r.code} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.responsabilidades ?? []).includes(r.code)}
                        onChange={() => toggleResp(r.code)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="text-sm text-slate-700">{r.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Selecciona todas las que apliquen. Se usan en la factura electrónica.</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Calidades especiales</p>
                <Toggle checked={form.granContribuyente ?? false} onChange={setCheck('granContribuyente')} label="Gran contribuyente" />
                <Toggle checked={form.autoretenedor ?? false} onChange={setCheck('autoretenedor')} label="Autorretenedor en renta" />
                <Toggle checked={form.agenteRetencion ?? false} onChange={setCheck('agenteRetencion')} label="Agente de retención en la fuente" />
              </div>
            </div>
          )}

          {/* ── Cámara de Comercio ──────────────────────────────────── */}
          {tab === 'camara' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Cámara de Comercio
              </h2>

              <Field label="Número de matrícula mercantil">
                <Input value={form.matriculaMercantil} onChange={set('matriculaMercantil')} placeholder="00123456" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de matrícula" hint="Fecha de inscripción en Cámara de Comercio">
                  <Input type="date" value={form.fechaMatriculaMercantil} onChange={set('fechaMatriculaMercantil')} />
                </Field>
                <Field label="Ciudad de matrícula">
                  <Input value={form.ciudadMatricula} onChange={set('ciudadMatricula')} placeholder="Bogotá D.C." />
                </Field>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">¿Por qué necesito esto?</p>
                <p>La matrícula mercantil es requerida para algunos procesos de habilitación ante la DIAN y para la generación de documentos legales como contratos y propuestas comerciales.</p>
              </div>
            </div>
          )}

          {/* ── Ubicación ───────────────────────────────────────────── */}
          {tab === 'ubicacion' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Ubicación Principal
              </h2>

              <Field label="Dirección *" hint="Dirección fiscal / domicilio principal">
                <Input value={form.direccion} onChange={set('direccion')} placeholder="Calle 80 # 45-23" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Municipio / Ciudad *">
                  <Input value={form.municipio} onChange={set('municipio')} placeholder="Bogotá" />
                </Field>
                <Field label="Departamento *">
                  <Input value={form.departamento} onChange={set('departamento')} placeholder="Cundinamarca" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Código DANE" hint="5 dígitos. Ej: 11001 = Bogotá D.C.">
                  <Input value={form.codigoDane} onChange={set('codigoDane')} placeholder="11001" />
                </Field>
                <Field label="Código postal">
                  <Input value={form.codigoPostal} onChange={set('codigoPostal')} placeholder="110111" />
                </Field>
              </div>

              <Field label="País">
                <Select
                  value={form.pais ?? 'CO'}
                  onChange={set('pais')}
                  options={[
                    { value: 'CO', label: 'Colombia' },
                    { value: 'US', label: 'Estados Unidos' },
                    { value: 'MX', label: 'México' },
                    { value: 'PE', label: 'Perú' },
                    { value: 'EC', label: 'Ecuador' },
                  ]}
                />
              </Field>
            </div>
          )}

          {/* ── Contacto ────────────────────────────────────────────── */}
          {tab === 'contacto' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Información de Contacto
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono principal">
                  <Input value={form.telefono} onChange={set('telefono')} placeholder="+57 601 3456789" />
                </Field>
                <Field label="Sitio web">
                  <Input value={form.web} onChange={set('web')} placeholder="https://www.miempresa.com" />
                </Field>
              </div>

              <Field label="Correo electrónico general">
                <Input type="email" value={form.email} onChange={set('email')} placeholder="info@miempresa.com" />
              </Field>

              <Field
                label="Correo de facturación"
                hint="Se usa para el envío de facturas electrónicas. Si está vacío, se usa el correo general."
              >
                <Input type="email" value={form.correoFacturacion} onChange={set('correoFacturacion')} placeholder="facturacion@miempresa.com" />
              </Field>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Configuración operativa</p>
                <Toggle
                  checked={form.permiteStockNegativo ?? false}
                  onChange={setCheck('permiteStockNegativo')}
                  label="Permitir ventas con stock en negativo"
                />
                <p className="text-xs text-slate-400 mt-1 ml-13">
                  Si se activa, el sistema permite vender productos aunque no haya stock disponible.
                </p>
              </div>
            </div>
          )}

          {/* ── Marca / Branding ────────────────────────────────────── */}
          {tab === 'marca' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Marca y Branding
              </h2>

              <Field label="Eslogan / Frase comercial" hint="Aparece en facturas y recibos POS">
                <Input value={form.slogan} onChange={set('slogan')} placeholder="Tu mejor aliado en..." />
              </Field>

              <Field label="Color principal" hint="Color de la marca en documentos generados">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.colorPrimario ?? '#4F46E5'}
                    onChange={e => set('colorPrimario')(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-1"
                  />
                  <Input value={form.colorPrimario ?? '#4F46E5'} onChange={set('colorPrimario')} placeholder="#4F46E5" />
                </div>
              </Field>

              <Field label="URL del logo" hint="URL pública de la imagen del logo (PNG o SVG recomendado). Próximamente: carga directa.">
                <Input value={form.logo} onChange={set('logo')} placeholder="https://cdn.miempresa.com/logo.png" />
              </Field>

              {form.logo && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-xs text-slate-500 mb-2">Vista previa:</p>
                  <img src={form.logo} alt="Logo" className="h-16 object-contain" />
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                <p className="font-semibold mb-2" style={{ color: form.colorPrimario ?? '#4F46E5' }}>
                  Vista previa de encabezado de factura
                </p>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-3">
                    {form.logo
                      ? <img src={form.logo} alt="logo" className="h-10 object-contain" />
                      : <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-400 text-xs">Logo</div>
                    }
                    <div>
                      <div className="font-bold text-slate-800">{form.nombreComercial || form.nombre || 'Nombre Empresa'}</div>
                      <div className="text-xs text-slate-500">NIT: {form.nit || '900000000'}-{form.digitoVerificacion || '0'}</div>
                      {form.slogan && <div className="text-xs italic text-slate-400">{form.slogan}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
