import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmpresaConfig, updateEmpresaConfig } from '../../services/configuracion.service'
import {
  Building2, FileText, MapPin, Phone, Palette, ShieldCheck,
  Save, CheckCircle2, AlertCircle, ChevronRight, Info, Calculator,
  Coins, Package, FileCheck2, Landmark, Shield, Lock, BellRing, Settings2
} from 'lucide-react'

// ─── Tipos y Opciones de Configuración ────────────────────────────────────────

const TABS = [
  { id: 'informacion',  label: 'Información',           icon: Info },
  { id: 'digital',      label: 'Digital',               icon: Palette },
  { id: 'contabilidad', label: 'Contabilidad',          icon: Calculator },
  { id: 'costos',       label: 'Costos',                icon: Coins },
  { id: 'productos',    label: 'Productos',             icon: Package },
  { id: 'ventas',       label: 'Facturas y Pedidos',    icon: FileText },
  { id: 'inventario',   label: 'Inventario y Compras',  icon: FileCheck2 },
  { id: 'cartera',      label: 'Cartera',               icon: Landmark },
  { id: 'emision',      label: 'Emisión Electrónica',   icon: ShieldCheck },
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 w-full">
      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
        {Icon && <Icon className="h-4 w-4 text-indigo-600" />}
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigEmpresa() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('informacion')
  const [form, setForm] = useState<any>({})
  const [saved, setSaved] = useState(false)

  const { data: empresa, isLoading } = useQuery(['config-empresa'], getEmpresaConfig)

  useEffect(() => {
    if (empresa) {
      // Cargar configuraciones del localStorage
      const savedContabilidad = JSON.parse(localStorage.getItem('edatia_config_contabilidad') || '{}')
      const savedCostos = JSON.parse(localStorage.getItem('edatia_config_costos') || '{}')
      const savedProductos = JSON.parse(localStorage.getItem('edatia_config_productos') || '{}')
      const savedVentas = JSON.parse(localStorage.getItem('edatia_config_ventas') || '{}')
      const savedCartera = JSON.parse(localStorage.getItem('edatia_config_cartera') || '{}')
      const savedDian = JSON.parse(localStorage.getItem('edatia_config_dian') || '{}')

      setForm({
        ...empresa,
        fechaMatriculaMercantil: empresa.fechaMatriculaMercantil
          ? empresa.fechaMatriculaMercantil.split('T')[0]
          : '',
        // Valores por defecto
        cuentaVentas: '413505',
        cuentaIva: '240805',
        cuentaRete: '135515',
        cuentaCaja: '110505',
        metodoCosteo: 'PROMEDIO',
        margenUtilidadBase: '30',
        bloquearBajoCosto: false,
        incluirFletes: false,
        skuAutogenerado: true,
        skuLength: '8',
        permitirDuplicadoBarras: false,
        unidadMedidaDefecto: 'UND',
        consecutivoPrefijo: 'SETT',
        consecutivoInicial: '1',
        permitirCotizacionesVencidas: false,
        terminosDefecto: 'Gracias por su compra.',
        plantillaImpresion: 'TIRILLA_80',
        limiteCreditoDefecto: '1000000',
        plazoPagoDefecto: '30',
        tasaInteresMora: '1.5',
        bloquearClientesMora: false,
        entornoDian: 'PRUEBAS',
        softwarePinDian: '12345',
        softwareIdDian: '',
        notificarEmisionEmail: true,
        // Sobrescribir con lo guardado
        ...savedContabilidad,
        ...savedCostos,
        ...savedProductos,
        ...savedVentas,
        ...savedCartera,
        ...savedDian,
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
    mutationFn: async () => {
      // 1. Guardar configuraciones adicionales en localStorage
      const contabilidadConfig = {
        cuentaVentas: form.cuentaVentas,
        cuentaIva: form.cuentaIva,
        cuentaRete: form.cuentaRete,
        cuentaCaja: form.cuentaCaja,
      }
      localStorage.setItem('edatia_config_contabilidad', JSON.stringify(contabilidadConfig))

      const costosConfig = {
        metodoCosteo: form.metodoCosteo,
        margenUtilidadBase: form.margenUtilidadBase,
        bloquearBajoCosto: form.bloquearBajoCosto,
        incluirFletes: form.incluirFletes,
      }
      localStorage.setItem('edatia_config_costos', JSON.stringify(costosConfig))

      const productosConfig = {
        skuAutogenerado: form.skuAutogenerado,
        skuLength: form.skuLength,
        permitirDuplicadoBarras: form.permitirDuplicadoBarras,
        unidadMedidaDefecto: form.unidadMedidaDefecto,
      }
      localStorage.setItem('edatia_config_productos', JSON.stringify(productosConfig))

      const ventasConfig = {
        consecutivoPrefijo: form.consecutivoPrefijo,
        consecutivoInicial: form.consecutivoInicial,
        permitirCotizacionesVencidas: form.permitirCotizacionesVencidas,
        terminosDefecto: form.terminosDefecto,
        plantillaImpresion: form.plantillaImpresion,
      }
      localStorage.setItem('edatia_config_ventas', JSON.stringify(ventasConfig))

      const carteraConfig = {
        limiteCreditoDefecto: form.limiteCreditoDefecto,
        plazoPagoDefecto: form.plazoPagoDefecto,
        tasaInteresMora: form.tasaInteresMora,
        bloquearClientesMora: form.bloquearClientesMora,
      }
      localStorage.setItem('edatia_config_cartera', JSON.stringify(carteraConfig))

      const dianConfig = {
        entornoDian: form.entornoDian,
        softwarePinDian: form.softwarePinDian,
        softwareIdDian: form.softwareIdDian,
        notificarEmisionEmail: form.notificarEmisionEmail,
      }
      localStorage.setItem('edatia_config_dian', JSON.stringify(dianConfig))

      // 2. Extraer y filtrar campos que no están en la Base de Datos para evitar errores de Prisma
      const databasePayload = { ...form }
      const frontendKeys = [
        'cuentaVentas', 'cuentaIva', 'cuentaRete', 'cuentaCaja',
        'metodoCosteo', 'margenUtilidadBase', 'bloquearBajoCosto', 'incluirFletes',
        'skuAutogenerado', 'skuLength', 'permitirDuplicadoBarras', 'unidadMedidaDefecto',
        'consecutivoPrefijo', 'consecutivoInicial', 'permitirCotizacionesVencidas', 'terminosDefecto', 'plantillaImpresion',
        'limiteCreditoDefecto', 'plazoPagoDefecto', 'tasaInteresMora', 'bloquearClientesMora',
        'entornoDian', 'softwarePinDian', 'softwareIdDian', 'notificarEmisionEmail'
      ]
      frontendKeys.forEach(k => { delete databasePayload[k] })

      // 3. Guardar cambios en el backend
      return updateEmpresaConfig(databasePayload)
    },
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Configuración</span>
            <ChevronRight size={12} />
            <span className="text-slate-500">General</span>
            <ChevronRight size={12} />
            <span className="text-slate-600 font-medium">Empresa</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <Building2 size={24} className="text-indigo-600" />
            Configuración de Empresa
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Parametrización y personalización de módulos operativos para {form.nombreComercial || form.nombre}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold animate-bounce">
              <CheckCircle2 size={16} /> Cambios guardados correctamente
            </div>
          )}
          {mutSave.isError && (
            <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
              <AlertCircle size={16} /> Error al guardar cambios
            </div>
          )}
          <button
            onClick={() => mutSave.mutate()}
            disabled={mutSave.isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <Save size={16} />
            {mutSave.isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* TABS HORIZONTALES SUPERIORES (DISEÑO PREMIUM SCROLLABLE) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
        <nav className="flex flex-wrap items-center gap-2">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN EL TAB ACTIVO */}
      <div className="min-h-[400px] w-full">

        {/* ─── TAB 1: INFORMACIÓN GENERAL (BLOQUES DE ANCHO COMPLETO APILADOS) ─── */}
        {tab === 'informacion' && (
          <div className="space-y-6 w-full">
            {/* Identificación Legal */}
            <SectionCard title="Identificación Legal" icon={Building2}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Field label="NIT (No Editable)" hint="Contacta a soporte técnico para modificar el NIT oficial.">
                    <Input value={form.nit} disabled placeholder="900123456" />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Dígito de verificación">
                    <Input value={form.digitoVerificacion} onChange={set('digitoVerificacion')} placeholder="7" />
                  </Field>
                </div>
                <div className="md:col-span-3">
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
                </div>
                <div className="md:col-span-4">
                  <Field label="Razón social / Nombre legal *">
                    <Input value={form.nombre} onChange={set('nombre')} placeholder="Mi Empresa S.A.S." />
                  </Field>
                </div>
                <div className="md:col-span-6">
                  <Field label="Nombre comercial" hint="Aparecerá en facturas, recibos y cotizaciones públicas.">
                    <Input value={form.nombreComercial} onChange={set('nombreComercial')} placeholder="Mi Empresa" />
                  </Field>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Representante Legal</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <Field label="Nombre completo">
                      <Input value={form.representanteLegal} onChange={set('representanteLegal')} placeholder="Juan Pérez" />
                    </Field>
                  </div>
                  <div className="md:col-span-4">
                    <Field label="Cédula / Documento">
                      <Input value={form.representanteLegalDoc} onChange={set('representanteLegalDoc')} placeholder="10203040" />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Cámara de Comercio */}
            <SectionCard title="Registro Mercantil" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Número de matrícula mercantil">
                    <Input value={form.matriculaMercantil} onChange={set('matriculaMercantil')} placeholder="00123456" />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Fecha de matrícula">
                    <Input type="date" value={form.fechaMatriculaMercantil} onChange={set('fechaMatriculaMercantil')} />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Ciudad de matrícula">
                    <Input value={form.ciudadMatricula} onChange={set('ciudadMatricula')} placeholder="Bogotá D.C." />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Ubicación */}
            <SectionCard title="Ubicación Principal" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <Field label="Dirección fiscal / principal *">
                    <Input value={form.direccion} onChange={set('direccion')} placeholder="Calle 80 # 45-23" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Municipio / Ciudad *">
                    <Input value={form.municipio} onChange={set('municipio')} placeholder="Bogotá" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Departamento *">
                    <Input value={form.departamento} onChange={set('departamento')} placeholder="Cundinamarca" />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Código DANE (5 dígitos)">
                    <Input value={form.codigoDane} onChange={set('codigoDane')} placeholder="11001" />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Código postal">
                    <Input value={form.codigoPostal} onChange={set('codigoPostal')} placeholder="110111" />
                  </Field>
                </div>
                <div className="md:col-span-4">
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
              </div>
            </SectionCard>

            {/* Contacto */}
            <SectionCard title="Información de Contacto" icon={Phone}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Field label="Teléfono principal">
                    <Input value={form.telefono} onChange={set('telefono')} placeholder="+57 601 3456789" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Sitio web corporativo">
                    <Input value={form.web} onChange={set('web')} placeholder="https://www.miempresa.com" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Correo electrónico general">
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="info@miempresa.com" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Correo de facturación" hint="Para envío de facturas a clientes.">
                    <Input type="email" value={form.correoFacturacion} onChange={set('correoFacturacion')} placeholder="facturas@miempresa.com" />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 2: DIGITAL (BRANDING E IDENTIDAD - ANCHO COMPLETO APILADOS) ─── */}
        {tab === 'digital' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Branding e Identidad Corporativa" icon={Palette}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Eslogan corporativo" hint="Aparecerá impreso al pie de recibos e informes.">
                    <Input value={form.slogan} onChange={set('slogan')} placeholder="Tu mejor aliado comercial" />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Color principal de marca" hint="Color corporativo en facturas e informes.">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.colorPrimario ?? '#4F46E5'}
                        onChange={e => set('colorPrimario')(e.target.value)}
                        className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 shrink-0 bg-white"
                      />
                      <Input value={form.colorPrimario ?? '#4F46E5'} onChange={set('colorPrimario')} placeholder="#4F46E5" />
                    </div>
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="URL del logo" hint="Pegar link de imagen pública en formato PNG o SVG.">
                    <Input value={form.logo} onChange={set('logo')} placeholder="https://cdn.empresa.com/logo.png" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Vista Previa de Marca" icon={Palette}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6">
                  {form.logo ? (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[140px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 self-start">Logo actual</p>
                      <img src={form.logo} alt="Logo" className="h-16 max-w-full object-contain animate-none" />
                    </div>
                  ) : (
                    <div className="border border-slate-200 border-dashed rounded-xl p-4 bg-slate-50 text-center text-xs text-slate-400 flex items-center justify-center min-h-[140px]">
                      No se ha configurado un logo comercial.
                    </div>
                  )}
                </div>

                <div className="md:col-span-6">
                  <div className="bg-slate-800 text-white rounded-xl p-4 border border-slate-700 space-y-3">
                    <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Vista previa de encabezado de factura
                    </h4>
                    <div className="bg-white text-slate-800 rounded-lg p-3">
                      <div className="flex items-start gap-2.5">
                        {form.logo ? (
                          <img src={form.logo} alt="logo preview" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">LOGO</div>
                        )}
                        <div className="min-w-0 leading-tight">
                          <div className="font-extrabold text-xs text-slate-900 truncate">{form.nombreComercial || form.nombre || 'Nombre Empresa'}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">NIT: {form.nit || '900000000'}-{form.digitoVerificacion || '0'}</div>
                          {form.slogan && <div className="text-[9px] italic text-slate-400 mt-1 leading-tight truncate">{form.slogan}</div>}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-[9px]">
                        <span className="font-semibold" style={{ color: form.colorPrimario ?? '#4F46E5' }}>FACTURA ELECTRÓNICA</span>
                        <span className="text-slate-400">N° SETT-1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 3: CONTABILIDAD (ANCHO COMPLETO APILADOS) ──────────────── */}
        {tab === 'contabilidad' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Configuración Tributaria y Régimen" icon={ShieldCheck}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <Field label="Régimen fiscal *">
                    <Select
                      value={form.regimenFiscal ?? '48'}
                      onChange={set('regimenFiscal')}
                      options={REGIMENES}
                    />
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field label="Actividad económica (código CIIU)" hint="Ejemplo: 4711 (Comercio al por menor).">
                    <Input value={form.actividadEconomica} onChange={set('actividadEconomica')} placeholder="4711" />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Responsabilidades tributarias DIAN
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  {RESPONSABILIDADES.map(r => (
                    <label key={r.code} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={(form.responsabilidades ?? []).includes(r.code)}
                        onChange={() => toggleResp(r.code)}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                      />
                      <span className="text-xs font-semibold text-slate-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Calidades Especiales</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Toggle checked={form.granContribuyente ?? false} onChange={setCheck('granContribuyente')} label="Gran contribuyente" />
                  <Toggle checked={form.autoretenedor ?? false} onChange={setCheck('autoretenedor')} label="Autorretenedor en renta" />
                  <Toggle checked={form.agenteRetencion ?? false} onChange={setCheck('agenteRetencion')} label="Agente de retención en la fuente" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cuentas Contables por Defecto" icon={Calculator}>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Especifica las cuentas del Plan Único de Cuentas (PUC) que se afectarán automáticamente en las operaciones de venta y recaudos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Field label="Cuenta de ventas por defecto" hint="Clase 4 (Ingresos).">
                    <Input value={form.cuentaVentas} onChange={set('cuentaVentas')} placeholder="413505" />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Cuenta de IVA generado" hint="Clase 2 (Pasivos tributarios).">
                    <Input value={form.cuentaIva} onChange={set('cuentaIva')} placeholder="240805" />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Cuenta de retención en la fuente" hint="Clase 1 (Activos - Anticipo impuestos).">
                    <Input value={form.cuentaRete} onChange={set('cuentaRete')} placeholder="135515" />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Cuenta de caja general" hint="Clase 1 (Efectivo y equivalentes).">
                    <Input value={form.cuentaCaja} onChange={set('cuentaCaja')} placeholder="110505" />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 4: COSTOS (ANCHO COMPLETO APILADOS) ────────────────────── */}
        {tab === 'costos' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Método de Valuación de Inventarios" icon={Coins}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <Field label="Método de costeo predeterminado">
                    <Select
                      value={form.metodoCosteo}
                      onChange={set('metodoCosteo')}
                      options={[
                        { value: 'PROMEDIO', label: 'Promedio Ponderado' },
                        { value: 'FIFO', label: 'PEPS (Primero en Entrar, Primero en Salir)' },
                        { value: 'LIFO', label: 'UEPS (Último en Entrar, Primero en Salir)' },
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field label="Margen de utilidad base (%)" hint="Margen sugerido por defecto para la fijación de precios sobre el costo de compra.">
                    <Input type="number" value={form.margenUtilidadBase} onChange={set('margenUtilidadBase')} placeholder="30" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Políticas y Controles de Costo" icon={Lock}>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Define las restricciones y validaciones asociadas al margen comercial y los costos logísticos de importación o compras locales.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <Toggle
                    checked={form.bloquearBajoCosto}
                    onChange={setCheck('bloquearBajoCosto')}
                    label="Bloquear ventas por debajo del costo"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Evita que los cajeros o asesores emitan facturas o cotizaciones donde el precio unitario sea inferior al costo promedio del producto.
                  </p>
                </div>

                <div className="space-y-2">
                  <Toggle
                    checked={form.incluirFletes}
                    onChange={setCheck('incluirFletes')}
                    label="Prorratear fletes de compra en el costo"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Si se activa, el valor logístico del flete ingresado en la orden de compra incrementa directamente el valor unitario de entrada de los artículos.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 5: PRODUCTOS (ANCHO COMPLETO APILADOS) ─────────────────── */}
        {tab === 'productos' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Codificación y Atributos" icon={Package}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 space-y-2">
                  <Toggle
                    checked={form.skuAutogenerado}
                    onChange={setCheck('skuAutogenerado')}
                    label="Generar códigos SKU automáticamente"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Si se activa, al crear un nuevo producto se creará una referencia consecutiva según su categoría y marca.
                  </p>
                </div>

                <div className="md:col-span-5 space-y-2">
                  <Toggle
                    checked={form.permitirDuplicadoBarras}
                    onChange={setCheck('permitirDuplicadoBarras')}
                    label="Permitir duplicidad en códigos de barra"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Permite guardar múltiples referencias de productos con el mismo código EAN/código de barras. No recomendado.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Field label="Longitud de SKU">
                    <Input type="number" value={form.skuLength} onChange={set('skuLength')} placeholder="8" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Unidades y Conversiones" icon={Settings2}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6">
                  <Field label="Unidad de medida por defecto">
                    <Select
                      value={form.unidadMedidaDefecto}
                      onChange={set('unidadMedidaDefecto')}
                      options={[
                        { value: 'UND', label: 'Unidades (UND)' },
                        { value: 'KG', label: 'Kilogramos (KG)' },
                        { value: 'MTS', label: 'Metros (MTS)' },
                        { value: 'LTS', label: 'Litros (LTS)' },
                        { value: 'PAQ', label: 'Paquetes (PAQ)' },
                      ]}
                    />
                  </Field>
                </div>
                <div className="md:col-span-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700 mb-1">Nota del sistema</p>
                    <p>Las unidades se aplican en todas las órdenes de inventario y entradas/salidas de POS. Asegúrate de configurar las equivalencias de conversiones si vendes al por mayor y al detal.</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 6: FACTURAS Y PEDIDOS (ANCHO COMPLETO APILADOS) ────────── */}
        {tab === 'ventas' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Consecutivos y Vigencias" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <Field label="Prefijo de facturación">
                    <Input value={form.consecutivoPrefijo} onChange={set('consecutivoPrefijo')} placeholder="SETT" />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Consecutivo inicial">
                    <Input type="number" value={form.consecutivoInicial} onChange={set('consecutivoInicial')} placeholder="1" />
                  </Field>
                </div>
                <div className="md:col-span-4 pb-2">
                  <Toggle
                    checked={form.permitirCotizacionesVencidas}
                    onChange={setCheck('permitirCotizacionesVencidas')}
                    label="Permitir facturar cotizaciones vencidas"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Impresión y Leyendas" icon={Palette}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                  <Field label="Plantilla de impresión por defecto">
                    <Select
                      value={form.plantillaImpresion}
                      onChange={set('plantillaImpresion')}
                      options={[
                        { value: 'CARTA', label: 'Papel tamaño Carta / A4 (Estándar PDF)' },
                        { value: 'TIRILLA_80', label: 'Tirilla POS Térmica de 80mm' },
                        { value: 'TIRILLA_58', label: 'Tirilla POS Térmica de 58mm' },
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-8">
                  <Field label="Términos y condiciones al pie" hint="Aparecerá en la parte inferior de las facturas generadas.">
                    <textarea
                      value={form.terminosDefecto ?? ''}
                      onChange={e => set('terminosDefecto')(e.target.value)}
                      placeholder="Escribe aquí las leyendas, plazos o cuentas para consignación..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all animate-none"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 7: INVENTARIO Y COMPRAS (ANCHO COMPLETO APILADOS) ──────── */}
        {tab === 'inventario' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Políticas de Inventario" icon={FileCheck2}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6 space-y-2">
                  <Toggle
                    checked={form.permiteStockNegativo ?? false}
                    onChange={setCheck('permiteStockNegativo')}
                    label="Permitir ventas con stock en negativo"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Si se activa, el sistema permitirá facturar y vender artículos en el POS y módulo de ventas aunque no existan cantidades disponibles.
                  </p>
                </div>

                <div className="md:col-span-6">
                  <Field label="Bodega principal / Domicilio por defecto">
                    <Select
                      value={form.bodegaDefecto ?? 'BODEGA_01'}
                      onChange={set('bodegaDefecto')}
                      options={[
                        { value: 'BODEGA_01', label: 'Bodega Principal Central' },
                        { value: 'BODEGA_NORTE', label: 'Bodega Sucursal Norte' },
                        { value: 'BODEGA_SUR', label: 'Bodega Sucursal Sur' },
                      ]}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Alertas de Reabastecimiento" icon={BellRing}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6 space-y-2">
                  <Toggle
                    checked={form.notificarStockMinimo ?? true}
                    onChange={setCheck('notificarStockMinimo')}
                    label="Notificar cuando el stock llegue al mínimo"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    El sistema disparará alertas visuales y enviará resúmenes semanales con los productos que estén bajo el mínimo de stock de seguridad.
                  </p>
                </div>

                <div className="md:col-span-6">
                  <Field label="Correo para alertas de abastecimiento" hint="Si se deja vacío, se enviará al correo general de la empresa.">
                    <Input type="email" value={form.correoAlertasStock ?? ''} onChange={set('correoAlertasStock')} placeholder="compras@miempresa.com" />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 8: CARTERA (ANCHO COMPLETO APILADOS) ───────────────────── */}
        {tab === 'cartera' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Límites de Crédito y Plazos" icon={Landmark}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <Field label="Cupo de crédito estándar para clientes" hint="Límite máximo por defecto asignado a nuevos clientes creados.">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={form.limiteCreditoDefecto}
                        onChange={e => set('limiteCreditoDefecto')(e.target.value)}
                        placeholder="1000000"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </Field>
                </div>

                <div className="md:col-span-6">
                  <Field label="Plazo de pago predeterminado">
                    <Select
                      value={form.plazoPagoDefecto}
                      onChange={set('plazoPagoDefecto')}
                      options={[
                        { value: '0', label: 'Pago Inmediato (Contado)' },
                        { value: '15', label: '15 Días Neto' },
                        { value: '30', label: '30 Días Neto' },
                        { value: '45', label: '45 Días Neto' },
                        { value: '60', label: '60 Días Neto' },
                      ]}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Controles de Mora y Bloqueos" icon={Lock}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6">
                  <Field label="Tasa de interés moratorio mensual (%)">
                    <Input type="number" step="0.01" value={form.tasaInteresMora} onChange={set('tasaInteresMora')} placeholder="1.5" />
                  </Field>
                </div>

                <div className="md:col-span-6 space-y-2">
                  <Toggle
                    checked={form.bloquearClientesMora}
                    onChange={setCheck('bloquearClientesMora')}
                    label="Bloquear facturas a clientes en mora"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Si se activa, el facturador lanzará una alerta roja y no permitirá finalizar ventas a crédito para clientes que tengan saldos vencidos pendientes.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── TAB 9: EMISIÓN ELECTRÓNICA (ANCHO COMPLETO APILADOS) ───────── */}
        {tab === 'emision' && (
          <div className="space-y-6 w-full">
            <SectionCard title="Configuración de Habilitación DIAN" icon={ShieldCheck}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Entorno de emisión actual" hint="Pruebas Sandbox o Producción Real API.">
                    <Select
                      value={form.entornoDian}
                      onChange={set('entornoDian')}
                      options={[
                        { value: 'PRUEBAS', label: 'Pruebas / Habilitación (DIAN SandBox)' },
                        { value: 'PRODUCCION', label: 'Producción Real (DIAN API)' },
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="PIN del software DIAN">
                    <Input type="password" value={form.softwarePinDian} onChange={set('softwarePinDian')} placeholder="*****" />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="ID del software (UUID DIAN)">
                    <Input value={form.softwareIdDian} onChange={set('softwareIdDian')} placeholder="12345678-abcd-1234-abcd-1234567890ab" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Certificación y Envío" icon={Shield}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Firma Digital Activa</h4>
                      <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                        Tu certificado de firma digital está configurado correctamente.
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Vencimiento: 31-Dic-2026</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-2">
                  <Toggle
                    checked={form.notificarEmisionEmail}
                    onChange={setCheck('notificarEmisionEmail')}
                    label="Notificar emisión de factura automáticamente"
                  />
                  <p className="text-xs text-slate-400 leading-tight">
                    Envía de manera inmediata la representación gráfica (PDF) y el XML oficial de la factura al correo de facturación del adquiriente tras ser autorizada.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  )
}
