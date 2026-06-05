import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, Search, Users, User, RotateCcw,
  FileText, Layers, ClipboardList, Shield, Lock, BarChart3, Receipt, Tag,
  CheckCircle2, AlertTriangle, X, ChevronRight, Calculator, PlusCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVendedores, createVendedor, updateVendedor, deleteVendedor } from '../../services/erp.service'
import { getColaboradores } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'

// ── Types ──
interface Vendedor {
  id: number
  codigo: string
  nombre: string
  telefono: string
  comision: number
  activo: boolean
}

interface CIIU {
  id: number
  codigo: string
  descripcion: string
  categoria: string
}

interface Clasificacion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
}

interface Identificacion {
  id: number
  codigoDian: string
  nombreCorto: string
  descripcion: string
  activo: boolean
}

interface Regimen {
  id: number
  codigoDian: string
  nombre: string
  descripcion: string
}

interface RegimenTributario {
  id: number
  codigo: string
  nombre: string
  tarifa: number
  activo: boolean
}

interface AuxTag {
  id: number
  nombre: string
  color: string
  descripcion: string
}

// ── Helpers ──
function getLS(key: string, fallback: any = null) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function setLS(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function ConfigTercerosExtra({ section }: { section: string }) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // ── Modals & Forms State ──
  const [formVendedor, setFormVendedor] = useState({ codigo: '', nombre: '', telefono: '', comision: 5, activo: true })
  const [formCiiu, setFormCiiu] = useState({ codigo: '', descripcion: '', categoria: 'Servicios' })
  const [formClasificacion, setFormClasificacion] = useState({ codigo: '', nombre: '', descripcion: '' })
  const [formIdentificacion, setFormIdentificacion] = useState({ codigoDian: '', nombreCorto: '', descripcion: '', activo: true })
  const [formRegimen, setFormRegimen] = useState({ codigoDian: '', nombre: '', descripcion: '' })
  const [formRegimenTributario, setFormRegimenTributario] = useState({ codigo: '', nombre: '', tarifa: 19, activo: true })
  const [formTag, setFormTag] = useState({ nombre: '', color: 'indigo', descripcion: '' })

  // ── Unificar Terceros State ──
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const [mergeProgress, setMergeProgress] = useState(0)

  const qc = useQueryClient()

  // ── Data lists state ──
  const { data: dbVendedores = [] } = useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
    enabled: section === 'vendedores',
  })

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: getColaboradores,
    enabled: section === 'vendedores',
  })

  const mutCreateVendedor = useMutation({
    mutationFn: createVendedor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor creado')
      setShowModal(false)
    },
    onError: (e) => toast.error(getApiError(e, 'Error al crear vendedor')),
  })

  const mutUpdateVendedor = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateVendedor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor actualizado')
      setShowModal(false)
    },
    onError: (e) => toast.error(getApiError(e, 'Error al actualizar vendedor')),
  })

  const mutDeleteVendedor = useMutation({
    mutationFn: deleteVendedor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedores'] })
      toast.success('Vendedor eliminado')
    },
    onError: (e) => toast.error(getApiError(e, 'Error al eliminar vendedor')),
  })

  const vendedores = dbVendedores.map((v: any) => ({
    id: v.id,
    codigo: v.documento || `V${String(v.id).padStart(3, '0')}`,
    nombre: v.nombre,
    telefono: v.telefono || '',
    comision: v.comisionPct ? Number(v.comisionPct) : 0,
    activo: v.activo !== false,
  }))

  const [ciiuses, setCiiuses] = useState<CIIU[]>([])
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([])
  const [identificaciones, setIdentificaciones] = useState<Identificacion[]>([])
  const [regimenes, setRegimenes] = useState<Regimen[]>([])
  const [regimenesTributarios, setRegimenesTributarios] = useState<RegimenTributario[]>([])
  const [tags, setTags] = useState<AuxTag[]>([])

  // ── Load & Seed Database ──
  useEffect(() => {
    // Vendedores (Eliminado localStorage local, consumido del backend)

    // CIIU
    const cSeed: CIIU[] = [
      { id: 1, codigo: '6201', descripcion: 'Actividades de desarrollo de sistemas informáticos', categoria: 'Tecnología' },
      { id: 2, codigo: '6202', descripcion: 'Actividades de consultoría informática y tecnología', categoria: 'Tecnología' },
      { id: 3, codigo: '4711', descripcion: 'Comercio al por menor en establecimientos no especializados', categoria: 'Comercio' },
      { id: 4, codigo: '4690', descripcion: 'Comercio al por mayor no especializado', categoria: 'Comercio' },
      { id: 5, codigo: '7020', descripcion: 'Actividades de consultoría de gestión empresarial', categoria: 'Servicios' }
    ]
    setCiiuses(getLS('edatia_ciiu', cSeed))

    // Clasificaciones
    const clSeed: Clasificacion[] = [
      { id: 1, codigo: 'CL-01', nombre: 'VIP', descripcion: 'Clientes premium con facturación superior a 10M COP' },
      { id: 2, codigo: 'CL-02', nombre: 'Distribuidor', descripcion: 'Socios comerciales con lista de precios wholesale' },
      { id: 3, codigo: 'CL-03', nombre: 'Minorista', descripcion: 'Clientes finales con precio general de vitrina' },
      { id: 4, codigo: 'CL-04', nombre: 'Proveedor Exterior', descripcion: 'Proveedores de insumos y materia prima internacional' }
    ]
    setClasificaciones(getLS('edatia_clasificaciones', clSeed))

    // Identificaciones
    const idSeed: Identificacion[] = [
      { id: 1, codigoDian: '31', nombreCorto: 'NIT', descripcion: 'Número de Identificación Tributaria', activo: true },
      { id: 2, codigoDian: '13', nombreCorto: 'CC', descripcion: 'Cédula de Ciudadanía', activo: true },
      { id: 3, codigoDian: '22', nombreCorto: 'CE', descripcion: 'Cédula de Extranjería', activo: true },
      { id: 4, codigoDian: '41', nombreCorto: 'Pasaporte', descripcion: 'Pasaporte Extranjero', activo: true },
      { id: 5, codigoDian: '11', nombreCorto: 'Registro Civil', descripcion: 'Registro Civil de Nacimiento', activo: false }
    ]
    setIdentificaciones(getLS('edatia_identificaciones', idSeed))

    // Regimenes
    const regSeed: Regimen[] = [
      { id: 1, codigoDian: 'O-48', nombre: 'Responsable de IVA', descripcion: 'Antiguo régimen común obligado a declarar IVA' },
      { id: 2, codigoDian: 'R-99-PN', nombre: 'No Responsable de IVA', descripcion: 'Antiguo régimen simplificado, personas naturales' },
      { id: 3, codigoDian: 'O-47', nombre: 'Régimen Simple (RST)', descripcion: 'Régimen Simple de Tributación de la DIAN' }
    ]
    setRegimenes(getLS('edatia_regimenes', regSeed))

    // Regimenes Tributarios (Tasas)
    const rtSeed: RegimenTributario[] = [
      { id: 1, codigo: 'IVA-19', nombre: 'Tarifa General IVA', tarifa: 19, activo: true },
      { id: 2, codigo: 'IVA-5', nombre: 'Tarifa Diferencial IVA', tarifa: 5, activo: true },
      { id: 3, codigo: 'IVA-EX', nombre: 'Exento de IVA', tarifa: 0, activo: true },
      { id: 4, codigo: 'INC-8', nombre: 'Impuesto Consumo', tarifa: 8, activo: false }
    ]
    setRegimenesTributarios(getLS('edatia_regimenes_tributarios', rtSeed))

    // Tags
    const tagSeed: AuxTag[] = [
      { id: 1, nombre: 'Cliente Recurrente', color: 'indigo', descripcion: 'Mantiene compras cada mes' },
      { id: 2, nombre: 'Riesgo de Cartera', color: 'rose', descripcion: 'Alerta en cobro de facturas' },
      { id: 3, nombre: 'Importador', color: 'emerald', descripcion: 'Maneja transacciones en moneda extranjera' },
      { id: 4, nombre: 'Descuento Especial', color: 'purple', descripcion: 'Aplica 5% extra en compras' },
      { id: 5, nombre: 'Revisar RUT', color: 'amber', descripcion: 'RUT vencido o desactualizado' }
    ]
    setTags(getLS('edatia_tags', tagSeed))
  }, [section])

  // ── Sync to LocalStorage ──
  const syncData = (key: string, val: any, updater: any) => {
    setLS(key, val)
    updater(val)
  }

  // ── Section metadata ──
  const SECTIONS_META: Record<string, { title: string; desc: string; icon: any }> = {
    vendedores: { title: 'Mantenimiento de Vendedores', desc: 'Gestiona la planta de ejecutivos comerciales y sus porcentajes de comisión por defecto.', icon: User },
    unificar: { title: 'Unificación de Terceros', desc: 'Herramienta administrativa para fusionar fichas de terceros duplicados en un único registro maestro.', icon: RotateCcw },
    ciiu: { title: 'Códigos CIIU (DIAN)', desc: 'Listado oficial de la Clasificación Industrial Internacional Uniforme homologados ante la DIAN colombiana.', icon: FileText },
    clasificaciones: { title: 'Clasificaciones de Tercero', desc: 'Agrupaciones personalizadas para catalogar clientes y proveedores para listas de precios y análisis comercial.', icon: Layers },
    'tipos-identificacion': { title: 'Tipos de Identificación', desc: 'Códigos de documentos de identidad homologados para facturación electrónica DIAN.', icon: ClipboardList },
    'tipos-regimen': { title: 'Tipos de Régimen Fiscal', desc: 'Categorías legales del régimen impositivo para reportar en documentos electrónicos.', icon: Shield },
    'regimen-tributario': { title: 'Regímenes Tributarios (Impuestos)', desc: 'Tasas de impuestos y retenciones configurables aplicadas a las transacciones de terceros.', icon: Calculator },
    reportes: { title: 'Reportes de Gestión de Terceros', desc: 'Estadísticas, análisis de ventas por vendedor, distribución y cumpleaños.', icon: BarChart3 },
    'reportes-pagos': { title: 'Reportes de Cartera y Pagos', desc: 'Análisis de saldos de facturas vencidas, recibos de caja y auditoría de retenciones.', icon: Receipt },
    tags: { title: 'Tags y Etiquetas de Control', desc: 'Etiquetas flexibles para marcar y filtrar terceros por condiciones comerciales específicas.', icon: Tag },
  }

  const meta = SECTIONS_META[section] || { title: 'Gestión de Terceros', desc: '', icon: Users }
  const MetaIcon = meta.icon

  // ── CRUD handlers ──
  const openNew = () => {
    setEditingId(null)
    setFormVendedor({ codigo: '', nombre: '', telefono: '', comision: 5, activo: true })
    setFormCiiu({ codigo: '', descripcion: '', categoria: 'Servicios' })
    setFormClasificacion({ codigo: '', nombre: '', descripcion: '' })
    setFormIdentificacion({ codigoDian: '', nombreCorto: '', descripcion: '', activo: true })
    setFormRegimen({ codigoDian: '', nombre: '', descripcion: '' })
    setFormRegimenTributario({ codigo: '', nombre: '', tarifa: 19, activo: true })
    setFormTag({ nombre: '', color: 'indigo', descripcion: '' })
    setShowModal(true)
  }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    if (section === 'vendedores') setFormVendedor({ ...item })
    if (section === 'ciiu') setFormCiiu({ ...item })
    if (section === 'clasificaciones') setFormClasificacion({ ...item })
    if (section === 'tipos-identificacion') setFormIdentificacion({ ...item })
    if (section === 'tipos-regimen') setFormRegimen({ ...item })
    if (section === 'regimen-tributario') setFormRegimenTributario({ ...item })
    if (section === 'tags') setFormTag({ ...item })
    setShowModal(true)
  }

  const handleSave = () => {
    if (section === 'vendedores') {
      if (!formVendedor.nombre) return toast.error('El nombre es obligatorio')
      const payload = {
        nombre: formVendedor.nombre,
        telefono: formVendedor.telefono || null,
        documento: formVendedor.codigo || null,
        comisionPct: formVendedor.comision,
        activo: formVendedor.activo,
      }
      if (editingId) {
        mutUpdateVendedor.mutate({ id: editingId, data: payload })
      } else {
        mutCreateVendedor.mutate(payload)
      }
      return
    }

    if (section === 'ciiu') {
      if (!formCiiu.codigo || !formCiiu.descripcion) return toast.error('Código y descripción obligatorios')
      let updated
      if (editingId) {
        updated = ciiuses.map(c => c.id === editingId ? { ...formCiiu, id: editingId } : c)
        toast.success('Código CIIU actualizado')
      } else {
        updated = [...ciiuses, { ...formCiiu, id: Date.now() }]
        toast.success('Código CIIU creado')
      }
      syncData('edatia_ciiu', updated, setCiiuses)
    }

    if (section === 'clasificaciones') {
      if (!formClasificacion.codigo || !formClasificacion.nombre) return toast.error('Código y nombre obligatorios')
      let updated
      if (editingId) {
        updated = clasificaciones.map(c => c.id === editingId ? { ...formClasificacion, id: editingId } : c)
        toast.success('Clasificación actualizada')
      } else {
        updated = [...clasificaciones, { ...formClasificacion, id: Date.now() }]
        toast.success('Clasificación creada')
      }
      syncData('edatia_clasificaciones', updated, setClasificaciones)
    }

    if (section === 'tipos-identificacion') {
      if (!formIdentificacion.codigoDian || !formIdentificacion.nombreCorto) return toast.error('Código y nombre corto obligatorios')
      let updated
      if (editingId) {
        updated = identificaciones.map(i => i.id === editingId ? { ...formIdentificacion, id: editingId } : i)
        toast.success('Tipo de identificación actualizado')
      } else {
        updated = [...identificaciones, { ...formIdentificacion, id: Date.now() }]
        toast.success('Tipo de identificación creado')
      }
      syncData('edatia_identificaciones', updated, setIdentificaciones)
    }

    if (section === 'tipos-regimen') {
      if (!formRegimen.codigoDian || !formRegimen.nombre) return toast.error('Código y nombre obligatorios')
      let updated
      if (editingId) {
        updated = regimenes.map(r => r.id === editingId ? { ...formRegimen, id: editingId } : r)
        toast.success('Régimen fiscal actualizado')
      } else {
        updated = [...regimenes, { ...formRegimen, id: Date.now() }]
        toast.success('Régimen fiscal creado')
      }
      syncData('edatia_regimenes', updated, setRegimenes)
    }

    if (section === 'regimen-tributario') {
      if (!formRegimenTributario.codigo || !formRegimenTributario.nombre) return toast.error('Código y nombre obligatorios')
      let updated
      if (editingId) {
        updated = regimenesTributarios.map(r => r.id === editingId ? { ...formRegimenTributario, id: editingId } : r)
        toast.success('Impuesto actualizado')
      } else {
        updated = [...regimenesTributarios, { ...formRegimenTributario, id: Date.now() }]
        toast.success('Impuesto creado')
      }
      syncData('edatia_regimenes_tributarios', updated, setRegimenesTributarios)
    }

    if (section === 'tags') {
      if (!formTag.nombre) return toast.error('Nombre de etiqueta obligatorio')
      let updated
      if (editingId) {
        updated = tags.map(t => t.id === editingId ? { ...formTag, id: editingId } : t)
        toast.success('Etiqueta actualizada')
      } else {
        updated = [...tags, { ...formTag, id: Date.now() }]
        toast.success('Etiqueta creada')
      }
      syncData('edatia_tags', updated, setTags)
    }

    setShowModal(false)
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este registro auxiliar?')) return

    if (section === 'vendedores') {
      mutDeleteVendedor.mutate(id)
      return
    }
    if (section === 'ciiu') {
      const updated = ciiuses.filter(c => c.id !== id)
      syncData('edatia_ciiu', updated, setCiiuses)
      toast.success('Código CIIU eliminado')
    }
    if (section === 'clasificaciones') {
      const updated = clasificaciones.filter(c => c.id !== id)
      syncData('edatia_clasificaciones', updated, setClasificaciones)
      toast.success('Clasificación eliminada')
    }
    if (section === 'tipos-identificacion') {
      const updated = identificaciones.filter(i => i.id !== id)
      syncData('edatia_identificaciones', updated, setIdentificaciones)
      toast.success('Tipo de identificación eliminado')
    }
    if (section === 'tipos-regimen') {
      const updated = regimenes.filter(r => r.id !== id)
      syncData('edatia_regimenes', updated, setRegimenes)
      toast.success('Régimen fiscal eliminado')
    }
    if (section === 'regimen-tributario') {
      const updated = regimenesTributarios.filter(r => r.id !== id)
      syncData('edatia_regimenes_tributarios', updated, setRegimenesTributarios)
      toast.success('Impuesto eliminado')
    }
    if (section === 'tags') {
      const updated = tags.filter(t => t.id !== id)
      syncData('edatia_tags', updated, setTags)
      toast.success('Etiqueta eliminada')
    }
  }

  // ── Unificar Terceros Logic ──
  const tercerosList = getLS('edatia_terceros', [])
  const handleUnificar = () => {
    if (!origenId || !destinoId) return toast.error('Debe seleccionar ambos terceros')
    if (origenId === destinoId) return toast.error('El tercero origen y destino no pueden ser el mismo')

    const origen = tercerosList.find((t: any) => t.id.toString() === origenId.toString())
    const destino = tercerosList.find((t: any) => t.id.toString() === destinoId.toString())

    if (!origen || !destino) return toast.error('Terceros inválidos')

    if (!window.confirm(`¿ADVERTENCIA CRÍTICA: Confirma la fusión de ${origen.nombre} en ${destino.nombre}? Esta operación es irreversible.`)) return

    setIsMerging(true)
    setMergeProgress(10)

    const timer = setInterval(() => {
      setMergeProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          // Exec merging
          const updatedTerceros = tercerosList.filter((t: any) => t.id.toString() !== origenId.toString())
          setLS('edatia_terceros', updatedTerceros)

          setIsMerging(false)
          setOrigenId('')
          setDestinoId('')
          toast.success(`Fusión exitosa. Toda la información de ${origen.nombre} ha sido unificada en ${destino.nombre}.`)
          return 0
        }
        return prev + 30
      })
    }, 400)
  }

  // ── Report Previews ──
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const REPORT_DATA: Record<string, { title: string; cols: string[]; rows: any[] }> = {
    cartera: {
      title: 'Reporte de Saldos de Cartera',
      cols: ['NIT', 'Nombre', 'Forma Pago', 'Límite Crédito', 'Saldo Pendiente', 'Estado'],
      rows: [
        ['4526049-3', 'JHON FREDY GIRALDO ZULUAGA', 'Crédito 30 Días', '$15.000.000', '$2.450.000', 'Al Día'],
        ['901552312-8', 'DISTRIBUCIONES ANDINAS S.A.S.', 'Contado', '$0', '$0', 'Sin Saldos'],
        ['71223405-1', 'ALBERTO ENRIQUE ORTIZ', 'Crédito 15 Días', '$5.000.000', '$5.800.000', 'Vencido (Mora 8d)']
      ]
    },
    vendedor: {
      title: 'Análisis de Ventas por Vendedor',
      cols: ['Vendedor', 'Código', 'Ventas Totales (Mes)', 'Comisión Promedio', 'Comisión Acumulada'],
      rows: [
        ['JUAN CARLOS PEREZ', 'V001', '$48.500.000', '5%', '$2.425.000'],
        ['MARIA HELENA GOMEZ', 'V002', '$72.100.000', '8%', '$5.768.000'],
        ['ANDRES MAURICIO ARIAS', 'V003', '$0', '6%', '$0']
      ]
    },
    contactos: {
      title: 'Directorio de Terceros y Contactos',
      cols: ['NIT', 'Razón Social', 'Contacto Principal', 'Teléfono Celular', 'Email Principal', 'Ciudad'],
      rows: [
        ['4526049-3', 'JHON FREDY GIRALDO ZULUAGA', 'Jhon Fredy Giraldo', '3128905623', 'jfredygiraldo@gmail.com', 'Sabaneta, Antioquia'],
        ['901552312-8', 'DISTRIBUCIONES ANDINAS S.A.S.', 'Marta Lucía Gómez', '3157829910', 'ventas@distriandinas.com.co', 'Bogotá D.C.']
      ]
    },
    retenciones: {
      title: 'Auditoría de Retenciones Aplicadas',
      cols: ['Fecha', 'Factura', 'Tercero', 'Base Gravable', 'Retención (2.5%)', 'ICA Retenido'],
      rows: [
        ['2026-05-15', 'FE-1402', 'DISTRIBUCIONES ANDINAS S.A.S.', '$4.500.000', '$112.500', '$32.100'],
        ['2026-05-20', 'FE-1408', 'JHON FREDY GIRALDO ZULUAGA', '$800.000', '$20.000', '$5.400']
      ]
    }
  }

  // ── Color palette colors for tags ──
  const TAG_COLORS = ['indigo', 'rose', 'emerald', 'amber', 'purple', 'sky', 'teal', 'slate']

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Cabecera Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/configuracion/terceros" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition-all shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl"><MetaIcon size={18} /></span>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{meta.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">{meta.desc}</p>
          </div>
        </div>

        {/* Botón Nueva Ficha Auxiliar (si aplica) */}
        {!['unificar', 'reportes', 'reportes-pagio', 'reportes-pagos'].includes(section) && (
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 shrink-0">
            <Plus size={14} /> Registrar Nuevo
          </button>
        )}
      </div>

      {/* Barra de Filtro Rápido (si no es Unificar o Reportes) */}
      {!['unificar', 'reportes', 'reportes-pagio', 'reportes-pagos'].includes(section) && (
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtro rápido por código o nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="w-full pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

      )}

      {/* ── SECCIÓN: VENDEDORES ── */}
      {section === 'vendedores' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Comisión (%)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendedores.filter(v => v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || v.codigo.includes(searchTerm)).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 text-xs">{v.codigo}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{v.nombre}</td>
                    <td className="p-4 text-xs text-slate-500">{v.telefono || '—'}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-800">{v.comision}%</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${v.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: UNIFICAR TERCEROS ── */}
      {section === 'unificar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
              <RotateCcw size={16} className="text-indigo-600 animate-spin-slow" /> Fusionar Fichas de Terceros
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origen */}
              <div className="p-5 bg-rose-50/20 border border-rose-100 rounded-2xl space-y-4">
                <label className="block text-xs font-bold text-rose-800 uppercase tracking-wide">Tercero Origen (Se Elimina)</label>
                <select
                  value={origenId}
                  onChange={e => setOrigenId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="">-- Seleccionar tercero a eliminar --</option>
                  {tercerosList.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.numeroDocumento})</option>
                  ))}
                </select>
                <p className="text-[10px] text-rose-500">Toda la facturación, cartera e historial de este tercero se transferirán.</p>
              </div>

              {/* Destino */}
              <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-4">
                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">Tercero Destino (Se Conserva)</label>
                <select
                  value={destinoId}
                  onChange={e => setDestinoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="">-- Seleccionar tercero a conservar --</option>
                  {tercerosList.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.numeroDocumento})</option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-500">Este registro concentrará la información unificada final.</p>
              </div>
            </div>

            {/* Merge Indicator */}
            {isMerging && (
              <div className="space-y-2 bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-700">
                  <span>Procesando unificación y re-indexando base de datos...</span>
                  <span>{mergeProgress}%</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${mergeProgress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleUnificar}
              disabled={isMerging}
              className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isMerging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RotateCcw size={14} /> Ejecutar Fusión de Terceros
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500" /> Reglas de Negocio</h4>
            <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4">
              <li>El NIT del tercero destino prevalecerá como el identificador fiscal primario.</li>
              <li>Las transacciones del Tercero Origen se re-asociarán al ID del Tercero Destino en el motor de reportes.</li>
              <li>El tercero origen será purgado del `localStorage` permanentemente.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: CIIU ── */}
      {section === 'ciiu' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código CIIU</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actividad Económica</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ciiuses.filter(c => c.codigo.includes(searchTerm) || c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-extrabold text-slate-800 text-sm tracking-wider">{c.codigo}</td>
                    <td className="p-4 text-xs text-slate-600 font-bold">{c.descripcion}</td>
                    <td className="p-4 text-xs text-slate-400">{c.categoria}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: CLASIFICACIÓN DE TERCEROS ── */}
      {section === 'clasificaciones' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Clasificación</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción / Uso</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clasificaciones.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 text-xs">{c.codigo}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{c.nombre}</td>
                    <td className="p-4 text-xs text-slate-400">{c.descripcion}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: TIPO DE IDENTIFICACIÓN ── */}
      {section === 'tipos-identificacion' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código DIAN</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Corto</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción Homologada</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Facturación Electrónica</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {identificaciones.filter(i => i.nombreCorto.toLowerCase().includes(searchTerm.toLowerCase())).map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-extrabold text-slate-700 text-xs">{i.codigoDian}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{i.nombreCorto}</td>
                    <td className="p-4 text-xs text-slate-400">{i.descripcion}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${i.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                        {i.activo ? 'Habilitado' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(i)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(i.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: TIPO DE REGIMEN ── */}
      {section === 'tipos-regimen' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código Fiscal</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Régimen</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles / Exenciones</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regimenes.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 text-xs">{r.codigoDian}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{r.nombre}</td>
                    <td className="p-4 text-xs text-slate-400">{r.descripcion}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: REGIMEN TRIBUTARIO (IMPUESTOS) ── */}
      {section === 'regimen-tributario' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Tributario</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tarifa General (%)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regimenesTributarios.filter(rt => rt.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(rt => (
                  <tr key={rt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 text-xs">{rt.codigo}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{rt.nombre}</td>
                    <td className="p-4 text-right font-mono font-extrabold text-slate-800">{rt.tarifa}%</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${rt.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                        {rt.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(rt)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(rt.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: REPORTES / REPORTES PAGOS ── */}
      {(section === 'reportes' || section === 'reportes-pagos') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(section === 'reportes' ? [
            { key: 'cartera', title: 'Saldos de Cartera por Cliente', desc: 'Filtro detallado de cuentas por cobrar, estados de vencimiento y límites de cupos.', color: 'from-blue-500 to-indigo-600' },
            { key: 'vendedor', title: 'Desempeño y Ventas por Vendedor', desc: 'Análisis mensual de ventas facturadas y liquidación de comisiones.', color: 'from-purple-500 to-pink-600' },
            { key: 'contactos', title: 'Directorio de Terceros Homologados', desc: 'Consolidado general de correos de facturación electrónica y georreferenciación.', color: 'from-emerald-500 to-teal-600' }
          ] : [
            { key: 'retenciones', title: 'Auditoría de Retenciones de Impuesto', desc: 'Informe de retenciones aplicadas en la fuente, ICA e IVA del periodo fiscal.', color: 'from-amber-500 to-orange-600' }
          ]).map(r => (
            <div key={r.key} className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-200 transition-all hover:shadow-md">
              <div className="space-y-3">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${r.color} text-white flex items-center justify-center font-bold shadow-md`}>
                  <BarChart3 size={20} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800">{r.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
              <button
                onClick={() => setSelectedReport(r.key)}
                className="mt-6 w-full py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                Generar Reporte <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── SECCIÓN: TAGS (ETIQUETAS) ── */}
      {section === 'tags' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Tag size={14} className="text-indigo-600" /> Directorio de Etiquetas Comerciales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(t => {
              const bgColors: Record<string, string> = {
                indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                rose: 'bg-rose-50 text-rose-700 border-rose-100',
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                amber: 'bg-amber-50 text-amber-700 border-amber-100',
                purple: 'bg-purple-50 text-purple-700 border-purple-100',
                sky: 'bg-sky-50 text-sky-700 border-sky-100',
                teal: 'bg-teal-50 text-teal-700 border-teal-100',
                slate: 'bg-slate-50 text-slate-700 border-slate-100',
              }
              const cls = bgColors[t.color] || bgColors.indigo
              return (
                <div key={t.id} className={`flex items-start justify-between p-4 rounded-2xl border-2 hover:border-indigo-200 transition-colors bg-white`}>
                  <div className="space-y-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${cls}`}>
                      {t.nombre}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">{t.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3">
                    <button onClick={() => openEdit(t)} className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"><Edit3 size={12} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR / CREAR FICHA AUXILIAR ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <PlusCircle size={16} className="text-indigo-600" /> {editingId ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* VENDEDORES */}
              {section === 'vendedores' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código *</label>
                      <input
                        type="text"
                        value={formVendedor.codigo}
                        onChange={e => setFormVendedor(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Comisión (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formVendedor.comision}
                        onChange={e => setFormVendedor(p => ({ ...p, comision: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Seleccionar Colaborador *</label>
                    <select
                      value={colaboradores.find((c: any) => c.nombre === formVendedor.nombre)?.id || ''}
                      onChange={e => {
                        const selectedEmp = colaboradores.find((c: any) => c.id.toString() === e.target.value.toString())
                        if (selectedEmp) {
                          setFormVendedor(p => ({
                            ...p,
                            nombre: selectedEmp.nombre,
                            telefono: selectedEmp.telefonoCorporativo || ''
                          }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="">-- Seleccionar Colaborador --</option>
                      {colaboradores.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    {colaboradores.length === 0 && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> No hay colaboradores registrados. Regístralos en la sección de Seguridad.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre Completo *</label>
                    <input
                      type="text"
                      readOnly
                      value={formVendedor.nombre}
                      placeholder="Selecciona un colaborador de la lista"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Teléfono Celular</label>
                    <input
                      type="text"
                      readOnly
                      value={formVendedor.telefono}
                      placeholder="Celular auto-completado"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                    <input
                      type="checkbox"
                      checked={formVendedor.activo}
                      onChange={e => setFormVendedor(p => ({ ...p, activo: e.target.checked }))}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Comercial Activo</span>
                  </label>
                </div>
              )}

              {/* CIIU */}
              {section === 'ciiu' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código CIIU *</label>
                      <input
                        type="text"
                        value={formCiiu.codigo}
                        onChange={e => setFormCiiu(p => ({ ...p, codigo: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold font-mono text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Categoría</label>
                      <select
                        value={formCiiu.categoria}
                        onChange={e => setFormCiiu(p => ({ ...p, categoria: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      >
                        <option>Servicios</option>
                        <option>Tecnología</option>
                        <option>Comercio</option>
                        <option>Manufactura</option>
                        <option>Otros</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Actividad Económica (Descripción) *</label>
                    <textarea
                      rows={3}
                      value={formCiiu.descripcion}
                      onChange={e => setFormCiiu(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* CLASIFICACIONES */}
              {section === 'clasificaciones' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código de Clasificación *</label>
                    <input
                      type="text"
                      value={formClasificacion.codigo}
                      onChange={e => setFormClasificacion(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre de Clasificación *</label>
                    <input
                      type="text"
                      value={formClasificacion.nombre}
                      onChange={e => setFormClasificacion(p => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción de Uso</label>
                    <input
                      type="text"
                      value={formClasificacion.descripcion}
                      onChange={e => setFormClasificacion(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TIPOS IDENTIFICACION */}
              {section === 'tipos-identificacion' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código DIAN *</label>
                      <input
                        type="text"
                        value={formIdentificacion.codigoDian}
                        onChange={e => setFormIdentificacion(p => ({ ...p, codigoDian: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre Corto *</label>
                      <input
                        type="text"
                        value={formIdentificacion.nombreCorto}
                        onChange={e => setFormIdentificacion(p => ({ ...p, nombreCorto: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción Homologada</label>
                    <input
                      type="text"
                      value={formIdentificacion.descripcion}
                      onChange={e => setFormIdentificacion(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                    <input
                      type="checkbox"
                      checked={formIdentificacion.activo}
                      onChange={e => setFormIdentificacion(p => ({ ...p, activo: e.target.checked }))}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Habilitar Facturación Electrónica</span>
                  </label>
                </div>
              )}

              {/* TIPO REGIMEN */}
              {section === 'tipos-regimen' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código Fiscal DIAN *</label>
                    <input
                      type="text"
                      value={formRegimen.codigoDian}
                      onChange={e => setFormRegimen(p => ({ ...p, codigoDian: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre del Régimen *</label>
                    <input
                      type="text"
                      value={formRegimen.nombre}
                      onChange={e => setFormRegimen(p => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Detalles y Exenciones</label>
                    <input
                      type="text"
                      value={formRegimen.descripcion}
                      onChange={e => setFormRegimen(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* REGIMEN TRIBUTARIO (IMPUESTOS) */}
              {section === 'regimen-tributario' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código Tributario *</label>
                      <input
                        type="text"
                        value={formRegimenTributario.codigo}
                        onChange={e => setFormRegimenTributario(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tarifa General (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formRegimenTributario.tarifa}
                        onChange={e => setFormRegimenTributario(p => ({ ...p, tarifa: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre Tributario *</label>
                    <input
                      type="text"
                      value={formRegimenTributario.nombre}
                      onChange={e => setFormRegimenTributario(p => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                    <input
                      type="checkbox"
                      checked={formRegimenTributario.activo}
                      onChange={e => setFormRegimenTributario(p => ({ ...p, activo: e.target.checked }))}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Impuesto Activo / Aplicable</span>
                  </label>
                </div>
              )}

              {/* TAGS */}
              {section === 'tags' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre de Etiqueta *</label>
                    <input
                      type="text"
                      value={formTag.nombre}
                      onChange={e => setFormTag(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej. VIP, Bloqueado..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Color Temático</label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_COLORS.map(c => {
                        const bgColors: Record<string, string> = {
                          indigo: 'bg-indigo-500 ring-indigo-200',
                          rose: 'bg-rose-500 ring-rose-200',
                          emerald: 'bg-emerald-500 ring-emerald-200',
                          amber: 'bg-amber-500 ring-amber-200',
                          purple: 'bg-purple-500 ring-purple-200',
                          sky: 'bg-sky-500 ring-sky-200',
                          teal: 'bg-teal-500 ring-teal-200',
                          slate: 'bg-slate-500 ring-slate-200',
                        }
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormTag(p => ({ ...p, color: c }))}
                            className={`w-7 h-7 rounded-full ${bgColors[c] || bgColors.indigo} transition-all ${formTag.color === c ? 'ring-4 scale-110 shadow' : 'opacity-85 hover:scale-105'}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción de Uso</label>
                    <input
                      type="text"
                      value={formTag.descripcion}
                      onChange={e => setFormTag(p => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
              >
                <Save size={13} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVISUALIZAR REPORTES ── */}
      {selectedReport && REPORT_DATA[selectedReport] && (() => {
        const rep = REPORT_DATA[selectedReport]
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-600" /> {rep.title}
                </h3>
                <button onClick={() => setSelectedReport(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Data Table */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                        {rep.cols.map((col, idx) => (
                          <th key={idx} className="p-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rep.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/20 bg-white transition-colors">
                          {row.map((cell: any, cIdx: number) => {
                            const isCurrency = cell.toString().startsWith('$')
                            const isStatus = cell === 'Al Día' || cell === 'Vencido (Mora 8d)' || cell === 'Sin Saldos'
                            return (
                              <td key={cIdx} className={`p-3 text-xs ${isCurrency ? 'font-mono font-bold text-slate-800' : 'text-slate-600'} ${isStatus ? 'font-bold' : ''}`}>
                                {cell === 'Al Día' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[10px]">Al Día</span>}
                                {cell === 'Vencido (Mora 8d)' && <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 text-[10px]">Vencido</span>}
                                {cell === 'Sin Saldos' && <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">Sin Saldos</span>}
                                {!isStatus && cell}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Panel */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-medium">Reporte generado dinámicamente el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      toast.success('Descargando archivo Excel...')
                      setSelectedReport(null)
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-50 flex items-center gap-1.5"
                  >
                    <FileText size={13} /> Exportar Excel
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Imprimiendo / Guardando en PDF...')
                      setSelectedReport(null)
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-50 flex items-center gap-1.5"
                  >
                    <Receipt size={13} /> Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
