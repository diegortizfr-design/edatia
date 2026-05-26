import { useState, useEffect } from 'react'
import { Globe, Plus, Search, Trash2, Edit3, CheckCircle2, SlidersHorizontal, MapPin, RefreshCw } from 'lucide-react'

// ─── Interfaces y Estructuras de Datos ────────────────────────────────────────

interface Pais {
  id: string;
  nombre: string;
  codigo: string; // ej. CO, ES, US (Código ISO Alfa-2)
  codigoDianExogena: string; // ej. 169 (Código exógena de la DIAN)
  indicativoTelefonico: string; // ej. 57
}

interface Departamento {
  id: string;
  nombre: string;
  paisId: string;
  codigoDian: string; // Código DIVIPOLA de 2 dígitos
}

interface Ciudad {
  id: string;
  nombre: string;
  departamentoId: string;
  codigoDian: string; // Código DIVIPOLA de 5 dígitos
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
  comunaId?: string; // opcional
}

interface GeolocationState {
  paises: Pais[];
  departamentos: Departamento[];
  ciudades: Ciudad[];
  comunas: Comuna[];
  barrios: Barrio[];
}

const DEFAULT_GEO_DATA: GeolocationState = {
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

type GeoLevel = 'PAISES' | 'DEPARTAMENTOS' | 'CIUDADES' | 'COMUNAS' | 'BARRIOS';

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

function Select({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigGeolocalizacion() {
  const [data, setData] = useState<GeolocationState>({ paises: [], departamentos: [], ciudades: [], comunas: [], barrios: [] })
  const [activeLevel, setActiveLevel] = useState<GeoLevel>('PAISES')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estados de Formulario de Creación/Edición
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formPais, setFormPais] = useState<Partial<Pais>>({})
  const [formDept, setFormDept] = useState<Partial<Departamento>>({})
  const [formCity, setFormCity] = useState<Partial<Ciudad>>({})
  const [formComuna, setFormComuna] = useState<Partial<Comuna>>({})
  const [formBarrio, setFormBarrio] = useState<Partial<Barrio>>({})

  useEffect(() => {
    const saved = localStorage.getItem('edatia_config_geolocalizacion')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Migración y saneamiento para clientes con datos antiguos
        const sanitizedPaises = (parsed.paises || []).map((p: any) => ({
          ...p,
          codigoDianExogena: p.codigoDianExogena || (p.codigo === 'CO' ? '169' : p.codigo === 'ES' ? '245' : p.codigo === 'US' ? '249' : ''),
          indicativoTelefonico: p.indicativoTelefonico || (p.codigo === 'CO' ? '57' : p.codigo === 'ES' ? '34' : p.codigo === 'US' ? '1' : '')
        }))
        const sanitizedDeptos = (parsed.departamentos || []).map((d: any) => ({
          ...d,
          codigoDian: d.codigoDian || ''
        }))
        const sanitizedCiudades = (parsed.ciudades || []).map((c: any) => ({
          ...c,
          codigoDian: c.codigoDian || ''
        }))

        setData({
          paises: sanitizedPaises,
          departamentos: sanitizedDeptos,
          ciudades: sanitizedCiudades,
          comunas: parsed.comunas || [],
          barrios: parsed.barrios || []
        })
      } catch (e) {
        setData(DEFAULT_GEO_DATA)
      }
    } else {
      setData(DEFAULT_GEO_DATA)
      localStorage.setItem('edatia_config_geolocalizacion', JSON.stringify(DEFAULT_GEO_DATA))
    }
  }, [])

  const saveToLocalStorage = (newState: GeolocationState) => {
    setData(newState)
    localStorage.setItem('edatia_config_geolocalizacion', JSON.stringify(newState))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  // Resetear filtros al cambiar de pestaña
  useEffect(() => {
    setSearch('')
    setViewMode('list')
  }, [activeLevel])

  const handleResetTemplate = () => {
    if (window.confirm('¿Está seguro de restablecer los datos a la plantilla oficial de Colombia (32 departamentos y capitales)? Se perderán los registros modificados actualmente.')) {
      saveToLocalStorage(DEFAULT_GEO_DATA)
    }
  }

  // Abrir Formularios
  const handleOpenNew = () => {
    setEditingId(null)
    if (activeLevel === 'PAISES') setFormPais({ nombre: '', codigo: '', codigoDianExogena: '', indicativoTelefonico: '' })
    if (activeLevel === 'DEPARTAMENTOS') setFormDept({ nombre: '', paisId: data.paises[0]?.id || '', codigoDian: '' })
    if (activeLevel === 'CIUDADES') setFormCity({ nombre: '', departamentoId: data.departamentos[0]?.id || '', codigoDian: '' })
    if (activeLevel === 'COMUNAS') setFormComuna({ nombre: '', ciudadId: data.ciudades[0]?.id || '' })
    if (activeLevel === 'BARRIOS') {
      const firstCityId = data.ciudades[0]?.id || ''
      const relatedComunas = data.comunas.filter(c => c.ciudadId === firstCityId)
      setFormBarrio({ nombre: '', ciudadId: firstCityId, comunaId: relatedComunas[0]?.id || '' })
    }
    setViewMode('form')
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    if (activeLevel === 'PAISES') setFormPais({ codigoDianExogena: '', indicativoTelefonico: '', ...item })
    if (activeLevel === 'DEPARTAMENTOS') setFormDept({ codigoDian: '', ...item })
    if (activeLevel === 'CIUDADES') setFormCity({ codigoDian: '', ...item })
    if (activeLevel === 'COMUNAS') setFormComuna({ ...item })
    if (activeLevel === 'BARRIOS') setFormBarrio({ ...item })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      const newState = { ...data }
      if (activeLevel === 'PAISES') {
        // Validación de llaves foráneas en cascada local
        const hasChild = data.departamentos.some(d => d.paisId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene departamentos asociados.')
        newState.paises = data.paises.filter(p => p.id !== id)
      }
      if (activeLevel === 'DEPARTAMENTOS') {
        const hasChild = data.ciudades.some(c => c.departamentoId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene ciudades asociadas.')
        newState.departamentos = data.departamentos.filter(d => d.id !== id)
      }
      if (activeLevel === 'CIUDADES') {
        const hasChild = data.comunas.some(c => c.ciudadId === id) || data.barrios.some(b => b.ciudadId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene comunas o barrios asociados.')
        newState.ciudades = data.ciudades.filter(c => c.id !== id)
      }
      if (activeLevel === 'COMUNAS') {
        const hasChild = data.barrios.some(b => b.comunaId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene barrios asociados.')
        newState.comunas = data.comunas.filter(c => c.id !== id)
      }
      if (activeLevel === 'BARRIOS') {
        newState.barrios = data.barrios.filter(b => b.id !== id)
      }
      saveToLocalStorage(newState)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const newState = { ...data }

    if (activeLevel === 'PAISES') {
      if (!formPais.nombre || !formPais.codigo || !formPais.codigoDianExogena || !formPais.indicativoTelefonico) {
        return alert('Nombre, Código ISO, Código DIAN e Indicativo son obligatorios.')
      }
      if (editingId) {
        newState.paises = data.paises.map(p => p.id === editingId ? { ...p, ...formPais } as Pais : p)
      } else {
        newState.paises = [...data.paises, { id: `pais_${Date.now()}`, ...formPais } as Pais]
      }
    }
    if (activeLevel === 'DEPARTAMENTOS') {
      if (!formDept.nombre || !formDept.paisId || !formDept.codigoDian) {
        return alert('Nombre, País y Código DIAN/DIVIPOLA son obligatorios.')
      }
      if (editingId) {
        newState.departamentos = data.departamentos.map(d => d.id === editingId ? { ...d, ...formDept } as Departamento : d)
      } else {
        newState.departamentos = [...data.departamentos, { id: `dept_${Date.now()}`, ...formDept } as Departamento]
      }
    }
    if (activeLevel === 'CIUDADES') {
      if (!formCity.nombre || !formCity.departamentoId || !formCity.codigoDian) {
        return alert('Nombre, Departamento y Código DIAN/DIVIPOLA son obligatorios.')
      }
      if (editingId) {
        newState.ciudades = data.ciudades.map(c => c.id === editingId ? { ...c, ...formCity } as Ciudad : c)
      } else {
        newState.ciudades = [...data.ciudades, { id: `city_${Date.now()}`, ...formCity } as Ciudad]
      }
    }
    if (activeLevel === 'COMUNAS') {
      if (!formComuna.nombre || !formComuna.ciudadId) return alert('Nombre y Ciudad son obligatorios.')
      if (editingId) {
        newState.comunas = data.comunas.map(c => c.id === editingId ? { ...c, ...formComuna } as Comuna : c)
      } else {
        newState.comunas = [...data.comunas, { id: `com_${Date.now()}`, ...formComuna } as Comuna]
      }
    }
    if (activeLevel === 'BARRIOS') {
      if (!formBarrio.nombre || !formBarrio.ciudadId) return alert('Nombre y Ciudad son obligatorios.')
      if (editingId) {
        newState.barrios = data.barrios.map(b => b.id === editingId ? { ...b, ...formBarrio } as Barrio : b)
      } else {
        newState.barrios = [...data.barrios, { id: `bar_${Date.now()}`, ...formBarrio } as Barrio]
      }
    }

    saveToLocalStorage(newState)
    setViewMode('list')
  }

  // Filtrado de Datos
  const getFilteredItems = () => {
    const s = search.toLowerCase()
    if (activeLevel === 'PAISES') {
      return data.paises.filter(p => 
        p.nombre.toLowerCase().includes(s) || 
        p.codigo.toLowerCase().includes(s) ||
        (p.codigoDianExogena || '').toLowerCase().includes(s) ||
        (p.indicativoTelefonico || '').toLowerCase().includes(s)
      )
    }
    if (activeLevel === 'DEPARTAMENTOS') {
      return data.departamentos.filter(d => {
        const country = data.paises.find(p => p.id === d.paisId)?.nombre || ''
        return d.nombre.toLowerCase().includes(s) || country.toLowerCase().includes(s) || (d.codigoDian || '').toLowerCase().includes(s)
      })
    }
    if (activeLevel === 'CIUDADES') {
      return data.ciudades.filter(c => {
        const dept = data.departamentos.find(d => d.id === c.departamentoId)?.nombre || ''
        return c.nombre.toLowerCase().includes(s) || dept.toLowerCase().includes(s) || (c.codigoDian || '').toLowerCase().includes(s)
      })
    }
    if (activeLevel === 'COMUNAS') {
      return data.comunas.filter(c => {
        const city = data.ciudades.find(ci => ci.id === c.ciudadId)?.nombre || ''
        return c.nombre.toLowerCase().includes(s) || city.toLowerCase().includes(s)
      })
    }
    if (activeLevel === 'BARRIOS') {
      return data.barrios.filter(b => {
        const city = data.ciudades.find(ci => ci.id === b.ciudadId)?.nombre || ''
        const comuna = data.comunas.find(co => co.id === b.comunaId)?.nombre || ''
        return b.nombre.toLowerCase().includes(s) || city.toLowerCase().includes(s) || comuna.toLowerCase().includes(s)
      })
    }
    return []
  }

  const filteredItems = getFilteredItems()

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
                <span className="text-slate-600 font-medium">Geolocalización</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Globe size={24} className="text-indigo-600" />
                Configuración de Geolocalización
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Administra la estructura geográfica del sistema para clientes, proveedores y envíos logísticos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAlert && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold animate-bounce">
                  <CheckCircle2 size={16} /> Configuración actualizada
                </div>
              )}
              <button
                onClick={handleResetTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                title="Restablecer a la plantilla oficial con todos los departamentos y capitales"
              >
                <RefreshCw size={14} className="text-slate-500 animate-spin-hover" />
                Cargar Plantilla
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Crear Registro
              </button>
            </div>
          </div>

          {/* Level Tabs Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-0.5">
            <nav className="flex items-center gap-6 overflow-x-auto custom-scrollbar scrollbar-none pb-2 sm:pb-0">
              {(['PAISES', 'DEPARTAMENTOS', 'CIUDADES', 'COMUNAS', 'BARRIOS'] as GeoLevel[]).map(lvl => {
                const isActive = activeLevel === lvl
                return (
                  <button
                    key={lvl}
                    onClick={() => setActiveLevel(lvl)}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                      isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lvl.toLowerCase()}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                  </button>
                )
              })}
            </nav>

            <div className="relative w-full sm:w-72 pb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Buscar en ${activeLevel.toLowerCase()}...`}
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                    {activeLevel === 'PAISES' && (
                      <>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código ISO</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código DIAN</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Indicativo Tel.</th>
                      </>
                    )}
                    {activeLevel === 'DEPARTAMENTOS' && (
                      <>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código DIVIPOLA</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">País</th>
                      </>
                    )}
                    {activeLevel === 'CIUDADES' && (
                      <>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código DIVIPOLA</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento</th>
                      </>
                    )}
                    {activeLevel === 'COMUNAS' && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ciudad</th>}
                    {activeLevel === 'BARRIOS' && (
                      <>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ciudad</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comuna / Localidad</th>
                      </>
                    )}
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          {item.nombre}
                        </td>

                        {activeLevel === 'PAISES' && (
                          <>
                            <td className="p-4 font-mono font-bold text-slate-600">{item.codigo}</td>
                            <td className="p-4 font-mono text-slate-600">{item.codigoDianExogena || '-'}</td>
                            <td className="p-4 font-mono text-slate-600">+{item.indicativoTelefonico || ''}</td>
                          </>
                        )}

                        {activeLevel === 'DEPARTAMENTOS' && (
                          <>
                            <td className="p-4 font-mono text-slate-600">{item.codigoDian || '-'}</td>
                            <td className="p-4 text-slate-600">
                              {data.paises.find(p => p.id === item.paisId)?.nombre || 'Desconocido'}
                            </td>
                          </>
                        )}

                        {activeLevel === 'CIUDADES' && (
                          <>
                            <td className="p-4 font-mono text-slate-600">{item.codigoDian || '-'}</td>
                            <td className="p-4 text-slate-600">
                              {data.departamentos.find(d => d.id === item.departamentoId)?.nombre || 'Desconocido'}
                            </td>
                          </>
                        )}

                        {activeLevel === 'COMUNAS' && (
                          <td className="p-4 text-slate-600">
                            {data.ciudades.find(c => c.id === item.ciudadId)?.nombre || 'Desconocido'}
                          </td>
                        )}

                        {activeLevel === 'BARRIOS' && (
                          <>
                            <td className="p-4 text-slate-600">
                              {data.ciudades.find(c => c.id === item.ciudadId)?.nombre || 'Desconocido'}
                            </td>
                            <td className="p-4 text-slate-500">
                              {data.comunas.find(co => co.id === item.comunaId)?.nombre || <span className="text-slate-300 italic">No aplica</span>}
                            </td>
                          </>
                        )}

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No se encontraron registros en este nivel.
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Geolocalización</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium capitalize">{activeLevel.toLowerCase()}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? `Editar ${activeLevel.slice(0, -1).toLowerCase()}` : `Crear ${activeLevel.slice(0, -1).toLowerCase()}`}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Ingresa los datos para la ubicación geográfica.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* FORM PAISES */}
                {activeLevel === 'PAISES' && (
                  <>
                    <div className="md:col-span-4">
                      <Field label="Nombre del País *">
                        <Input
                          value={formPais.nombre}
                          onChange={(v: string) => setFormPais(f => ({ ...f, nombre: v }))}
                          placeholder="Ej. Colombia"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Código ISO (Sigla) *">
                        <Input
                          value={formPais.codigo}
                          onChange={(v: string) => setFormPais(f => ({ ...f, codigo: v }))}
                          placeholder="Ej. CO"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-3">
                      <Field label="Código DIAN Exógena *">
                        <Input
                          value={formPais.codigoDianExogena}
                          onChange={(v: string) => setFormPais(f => ({ ...f, codigoDianExogena: v }))}
                          placeholder="Ej. 169"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-3">
                      <Field label="Indicativo Telefónico *">
                        <Input
                          value={formPais.indicativoTelefonico}
                          onChange={(v: string) => setFormPais(f => ({ ...f, indicativoTelefonico: v }))}
                          placeholder="Ej. 57"
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* FORM DEPARTAMENTOS */}
                {activeLevel === 'DEPARTAMENTOS' && (
                  <>
                    <div className="md:col-span-4">
                      <Field label="Nombre del Departamento *">
                        <Input
                          value={formDept.nombre}
                          onChange={(v: string) => setFormDept(f => ({ ...f, nombre: v }))}
                          placeholder="Ej. Antioquia"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Código DIAN/DIVIPOLA (2 dígitos) *">
                        <Input
                          value={formDept.codigoDian}
                          onChange={(v: string) => setFormDept(f => ({ ...f, codigoDian: v }))}
                          placeholder="Ej. 05"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="País Asociado *">
                        <Select
                          value={formDept.paisId || ''}
                          onChange={(v) => setFormDept(f => ({ ...f, paisId: v }))}
                          options={data.paises.map(p => ({ value: p.id, label: p.nombre }))}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* FORM CIUDADES */}
                {activeLevel === 'CIUDADES' && (
                  <>
                    <div className="md:col-span-4">
                      <Field label="Nombre de la Ciudad *">
                        <Input
                          value={formCity.nombre}
                          onChange={(v: string) => setFormCity(f => ({ ...f, nombre: v }))}
                          placeholder="Ej. Medellín"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Código DIAN/DIVIPOLA (5 dígitos) *">
                        <Input
                          value={formCity.codigoDian}
                          onChange={(v: string) => setFormCity(f => ({ ...f, codigoDian: v }))}
                          placeholder="Ej. 05001"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Departamento Asociado *">
                        <Select
                          value={formCity.departamentoId || ''}
                          onChange={(v) => setFormCity(f => ({ ...f, departamentoId: v }))}
                          options={data.departamentos.map(d => {
                            const cName = data.paises.find(p => p.id === d.paisId)?.nombre || ''
                            return { value: d.id, label: `${d.nombre} (${cName})` }
                          })}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* FORM COMUNAS */}
                {activeLevel === 'COMUNAS' && (
                  <>
                    <div className="md:col-span-6">
                      <Field label="Nombre de la Comuna / Localidad *">
                        <Input
                          value={formComuna.nombre}
                          onChange={(v: string) => setFormComuna(f => ({ ...f, nombre: v }))}
                          placeholder="Ej. Comuna 14 - Poblado"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-6">
                      <Field label="Ciudad Asociada *">
                        <Select
                          value={formComuna.ciudadId || ''}
                          onChange={(v) => setFormComuna(f => ({ ...f, ciudadId: v }))}
                          options={data.ciudades.map(c => {
                            const dName = data.departamentos.find(d => d.id === c.departamentoId)?.nombre || ''
                            return { value: c.id, label: `${c.nombre} (${dName})` }
                          })}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* FORM BARRIOS */}
                {activeLevel === 'BARRIOS' && (
                  <>
                    <div className="md:col-span-4">
                      <Field label="Nombre del Barrio *">
                        <Input
                          value={formBarrio.nombre}
                          onChange={(v: string) => setFormBarrio(f => ({ ...f, nombre: v }))}
                          placeholder="Ej. Provenza"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Ciudad Asociada *">
                        <Select
                          value={formBarrio.ciudadId || ''}
                          onChange={(v) => {
                            const relatedComunas = data.comunas.filter(c => c.ciudadId === v)
                            setFormBarrio(f => ({ ...f, ciudadId: v, comunaId: relatedComunas[0]?.id || '' }))
                          }}
                          options={data.ciudades.map(c => ({ value: c.id, label: c.nombre }))}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Comuna / Localidad (Opcional)">
                        <Select
                          value={formBarrio.comunaId || ''}
                          onChange={(v) => setFormBarrio(f => ({ ...f, comunaId: v }))}
                          options={[
                            { value: '', label: '-- No aplica / Ninguna --' },
                            ...data.comunas
                              .filter(c => c.ciudadId === formBarrio.ciudadId)
                              .map(c => ({ value: c.id, label: c.nombre }))
                          ]}
                        />
                      </Field>
                    </div>
                  </>
                )}
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
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
