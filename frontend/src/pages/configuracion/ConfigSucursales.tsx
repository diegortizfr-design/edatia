import { useState, useEffect, useMemo } from 'react'
import { Store, Plus, Search, Trash2, Edit3, CheckCircle2, SlidersHorizontal, MapPin } from 'lucide-react'

// ─── Interfaces de Estructura Geográfica (Lectura de Geolocalización) ────────

interface Pais {
  id: string;
  nombre: string;
  codigo: string;
  codigoDianExogena?: string;
  indicativoTelefonico?: string;
}

interface Departamento {
  id: string;
  nombre: string;
  paisId: string;
  codigoDian?: string;
}

interface Ciudad {
  id: string;
  nombre: string;
  departamentoId: string;
  codigoDian?: string;
}

interface Comuna {
  id: string;
  nombre: string;
  ciudadId: string;
}

interface Barrio {
  id: string;
  nombre: string;
  ciudadId: string;
  comunaId?: string;
}

interface GeolocationData {
  paises: Pais[];
  departamentos: Departamento[];
  ciudades: Ciudad[];
  comunas: Comuna[];
  barrios: Barrio[];
}

// Fallback de Datos Geográficos si no hay nada guardado en localstorage
const DEFAULT_GEO_DATA: GeolocationData = {
  paises: [
    { id: 'pais_co', nombre: 'Colombia', codigo: 'CO', codigoDianExogena: '169', indicativoTelefonico: '57' },
    { id: 'pais_es', nombre: 'España', codigo: 'ES', codigoDianExogena: '245', indicativoTelefonico: '34' },
    { id: 'pais_us', nombre: 'Estados Unidos', codigo: 'US', codigoDianExogena: '249', indicativoTelefonico: '1' }
  ],
  departamentos: [
    { id: 'dept_ant', nombre: 'Antioquia', paisId: 'pais_co', codigoDian: '05' },
    { id: 'dept_atl', nombre: 'Atlántico', paisId: 'pais_co', codigoDian: '08' },
    { id: 'dept_bog', nombre: 'Bogotá D.C.', paisId: 'pais_co', codigoDian: '11' },
    { id: 'dept_bol', nombre: 'Bolívar', paisId: 'pais_co', codigoDian: '13' },
    { id: 'dept_boy', nombre: 'Boyacá', paisId: 'pais_co', codigoDian: '15' },
    { id: 'dept_cal', nombre: 'Caldas', paisId: 'pais_co', codigoDian: '17' },
    { id: 'dept_caq', nombre: 'Caquetá', paisId: 'pais_co', codigoDian: '18' },
    { id: 'dept_cau', nombre: 'Cauca', paisId: 'pais_co', codigoDian: '19' },
    { id: 'dept_ces', nombre: 'Cesar', paisId: 'pais_co', codigoDian: '20' },
    { id: 'dept_cor', nombre: 'Córdoba', paisId: 'pais_co', codigoDian: '23' },
    { id: 'dept_cun', nombre: 'Cundinamarca', paisId: 'pais_co', codigoDian: '25' },
    { id: 'dept_cho', nombre: 'Chocó', paisId: 'pais_co', codigoDian: '27' },
    { id: 'dept_hui', nombre: 'Huila', paisId: 'pais_co', codigoDian: '41' },
    { id: 'dept_lag', nombre: 'La Guajira', paisId: 'pais_co', codigoDian: '44' },
    { id: 'dept_mag', nombre: 'Magdalena', paisId: 'pais_co', codigoDian: '47' },
    { id: 'dept_met', nombre: 'Meta', paisId: 'pais_co', codigoDian: '50' },
    { id: 'dept_nar', nombre: 'Nariño', paisId: 'pais_co', codigoDian: '52' },
    { id: 'dept_nsa', nombre: 'Norte de Santander', paisId: 'pais_co', codigoDian: '54' },
    { id: 'dept_qui', nombre: 'Quindío', paisId: 'pais_co', codigoDian: '63' },
    { id: 'dept_ris', nombre: 'Risaralda', paisId: 'pais_co', codigoDian: '66' },
    { id: 'dept_san', nombre: 'Santander', paisId: 'pais_co', codigoDian: '68' },
    { id: 'dept_suc', nombre: 'Sucre', paisId: 'pais_co', codigoDian: '70' },
    { id: 'dept_tol', nombre: 'Tolima', paisId: 'pais_co', codigoDian: '73' },
    { id: 'dept_val', nombre: 'Valle del Cauca', paisId: 'pais_co', codigoDian: '76' },
    { id: 'dept_ara', nombre: 'Arauca', paisId: 'pais_co', codigoDian: '81' },
    { id: 'dept_cas', nombre: 'Casanare', paisId: 'pais_co', codigoDian: '85' },
    { id: 'dept_put', nombre: 'Putumayo', paisId: 'pais_co', codigoDian: '86' },
    { id: 'dept_sap', nombre: 'San Andrés y Providencia', paisId: 'pais_co', codigoDian: '88' },
    { id: 'dept_ama', nombre: 'Amazonas', paisId: 'pais_co', codigoDian: '91' },
    { id: 'dept_gua', nombre: 'Guainía', paisId: 'pais_co', codigoDian: '94' },
    { id: 'dept_guv', nombre: 'Guaviare', paisId: 'pais_co', codigoDian: '95' },
    { id: 'dept_vau', nombre: 'Vaupés', paisId: 'pais_co', codigoDian: '97' },
    { id: 'dept_vic', nombre: 'Vichada', paisId: 'pais_co', codigoDian: '99' },
    { id: 'dept_mad', nombre: 'Madrid', paisId: 'pais_es', codigoDian: 'MAD' },
    { id: 'dept_flo', nombre: 'Florida', paisId: 'pais_us', codigoDian: 'FL' }
  ],
  ciudades: [
    { id: 'city_med', nombre: 'Medellín', departamentoId: 'dept_ant', codigoDian: '05001' },
    { id: 'city_env', nombre: 'Envigado', departamentoId: 'dept_ant', codigoDian: '05266' },
    { id: 'city_sab', nombre: 'Sabaneta', departamentoId: 'dept_ant', codigoDian: '05631' },
    { id: 'city_ita', nombre: 'Itagüí', departamentoId: 'dept_ant', codigoDian: '05360' },
    { id: 'city_rio', nombre: 'Rionegro', departamentoId: 'dept_ant', codigoDian: '05615' },
    { id: 'city_bel', nombre: 'Bello', departamentoId: 'dept_ant', codigoDian: '05088' },
    { id: 'city_bar', nombre: 'Barranquilla', departamentoId: 'dept_atl', codigoDian: '08001' },
    { id: 'city_sol', nombre: 'Soledad', departamentoId: 'dept_atl', codigoDian: '08758' },
    { id: 'city_bog', nombre: 'Bogotá D.C.', departamentoId: 'dept_bog', codigoDian: '11001' },
    { id: 'city_car', nombre: 'Cartagena de Indias', departamentoId: 'dept_bol', codigoDian: '13001' },
    { id: 'city_tun', nombre: 'Tunja', departamentoId: 'dept_boy', codigoDian: '15001' },
    { id: 'city_man', nombre: 'Manizales', departamentoId: 'dept_cal', codigoDian: '17001' },
    { id: 'city_flo_c', nombre: 'Florencia', departamentoId: 'dept_caq', codigoDian: '18001' },
    { id: 'city_pop', nombre: 'Popayán', departamentoId: 'dept_cau', codigoDian: '19001' },
    { id: 'city_val_m', nombre: 'Valledupar', departamentoId: 'dept_ces', codigoDian: '20001' },
    { id: 'city_mon', nombre: 'Montería', departamentoId: 'dept_cor', codigoDian: '23001' },
    { id: 'city_agd', nombre: 'Agua de Dios', departamentoId: 'dept_cun', codigoDian: '25001' },
    { id: 'city_soa', nombre: 'Soacha', departamentoId: 'dept_cun', codigoDian: '25754' },
    { id: 'city_chi', nombre: 'Chía', departamentoId: 'dept_cun', codigoDian: '25175' },
    { id: 'city_zip', nombre: 'Zipaquirá', departamentoId: 'dept_cun', codigoDian: '25899' },
    { id: 'city_fac', nombre: 'Facatativá', departamentoId: 'dept_cun', codigoDian: '25269' },
    { id: 'city_qui_c', nombre: 'Quibdó', departamentoId: 'dept_cho', codigoDian: '27001' },
    { id: 'city_nei', nombre: 'Neiva', departamentoId: 'dept_hui', codigoDian: '41001' },
    { id: 'city_rio_h', nombre: 'Riohacha', departamentoId: 'dept_lag', codigoDian: '44001' },
    { id: 'city_sam', nombre: 'Santa Marta', departamentoId: 'dept_mag', codigoDian: '47001' },
    { id: 'city_vil', nombre: 'Villavicencio', departamentoId: 'dept_met', codigoDian: '50001' },
    { id: 'city_pas', nombre: 'Pasto', departamentoId: 'dept_nar', codigoDian: '52001' },
    { id: 'city_cuc', nombre: 'Cúcuta', departamentoId: 'dept_nsa', codigoDian: '54001' },
    { id: 'city_arm', nombre: 'Armenia', departamentoId: 'dept_qui', codigoDian: '63001' },
    { id: 'city_per', nombre: 'Pereira', departamentoId: 'dept_ris', codigoDian: '66001' },
    { id: 'city_buc', nombre: 'Bucaramanga', departamentoId: 'dept_san', codigoDian: '68001' },
    { id: 'city_flo_s', nombre: 'Floridablanca', departamentoId: 'dept_san', codigoDian: '68276' },
    { id: 'city_bbc', nombre: 'Barrancabermeja', departamentoId: 'dept_san', codigoDian: '68081' },
    { id: 'city_sin', nombre: 'Sincelejo', departamentoId: 'dept_suc', codigoDian: '70001' },
    { id: 'city_iba', nombre: 'Ibagué', departamentoId: 'dept_tol', codigoDian: '73001' },
    { id: 'city_cal', nombre: 'Cali', departamentoId: 'dept_val', codigoDian: '76001' },
    { id: 'city_pal', nombre: 'Palmira', departamentoId: 'dept_val', codigoDian: '76520' },
    { id: 'city_bue', nombre: 'Buenaventura', departamentoId: 'dept_val', codigoDian: '76109' },
    { id: 'city_ara_c', nombre: 'Arauca', departamentoId: 'dept_ara', codigoDian: '81001' },
    { id: 'city_yop', nombre: 'Yopal', departamentoId: 'dept_cas', codigoDian: '85001' },
    { id: 'city_moc', nombre: 'Mocoa', departamentoId: 'dept_put', codigoDian: '86001' },
    { id: 'city_san_c', nombre: 'San Andrés', departamentoId: 'dept_sap', codigoDian: '88001' },
    { id: 'city_let', nombre: 'Leticia', departamentoId: 'dept_ama', codigoDian: '91001' },
    { id: 'city_ini', nombre: 'Inírida', departamentoId: 'dept_gua', codigoDian: '94001' },
    { id: 'city_sjg', nombre: 'San José del Guaviare', departamentoId: 'dept_guv', codigoDian: '95001' },
    { id: 'city_mit', nombre: 'Mitú', departamentoId: 'dept_vau', codigoDian: '97001' },
    { id: 'city_pau', nombre: 'Puerto Carreño', departamentoId: 'dept_vic', codigoDian: '99001' },
    { id: 'city_mad', nombre: 'Madrid', departamentoId: 'dept_mad', codigoDian: '28079' },
    { id: 'city_mia', nombre: 'Miami', departamentoId: 'dept_flo', codigoDian: '12086' }
  ],
  comunas: [
    { id: 'com_pob', nombre: 'Comuna 14 - El Poblado', ciudadId: 'city_med' },
    { id: 'com_lau', nombre: 'Comuna 11 - Laureles', ciudadId: 'city_med' },
    { id: 'com_bel', nombre: 'Comuna 16 - Belén', ciudadId: 'city_med' }
  ],
  barrios: [
    { id: 'bar_pob', nombre: 'El Poblado', ciudadId: 'city_med', comunaId: 'com_pob' },
    { id: 'bar_pro', nombre: 'Provenza', ciudadId: 'city_med', comunaId: 'com_pob' },
    { id: 'bar_man', nombre: 'Manila', ciudadId: 'city_med', comunaId: 'com_pob' },
    { id: 'bar_lau', nombre: 'Laureles', ciudadId: 'city_med', comunaId: 'com_pob' },
    { id: 'bar_bel', nombre: 'Belén', ciudadId: 'city_med', comunaId: 'com_bel' }
  ]
};

// ─── Interfaces de Sucursales ───────────────────────────────────────────────

interface SucursalConfig {
  id: string;
  codigo: string; // muy importante
  nombre: string;
  correo?: string;
  paisId: string;
  departamentoId: string;
  ciudadId: string;
  barrioId: string;
  direccion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

const DEFAULT_SUCURSALES: SucursalConfig[] = [
  {
    id: 'suc_principal',
    codigo: 'B1',
    nombre: 'Sucursal Principal Poblado',
    correo: 'principal@edatia.com',
    paisId: 'pais_co',
    departamentoId: 'dept_ant',
    ciudadId: 'city_med',
    barrioId: 'bar_pob',
    direccion: 'Calle 10 # 43A - 50',
    estado: 'ACTIVO'
  },
  {
    id: 'suc_centro',
    codigo: 'B2',
    nombre: 'Sucursal Laureles',
    correo: 'laureles@edatia.com',
    paisId: 'pais_co',
    departamentoId: 'dept_ant',
    ciudadId: 'city_med',
    barrioId: 'bar_lau',
    direccion: 'Avenida Nutibara # 74 - 20',
    estado: 'ACTIVO'
  }
];

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

function Select({ value, onChange, options, disabled = false }: { value: string; onChange: (v: any) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigSucursales() {
  const [sucursales, setSucursales] = useState<SucursalConfig[]>([])
  const [geoData, setGeoData] = useState<GeolocationData>(DEFAULT_GEO_DATA)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<SucursalConfig>>({})

  // Cargar sucursales y geolocalización desde localStorage
  useEffect(() => {
    // 1. Geolocalización
    const savedGeo = localStorage.getItem('edatia_config_geolocalizacion')
    if (savedGeo) {
      try {
        setGeoData(JSON.parse(savedGeo))
      } catch (e) {
        setGeoData(DEFAULT_GEO_DATA)
      }
    } else {
      setGeoData(DEFAULT_GEO_DATA)
    }

    // 2. Sucursales
    const savedSuc = localStorage.getItem('edatia_config_sucursales')
    if (savedSuc) {
      try {
        setSucursales(JSON.parse(savedSuc))
      } catch (e) {
        setSucursales(DEFAULT_SUCURSALES)
      }
    } else {
      setSucursales(DEFAULT_SUCURSALES)
      localStorage.setItem('edatia_config_sucursales', JSON.stringify(DEFAULT_SUCURSALES))
    }
  }, [])

  const saveToLocalStorage = (items: SucursalConfig[]) => {
    setSucursales(items)
    localStorage.setItem('edatia_config_sucursales', JSON.stringify(items))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  // Filtrado de geolocalización para cascada del formulario
  const filteredDepts = useMemo(() => {
    if (!form.paisId) return []
    return geoData.departamentos.filter(d => d.paisId === form.paisId)
  }, [form.paisId, geoData.departamentos])

  const filteredCities = useMemo(() => {
    if (!form.departamentoId) return []
    return geoData.ciudades.filter(c => c.departamentoId === form.departamentoId)
  }, [form.departamentoId, geoData.ciudades])

  const filteredBarrios = useMemo(() => {
    if (!form.ciudadId) return []
    return geoData.barrios.filter(b => b.ciudadId === form.ciudadId)
  }, [form.ciudadId, geoData.barrios])

  const handleOpenNew = () => {
    setEditingId(null)
    const firstPais = geoData.paises[0]?.id || ''
    const deptsOfPais = geoData.departamentos.filter(d => d.paisId === firstPais)
    const firstDept = deptsOfPais[0]?.id || ''
    const citiesOfDept = geoData.ciudades.filter(c => c.departamentoId === firstDept)
    const firstCity = citiesOfDept[0]?.id || ''
    const barriosOfCity = geoData.barrios.filter(b => b.ciudadId === firstCity)
    const firstBarrio = barriosOfCity[0]?.id || ''

    setForm({
      codigo: '',
      nombre: '',
      correo: '',
      paisId: firstPais,
      departamentoId: firstDept,
      ciudadId: firstCity,
      barrioId: firstBarrio,
      direccion: '',
      estado: 'ACTIVO'
    })
    setViewMode('form')
  }

  const handleOpenEdit = (suc: SucursalConfig) => {
    setEditingId(suc.id)
    setForm({ ...suc })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    const isBase = DEFAULT_SUCURSALES.some(s => s.id === id)
    if (isBase) {
      alert('Las sucursales base del sistema no pueden ser eliminadas, solo inhabilitadas.')
      return
    }
    if (window.confirm('¿Está seguro de que desea eliminar esta sucursal? Esta acción no se puede deshacer.')) {
      const updated = sucursales.filter(s => s.id !== id)
      saveToLocalStorage(updated)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo || !form.nombre || !form.direccion || !form.paisId || !form.departamentoId || !form.ciudadId) {
      alert('Todos los campos marcados con asterisco (*) son obligatorios.')
      return
    }

    let updated: SucursalConfig[]
    if (editingId) {
      updated = sucursales.map(s => (s.id === editingId ? { ...s, ...form } as SucursalConfig : s))
    } else {
      const newId = `suc_${Date.now()}`
      const newSuc: SucursalConfig = {
        ...form,
        id: newId,
        codigo: form.codigo!.toUpperCase(),
        nombre: form.nombre!,
        correo: form.correo || '',
        paisId: form.paisId!,
        departamentoId: form.departamentoId!,
        ciudadId: form.ciudadId!,
        barrioId: form.barrioId || '',
        direccion: form.direccion!,
        estado: form.estado || 'ACTIVO'
      } as SucursalConfig
      updated = [...sucursales, newSuc]
    }

    saveToLocalStorage(updated)
    setViewMode('form')
    setViewMode('list')
  }

  const filteredSucursales = sucursales.filter(s =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    s.codigo.toLowerCase().includes(search.toLowerCase()) ||
    s.direccion.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Sucursales</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Store size={24} className="text-indigo-600" />
                Configuración de Sucursales
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Administración de sucursales, ubicaciones operativas, direcciones y códigos de establecimientos comerciales.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAlert && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold animate-bounce">
                  <CheckCircle2 size={16} /> Configuración actualizada
                </div>
              )}
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Crear Sucursal
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
              <MapPin size={14} className="flex-shrink-0" />
              <span>Sucursales Activas: <span className="font-extrabold">{sucursales.filter(s => s.estado === 'ACTIVO').length}</span></span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre o dirección..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de Sucursal</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Física</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Geográfica</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSucursales.length > 0 ? (
                    filteredSucursales.map(suc => {
                      const paisName = geoData.paises.find(p => p.id === suc.paisId)?.nombre || 'Desconocido'
                      const deptName = geoData.departamentos.find(d => d.id === suc.departamentoId)?.nombre || 'Desconocido'
                      const cityName = geoData.ciudades.find(c => c.id === suc.ciudadId)?.nombre || 'Desconocido'
                      const barrioName = geoData.barrios.find(b => b.id === suc.barrioId)?.nombre || ''

                      return (
                        <tr key={suc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-indigo-600">
                            {suc.codigo}
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-800">{suc.nombre}</div>
                            {suc.correo && (
                              <div className="text-xs text-slate-400 font-normal mt-0.5">{suc.correo}</div>
                            )}
                          </td>

                          <td className="p-4 text-slate-600">
                            {suc.direccion}
                          </td>

                          <td className="p-4 text-slate-500 text-xs">
                            <div className="font-semibold text-slate-700">{cityName}, {deptName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{barrioName ? `${barrioName} | ` : ''}{paisName}</div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                              suc.estado === 'ACTIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${suc.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {suc.estado}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(suc)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar sucursal"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(suc.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar sucursal"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No se encontraron sucursales registradas.
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
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Sucursales</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Sucursal' : 'Crear Sucursal'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Completa los datos de ubicación y asignación de código del establecimiento comercial.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <Field label="Código de Sucursal *">
                    <Input
                      value={form.codigo}
                      onChange={(v: string) => setForm(f => ({ ...f, codigo: v }))}
                      placeholder="Ej. SUC01"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Nombre de Sucursal *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. Sucursal Medellín Norte"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Correo Electrónico">
                    <Input
                      type="email"
                      value={form.correo}
                      onChange={(v: string) => setForm(f => ({ ...f, correo: v }))}
                      placeholder="Ej. correo@sucursal.com"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Estado">
                    <Select
                      value={form.estado || 'ACTIVO'}
                      onChange={(v) => setForm(f => ({ ...f, estado: v }))}
                      options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' }
                      ]}
                    />
                  </Field>
                </div>

                {/* SELECTORES CASCADA GEOGRÁFICA */}
                <div className="md:col-span-3">
                  <Field label="País *">
                    <Select
                      value={form.paisId || ''}
                      onChange={(v) => {
                        const deptsOfPais = geoData.departamentos.filter(d => d.paisId === v)
                        const firstDept = deptsOfPais[0]?.id || ''
                        const citiesOfDept = geoData.ciudades.filter(c => c.departamentoId === firstDept)
                        const firstCity = citiesOfDept[0]?.id || ''
                        const barriosOfCity = geoData.barrios.filter(b => b.ciudadId === firstCity)
                        const firstBarrio = barriosOfCity[0]?.id || ''

                        setForm(f => ({
                          ...f,
                          paisId: v,
                          departamentoId: firstDept,
                          ciudadId: firstCity,
                          barrioId: firstBarrio
                        }))
                      }}
                      options={geoData.paises.map(p => ({ value: p.id, label: p.nombre }))}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Departamento *">
                    <Select
                      value={form.departamentoId || ''}
                      disabled={filteredDepts.length === 0}
                      onChange={(v) => {
                        const citiesOfDept = geoData.ciudades.filter(c => c.departamentoId === v)
                        const firstCity = citiesOfDept[0]?.id || ''
                        const barriosOfCity = geoData.barrios.filter(b => b.ciudadId === firstCity)
                        const firstBarrio = barriosOfCity[0]?.id || ''

                        setForm(f => ({
                          ...f,
                          departamentoId: v,
                          ciudadId: firstCity,
                          barrioId: firstBarrio
                        }))
                      }}
                      options={filteredDepts.length > 0 
                        ? filteredDepts.map(d => ({ value: d.id, label: d.nombre }))
                        : [{ value: '', label: '-- Sin Departamentos --' }]
                      }
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Ciudad / Municipio *">
                    <Select
                      value={form.ciudadId || ''}
                      disabled={filteredCities.length === 0}
                      onChange={(v) => {
                        const barriosOfCity = geoData.barrios.filter(b => b.ciudadId === v)
                        const firstBarrio = barriosOfCity[0]?.id || ''

                        setForm(f => ({
                          ...f,
                          ciudadId: v,
                          barrioId: firstBarrio
                        }))
                      }}
                      options={filteredCities.length > 0 
                        ? filteredCities.map(c => ({ value: c.id, label: c.nombre }))
                        : [{ value: '', label: '-- Sin Ciudades --' }]
                      }
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Barrio">
                    <Select
                      value={form.barrioId || ''}
                      disabled={filteredBarrios.length === 0}
                      onChange={(v) => setForm(f => ({ ...f, barrioId: v }))}
                      options={filteredBarrios.length > 0 
                        ? [
                            { value: '', label: '-- Ninguno / No aplica --' },
                            ...filteredBarrios.map(b => ({ value: b.id, label: b.nombre }))
                          ]
                        : [{ value: '', label: '-- Sin Barrios --' }]
                      }
                    />
                  </Field>
                </div>

                <div className="col-span-12 w-full" style={{ gridColumn: '1 / -1' }}>
                  <Field label="Dirección Física Completa *">
                    <Input
                      value={form.direccion}
                      onChange={(v: string) => setForm(f => ({ ...f, direccion: v }))}
                      placeholder="Ej. Calle 50 # 80 - 45 Oficina 301"
                    />
                  </Field>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
