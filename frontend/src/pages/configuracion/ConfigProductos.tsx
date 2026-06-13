import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Trash2, Edit3, CheckCircle2, SlidersHorizontal, 
  Layers, ArrowLeft, Save, Package, Info, Percent, 
  Scale, Tag, AlertTriangle, FileText, Eye
} from 'lucide-react'
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../services/inventario.service'
import {
  getCategorias,
  getMarcas,
  getUnidadesMedida,
  getGruposProducto,
  getSubgruposProducto,
  getColoresProducto,
  getTallasProducto,
  getClasificacionesContables,
  getTagsProducto,
  getImpuestos
} from '../../services/erp.service'

// ── Interfaces ──────────────────────────────────────────────────────────────

interface MasterItem {
  id: string;
  nombre: string;
  activo: boolean;
  extra?: string;
  parentId?: string;
}

function Barcode({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 5v14" />
      <path d="M8 5v14" />
      <path d="M12 5v14" />
      <path d="M17 5v14" />
      <path d="M21 5v14" />
    </svg>
  )
}

function generateRandomEAN13(): string {
  let code = "770"
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }

  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10)
    if (i % 2 === 0) {
      sum += digit * 1
    } else {
      sum += digit * 3
    }
  }

  const remainder = sum % 10
  const checkDigit = remainder === 0 ? 0 : 10 - remainder

  return code + checkDigit.toString()
}

function getErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) {
    return msg.join(', ')
  }
  if (typeof msg === 'object' && msg !== null) {
    return JSON.stringify(msg)
  }
  if (typeof msg === 'string') {
    return msg
  }
  return fallback
}

function BarcodeSVG({ value }: { value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl w-full max-w-[220px]">
      <svg className="w-full h-10" viewBox="0 0 100 40" preserveAspectRatio="none">
        <g fill="currentColor" className="text-slate-800">
          <rect x="0" y="0" width="2" height="35" />
          <rect x="3" y="0" width="1" height="35" />
          <rect x="6" y="0" width="2" height="32" />
          <rect x="10" y="0" width="3" height="32" />
          <rect x="15" y="0" width="1" height="32" />
          <rect x="18" y="0" width="2" height="32" />
          <rect x="22" y="0" width="4" height="32" />
          <rect x="28" y="0" width="1" height="32" />
          <rect x="31" y="0" width="2" height="32" />
          <rect x="35" y="0" width="1" height="35" />
          <rect x="37" y="0" width="1" height="35" />
          <rect x="40" y="0" width="3" height="32" />
          <rect x="45" y="0" width="1" height="32" />
          <rect x="48" y="0" width="2" height="32" />
          <rect x="52" y="0" width="4" height="32" />
          <rect x="58" y="0" width="1" height="32" />
          <rect x="61" y="0" width="2" height="32" />
          <rect x="65" y="0" width="3" height="32" />
          <rect x="70" y="0" width="1" height="32" />
          <rect x="73" y="0" width="2" height="32" />
          <rect x="77" y="0" width="4" height="32" />
          <rect x="83" y="0" width="1" height="32" />
          <rect x="86" y="0" width="2" height="32" />
          <rect x="90" y="0" width="3" height="32" />
          <rect x="95" y="0" width="2" height="35" />
          <rect x="98" y="0" width="1" height="35" />
        </g>
      </svg>
      <span className="font-mono text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">{value}</span>
    </div>
  )
}

const DEFAULT_FORM = {
  sku: '',
  nombre: '',
  referencia: '',
  activo: true,
  descripcionAlterna: '',
  comisionValor: 0,
  comisionPct: 0,
  ubicacion1: '',
  ubicacion2: '',

  // Cubicaje
  presentacion: '',
  pesoUnidad: 0,
  paca: '',
  pacaCantidad: 0,
  dimensiones: '',
  multiploVenta: 1,
  pacaAlto: 0,
  pacaAncho: 0,
  pacaProfundidad: 0,
  cubicaje: 0,

  // Caracteristicas
  esRegalo: false,
  esKit: false,
  esLote: false,
  esImportado: false,
  esDescargable: false,
  bolsaP: false,
  aplicaSerial: false,
  esFacturable: true,
  esAjustable: true,
  receta: false,

  // Categorizacion
  categoriaId: '',
  grupoId: '',
  subgrupoId: '',
  unidadMedidaId: '',
  colorId: '',
  marcaId: '',
  clasificacionId: '',
  productoGrupo: '',
  centroCosto: '',
  tipoProducto: 'Inventario',
  aplicaTalla: 'No',
  aplicaColor: 'No',
  selectedTags: [] as string[],

  // Costos, Promoción
  costo: 0,
  costoPromedio: 0,
  costoUltimo: 0,
  costoI: 0,
  promocionActiva: false,
  promocionDescuentoPct: 0,
  promocionDescuentoValor: 0,
  promocionFechaLimite: '',
  noAutoAddPos: false,

  // Precios
  precios: Array(11).fill(0),
  observacion: '',
  liquidarIva: true,
  productoExentoIva: false,
  appliedTaxIds: ['iva_19'] as string[],
}

const DEFAULT_SYSTEM_IMPUESTOS = [
  {
    id: 'iva_19',
    codigo: '0',
    nombre: 'IVA 19%',
    sigla: 'IVA19',
    tipo: 'IVA',
    dianCod: '01',
    tipoCalculo: 'PORCENTAJE',
    tarifa: 19,
    estado: 'ACTIVO',
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
    estado: 'ACTIVO',
  }
]

function getLocalMaster(key: string): MasterItem[] {
  const data = localStorage.getItem(key)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch (e) {
    return []
  }
}

export function ConfigProductos() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Barcode scanner modal states
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')

  // Filters State
  const [filterSku, setFilterSku] = useState('')
  const [filterReferencia, setFilterReferencia] = useState('')
  const [filterNombre, setFilterNombre] = useState('')
  const [filterActivo, setFilterActivo] = useState<string>('true')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterGrupo, setFilterGrupo] = useState('')
  const [filterSubgrupo, setFilterSubgrupo] = useState('')
  const [filterMarca, setFilterMarca] = useState('')
  const [filterClasificacion, setFilterClasificacion] = useState('')

  // Form State
  const [formData, setFormData] = useState(DEFAULT_FORM)

  // Load masters via React Query
  const { data: catData = [] } = useQuery({ queryKey: ['categorias'], queryFn: getCategorias })
  const { data: marcaData = [] } = useQuery({ queryKey: ['marcas'], queryFn: getMarcas })
  const { data: undData = [] } = useQuery({ queryKey: ['unidades_medida'], queryFn: getUnidadesMedida })
  const { data: grpData = [] } = useQuery({ queryKey: ['grupos_producto'], queryFn: getGruposProducto })
  const { data: subgrpData = [] } = useQuery({ queryKey: ['subgrupos_producto'], queryFn: getSubgruposProducto })
  const { data: colData = [] } = useQuery({ queryKey: ['colores_producto'], queryFn: getColoresProducto })
  const { data: talData = [] } = useQuery({ queryKey: ['tallas_producto'], queryFn: getTallasProducto })
  const { data: clasifData = [] } = useQuery({ queryKey: ['clasificaciones_contables'], queryFn: getClasificacionesContables })
  const { data: tagData = [] } = useQuery({ queryKey: ['tags_producto'], queryFn: getTagsProducto })
  const { data: taxData = [] } = useQuery({ queryKey: ['impuestos'], queryFn: getImpuestos })

  // Map to MasterItem arrays
  const categorias: MasterItem[] = catData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const marcas: MasterItem[] = marcaData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const unidades: MasterItem[] = undData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true, extra: x.abreviatura }))
  const grupos: MasterItem[] = grpData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const subgrupos: MasterItem[] = subgrpData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true, parentId: String(x.grupoId) }))
  const colores: MasterItem[] = colData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const tallas: MasterItem[] = talData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const clasificaciones: MasterItem[] = clasifData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true, extra: x.pucCuenta }))
  const tags: MasterItem[] = tagData.map((x: any) => ({ id: String(x.id), nombre: x.nombre, activo: x.activo ?? true }))
  const systemTaxes: any[] = taxData.length > 0 ? taxData : DEFAULT_SYSTEM_IMPUESTOS

  const getAppliedTaxRate = (pForm: any) => {
    if (!pForm) return 0
    if (pForm.productoExentoIva) return 0 // Exento de todo impuesto -> 0%
    if (!pForm.liquidarIva) return 0 // No liquidar impuestos seleccionados -> 0% (keeps checklist editable)

    let rate = 0
    if (!pForm.appliedTaxIds) return 0
    pForm.appliedTaxIds.forEach((taxId: string) => {
      // Find either by ID (from defaults) or by code / id string
      const tax = systemTaxes.find(t => String(t.id) === String(taxId) || String(t.nombre) === String(taxId))
      if (tax && tax.activo !== false) {
        rate += Number(tax.tarifa || tax.porcentaje) || 0
      }
    })
    return rate
  }

  // Get products query
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ['config_productos'],
    queryFn: () => getProductos({ activo: undefined }), // get all
  })

  // Merge database products
  const products = dbProducts.map((p: any) => {
    return {
      ...p,
      extData: {
        ...DEFAULT_FORM,
        ...p,
        categoriaId: p.categoriaId ? String(p.categoriaId) : '',
        grupoId: p.grupoId ? String(p.grupoId) : '',
        subgrupoId: p.subgrupoId ? String(p.subgrupoId) : '',
        unidadMedidaId: p.unidadMedidaId ? String(p.unidadMedidaId) : '',
        colorId: p.colorId ? String(p.colorId) : '',
        marcaId: p.marcaId ? String(p.marcaId) : '',
        clasificacionId: p.clasificacionId ? String(p.clasificacionId) : '',
        precios: Array.isArray(p.precios) ? p.precios : DEFAULT_FORM.precios,
        selectedTags: Array.isArray(p.selectedTags) ? p.selectedTags : DEFAULT_FORM.selectedTags,
        appliedTaxIds: Array.isArray(p.appliedTaxIds) ? p.appliedTaxIds : DEFAULT_FORM.appliedTaxIds,
      }
    }
  })

  // Filter products locally
  const filteredProducts = products.filter(p => {
    if (filterSku && !p.sku.toLowerCase().includes(filterSku.toLowerCase())) return false
    if (filterReferencia && !(p.referencia || '').toLowerCase().includes(filterReferencia.toLowerCase())) return false
    if (filterNombre && !p.nombre.toLowerCase().includes(filterNombre.toLowerCase())) return false
    if (filterActivo !== 'all') {
      const isAct = filterActivo === 'true'
      if (p.activo !== isAct) return false
    }
    if (filterCategoria && p.extData.categoriaId !== filterCategoria) return false
    if (filterGrupo && p.extData.grupoId !== filterGrupo) return false
    if (filterSubgrupo && p.extData.subgrupoId !== filterSubgrupo) return false
    if (filterMarca && p.extData.marcaId !== filterMarca) return false
    if (filterClasificacion && p.extData.clasificacionId !== filterClasificacion) return false
    return true
  })

  // Dynamic filter lists
  const availableSubgroups = subgrupos.filter(sg => !formData.grupoId || sg.parentId === formData.grupoId)

  // Calculations for Cubicaje automatically on changes
  useEffect(() => {
    const alto = Number(formData.pacaAlto) || 0
    const ancho = Number(formData.pacaAncho) || 0
    const prof = Number(formData.pacaProfundidad) || 0
    const calcCubicaje = (alto * ancho * prof) / 1000000 // In cubic meters (m3) if in cm
    setFormData(prev => ({
      ...prev,
      cubicaje: parseFloat(calcCubicaje.toFixed(6))
    }))
  }, [formData.pacaAlto, formData.pacaAncho, formData.pacaProfundidad])

  const showNotification = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({
      ...DEFAULT_FORM,
      precios: Array(11).fill(0)
    })
    setError(null)
    setBarcodeInput('')
    setShowBarcodeModal(true)
  }

  const handleBarcodeSubmit = (codeToUse: string) => {
    const finalCode = codeToUse.trim()
    setFormData(prev => ({
      ...prev,
      sku: finalCode
    }))
    setShowBarcodeModal(false)
    setViewMode('form')
  }

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id)
    setFormData({
      ...DEFAULT_FORM,
      ...p.extData,
      sku: p.sku,
      nombre: p.nombre,
      referencia: p.referencia || '',
      activo: p.activo,
    })
    setError(null)
    setViewMode('form')
  }

  const handleDeleteProduct = async (p: any) => {
    if (window.confirm(`¿Está seguro de eliminar físicamente el producto "${p.nombre}" (SKU: ${p.sku})? Esto borrará el registro de la base de datos.`)) {
      try {
        await deleteProducto(p.id)
        qc.invalidateQueries({ queryKey: ['config_productos'] })
        showNotification('Producto eliminado correctamente de la base de datos.')
      } catch (err: any) {
        setError(getErrorMessage(err, 'No se pudo eliminar el producto. Podría tener movimientos contables o transacciones asociadas.'))
        setTimeout(() => setError(null), 5000)
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.sku || !formData.nombre) {
      setError('El SKU y el Nombre del producto son obligatorios.')
      return
    }

    const price1 = Number(formData.precios[0]) || 0

    // Full payload for database API
    const payload = {
      ...formData,
      categoriaId: formData.categoriaId ? Number(formData.categoriaId) : null,
      grupoId: formData.grupoId ? Number(formData.grupoId) : null,
      subgrupoId: formData.subgrupoId ? Number(formData.subgrupoId) : null,
      unidadMedidaId: formData.unidadMedidaId ? Number(formData.unidadMedidaId) : null,
      colorId: formData.colorId ? Number(formData.colorId) : null,
      marcaId: formData.marcaId ? Number(formData.marcaId) : null,
      clasificacionId: formData.clasificacionId ? Number(formData.clasificacionId) : null,
      precioBase: price1,
      costo: Number(formData.costo) || 0,
      costoPromedio: Number(formData.costoPromedio) || 0,
      costoUltimo: Number(formData.costoUltimo) || 0,
      costoI: Number(formData.costoI) || 0,
      pesoUnidad: Number(formData.pesoUnidad) || 0,
      pacaCantidad: Number(formData.pacaCantidad) || 0,
      multiploVenta: Number(formData.multiploVenta) || 1,
      pacaAlto: Number(formData.pacaAlto) || 0,
      pacaAncho: Number(formData.pacaAncho) || 0,
      pacaProfundidad: Number(formData.pacaProfundidad) || 0,
      cubicaje: Number(formData.cubicaje) || 0,
      comisionValor: Number(formData.comisionValor) || 0,
      comisionPct: Number(formData.comisionPct) || 0,
      manejaBodega: true,
      manejaLotes: formData.esLote,
      manejaSerial: formData.aplicaSerial,
      activo: formData.activo,
    }

    try {
      let savedProduct: any
      if (editingId) {
        savedProduct = await updateProducto(editingId, payload)
      } else {
        savedProduct = await createProducto(payload)
      }

      qc.invalidateQueries({ queryKey: ['config_productos'] })
      showNotification(`Producto ${editingId ? 'actualizado' : 'creado'} exitosamente en el ERP.`)
      navigate(`/configuracion/productos/${savedProduct.id}/detalle`)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Ocurrió un error al guardar el producto.'))
    }
  }

  const handlePriceChange = (index: number, value: number) => {
    const updatedPrices = [...formData.precios]
    updatedPrices[index] = value
    setFormData(prev => ({
      ...prev,
      precios: updatedPrices
    }))
  }

  const toggleTag = (tagId: string) => {
    const isSelected = formData.selectedTags.includes(tagId)
    const updated = isSelected 
      ? formData.selectedTags.filter(t => t !== tagId)
      : [...formData.selectedTags, tagId]
    setFormData(prev => ({
      ...prev,
      selectedTags: updated
    }))
  }

  return (
    <div className="w-full space-y-6">
      {successMsg && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-bold animate-bounce text-sm">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2 w-full shadow-sm">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-950 mb-0.5">Error en la operación</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>Productos</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Catálogo General</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Package size={24} className="text-indigo-600" />
                Configuración y Creación de Productos
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Módulo maestro para crear, editar, parametrizar y eliminar los productos del sistema ERP.
              </p>
            </div>

            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              Nuevo Producto
            </button>
          </div>

          {/* Advanced Filter Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
              <SlidersHorizontal size={14} className="text-indigo-600" />
              Panel de Filtros y Búsqueda Avanzada
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código / SKU</label>
                <input 
                  type="text" 
                  value={filterSku} 
                  onChange={e => setFilterSku(e.target.value)}
                  placeholder="Ej. P-001..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Referencia Fábrica</label>
                <input 
                  type="text" 
                  value={filterReferencia} 
                  onChange={e => setFilterReferencia(e.target.value)}
                  placeholder="Buscar referencia..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción / Nombre</label>
                <input 
                  type="text" 
                  value={filterNombre} 
                  onChange={e => setFilterNombre(e.target.value)}
                  placeholder="Nombre del producto..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                <select 
                  value={filterActivo} 
                  onChange={e => setFilterActivo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                  <option value="all">Todos</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoría</label>
                <select 
                  value={filterCategoria} 
                  onChange={e => setFilterCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Todas las Categorías --</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grupo</label>
                <select 
                  value={filterGrupo} 
                  onChange={e => setFilterGrupo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Todos los Grupos --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subgrupo</label>
                <select 
                  value={filterSubgrupo} 
                  onChange={e => setFilterSubgrupo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Todos los Subgrupos --</option>
                  {subgrupos.map(sg => <option key={sg.id} value={sg.id}>{sg.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marca</label>
                <select 
                  value={filterMarca} 
                  onChange={e => setFilterMarca(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Todas las Marcas --</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => {
                  setFilterSku('')
                  setFilterReferencia('')
                  setFilterNombre('')
                  setFilterActivo('true')
                  setFilterCategoria('')
                  setFilterGrupo('')
                  setFilterSubgrupo('')
                  setFilterMarca('')
                  setFilterClasificacion('')
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Table Listing */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código (SKU)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Precio 1 + Imp.</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Precio 2 + Imp.</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Último</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        Cargando catálogo de productos...
                      </td>
                    </tr>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(p => {
                      const taxRate = getAppliedTaxRate(p.extData)
                      const p1 = Number(p.extData.precios?.[0]) || Number(p.precioBase) || 0
                      const p2 = Number(p.extData.precios?.[1]) || 0
                      const p1Iva = p1 * (1 + taxRate / 100)
                      const p2Iva = p2 * (1 + taxRate / 100)
                      
                      const catName = categorias.find(c => c.id === p.extData.categoriaId)?.nombre || p.categoria?.nombre || '—'
                      const grpName = grupos.find(g => g.id === p.extData.grupoId)?.nombre || '—'

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => navigate(`/configuracion/productos/${p.id}/detalle`)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Ver detalle del producto"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar ficha técnica completa"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar producto"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">{p.sku}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{p.nombre}</div>
                            {p.referencia && <div className="text-[10px] text-slate-400">Ref: {p.referencia}</div>}
                          </td>
                          <td className="p-4 text-right font-mono font-semibold text-slate-700">
                            ${p1Iva.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-4 text-right font-mono font-semibold text-slate-700">
                            ${p2Iva.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{p.extData.tipoProducto || 'Inventario'}</td>
                          <td className="p-4 text-right font-mono text-slate-600">
                            ${(Number(p.extData.costoUltimo) || Number(p.costoPromedio) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-4 font-medium text-slate-600">{catName}</td>
                          <td className="p-4 font-medium text-slate-600">{grpName}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                              p.activo
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {p.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        No se encontraron productos registrados con los criterios seleccionados.
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
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode('list')} 
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span>Productos</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Administración</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-600 font-medium">{editingId ? 'Editar Producto' : 'Crear Producto'}</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                  <SlidersHorizontal size={22} className="text-indigo-600" />
                  {editingId ? `Ficha Técnica: ${formData.nombre}` : 'Nuevo Registro de Producto'}
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Completa la parametrización técnica, clasificación tributaria, costos y matriz de precios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Save size={16} />
                Guardar Producto
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6 w-full">
            
            {/* SECTION 1: INFORMACION GENERAL */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <Info size={16} className="text-indigo-600" />
                1. Información General del Producto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código Único (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Ej. REF-ORO-A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                  {formData.sku && (
                    <div className="mt-2.5">
                      <BarcodeSVG value={formData.sku} />
                    </div>
                  )}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ref. Fábrica / Catálogo</label>
                  <input
                    type="text"
                    value={formData.referencia}
                    onChange={e => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                    placeholder="Código de fábrica"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción / Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Anillo Solitario Oro Amarillo 18k"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={e => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Activo</span>
                  </label>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción Comercial / Alterna</label>
                  <input
                    type="text"
                    value={formData.descripcionAlterna}
                    onChange={e => setFormData(prev => ({ ...prev, descripcionAlterna: e.target.value }))}
                    placeholder="Nombre corto o comercial"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Comisión Fija ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.comisionValor || ''}
                    onChange={e => setFormData(prev => ({ ...prev, comisionValor: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Comisión (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.comisionPct || ''}
                    onChange={e => setFormData(prev => ({ ...prev, comisionPct: Number(e.target.value) }))}
                    placeholder="0%"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ubicación Bodega 1</label>
                  <input
                    type="text"
                    value={formData.ubicacion1}
                    onChange={e => setFormData(prev => ({ ...prev, ubicacion1: e.target.value }))}
                    placeholder="Ej. Vitrina A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ubicación Bodega 2</label>
                  <input
                    type="text"
                    value={formData.ubicacion2}
                    onChange={e => setFormData(prev => ({ ...prev, ubicacion2: e.target.value }))}
                    placeholder="Ej. Cajón B2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CUBICAJE Y DIMENSIONES */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <Scale size={16} className="text-indigo-600" />
                2. Cubicaje, Dimensión y Presentaciones
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Presentación</label>
                  <input
                    type="text"
                    value={formData.presentacion}
                    onChange={e => setFormData(prev => ({ ...prev, presentacion: e.target.value }))}
                    placeholder="Ej. Caja, Bolsa, Estuche"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Peso Unidad (g / kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pesoUnidad || ''}
                    onChange={e => setFormData(prev => ({ ...prev, pesoUnidad: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Paca (Embalaje)</label>
                  <input
                    type="text"
                    value={formData.paca}
                    onChange={e => setFormData(prev => ({ ...prev, paca: e.target.value }))}
                    placeholder="Ej. Master Carton"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cantidad x Paca</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pacaCantidad || ''}
                    onChange={e => setFormData(prev => ({ ...prev, pacaCantidad: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Múltiplo de Venta</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.multiploVenta || ''}
                    onChange={e => setFormData(prev => ({ ...prev, multiploVenta: Number(e.target.value) }))}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Paca Alto (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pacaAlto || ''}
                    onChange={e => setFormData(prev => ({ ...prev, pacaAlto: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Paca Ancho (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pacaAncho || ''}
                    onChange={e => setFormData(prev => ({ ...prev, pacaAncho: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Paca Profundidad (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pacaProfundidad || ''}
                    onChange={e => setFormData(prev => ({ ...prev, pacaProfundidad: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Volumen / Cubicaje (m³)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled
                      value={formData.cubicaje || 0}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold shrink-0">m³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: CARACTERISTICAS CHECKBOXES */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <SlidersHorizontal size={16} className="text-indigo-600" />
                3. Características Especiales (Checkboxes)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { key: 'esRegalo', label: 'Es Regalo', desc: 'Artículo de obsequio' },
                  { key: 'esKit', label: 'Es Kit / Combo', desc: 'Agrupa productos' },
                  { key: 'esLote', label: 'Maneja Lote', desc: 'Control de trazabilidad' },
                  { key: 'esImportado', label: 'Es Importado', desc: 'Código arancelario' },
                  { key: 'esDescargable', label: 'Es Descargable', desc: 'Servicio digital' },
                  { key: 'bolsaP', label: 'Bolsa Plast.', desc: 'Impuesto de bolsa' },
                  { key: 'aplicaSerial', label: 'Aplica Serial', desc: 'Control de seriales' },
                  { key: 'esFacturable', label: 'Facturable', desc: 'Venta comercial' },
                  { key: 'esAjustable', label: 'Ajustable', desc: 'Permite ajuste stock' },
                  { key: 'receta', label: 'Maneja Receta', desc: 'Materia prima / BOP' },
                ].map(item => (
                  <label key={item.key} className="flex flex-col p-3 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={(formData as any)[item.key]}
                        onChange={e => setFormData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium ml-6">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SECTION 4: CATEGORIZACION Y MAESTROS */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers size={16} className="text-indigo-600" />
                4. Categorización desde Maestros Paramétricos
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Categoría Maestro</label>
                  <select
                    value={formData.categoriaId}
                    onChange={e => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categorias.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Grupo Maestro</label>
                  <select
                    value={formData.grupoId}
                    onChange={e => setFormData(prev => ({ ...prev, grupoId: e.target.value, subgrupoId: '' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Grupo --</option>
                    {grupos.filter(g => g.activo).map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Subgrupo Maestro</label>
                  <select
                    value={formData.subgrupoId}
                    onChange={e => setFormData(prev => ({ ...prev, subgrupoId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Subgrupo --</option>
                    {availableSubgroups.filter(sg => sg.activo).map(sg => (
                      <option key={sg.id} value={sg.id}>{sg.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Unidad de Medida</label>
                  <select
                    value={formData.unidadMedidaId}
                    onChange={e => setFormData(prev => ({ ...prev, unidadMedidaId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Unidad --</option>
                    {unidades.filter(u => u.activo).map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.extra || 'und'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Color Maestro</label>
                  <select
                    value={formData.colorId}
                    onChange={e => setFormData(prev => ({ ...prev, colorId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Color --</option>
                    {colores.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Marca Maestro</label>
                  <select
                    value={formData.marcaId}
                    onChange={e => setFormData(prev => ({ ...prev, marcaId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Marca --</option>
                    {marcas.filter(m => m.activo).map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Clasificación Contable (PUC)</label>
                  <select
                    value={formData.clasificacionId}
                    onChange={e => setFormData(prev => ({ ...prev, clasificacionId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer font-mono"
                  >
                    <option value="">-- Seleccionar Cuenta --</option>
                    {clasificaciones.filter(cl => cl.activo).map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.extra || ''} - {cl.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipo de Producto</label>
                  <select
                    value={formData.tipoProducto}
                    onChange={e => setFormData(prev => ({ ...prev, tipoProducto: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Inventario">Inventario (Físico)</option>
                    <option value="Servicio">Servicio / Mano de Obra</option>
                    <option value="Activo Fijo">Activo Fijo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Grupo Producto ERP</label>
                  <input
                    type="text"
                    value={formData.productoGrupo}
                    onChange={e => setFormData(prev => ({ ...prev, productoGrupo: e.target.value }))}
                    placeholder="Grupo comercial ERP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Centro de Costo</label>
                  <input
                    type="text"
                    value={formData.centroCosto}
                    onChange={e => setFormData(prev => ({ ...prev, centroCosto: e.target.value }))}
                    placeholder="Ej. CC-VENTAS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">¿Aplica Talla?</label>
                  <select
                    value={formData.aplicaTalla}
                    onChange={e => setFormData(prev => ({ ...prev, aplicaTalla: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Si">Sí (Configurable)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">¿Aplica Color?</label>
                  <select
                    value={formData.aplicaColor}
                    onChange={e => setFormData(prev => ({ ...prev, aplicaColor: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Si">Sí (Configurable)</option>
                  </select>
                </div>
              </div>

              {/* Tags Selector */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Etiquetas / Tags de Clasificación</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => {
                    const isSelected = formData.selectedTags.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {t.nombre}
                      </button>
                    )
                  })}
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No hay etiquetas creadas en Maestros.</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5: COSTOS Y PROMOCION */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <Percent size={16} className="text-indigo-600" />
                5. Costos y Campañas de Promoción
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Costos col */}
                <div className="md:col-span-6 grid grid-cols-2 gap-4 border-r border-slate-100 pr-4">
                  <div className="col-span-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">Estructura de Costos ($)</div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Costo Unitario Base</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costo || ''}
                      onChange={e => setFormData(prev => ({ ...prev, costo: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Costo IVA Integrado</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costoI || ''}
                      onChange={e => setFormData(prev => ({ ...prev, costoI: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Costo Promedio (CPP)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costoPromedio || ''}
                      onChange={e => setFormData(prev => ({ ...prev, costoPromedio: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Costo Última Compra</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costoUltimo || ''}
                      onChange={e => setFormData(prev => ({ ...prev, costoUltimo: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                    />
                  </div>
                </div>

                {/* Promoción col */}
                <div className="md:col-span-6 space-y-3 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Ajustes de Campañas / Ofertas</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.promocionActiva}
                        onChange={e => setFormData(prev => ({ ...prev, promocionActiva: e.target.checked }))}
                        className="rounded text-indigo-600 h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase">Activar Promoción</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descuento (%)</label>
                      <input
                        type="number"
                        disabled={!formData.promocionActiva}
                        value={formData.promocionDescuentoPct || ''}
                        onChange={e => setFormData(prev => ({ ...prev, promocionDescuentoPct: Number(e.target.value) }))}
                        placeholder="0%"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descuento ($ Valor)</label>
                      <input
                        type="number"
                        disabled={!formData.promocionActiva}
                        value={formData.promocionDescuentoValor || ''}
                        onChange={e => setFormData(prev => ({ ...prev, promocionDescuentoValor: Number(e.target.value) }))}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Fecha Límite Campaña</label>
                      <input
                        type="date"
                        disabled={!formData.promocionActiva}
                        value={formData.promocionFechaLimite}
                        onChange={e => setFormData(prev => ({ ...prev, promocionFechaLimite: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none disabled:opacity-50 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className={`flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px] ${!formData.promocionActiva && 'opacity-50 pointer-events-none'}`}>
                        <input
                          type="checkbox"
                          disabled={!formData.promocionActiva}
                          checked={formData.noAutoAddPos}
                          onChange={e => setFormData(prev => ({ ...prev, noAutoAddPos: e.target.checked }))}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <span className="text-[10px] font-bold text-slate-700">No Auto-Add POS</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: MATRIZ DE PRECIOS */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={16} className="text-indigo-600" />
                  6. Matriz Especial de 11 Precios
                </h2>
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5 animate-pulse">
                  <Percent size={12} /> Tasa de Impuestos Aplicada: {getAppliedTaxRate(formData)}%
                </span>
              </div>

              {/* Controles de IVA e Impuestos */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Column 1: Checkboxes de Control */}
                <div className="md:col-span-4 space-y-3">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Control Tributario</span>
                  
                  <label className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl transition-all shadow-sm ${
                    formData.productoExentoIva ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={formData.productoExentoIva}
                      checked={formData.liquidarIva && !formData.productoExentoIva}
                      onChange={e => setFormData(prev => ({ ...prev, liquidarIva: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-50"
                    />
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-slate-700">Liquidar impuestos seleccionados</p>
                      <p className="text-[9px] text-slate-400">Aplica las tarifas de los impuestos marcados al precio</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={formData.productoExentoIva}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        productoExentoIva: e.target.checked,
                        liquidarIva: e.target.checked ? false : prev.liquidarIva
                      }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-slate-700">Producto exento de impuestos</p>
                      <p className="text-[9px] text-slate-400">El producto no está sujeto a ningún impuesto (Bloquea selección)</p>
                    </div>
                  </label>
                </div>

                {/* Column 2: Checklist de Impuestos del Sistema */}
                <div className="md:col-span-8 space-y-3">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Impuestos Aplicables (Configuración)</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {systemTaxes.filter(t => (t.tipo === 'IVA' || t.tipo === 'CONSUMO') && t.estado === 'ACTIVO').map(tax => {
                      const isChecked = formData.appliedTaxIds.includes(tax.id)
                      const isExempt = formData.productoExentoIva
                      const isNotLiquidated = !formData.liquidarIva
                      const displayRate = isExempt || isNotLiquidated ? 0 : tax.tarifa

                      return (
                        <label 
                          key={tax.id} 
                          className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all bg-white shadow-sm ${
                            isExempt 
                              ? 'opacity-40 cursor-not-allowed border-slate-100' 
                              : isChecked 
                                ? 'border-indigo-200 bg-indigo-50/20 cursor-pointer hover:bg-indigo-50/10' 
                                : 'border-slate-200 cursor-pointer hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isExempt}
                            checked={isChecked && !isExempt}
                            onChange={() => {
                              const updated = isChecked
                                ? formData.appliedTaxIds.filter(id => id !== tax.id)
                                : [...formData.appliedTaxIds, tax.id]
                              setFormData(prev => ({ ...prev, appliedTaxIds: updated }))
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-40"
                          />
                          <div className="leading-tight">
                            <span className="text-xs font-bold text-slate-700">{tax.nombre}</span>
                            <span className="text-[9px] block text-slate-400">
                              {tax.sigla} • Tarifa: {tax.tarifa}% {
                                isExempt 
                                  ? <span className="text-rose-500 font-bold">(Exento)</span> 
                                  : isNotLiquidated 
                                    ? <span className="text-amber-500 font-bold">(No liquidado)</span> 
                                    : <span className="text-emerald-500 font-bold">(Liquidando: {displayRate}%)</span>
                              }
                            </span>
                          </div>
                        </label>
                      )
                    })}
                    {systemTaxes.filter(t => (t.tipo === 'IVA' || t.tipo === 'CONSUMO') && t.estado === 'ACTIVO').length === 0 && (
                      <div className="text-xs text-slate-400 italic col-span-2 py-3 bg-white p-3 rounded-xl border border-dashed border-slate-200">
                        No hay impuestos de IVA o Consumo activos configurados.
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {formData.precios.map((precio, idx) => {
                  const taxRate = getAppliedTaxRate(formData)
                  const valorConImpuestos = (precio || 0) * (1 + taxRate / 100)
                  return (
                    <div key={idx} className="p-3.5 bg-slate-50/75 border border-slate-200/60 rounded-2xl space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precio {idx + 1}</span>
                        {idx === 0 && <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">Base</span>}
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={precio || ''}
                          onChange={e => handlePriceChange(idx, Number(e.target.value))}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] border-t border-slate-200/40 pt-1">
                        <span className="text-slate-400 font-bold">P + Impuesto:</span>
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          ${valorConImpuestos.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* OBSERVACIONES */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText size={16} className="text-indigo-600" />
                Observaciones Contables / Generales
              </h2>
              <textarea
                value={formData.observacion}
                onChange={e => setFormData(prev => ({ ...prev, observacion: e.target.value }))}
                placeholder="Ingresa notas o especificaciones de Auditoría/Clasificación de este producto..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Save size={16} />
                Guardar Ficha Técnica
              </button>
            </div>
          </form>
        </>
      )}

      {showBarcodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Barcode size={24} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Ingresa código de barras</h2>
              <p className="text-slate-500 text-xs px-4">
                Escribe el código manualmente o lee el código de barras con tu lector.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleBarcodeSubmit(barcodeInput)
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Ej. 7701234567890"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = generateRandomEAN13()
                    setBarcodeInput(code)
                  }}
                  className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                >
                  Crear aleatorio
                </button>
              </div>

              <div className="text-center bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  ⚡ O lee el código de barras con tu lector
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBarcodeModal(false)
                    setViewMode('list')
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!barcodeInput.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
