import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Trash2, Edit3, CheckCircle2, SlidersHorizontal,
  Tag, BookOpen, ShoppingCart, TrendingUp, Settings, Percent, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getCuentasAuxiliares } from '../../services/contabilidad.service'
import {
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
  getMarcas, createMarca, updateMarca, deleteMarca,
  getUnidadesMedida, createUnidadMedida, updateUnidadMedida, deleteUnidadMedida,
  getGruposProducto, createGrupoProducto, updateGrupoProducto, deleteGrupoProducto,
  getImpuestos,
} from '../../services/erp.service'


// ── Interfaces ──────────────────────────────────────────────────────────────

interface MasterItem {
  id: string;
  nombre: string;
  activo: boolean;
  extra?: string;
  parentId?: string;
  // Campos extendidos para Grupos (parametrización contable)
  contable?: GrupoContable;
}

interface GrupoContable {
  centroCosto?: string;
  // COMERCIAL
  inventarioVenta?: string;
  inventarioVentaReserva?: string;
  devolucionVentaInventario?: string;
  ingresoEnVentas?: string;
  devolucionEnVentas?: string;
  costoEnVentas?: string;
  gastoBonificado?: string;
  // INVENTARIOS
  compras?: string;
  devolucionInventarios?: string;
  descuentoEnCompras?: string;
  ajusteInventario?: string;
  inventarioFisico?: string;
  // PRODUCCIÓN
  costoDeProduccion?: string;
  // IMPUESTOS
  impuestoVenta?: string;
  impuestoVentaAlterno?: string;
  impuestosCompra?: string[];
}

type TabType = 'categorias' | 'marcas' | 'unidades' | 'grupos' | 'subgrupos' | 'colores' | 'tallas' | 'clasificacion' | 'tags';

interface TabConfig {
  id: TabType;
  label: string;
  storageKey: string;
  extraLabel?: string;
  extraPlaceholder?: string;
  defaultData: MasterItem[];
}

const TAB_CONFIGS: Record<TabType, TabConfig> = {
  categorias: {
    id: 'categorias',
    label: 'Categorías',
    storageKey: 'edatia_maestros_categorias',
    defaultData: [
      { id: 'cat_lujo', nombre: 'Joyería de Lujo', activo: true },
      { id: 'cat_reloj', nombre: 'Relojería Fina', activo: true },
      { id: 'cat_plata', nombre: 'Platería Ley 925', activo: true }
    ]
  },
  marcas: {
    id: 'marcas',
    label: 'Marcas',
    storageKey: 'edatia_maestros_marcas',
    defaultData: [
      { id: 'mar_rolex', nombre: 'Rolex', activo: true },
      { id: 'mar_tiffany', nombre: 'Tiffany & Co.', activo: true },
      { id: 'mar_pandora', nombre: 'Pandora', activo: true }
    ]
  },
  unidades: {
    id: 'unidades',
    label: 'Unidades de Medida',
    storageKey: 'edatia_maestros_unidades',
    extraLabel: 'Abreviatura',
    extraPlaceholder: 'Ej. und, g, kt',
    defaultData: [
      { id: 'uni_und', nombre: 'Unidad', activo: true, extra: 'und' },
      { id: 'uni_g', nombre: 'Gramos', activo: true, extra: 'g' },
      { id: 'uni_kt', nombre: 'Quilates', activo: true, extra: 'kt' }
    ]
  },
  grupos: {
    id: 'grupos',
    label: 'Grupos',
    storageKey: 'edatia_maestros_grupos',
    defaultData: [
      { id: 'grp_anillos', nombre: 'Anillos', activo: true },
      { id: 'grp_cadenas', nombre: 'Cadenas', activo: true },
      { id: 'grp_aretes', nombre: 'Aretes', activo: true }
    ]
  },
  subgrupos: {
    id: 'subgrupos',
    label: 'Subgrupos',
    storageKey: 'edatia_maestros_subgrupos',
    extraLabel: 'Grupo Asociado (ID)',
    extraPlaceholder: 'Ej. grp_anillos',
    defaultData: [
      { id: 'sub_matrimonio', nombre: 'Anillos de Matrimonio', activo: true, parentId: 'grp_anillos' },
      { id: 'sub_compromiso', nombre: 'Anillos de Compromiso', activo: true, parentId: 'grp_anillos' },
      { id: 'sub_gargantillas', nombre: 'Gargantillas', activo: true, parentId: 'grp_cadenas' }
    ]
  },
  colores: {
    id: 'colores',
    label: 'Colores',
    storageKey: 'edatia_maestros_colores',
    defaultData: [
      { id: 'col_oro', nombre: 'Oro Amarillo', activo: true },
      { id: 'col_plata', nombre: 'Plata brillante', activo: true },
      { id: 'col_ororosa', nombre: 'Oro Rosa', activo: true },
      { id: 'col_oroblanco', nombre: 'Oro Blanco', activo: true }
    ]
  },
  tallas: {
    id: 'tallas',
    label: 'Tallas / Medidas',
    storageKey: 'edatia_maestros_tallas',
    defaultData: [
      { id: 'tal_6', nombre: 'Talla 6', activo: true },
      { id: 'tal_7', nombre: 'Talla 7', activo: true },
      { id: 'tal_8', nombre: 'Talla 8', activo: true },
      { id: 'tal_unica', nombre: 'Talla Única', activo: true }
    ]
  },
  clasificacion: {
    id: 'clasificacion',
    label: 'Clasificación Contable',
    storageKey: 'edatia_maestros_clasificacion',
    extraLabel: 'Código Cuenta PUC',
    extraPlaceholder: 'Ej. 143505',
    defaultData: [
      { id: 'cla_mercancia', nombre: 'Mercancías no fabricadas por la empresa', activo: true, extra: '143505' },
      { id: 'cla_materia_prima', nombre: 'Materia Prima Joyería', activo: true, extra: '140501' }
    ]
  },
  tags: {
    id: 'tags',
    label: 'Tags / Etiquetas',
    storageKey: 'edatia_maestros_tags',
    defaultData: [
      { id: 'tag_lujo', nombre: 'Alta Gama', activo: true },
      { id: 'tag_descuento', nombre: 'Promoción', activo: true },
      { id: 'tag_boda', nombre: 'Bodas', activo: true }
    ]
  }
};

// ── Default contable object ──────────────────────────────────────────────────
const DEFAULT_CONTABLE: GrupoContable = {
  centroCosto: '',
  inventarioVenta: '',
  inventarioVentaReserva: '',
  devolucionVentaInventario: '',
  ingresoEnVentas: '',
  devolucionEnVentas: '',
  costoEnVentas: '',
  gastoBonificado: '',
  compras: '',
  devolucionInventarios: '',
  descuentoEnCompras: '',
  ajusteInventario: '',
  inventarioFisico: '',
  costoDeProduccion: '',
  impuestoVenta: '',
  impuestoVentaAlterno: '',
  impuestosCompra: [],
}

// ── PUC Autocomplete Input helper ──────────────────────────────────────────
function PucAutocompleteInput({
  label,
  value,
  onChange,
  allowedPrefixes,
  placeholder = 'Buscar por código o nombre...'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  allowedPrefixes: string[]
  placeholder?: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const data = await getCuentasAuxiliares(searchQuery)
        // Filtrar por los prefijos permitidos (clases o sub-clases)
        const filtered = data.filter((c: any) =>
          allowedPrefixes.some(pref => c.codigo.startsWith(pref))
        )
        setResults(filtered)
      } catch (err) {
        console.error('Error al consultar PUC:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, allowedPrefixes])

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">{label}</label>
        <span className="text-[8px] font-extrabold text-indigo-500 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md font-mono tracking-wider">
          PUC: {allowedPrefixes.map(p => `${p}*`).join('/')}
        </span>
      </div>

      {value ? (
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/80 border border-indigo-150 rounded-xl text-xs">
          <span className="font-mono text-indigo-700 font-semibold truncate select-all">{value}</span>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setSearchQuery('')
            }}
            className="p-1 text-slate-400 hover:text-slate-650 hover:bg-indigo-150 rounded-lg transition-all"
            title="Limpiar cuenta"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono"
          />
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          {isOpen && (searchQuery.trim().length >= 2 || loading) && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
              {loading && <p className="text-[10px] text-slate-400 italic p-3 text-center">Buscando en PUC...</p>}
              {!loading && results.length === 0 && (
                <p className="text-[10px] text-slate-400 italic p-3 text-center font-sans">Sin resultados para {allowedPrefixes.join(', ')}</p>
              )}
              {!loading && results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => {
                    onChange(`${c.codigo} — ${c.nombre}`)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors font-sans"
                >
                  <span className="font-mono text-indigo-650 font-bold">{c.codigo}</span> — {c.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ── Section header helper ───────────────────────────────────────────────────
function SectionHeader({ color, label, icon }: { color: string; label: string; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-extrabold uppercase tracking-widest ${color}`}>
      {icon}
      {label}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ConfigProductosMaestros() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabType) || 'categorias'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // Formulario general
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formActivo, setFormActivo] = useState(true)
  const [formExtra, setFormExtra] = useState('')
  const [formParentId, setFormParentId] = useState('')

  // Formulario contable extendido (solo para Grupos)
  const [formContable, setFormContable] = useState<GrupoContable>(DEFAULT_CONTABLE)

  const currentTabConfig = TAB_CONFIGS[activeTab] || TAB_CONFIGS.categorias

  // Reset view when switching tabs
  useEffect(() => {
    setViewMode('list')
    setSearch('')
  }, [activeTab])

  // ── API Queries per tab ─────────────────────────────────────────────────────
  const { data: categoriasData = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
  })
  const { data: marcasData = [], isLoading: loadingMarcas } = useQuery({
    queryKey: ['marcas'],
    queryFn: getMarcas,
  })
  const { data: unidadesData = [], isLoading: loadingUnidades } = useQuery({
    queryKey: ['unidades_medida'],
    queryFn: getUnidadesMedida,
  })
  const { data: gruposData = [], isLoading: loadingGrupos } = useQuery({
    queryKey: ['grupos_producto'],
    queryFn: getGruposProducto,
  })
  const { data: impuestosData = [] } = useQuery({
    queryKey: ['impuestos'],
    queryFn: getImpuestos,
  })

  // Derive active tab items and loading state
  const TAB_QUERY_MAP: Record<string, { items: any[]; isLoading: boolean }> = {
    categorias: { items: categoriasData, isLoading: loadingCategorias },
    marcas:     { items: marcasData,     isLoading: loadingMarcas },
    unidades:   { items: unidadesData,   isLoading: loadingUnidades },
    grupos:     { items: gruposData,     isLoading: loadingGrupos },
  }

  const apiTabState = TAB_QUERY_MAP[activeTab]
  // For API-backed tabs use query data; for local-only tabs (subgrupos, colores, etc.) use empty array
  const items: MasterItem[] = apiTabState
    ? apiTabState.items.map((x: any) => ({
        id: String(x.id),
        nombre: x.nombre,
        activo: x.activo ?? true,
        extra: x.abreviatura || x.extra || undefined,
        contable: x.contable || undefined,
      }))
    : currentTabConfig.defaultData

  const isLoadingItems = apiTabState?.isLoading ?? false

  // gruposList for the subgrupos tab selector
  const gruposList: MasterItem[] = gruposData.map((x: any) => ({
    id: String(x.id),
    nombre: x.nombre,
    activo: x.activo ?? true,
  }))

  // systemTaxes for the grupos form
  const systemTaxes: any[] = impuestosData

  // ── Mutations ───────────────────────────────────────────────────────────────
  const QUERY_KEY_MAP: Record<string, string[]> = {
    categorias: ['categorias'],
    marcas:     ['marcas'],
    unidades:   ['unidades_medida'],
    grupos:     ['grupos_producto'],
  }

  const CREATE_FN_MAP: Record<string, (dto: any) => Promise<any>> = {
    categorias: createCategoria,
    marcas:     createMarca,
    unidades:   createUnidadMedida,
    grupos:     createGrupoProducto,
  }

  const UPDATE_FN_MAP: Record<string, (id: number, dto: any) => Promise<any>> = {
    categorias: updateCategoria,
    marcas:     updateMarca,
    unidades:   updateUnidadMedida,
    grupos:     updateGrupoProducto,
  }

  const DELETE_FN_MAP: Record<string, (id: number) => Promise<any>> = {
    categorias: deleteCategoria,
    marcas:     deleteMarca,
    unidades:   deleteUnidadMedida,
    grupos:     deleteGrupoProducto,
  }

  const createMutation = useMutation({
    mutationFn: (dto: any) => {
      const fn = CREATE_FN_MAP[activeTab]
      if (!fn) return Promise.reject(new Error('Tab sin API'))
      return fn(dto)
    },
    onSuccess: () => {
      const key = QUERY_KEY_MAP[activeTab]
      if (key) queryClient.invalidateQueries({ queryKey: key })
      toast.success('Registro creado exitosamente')
      setViewMode('list')
    },
    onError: () => toast.error('Error al crear el registro'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => {
      const fn = UPDATE_FN_MAP[activeTab]
      if (!fn) return Promise.reject(new Error('Tab sin API'))
      return fn(id, dto)
    },
    onSuccess: () => {
      const key = QUERY_KEY_MAP[activeTab]
      if (key) queryClient.invalidateQueries({ queryKey: key })
      toast.success('Registro actualizado exitosamente')
      setViewMode('list')
    },
    onError: () => toast.error('Error al actualizar el registro'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const fn = DELETE_FN_MAP[activeTab]
      if (!fn) return Promise.reject(new Error('Tab sin API'))
      return fn(id)
    },
    onSuccess: () => {
      const key = QUERY_KEY_MAP[activeTab]
      if (key) queryClient.invalidateQueries({ queryKey: key })
      toast.success('Registro eliminado')
    },
    onError: () => toast.error('Error al eliminar el registro'),
  })

  const updContable = (field: keyof GrupoContable, value: any) =>
    setFormContable(prev => ({ ...prev, [field]: value }))

  const toggleImpuestoCompra = (taxId: string) => {
    const list = formContable.impuestosCompra || []
    const updated = list.includes(taxId) ? list.filter(x => x !== taxId) : [...list, taxId]
    updContable('impuestosCompra', updated)
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setFormNombre('')
    setFormActivo(true)
    setFormExtra('')
    setFormParentId('')
    setFormContable(DEFAULT_CONTABLE)
    setViewMode('form')
  }

  const handleOpenEdit = (item: MasterItem) => {
    setEditingId(item.id)
    setFormNombre(item.nombre)
    setFormActivo(item.activo)
    setFormExtra(item.extra || '')
    setFormParentId(item.parentId || '')
    setFormContable(item.contable ? { ...DEFAULT_CONTABLE, ...item.contable } : DEFAULT_CONTABLE)
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro maestro?')) {
      if (QUERY_KEY_MAP[activeTab]) {
        deleteMutation.mutate(Number(id))
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNombre) return alert('El nombre es obligatorio.')

    const dto: any = {
      nombre: formNombre,
      activo: formActivo,
      ...(formExtra ? { abreviatura: formExtra } : {}),
      ...(activeTab === 'grupos' ? { contable: formContable } : {}),
    }

    if (editingId) {
      updateMutation.mutate({ id: Number(editingId), dto })
    } else {
      createMutation.mutate(dto)
    }
  }

  const filteredItems = items.filter(x =>
    x.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (x.extra || '').toLowerCase().includes(search.toLowerCase())
  )

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="w-full space-y-6">
      {/* Tabs list */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl w-full max-w-5xl">
        {(Object.keys(TAB_CONFIGS) as TabType[]).map(tKey => {
          const config = TAB_CONFIGS[tKey]
          const isActive = activeTab === tKey
          return (
            <button
              key={tKey}
              onClick={() => setSearchParams({ tab: tKey })}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {config.label}
            </button>
          )
        })}
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>Maestros de Productos</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{currentTabConfig.label}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Tag size={24} className="text-indigo-600" />
                Catálogo de {currentTabConfig.label}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Crea y edita los valores globales que se seleccionarán en las fichas técnicas de los productos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isMutating && (
                <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold">
                  <CheckCircle2 size={16} /> Guardando...
                </div>
              )}
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Agregar {currentTabConfig.label.slice(0, -1)}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Buscar en ${currentTabConfig.label.toLowerCase()}...`}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Table list */}
          {isLoadingItems ? (
            <div className="py-10 text-center text-slate-400 text-sm">Cargando...</div>
          ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full max-w-4xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                    {currentTabConfig.extraLabel && (
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{currentTabConfig.extraLabel}</th>
                    )}
                    {activeTab === 'subgrupos' && (
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo Padre</th>
                    )}
                    {activeTab === 'grupos' && (
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parametrización</th>
                    )}
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                        {currentTabConfig.extraLabel && (
                          <td className="p-4 font-mono font-medium text-slate-600">{item.extra || '—'}</td>
                        )}
                        {activeTab === 'subgrupos' && (
                          <td className="p-4 text-slate-600 font-medium">
                            {gruposList.find(g => g.id === item.parentId)?.nombre || <span className="text-slate-300 italic">No asignado</span>}
                          </td>
                        )}
                        {activeTab === 'grupos' && (
                          <td className="p-4">
                            {item.contable && (item.contable.ingresoEnVentas || item.contable.costoEnVentas) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                <BookOpen size={9} /> Contabilidad configurada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                                Pendiente configurar
                              </span>
                            )}
                          </td>
                        )}
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                            item.activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No hay registros maestros creados en esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Maestros</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium capitalize">{currentTabConfig.label}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? `Editar ${currentTabConfig.label.slice(0, -1)}` : `Crear ${currentTabConfig.label.slice(0, -1)}`}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {activeTab === 'grupos'
                  ? 'Configura el grupo y asigna las cuentas PUC para la contabilización automática.'
                  : 'Ingresa los datos para este registro de catálogo maestro.'}
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
            {/* Información básica */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-3">
                Información General
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nombre / Descripción *</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={e => setFormNombre(e.target.value)}
                    required
                    placeholder="Ej. Aretes, Oro Rosado, Gramos, etc."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                {currentTabConfig.extraLabel && (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{currentTabConfig.extraLabel} *</label>
                    <input
                      type="text"
                      value={formExtra}
                      onChange={e => setFormExtra(e.target.value)}
                      required
                      placeholder={currentTabConfig.extraPlaceholder}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono font-bold"
                    />
                  </div>
                )}

                {activeTab === 'subgrupos' && (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Grupo Asociado *</label>
                    <select
                      value={formParentId}
                      onChange={e => setFormParentId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">-- Seleccionar Grupo --</option>
                      {gruposList.filter(g => g.activo).map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Centro de costo (solo Grupos) */}
                {activeTab === 'grupos' && (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Centro de Costo</label>
                    <input
                      type="text"
                      value={formContable.centroCosto || ''}
                      onChange={e => updContable('centroCosto', e.target.value)}
                      placeholder="Ej. 01 - JOYERÍA, CC-VENTAS"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox Activo */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 w-full sm:w-80 cursor-pointer hover:bg-slate-100/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={e => setFormActivo(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-700">Registro Activo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Se mostrará en selectores de productos</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Parametrización Contable (solo Grupos) ── */}
            {activeTab === 'grupos' && (
              <>
                {/* COMERCIAL */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
                  <SectionHeader
                    color="bg-emerald-600"
                    label="Comercial — Cuentas de Venta"
                    icon={<TrendingUp size={14} />}
                  />
                  <p className="text-[11px] text-slate-400">Cuentas PUC para el ciclo comercial: ventas, ingresos y devoluciones. Ingresa el código de cuenta y/o descripción.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PucAutocompleteInput label="Inventario Venta" value={formContable.inventarioVenta || ''} onChange={v => updContable('inventarioVenta', v)} allowedPrefixes={['1']} />
                    <PucAutocompleteInput label="Inventario Venta Reserva" value={formContable.inventarioVentaReserva || ''} onChange={v => updContable('inventarioVentaReserva', v)} allowedPrefixes={['1']} />
                    <PucAutocompleteInput label="Devolución de Venta (Inventario)" value={formContable.devolucionVentaInventario || ''} onChange={v => updContable('devolucionVentaInventario', v)} allowedPrefixes={['1']} />
                    <PucAutocompleteInput label="Ingreso en Ventas" value={formContable.ingresoEnVentas || ''} onChange={v => updContable('ingresoEnVentas', v)} allowedPrefixes={['4']} />
                    <PucAutocompleteInput label="Devolución en Ventas" value={formContable.devolucionEnVentas || ''} onChange={v => updContable('devolucionEnVentas', v)} allowedPrefixes={['4']} />
                    <PucAutocompleteInput label="Costo en Ventas (CMV)" value={formContable.costoEnVentas || ''} onChange={v => updContable('costoEnVentas', v)} allowedPrefixes={['6']} />
                    <PucAutocompleteInput label="Gasto Bonificado" value={formContable.gastoBonificado || ''} onChange={v => updContable('gastoBonificado', v)} allowedPrefixes={['5']} />
                  </div>
                </div>

                {/* INVENTARIOS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
                  <SectionHeader
                    color="bg-blue-700"
                    label="Inventarios — Cuentas de Compra y Ajuste"
                    icon={<ShoppingCart size={14} />}
                  />
                  <p className="text-[11px] text-slate-400">Cuentas PUC para el ciclo de compras, recepciones y ajustes de inventario físico.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PucAutocompleteInput label="Compras" value={formContable.compras || ''} onChange={v => updContable('compras', v)} allowedPrefixes={['1', '6']} />
                    <PucAutocompleteInput label="Devolución de Inventarios (Compras)" value={formContable.devolucionInventarios || ''} onChange={v => updContable('devolucionInventarios', v)} allowedPrefixes={['1', '6']} />
                    <PucAutocompleteInput label="Descuento en Compras" value={formContable.descuentoEnCompras || ''} onChange={v => updContable('descuentoEnCompras', v)} allowedPrefixes={['1', '4', '5', '6']} />
                    <PucAutocompleteInput label="Ajuste a Inventario (Faltante / Sobrante)" value={formContable.ajusteInventario || ''} onChange={v => updContable('ajusteInventario', v)} allowedPrefixes={['1', '4', '5', '6']} />
                    <PucAutocompleteInput label="Inventario Físico" value={formContable.inventarioFisico || ''} onChange={v => updContable('inventarioFisico', v)} allowedPrefixes={['1']} />
                  </div>
                </div>

                {/* PRODUCCIÓN */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
                  <SectionHeader
                    color="bg-slate-700"
                    label="Producción"
                    icon={<Settings size={14} />}
                  />
                  <p className="text-[11px] text-slate-400">Cuenta PUC para el costo de producción de productos fabricados o transformados.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PucAutocompleteInput label="Costo de Producción" value={formContable.costoDeProduccion || ''} onChange={v => updContable('costoDeProduccion', v)} allowedPrefixes={['7', '6']} />
                  </div>
                </div>

                {/* IMPUESTOS DE VENTA */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
                  <SectionHeader
                    color="bg-amber-500"
                    label="% Impuestos de Venta"
                    icon={<Percent size={14} />}
                  />
                  <p className="text-[11px] text-slate-400">Impuesto predeterminado aplicado a las ventas de productos en este grupo.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Impuesto Venta Principal</label>
                      <select
                        value={formContable.impuestoVenta || ''}
                        onChange={e => updContable('impuestoVenta', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Seleccionar --</option>
                        {systemTaxes.filter(t => t.estado === 'ACTIVO').map((t: any) => (
                          <option key={t.id} value={t.id}>{t.codigo ? `${t.codigo} - ` : ''}{t.nombre}</option>
                        ))}
                        <option value="exento">EXENTO</option>
                        <option value="excluido">EXCLUIDO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Impuesto Venta Alterno</label>
                      <select
                        value={formContable.impuestoVentaAlterno || ''}
                        onChange={e => updContable('impuestoVentaAlterno', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Ninguno --</option>
                        {systemTaxes.filter(t => t.estado === 'ACTIVO').map((t: any) => (
                          <option key={t.id} value={t.id}>{t.codigo ? `${t.codigo} - ` : ''}{t.nombre}</option>
                        ))}
                        <option value="exento">EXENTO</option>
                        <option value="excluido">EXCLUIDO</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* IMPUESTOS DE COMPRA */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
                  <SectionHeader
                    color="bg-slate-600"
                    label="% Impuestos de Compra"
                    icon={<Percent size={14} />}
                  />
                  <p className="text-[11px] text-slate-400">Selecciona los impuestos que aplican al comprar productos de este grupo.</p>
                  <div className="space-y-2">
                    {systemTaxes.filter(t => t.estado === 'ACTIVO').map((tax: any) => (
                      <label key={tax.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                        <input
                          type="checkbox"
                          checked={(formContable.impuestosCompra || []).includes(tax.id)}
                          onChange={() => toggleImpuestoCompra(tax.id)}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-700">{tax.nombre}</p>
                          <p className="text-[10px] text-slate-400">{tax.sigla} — Tarifa: {tax.tarifa}%</p>
                        </div>
                      </label>
                    ))}
                    {/* Opciones fijas */}
                    {[
                      { id: 'exento', label: 'EXENTO', desc: 'Compras exentas de IVA' },
                      { id: 'excluido', label: 'EXCLUIDO', desc: 'Producto excluido del régimen de IVA' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all">
                        <input
                          type="checkbox"
                          checked={(formContable.impuestosCompra || []).includes(opt.id)}
                          onChange={() => toggleImpuestoCompra(opt.id)}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-700">{opt.label}</p>
                          <p className="text-[10px] text-slate-400">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                    {systemTaxes.filter(t => t.estado === 'ACTIVO').length === 0 && (
                      <p className="text-xs text-slate-400 italic py-3 border border-dashed border-slate-200 rounded-xl text-center">
                        No hay impuestos configurados en Configuración → Impuestos.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
              >
                Guardar {currentTabConfig.label.slice(0, -1)}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
