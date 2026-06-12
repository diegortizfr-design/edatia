import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Building2, MapPin, CreditCard, Info, Phone, Mail, FileText, Plus, Trash2, Shield, Globe, ShoppingCart, RefreshCw, Upload, File, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tercero, Sucursal } from './ConfigTerceros'
import { getTercero, createTercero, updateTercero, getVendedores } from '../../services/erp.service'
import { getRegimenesFiscales, getCodigosCIIU, getResponsabilidadesFiscales, getGeolocationState } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'

const TIPO_DOCUMENTO_OPTIONS = ['NIT', 'CC', 'CE', 'PASAPORTE', 'PEP']
const TIPO_PERSONA_OPTIONS = ['NATURAL', 'JURIDICA']
const REGIMEN_OPTIONS = [
  { value: '48', label: 'Responsable de IVA (Regimen Común)' },
  { value: '49', label: 'No responsable de IVA (Regimen Simplificado)' }
]


const RESPONSABILIDADES_DIAN = [
  { value: 'O-13', label: 'Gran Contribuyente' },
  { value: 'O-15', label: 'Autorretenedor' },
  { value: 'O-23', label: 'Agente de Retención IVA' },
  { value: 'O-47', label: 'Régimen Simple de Tributación - RST' }
]

const DEFAULT_TERCERO: Tercero = {
  id: '',
  tipoPersona: 'JURIDICA',
  tipoDocumento: 'NIT',
  numeroDocumento: '',
  digitoVerificacion: '',
  codigo: '01',
  fechaCreacion: '',
  nombre: '',
  nombreComercial: '',
  activo: true,
  cliente: true,
  proveedor: false,
  empleado: false,
  prospecto: false,
  vendedor: '',
  email: '',
  emailNovedades: '',
  telefono: '',
  telefono2: '',
  telefono3: '',
  celular: '',
  pais: 'COLOMBIA',
  departamento: '11 - BOGOTA D.C.',
  ciudad: '11001 - BOGOTA',
  direccionFiscal: '',
  direccionDespachos: '',
  cumpleanosDia: 0,
  cumpleanosMes: 0,
  cartera: 'CL - CLIENTES',
  formaPago: '01 - EFECTIVO',
  nivelPrecio: 'Precio Estándar',
  cupoCredito: false,
  cupoCreditoValor: 0,
  paginaWeb: '',
  paginaWeb2: '',
  paginaWeb3: '',
  tokenPosgold: '',
  observacion: '',
  sucursales: [],
  regimenFiscal: '49',
  responsabilidades: [],
  actividadEconomica: '',
  crearUsuarioWeb: false,
  usuarioWebEmail: '',
  usuarioWebRol: 'Vendedor'
}

// ── DIAN Verification Digit Algorithm (Colombia) ───────────────────────────
function calcularDV(nit: string): string {
  const cleanNit = nit.replace(/\D/g, '')
  if (!cleanNit) return ''
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  let sum = 0
  const nitLength = cleanNit.length
  for (let i = 0; i < nitLength; i++) {
    const digit = parseInt(cleanNit.charAt(nitLength - 1 - i), 10)
    sum += digit * weights[i]
  }
  const remainder = sum % 11
  if (remainder > 1) {
    return String(11 - remainder)
  }
  return String(remainder)
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"

const mapDbTerceroToForm = (t: any): Tercero => ({
  id: String(t.id),
  tipoPersona: t.tipoPersona || 'JURIDICA',
  tipoDocumento: t.tipoDocumento || 'NIT',
  numeroDocumento: t.numeroDocumento || '',
  digitoVerificacion: t.digitoVerificacion || '',
  codigo: t.numeroDocumento || '',
  fechaCreacion: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
  nombre: t.nombre || '',
  nombreComercial: t.nombreComercial || t.nombre || '',
  activo: t.activo !== false,
  cliente: !!t.esCliente,
  proveedor: !!t.esProveedor,
  empleado: !!t.esColaborador || !!t.esVendedor,
  prospecto: false,
  vendedor: t.vendedorAsignadoId ? String(t.vendedorAsignadoId) : '',
  email: t.email || '',
  emailNovedades: '',
  telefono: t.telefono || '',
  telefono2: '',
  telefono3: '',
  celular: t.celular || '',
  pais: t.pais || 'COLOMBIA',
  departamento: t.departamento || '',
  ciudad: t.municipio || '',
  direccionFiscal: t.direccion || '',
  direccionDespachos: t.direccion || '',
  cumpleanosDia: 0,
  cumpleanosMes: 0,
  cartera: t.esCliente ? 'CL - CLIENTES' : 'PR - PROVEEDORES',
  formaPago: t.condicionesPago || '01 - EFECTIVO',
  nivelPrecio: 'Precio Estándar',
  clasificacion: 'Ninguna',
  cupoCredito: !!t.cupoCredito,
  cupoCreditoValor: t.cupoCredito ? Number(t.cupoCredito) : 0,
  paginaWeb: '',
  paginaWeb2: '',
  paginaWeb3: '',
  tokenPosgold: '',
  observacion: t.notas || '',
  sucursales: t.sucursales || [],
  regimenFiscal: t.regimenFiscal || '49',
  responsabilidades: t.responsabilidades || [],
  actividadEconomica: t.actividadEconomica || '',
  crearUsuarioWeb: false,
})

const compileTerceroPayload = (f: Tercero, currentSucs: Sucursal[]) => {
  return {
    tipoPersona: f.tipoPersona,
    tipoDocumento: f.tipoDocumento,
    numeroDocumento: f.numeroDocumento,
    digitoVerificacion: f.digitoVerificacion || null,
    nombre: f.nombre,
    nombreComercial: f.nombreComercial || null,
    email: f.email || null,
    telefono: f.telefono || null,
    celular: f.celular || null,
    pais: f.pais || 'CO',
    departamento: f.departamento || null,
    municipio: f.ciudad || null,
    direccion: f.direccionFiscal || null,
    
    esCliente: !!f.cliente,
    esProveedor: !!f.proveedor,
    esColaborador: !!f.empleado,
    esVendedor: !!f.empleado,

    plazoCredito: f.formaPago.includes('30') ? 30 : 0,
    cupoCredito: f.cupoCredito ? f.cupoCreditoValor : null,
    vendedorAsignadoId: f.vendedor ? parseInt(f.vendedor, 10) : null,
    
    contactoNombre: f.nombre || null,
    condicionesPago: f.formaPago || '01 - EFECTIVO',
    monedaProveedor: 'COP',

    activo: f.activo,
    notas: f.observacion || null,
    
    regimenFiscal: f.regimenFiscal || '49',
    responsabilidades: f.responsabilidades || [],
    actividadEconomica: f.actividadEconomica || null,
    
    sucursales: currentSucs.map(s => ({
      codigo: s.codigo,
      descripcion: s.descripcion,
      direccion: s.direccion,
      telefono: s.telefono,
      ciudad: s.ciudad,
      departamento: s.departamento,
      contacto: s.contacto,
      cargo: s.cargo
    }))
  }
}

export function ConfigTerceroForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const terceroId = id ? parseInt(id, 10) : null

  // Queries
  const { data: terceroData, isLoading: loadingTercero } = useQuery({
    queryKey: ['tercero-detail', terceroId],
    queryFn: () => getTercero(terceroId!),
    enabled: !!terceroId,
  })

  const { data: regimenes = [] } = useQuery({
    queryKey: ['regimenes-fiscales'],
    queryFn: getRegimenesFiscales,
  })

  const { data: ciius = [] } = useQuery({
    queryKey: ['codigos-ciiu'],
    queryFn: getCodigosCIIU,
  })

  const { data: responsabilidades = [] } = useQuery({
    queryKey: ['responsabilidades-fiscales'],
    queryFn: getResponsabilidadesFiscales,
  })

  const { data: vendedores = [] } = useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })

  const { data: geoData } = useQuery({
    queryKey: ['geolocation-state'],
    queryFn: getGeolocationState,
  })

  // Mutations
  const mutCreateTercero = useMutation({
    mutationFn: createTercero,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terceros-erp'] })
  })
  const mutUpdateTercero = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTercero(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terceros-erp'] })
  })

  // Tabs: principal, sucursales, adjuntos, tributaria, web, transacciones
  const [activeTab, setActiveTab] = useState<'datos' | 'sucursales' | 'adjuntos' | 'tributaria' | 'usuario' | 'transacciones'>('datos')
  
  const [form, setForm] = useState<Tercero>(DEFAULT_TERCERO)
  
  // Estado para la tabla de Sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [showSucModal, setShowSucModal] = useState(false)
  const [editingSucId, setEditingSucId] = useState<string | null>(null)
  const [sucForm, setSucForm] = useState<Omit<Sucursal, 'id'>>({
    codigo: '', descripcion: '', direccion: '', telefono: '', ciudad: '', departamento: '', contacto: '', cargo: ''
  })

  // Estado para Adjuntos simulados
  const [adjuntos, setAdjuntos] = useState<{ id: string; nombre: string; tamaño: string; fecha: string; progreso?: number }[]>([
    { id: 'adj_1', nombre: 'RUT_2026.pdf', tamaño: '145 KB', fecha: '14/05/2026' },
    { id: 'adj_2', nombre: 'Camara_Comercio.pdf', tamaño: '412 KB', fecha: '14/05/2026' }
  ])
  const [uploadingName, setUploadingName] = useState('')

  // Geolocalización computada
  const paisesList = geoData?.paises || []
  
  const selectedPaisObj = paisesList.find(
    p => p.nombre.toUpperCase() === (form.pais || 'COLOMBIA').toUpperCase() ||
         p.codigo.toUpperCase() === (form.pais || 'CO').toUpperCase()
  )

  const deptsList = selectedPaisObj
    ? (geoData?.departamentos || []).filter(d => d.paisId === selectedPaisObj.id)
    : []

  const selectedDeptObj = deptsList.find(
    d => d.nombre.toUpperCase() === (form.departamento || '').toUpperCase()
  )

  const citiesList = selectedDeptObj
    ? (geoData?.ciudades || []).filter(c => c.departamentoId === selectedDeptObj.id)
    : []

  // Para sucursales del tercero
  const selectedPaisForSucursal = selectedPaisObj || paisesList.find(p => p.codigo === 'CO')
  
  const deptsListForSucursal = selectedPaisForSucursal
    ? (geoData?.departamentos || []).filter(d => d.paisId === selectedPaisForSucursal.id)
    : []

  const selectedDeptObjForSucursal = deptsListForSucursal.find(
    d => d.nombre.toUpperCase() === (sucForm.departamento || '').toUpperCase()
  )

  const citiesListForSucursal = selectedDeptObjForSucursal
    ? (geoData?.ciudades || []).filter(c => c.departamentoId === selectedDeptObjForSucursal.id)
    : []

  // Cargar datos
  useEffect(() => {
    if (isEdit && terceroData) {
      setForm(mapDbTerceroToForm(terceroData))
      setSucursales(terceroData.sucursales || [])
    } else if (!isEdit) {
      const roleParam = searchParams.get('role')
      setForm({
        ...DEFAULT_TERCERO,
        codigo: '01',
        fechaCreacion: new Date().toLocaleDateString('es-CO'),
        cliente: roleParam === 'cliente' || roleParam === null,
        proveedor: roleParam === 'proveedor',
        empleado: roleParam === 'empleado',
      })
      setSucursales([])
    }
  }, [id, isEdit, searchParams, terceroData])

  // Guardar datos
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) return toast.error('El nombre completo/razón social es obligatorio.')
    if (!form.numeroDocumento) return toast.error('El número de documento es obligatorio.')

    try {
      const isClientChecked = !!form.cliente
      const isProvChecked = !!form.proveedor
      const isEmpChecked = !!form.empleado

      if (!isClientChecked && !isProvChecked && !isEmpChecked) {
        return toast.error('Debe seleccionar al menos un rol (Cliente, Proveedor o Empleado).')
      }

      const payload = compileTerceroPayload(form, sucursales)

      if (isEdit && terceroId) {
        await mutUpdateTercero.mutateAsync({ id: terceroId, data: payload })
        toast.success('Tercero actualizado exitosamente')
      } else {
        await mutCreateTercero.mutateAsync(payload)
        toast.success('Tercero creado exitosamente')
      }

      const roleParam = searchParams.get('role')
      if (roleParam === 'cliente') {
        navigate('/ventas/clientes')
      } else if (roleParam === 'proveedor') {
        navigate('/inventario/proveedores')
      } else {
        navigate('/configuracion/terceros')
      }
    } catch (err) {
      toast.error(getApiError(err, 'Error al guardar tercero'))
    }
  }

  // Manejar cambios simples
  const set = (k: keyof Tercero) => (e: any) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => {
      const next = { ...prev, [k]: val }
      
      // Auto-calcular DV si cambia el NIT
      if (k === 'numeroDocumento' && prev.tipoDocumento === 'NIT') {
        next.digitoVerificacion = calcularDV(e.target.value)
      }
      if (k === 'tipoDocumento') {
        next.digitoVerificacion = e.target.value === 'NIT' ? calcularDV(prev.numeroDocumento) : ''
      }
      if (k === 'pais') {
        next.departamento = ''
        next.ciudad = ''
      }
      if (k === 'departamento') {
        next.ciudad = ''
      }
      return next
    })
  }

  const setNested = (k: keyof Tercero, subKey: string) => (e: any) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => {
      const parent = (prev as any)[k] || {}
      return {
        ...prev,
        [k]: { ...parent, [subKey]: val }
      }
    })
  }

  // ── Gestión de Sucursales ────────────────────────────────────────────────
  const handleOpenSucModal = (suc?: Sucursal) => {
    if (suc) {
      setEditingSucId(suc.id)
      setSucForm({ ...suc })
    } else {
      setEditingSucId(null)
      setSucForm({
        codigo: '', descripcion: '', direccion: '', telefono: '', ciudad: '', departamento: '', contacto: '', cargo: ''
      })
    }
    setShowSucModal(true)
  }

  const handleSaveSucursal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sucForm.codigo || !sucForm.descripcion) return toast.error('Código y descripción son obligatorios.')

    if (editingSucId) {
      setSucursales(prev => prev.map(s => s.id === editingSucId ? { ...s, ...sucForm } : s))
      toast.success('Sucursal actualizada')
    } else {
      const newSuc: Sucursal = {
        id: `suc_${Date.now()}`,
        ...sucForm
      }
      setSucursales(prev => [...prev, newSuc])
      toast.success('Sucursal agregada')
    }
    setShowSucModal(false)
  }

  const handleDeleteSucursal = (sucId: string) => {
    if (window.confirm('¿Desea eliminar esta sucursal?')) {
      setSucursales(prev => prev.filter(s => s.id !== sucId))
    }
  }

  // ── Simulación de Carga de Adjuntos ──────────────────────────────────────
  const handleAddAdjunto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadingName) return
    const id = `adj_${Date.now()}`
    
    // Carga simulada con intervalo
    const newItem = { id, nombre: uploadingName, tamaño: '0 KB', fecha: new Date().toLocaleDateString('es-CO'), progreso: 10 }
    setAdjuntos(prev => [...prev, newItem])
    setUploadingName('')

    let progress = 10
    const interval = setInterval(() => {
      progress += 30
      if (progress >= 100) {
        clearInterval(interval)
        setAdjuntos(prev => prev.map(a => a.id === id ? { ...a, tamaño: '254 KB', progreso: undefined } : a))
        toast.success('Documento subido correctamente')
      } else {
        setAdjuntos(prev => prev.map(a => a.id === id ? { ...a, progreso } : a))
      }
    }, 200)
  }

  // Toggle de responsabilidades DIAN
  const toggleResponsabilidad = (code: string) => {
    const list = form.responsabilidades || []
    const updated = list.includes(code) ? list.filter(x => x !== code) : [...list, code]
    setForm(prev => ({ ...prev, responsabilidades: updated }))
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const role = searchParams.get('role')
              if (role === 'cliente') navigate('/ventas/clientes')
              else if (role === 'proveedor') navigate('/inventario/proveedores')
              else navigate('/configuracion/terceros')
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Configuración</span>
              <span className="text-slate-300">/</span>
              <span>Terceros</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-medium">{isEdit ? 'Ficha de Tercero' : 'Nuevo Tercero'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
              {isEdit ? form.nombre : 'Nuevo Tercero'}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">
              {isEdit ? `ID: ${form.id} — Creado el ${form.fechaCreacion || '31/07/2023'}` : 'Ingresa la información básica y fiscal del tercero'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-150 p-1 rounded-2xl w-full shadow-sm border border-slate-200/40">
        {[
          { id: 'datos', label: 'Datos Principales', icon: <User size={14} /> },
          { id: 'sucursales', label: 'Sucursales', icon: <MapPin size={14} /> },
          { id: 'adjuntos', label: 'Adjuntos', icon: <File size={14} /> },
          { id: 'tributaria', label: 'Tributaria', icon: <CreditCard size={14} /> },
          { id: 'usuario', label: 'Usuario Web', icon: <Shield size={14} /> },
          { id: 'transacciones', label: 'Historial', icon: <ShoppingCart size={14} /> }
        ].filter(t => isEdit || t.id === 'datos').map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-white text-indigo-600 shadow-md shadow-slate-250/20'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className="space-y-6 w-full">
        {/* TABS RENDERS */}
        {activeTab === 'datos' && (
          <div className="space-y-6">
            {/* Informacion Principal */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <User size={14} className="text-indigo-650" />
                Información Principal
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Field label="Tipo Persona" required>
                    <select value={form.tipoPersona} onChange={set('tipoPersona')} className={inputCls}>
                      {TIPO_PERSONA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Tipo Identificación" required>
                    <select value={form.tipoDocumento} onChange={set('tipoDocumento')} className={inputCls}>
                      {TIPO_DOCUMENTO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Identificación" required>
                    <input
                      type="text"
                      value={form.numeroDocumento}
                      onChange={set('numeroDocumento')}
                      className={`${inputCls} font-mono font-bold`}
                      placeholder="Ej. 4526049"
                    />
                  </Field>
                </div>
                {form.tipoDocumento === 'NIT' && (
                  <div className="md:col-span-2">
                    <Field label="DV">
                      <input
                        type="text"
                        value={form.digitoVerificacion || ''}
                        onChange={set('digitoVerificacion')}
                        className={`${inputCls} font-mono font-bold text-center bg-indigo-50 border-indigo-200 text-indigo-700`}
                        maxLength={1}
                        placeholder="DV"
                      />
                    </Field>
                  </div>
                )}
                
                <div className="md:col-span-9">
                  <Field label="Descripción / Nombre Completo" required>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={set('nombre')}
                      className={`${inputCls} font-bold`}
                      placeholder="Nombre Completo o Razón Social de la empresa"
                    />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Código Interno">
                    <input
                      type="text"
                      value={form.codigo || ''}
                      onChange={set('codigo')}
                      className={`${inputCls} font-mono`}
                      placeholder="Auto"
                    />
                  </Field>
                </div>
                
                <div className="md:col-span-12">
                  <Field label="Razón Social / Nombre Comercial">
                    <input
                      type="text"
                      value={form.nombreComercial || ''}
                      onChange={set('nombreComercial')}
                      className={inputCls}
                      placeholder="Nombre comercial o establecimiento"
                    />
                  </Field>
                </div>
              </div>

              {/* Roles Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Roles del Tercero</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'activo', label: 'Activo', desc: 'Habilitado en el sistema' },
                    { key: 'cliente', label: 'Cliente', desc: 'Aparece en ventas' },
                    { key: 'proveedor', label: 'Proveedor', desc: 'Aparece en compras' },
                    { key: 'empleado', label: 'Empleado', desc: 'Acceso a nómina' },
                    { key: 'prospecto', label: 'Prospecto', desc: 'Interesado en CRM' }
                  ].map(r => (
                    <label key={r.key} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all select-none">
                      <input
                        type="checkbox"
                        checked={!!(form as any)[r.key]}
                        onChange={set(r.key as any)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-700">{r.label}</p>
                        <p className="text-[9px] text-slate-400">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Ubicación y Contacto */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin size={14} className="text-indigo-650" />
                Ubicación y Contacto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Email Principal">
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.email || ''} onChange={set('email')} className={`${inputCls} pl-8`} placeholder="email@correo.com" />
                  </div>
                </Field>
                <Field label="Email Novedades">
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.emailNovedades || ''} onChange={set('emailNovedades')} className={`${inputCls} pl-8`} placeholder="novedades@correo.com" />
                  </div>
                </Field>
                <Field label="Vendedor Asignado">
                  <select value={form.vendedor || ''} onChange={set('vendedor')} className={inputCls}>
                    <option value="">-- Ninguno --</option>
                    {vendedores.map((v: any) => (
                      <option key={v.id} value={String(v.id)}>{v.nombre}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Teléfono 1">
                  <div className="relative">
                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.telefono || ''} onChange={set('telefono')} className={`${inputCls} pl-8`} placeholder="Fijo o Celular" />
                  </div>
                </Field>
                <Field label="Teléfono 2 (Alterno)">
                  <div className="relative">
                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.telefono2 || ''} onChange={set('telefono2')} className={`${inputCls} pl-8`} placeholder="Opcional" />
                  </div>
                </Field>
                <Field label="Celular">
                  <div className="relative">
                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.celular || ''} onChange={set('celular')} className={`${inputCls} pl-8`} placeholder="Celular" />
                  </div>
                </Field>

                <Field label="País">
                  <select value={form.pais || ''} onChange={set('pais')} className={inputCls}>
                    <option value="">-- Seleccionar País --</option>
                    {paisesList.map(p => (
                      <option key={p.id} value={p.nombre.toUpperCase()}>{p.nombre.toUpperCase()}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Departamento">
                  <select value={form.departamento || ''} onChange={set('departamento')} className={inputCls} disabled={!form.pais}>
                    <option value="">-- Seleccionar --</option>
                    {deptsList.map(d => (
                      <option key={d.id} value={d.nombre}>{d.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ciudad / Municipio">
                  <select value={form.ciudad || ''} onChange={set('ciudad')} className={inputCls} disabled={!form.departamento}>
                    <option value="">-- Seleccionar --</option>
                    {citiesList.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-3">
                  <Field label="Dirección Fiscal (RUT)">
                    <input type="text" value={form.direccionFiscal || ''} onChange={set('direccionFiscal')} className={inputCls} placeholder="Ej. Calle 14 # 5-60" />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Dirección Despachos (Entrega)">
                    <input type="text" value={form.direccionDespachos || ''} onChange={set('direccionDespachos')} className={inputCls} placeholder="Igual al fiscal o dirección alternativa" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Comercial y Crédito */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard size={14} className="text-indigo-650" />
                Fiscal, Comercial y Crédito
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cumpleaños</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={0} max={31} value={form.cumpleanosDia || ''} onChange={set('cumpleanosDia')} className={inputCls} placeholder="Día" />
                    <input type="number" min={0} max={12} value={form.cumpleanosMes || ''} onChange={set('cumpleanosMes')} className={inputCls} placeholder="Mes" />
                  </div>
                </div>
                <Field label="Cartera Asociada">
                  <select value={form.cartera || ''} onChange={set('cartera')} className={inputCls}>
                    <option value="">Ninguna</option>
                    <option value="CL - CLIENTES">CL - CLIENTES</option>
                    <option value="PR - PROVEEDORES">PR - PROVEEDORES</option>
                  </select>
                </Field>
                <Field label="Forma de Pago">
                  <select value={form.formaPago || ''} onChange={set('formaPago')} className={inputCls}>
                    <option value="01 - EFECTIVO">01 - EFECTIVO</option>
                    <option value="02 - CRÉDITO 30 DÍAS">02 - CRÉDITO 30 DÍAS</option>
                    <option value="03 - TRANSFERENCIA">03 - TRANSFERENCIA</option>
                  </select>
                </Field>
                <Field label="Nivel de Precio">
                  <select value={form.nivelPrecio || ''} onChange={set('nivelPrecio')} className={inputCls}>
                    <option value="Precio Estándar">Precio Estándar</option>
                    <option value="Precio Distribuidor">Precio Distribuidor</option>
                    <option value="Precio Mayorista">Precio Mayorista</option>
                  </select>
                </Field>
                
                {/* Cupo Credito */}
                <div className="sm:col-span-2 flex gap-4 items-end">
                  <div className="pb-1 select-none">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                      <input type="checkbox" checked={!!form.cupoCredito} onChange={set('cupoCredito')} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                      Cupo Crédito
                    </label>
                  </div>
                  {form.cupoCredito && (
                    <div className="flex-1">
                      <input
                        type="number"
                        value={form.cupoCreditoValor || ''}
                        onChange={set('cupoCreditoValor')}
                        className={`${inputCls} text-right font-mono font-bold text-indigo-650`}
                        placeholder="$ Valor cupo"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Páginas web, Token, Observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <Field label="Página Web 1">
                  <input type="text" value={form.paginaWeb || ''} onChange={set('paginaWeb')} className={inputCls} placeholder="www.ejemplo.com" />
                </Field>
                <Field label="Página Web 2">
                  <input type="text" value={form.paginaWeb2 || ''} onChange={set('paginaWeb2')} className={inputCls} placeholder="Redes sociales o alt" />
                </Field>
                <Field label="Token POSGOLD">
                  <input type="text" value={form.tokenPosgold || ''} onChange={set('tokenPosgold')} className={`${inputCls} font-mono`} placeholder="Token para vinculaciones externas" />
                </Field>
                <div className="md:col-span-3">
                  <Field label="Observación Especial / Notas">
                    <textarea value={form.observacion || ''} onChange={set('observacion')} rows={3} className={`${inputCls} resize-none`} placeholder="Observaciones especiales sobre este tercero..." />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sucursales' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-650" />
                  Direcciones de Sucursales / Despacho
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Asocia múltiples sucursales u oficinas físicas adicionales para entregas y facturación.</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSucModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
              >
                <Plus size={12} />
                Nueva Sucursal
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3 w-20">Acción</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Dirección</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Ciudad / Dpto</th>
                    <th className="p-3">Contacto / Cargo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sucursales.length > 0 ? (
                    sucursales.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleOpenSucModal(s)} className="p-1 text-slate-400 hover:text-indigo-600"><Pencil size={12}/></button>
                            <button type="button" onClick={() => handleDeleteSucursal(s.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{s.codigo}</td>
                        <td className="p-3 font-bold text-slate-800">{s.descripcion}</td>
                        <td className="p-3 text-slate-650">{s.direccion}</td>
                        <td className="p-3 font-mono text-slate-600">{s.telefono || '—'}</td>
                        <td className="p-3 text-slate-600">{s.ciudad} / {s.departamento}</td>
                        <td className="p-3">
                          <p className="font-medium text-slate-700">{s.contacto || '—'}</p>
                          {s.cargo && <p className="text-[9px] text-slate-400 uppercase font-bold">{s.cargo}</p>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">No hay sucursales asociadas a este tercero.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'adjuntos' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <File size={14} className="text-indigo-650" />
                Documentos Adjuntos (RUT, Representación Legal, etc.)
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Sube fichas técnicas, contratos de crédito o el certificado RUT oficial de la DIAN.</p>
            </div>

            {/* Simulación de subida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center border-dashed text-center min-h-[140px]">
                <Upload size={32} className="text-slate-350 mb-2" />
                <p className="text-xs font-bold text-slate-600">Subir nuevo documento</p>
                <p className="text-[9px] text-slate-400 mt-0.5">PDF, DOC, JPG (Max 5MB)</p>
                <div className="mt-4 w-full max-w-[200px]">
                  <input
                    type="text"
                    value={uploadingName}
                    onChange={e => setUploadingName(e.target.value)}
                    placeholder="Nombre del archivo.pdf"
                    className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono mb-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdjunto}
                    disabled={!uploadingName}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Simular Carga
                  </button>
                </div>
              </div>

              {/* Lista de adjuntos */}
              <div className="md:col-span-2 space-y-2">
                {adjuntos.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl">
                    <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-550 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{a.nombre}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{a.tamaño} — Subido el {a.fecha}</p>
                      {a.progreso !== undefined && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-200" style={{ width: `${a.progreso}%` }} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjuntos(prev => prev.filter(x => x.id !== a.id))}
                      className="p-2 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar adjunto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tributaria' && (() => {
          const listRegimenes = (regimenes && regimenes.length > 0)
            ? regimenes.map((r: any) => ({ value: r.codigo, label: r.nombre }))
            : REGIMEN_OPTIONS

          const defaultCiius = [
            { codigo: '4773', descripcion: 'Comercio al por menor de artículos de joyería' },
            { codigo: '3210', descripcion: 'Fabricación de artículos de joyería y afines' },
            { codigo: '9609', descripcion: 'Otras actividades de servicios personales' },
            { codigo: '7410', descripcion: 'Actividades especializadas de diseño' }
          ]
          const listCiius = (ciius && ciius.length > 0) ? ciius : defaultCiius

          const listResponsabilidades = (responsabilidades && responsabilidades.length > 0)
            ? responsabilidades.map((r: any) => ({ value: r.codigo, label: r.descripcion }))
            : RESPONSABILIDADES_DIAN

          return (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard size={14} className="text-indigo-650" />
                  Información Tributaria y Responsabilidades DIAN
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Define las responsabilidades fiscales que se utilizarán para la emisión de facturación electrónica.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Régimen Fiscal (DIAN)" required>
                  <select value={form.regimenFiscal || '49'} onChange={set('regimenFiscal')} className={inputCls}>
                    {listRegimenes.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>

                <Field label="Actividad Económica Principal (CIIU)">
                  <select value={form.actividadEconomica || ''} onChange={set('actividadEconomica')} className={inputCls}>
                    <option value="">-- Seleccionar CIIU --</option>
                    {listCiius.map((c: any) => (
                      <option key={c.codigo} value={c.codigo}>
                        [{c.codigo}] {c.descripcion}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Responsabilidades del RUT</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listResponsabilidades.map((r: any) => {
                      const isChecked = (form.responsabilidades || []).includes(r.value)
                      return (
                        <label key={r.value} className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all ${
                          isChecked ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-200/60'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleResponsabilidad(r.value)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <div className="leading-tight">
                            <p className="text-xs font-bold text-slate-700">{r.label}</p>
                            <p className="text-[9px] text-indigo-600 font-bold font-mono">{r.value}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {activeTab === 'usuario' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield size={14} className="text-indigo-650" />
                Acceso a Usuario Web (Portal de Clientes/Proveedores)
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Configura una cuenta de acceso para que este tercero pueda descargar facturas, ver estados de cartera y cotizaciones.</p>
            </div>

            <div className="pt-2 select-none">
              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all inline-block w-full sm:w-auto">
                <input
                  type="checkbox"
                  checked={!!form.crearUsuarioWeb}
                  onChange={set('crearUsuarioWeb')}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-700">Habilitar portal web para este tercero</p>
                </div>
              </label>
            </div>

            {form.crearUsuarioWeb && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 animate-fadeIn">
                <Field label="Correo Electrónico (Login)">
                  <input type="email" value={form.usuarioWebEmail || form.email || ''} onChange={set('usuarioWebEmail')} className={inputCls} placeholder="ejemplo@correo.com" />
                </Field>
                <Field label="Contraseña Temporal">
                  <input type="password" value="********" readOnly className={`${inputCls} font-mono bg-slate-100`} />
                </Field>
                <Field label="Rol en Portal">
                  <select value={form.usuarioWebRol || 'Cliente'} onChange={set('usuarioWebRol')} className={inputCls}>
                    <option value="Cliente">Cliente (Consulta de facturas)</option>
                    <option value="Proveedor">Proveedor (Ofertas y facturas)</option>
                    <option value="Vendedor">Vendedor Externo</option>
                  </select>
                </Field>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transacciones' && (
          <div className="space-y-6">
            {/* Facturas */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText size={14} className="text-emerald-600" />
                  Historial de Ventas (Facturas emitidas al cliente)
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Listado histórico de comprobantes y facturas generadas.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-3">Factura</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Monto Total</th>
                      <th className="p-3">Saldo Pendiente</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {isEdit && form.cliente ? (
                      <>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-indigo-650">FV-2488</td>
                          <td className="p-3">14/05/2026</td>
                          <td className="p-3 font-bold text-slate-700">$ 4.250.000</td>
                          <td className="p-3 font-bold text-slate-700">$ 0</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-150 uppercase">Pagada</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-indigo-650">FV-2503</td>
                          <td className="p-3">22/05/2026</td>
                          <td className="p-3 font-bold text-slate-700">$ 1.820.000</td>
                          <td className="p-3 font-bold text-rose-600">$ 1.820.000</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-150 uppercase">Vencida</span></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">No hay registros para este tercero.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compras */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShoppingCart size={14} className="text-indigo-600" />
                  Historial de Compras (Órdenes de compra del proveedor)
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Listado histórico de órdenes de compra (OC) y recepciones de inventario.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="p-3">Órden de Compra</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Monto Total</th>
                      <th className="p-3">Items Recibidos</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {isEdit && form.proveedor ? (
                      <>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-indigo-650">OC-891</td>
                          <td className="p-3">12/04/2026</td>
                          <td className="p-3 font-bold text-slate-700">$ 14.500.000</td>
                          <td className="p-3">12 / 12</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-150 uppercase">Recibido</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-indigo-650">OC-914</td>
                          <td className="p-3">20/05/2026</td>
                          <td className="p-3 font-bold text-slate-700">$ 8.450.000</td>
                          <td className="p-3">0 / 8</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150 uppercase">En camino</span></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">No hay registros para este tercero.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 pb-10">
          <button
            type="button"
            onClick={() => {
              const role = searchParams.get('role')
              if (role === 'cliente') navigate('/ventas/clientes')
              else if (role === 'proveedor') navigate('/inventario/proveedores')
              else navigate('/configuracion/terceros')
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Tercero
          </button>
        </div>
      </form>

      {/* ── MODAL: Agregar/Editar Sucursal ── */}
      {showSucModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-indigo-650" />
                {editingSucId ? 'Editar Sucursal' : 'Nueva Sucursal de Entrega'}
              </h3>
              <button type="button" onClick={() => setShowSucModal(false)}>
                <X size={18} className="text-slate-400 hover:text-slate-650" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSucursal} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código Sucursal" required>
                  <input
                    type="text"
                    value={sucForm.codigo}
                    onChange={e => setSucForm(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ej. BOGOTA-NORTE"
                    className={inputCls}
                  />
                </Field>
                <Field label="Descripción / Nombre" required>
                  <input
                    type="text"
                    value={sucForm.descripcion}
                    onChange={e => setSucForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej. Bodega Norte, Oficina Principal"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Departamento">
                  <select
                    value={sucForm.departamento || ''}
                    onChange={e => setSucForm(prev => ({ ...prev, departamento: e.target.value, ciudad: '' }))}
                    className={inputCls}
                  >
                    <option value="">-- Seleccionar --</option>
                    {deptsListForSucursal.map(d => (
                      <option key={d.id} value={d.nombre}>{d.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ciudad">
                  <select
                    value={sucForm.ciudad || ''}
                    onChange={e => setSucForm(prev => ({ ...prev, ciudad: e.target.value }))}
                    className={inputCls}
                    disabled={!sucForm.departamento}
                  >
                    <option value="">-- Seleccionar --</option>
                    {citiesListForSucursal.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Dirección de Despacho" required>
                <input
                  type="text"
                  value={sucForm.direccion}
                  onChange={e => setSucForm(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Calle 100 # 15-30"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Contacto Autorizado">
                  <input
                    type="text"
                    value={sucForm.contacto}
                    onChange={e => setSucForm(prev => ({ ...prev, contacto: e.target.value }))}
                    placeholder="Persona que recibe"
                    className={inputCls}
                  />
                </Field>
                <Field label="Cargo / Relación">
                  <input
                    type="text"
                    value={sucForm.cargo}
                    onChange={e => setSucForm(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Ej. Jefe de almacén"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Teléfono de Contacto">
                <input
                  type="text"
                  value={sucForm.telefono}
                  onChange={e => setSucForm(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Número de contacto"
                  className={inputCls}
                />
              </Field>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSucModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  {editingSucId ? 'Actualizar' : 'Agregar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
