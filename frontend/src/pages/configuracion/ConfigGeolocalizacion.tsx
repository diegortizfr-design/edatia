import { useState, useEffect } from 'react'
import { Globe, Plus, Search, Trash2, Edit3, CheckCircle2, SlidersHorizontal, MapPin, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import {
  getGeolocationState, resetGeolocationToDefaults,
  createPais, updatePais, deletePais,
  createDepartamento, updateDepartamento, deleteDepartamento,
  createCiudad, updateCiudad, deleteCiudad,
  createComuna, updateComuna, deleteComuna,
  createBarrio, updateBarrio, deleteBarrio
} from '../../services/configuracion.service'

// ─── Interfaces y Estructuras de Datos ────────────────────────────────────────

export interface Pais {
  id: number;
  nombre: string;
  codigo: string; // ej. CO, ES, US (Código ISO Alfa-2)
  codigoDianExogena: string; // ej. 169 (Código exógena de la DIAN)
  indicativoTelefonico: string; // ej. 57
}

export interface Departamento {
  id: number;
  nombre: string;
  paisId: number;
  codigo: string; // Código DIVIPOLA de 2 dígitos
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamentoId: number;
  codigoDian: string; // Código DIVIPOLA de 5 dígitos
}

export interface Comuna {
  id: number;
  nombre: string;
  ciudadId: number;
}

export interface Barrio {
  id: number;
  nombre: string;
  ciudadId: number;
  comunaId?: number; // opcional
}

export interface GeolocationState {
  paises: Pais[];
  departamentos: Departamento[];
  ciudades: Ciudad[];
  comunas: Comuna[];
  barrios: Barrio[];
}

export const DEFAULT_GEO_DATA: GeolocationState = {
  paises: [
    { id: 1, nombre: 'Colombia', codigo: 'CO', codigoDianExogena: '169', indicativoTelefonico: '57' },
    { id: 2, nombre: 'España', codigo: 'ES', codigoDianExogena: '245', indicativoTelefonico: '34' },
    { id: 3, nombre: 'Estados Unidos', codigo: 'US', codigoDianExogena: '249', indicativoTelefonico: '1' }
  ],
  departamentos: [
    { id: 1, nombre: 'Antioquia', paisId: 1, codigo: '05' },
    { id: 2, nombre: 'Atlántico', paisId: 1, codigo: '08' },
    { id: 3, nombre: 'Bogotá D.C.', paisId: 1, codigo: '11' },
    { id: 4, nombre: 'Bolívar', paisId: 1, codigo: '13' },
    { id: 5, nombre: 'Boyacá', paisId: 1, codigo: '15' },
    { id: 6, nombre: 'Caldas', paisId: 1, codigo: '17' },
    { id: 7, nombre: 'Caquetá', paisId: 1, codigo: '18' },
    { id: 8, nombre: 'Cauca', paisId: 1, codigo: '19' },
    { id: 9, nombre: 'Cesar', paisId: 1, codigo: '20' },
    { id: 10, nombre: 'Córdoba', paisId: 1, codigo: '23' },
    { id: 11, nombre: 'Cundinamarca', paisId: 1, codigo: '25' },
    { id: 12, nombre: 'Chocó', paisId: 1, codigo: '27' },
    { id: 13, nombre: 'Huila', paisId: 1, codigo: '41' },
    { id: 14, nombre: 'La Guajira', paisId: 1, codigo: '44' },
    { id: 15, nombre: 'Magdalena', paisId: 1, codigo: '47' },
    { id: 16, nombre: 'Meta', paisId: 1, codigo: '50' },
    { id: 17, nombre: 'Nariño', paisId: 1, codigo: '52' },
    { id: 18, nombre: 'Norte de Santander', paisId: 1, codigo: '54' },
    { id: 19, nombre: 'Quindío', paisId: 1, codigo: '63' },
    { id: 20, nombre: 'Risaralda', paisId: 1, codigo: '66' },
    { id: 21, nombre: 'Santander', paisId: 1, codigo: '68' },
    { id: 22, nombre: 'Sucre', paisId: 1, codigo: '70' },
    { id: 23, nombre: 'Tolima', paisId: 1, codigo: '73' },
    { id: 24, nombre: 'Valle del Cauca', paisId: 1, codigo: '76' },
    { id: 25, nombre: 'Arauca', paisId: 1, codigo: '81' },
    { id: 26, nombre: 'Casanare', paisId: 1, codigo: '85' },
    { id: 27, nombre: 'Putumayo', paisId: 1, codigo: '86' },
    { id: 28, nombre: 'San Andrés y Providencia', paisId: 1, codigo: '88' },
    { id: 29, nombre: 'Amazonas', paisId: 1, codigo: '91' },
    { id: 30, nombre: 'Guainía', paisId: 1, codigo: '94' },
    { id: 31, nombre: 'Guaviare', paisId: 1, codigo: '95' },
    { id: 32, nombre: 'Vaupés', paisId: 1, codigo: '97' },
    { id: 33, nombre: 'Vichada', paisId: 1, codigo: '99' },
    { id: 34, nombre: 'Madrid', paisId: 2, codigo: 'MAD' },
    { id: 35, nombre: 'Florida', paisId: 3, codigo: 'FL' }
  ],
  ciudades: [
    { id: 1, nombre: 'Medellín', departamentoId: 1, codigoDian: '05001' },
    { id: 2, nombre: 'Envigado', departamentoId: 1, codigoDian: '05266' },
    { id: 3, nombre: 'Sabaneta', departamentoId: 1, codigoDian: '05631' },
    { id: 4, nombre: 'Itagüí', departamentoId: 1, codigoDian: '05360' },
    { id: 5, nombre: 'Rionegro', departamentoId: 1, codigoDian: '05615' },
    { id: 6, nombre: 'Bello', departamentoId: 1, codigoDian: '05088' },
    { id: 7, nombre: 'Barranquilla', departamentoId: 2, codigoDian: '08001' },
    { id: 8, nombre: 'Soledad', departamentoId: 2, codigoDian: '08758' },
    { id: 9, nombre: 'Bogotá D.C.', departamentoId: 3, codigoDian: '11001' },
    { id: 10, nombre: 'Cartagena de Indias', departamentoId: 4, codigoDian: '13001' },
    { id: 11, nombre: 'Tunja', departamentoId: 5, codigoDian: '15001' },
    { id: 12, nombre: 'Manizales', departamentoId: 6, codigoDian: '17001' },
    { id: 13, nombre: 'Florencia', departamentoId: 7, codigoDian: '18001' },
    { id: 14, nombre: 'Popayán', departamentoId: 8, codigoDian: '19001' },
    { id: 15, nombre: 'Valledupar', departamentoId: 9, codigoDian: '20001' },
    { id: 16, nombre: 'Montería', departamentoId: 10, codigoDian: '23001' },
    { id: 17, nombre: 'Agua de Dios', departamentoId: 11, codigoDian: '25001' },
    { id: 18, nombre: 'Soacha', departamentoId: 11, codigoDian: '25754' },
    { id: 19, nombre: 'Chía', departamentoId: 11, codigoDian: '25175' },
    { id: 20, nombre: 'Zipaquirá', departamentoId: 11, codigoDian: '25899' },
    { id: 21, nombre: 'Facatativá', departamentoId: 11, codigoDian: '25269' },
    { id: 22, nombre: 'Quibdó', departamentoId: 12, codigoDian: '27001' },
    { id: 23, nombre: 'Neiva', departamentoId: 13, codigoDian: '41001' },
    { id: 24, nombre: 'Riohacha', departamentoId: 14, codigoDian: '44001' },
    { id: 25, nombre: 'Santa Marta', departamentoId: 15, codigoDian: '47001' },
    { id: 26, nombre: 'Villavicencio', departamentoId: 16, codigoDian: '50001' },
    { id: 27, nombre: 'Pasto', departamentoId: 17, codigoDian: '52001' },
    { id: 28, nombre: 'Cúcuta', departamentoId: 18, codigoDian: '54001' },
    { id: 29, nombre: 'Armenia', departamentoId: 19, codigoDian: '63001' },
    { id: 30, nombre: 'Pereira', departamentoId: 20, codigoDian: '66001' },
    { id: 31, nombre: 'Bucaramanga', departamentoId: 21, codigoDian: '68001' },
    { id: 32, nombre: 'Floridablanca', departamentoId: 21, codigoDian: '68276' },
    { id: 33, nombre: 'Barrancabermeja', departamentoId: 21, codigoDian: '68081' },
    { id: 34, nombre: 'Sincelejo', departamentoId: 22, codigoDian: '70001' },
    { id: 35, nombre: 'Ibagué', departamentoId: 23, codigoDian: '73001' },
    { id: 36, nombre: 'Cali', departamentoId: 24, codigoDian: '76001' },
    { id: 37, nombre: 'Palmira', departamentoId: 24, codigoDian: '76520' },
    { id: 38, nombre: 'Buenaventura', departamentoId: 24, codigoDian: '76109' },
    { id: 39, nombre: 'Arauca', departamentoId: 25, codigoDian: '81001' },
    { id: 40, nombre: 'Yopal', departamentoId: 26, codigoDian: '85001' },
    { id: 41, nombre: 'Mocoa', departamentoId: 27, codigoDian: '86001' },
    { id: 42, nombre: 'San Andrés', departamentoId: 28, codigoDian: '88001' },
    { id: 43, nombre: 'Leticia', departamentoId: 29, codigoDian: '91001' },
    { id: 44, nombre: 'Inírida', departamentoId: 30, codigoDian: '94001' },
    { id: 45, nombre: 'San José del Guaviare', departamentoId: 31, codigoDian: '95001' },
    { id: 46, nombre: 'Mitú', departamentoId: 32, codigoDian: '97001' },
    { id: 47, nombre: 'Puerto Carreño', departamentoId: 33, codigoDian: '99001' },
    { id: 48, nombre: 'Madrid', departamentoId: 34, codigoDian: '28079' },
    { id: 49, nombre: 'Miami', departamentoId: 35, codigoDian: '12086' }
  ],
  comunas: [
    { id: 1, nombre: 'Comuna 14 - El Poblado', ciudadId: 1 },
    { id: 2, nombre: 'Comuna 11 - Laureles', ciudadId: 1 },
    { id: 3, nombre: 'Comuna 16 - Belén', ciudadId: 1 }
  ],
  barrios: [
    { id: 1, nombre: 'El Poblado', ciudadId: 1, comunaId: 1 },
    { id: 2, nombre: 'Provenza', ciudadId: 1, comunaId: 1 },
    { id: 3, nombre: 'Manila', ciudadId: 1, comunaId: 1 },
    { id: 4, nombre: 'Laureles', ciudadId: 1, comunaId: 2 },
    { id: 5, nombre: 'Belén', ciudadId: 1, comunaId: 3 }
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
  const qc = useQueryClient()
  const [activeLevel, setActiveLevel] = useState<GeoLevel>('PAISES')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // ── Query ──
  const { data = { paises: [], departamentos: [], ciudades: [], comunas: [], barrios: [] }, isLoading } = useQuery<GeolocationState>({
    queryKey: ['geolocation-state'],
    queryFn: getGeolocationState,
  })

  // Estados de Formulario de Creación/Edición
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formPais, setFormPais] = useState<Partial<Pais>>({})
  const [formDept, setFormDept] = useState<Partial<Departamento>>({})
  const [formCity, setFormCity] = useState<Partial<Ciudad>>({})
  const [formComuna, setFormComuna] = useState<Partial<Comuna>>({})
  const [formBarrio, setFormBarrio] = useState<Partial<Barrio>>({})

  // ── Mutations ──
  const mutReset = useMutation({
    mutationFn: resetGeolocationToDefaults,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geolocation-state'] })
      toast.success('Geolocalización restablecida a la plantilla oficial')
    },
    onError: () => toast.error('Error al restablecer geolocalización')
  })

  // Paises
  const mutCreatePais = useMutation({
    mutationFn: createPais,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('País creado'); setViewMode('list') },
    onError: () => toast.error('Error al crear país')
  })
  const mutUpdatePais = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updatePais(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('País actualizado'); setViewMode('list') },
    onError: () => toast.error('Error al actualizar país')
  })
  const mutDeletePais = useMutation({
    mutationFn: deletePais,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('País eliminado') },
    onError: () => toast.error('Error al eliminar país')
  })

  // Departamentos
  const mutCreateDept = useMutation({
    mutationFn: createDepartamento,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Departamento creado'); setViewMode('list') },
    onError: () => toast.error('Error al crear departamento')
  })
  const mutUpdateDept = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateDepartamento(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Departamento actualizado'); setViewMode('list') },
    onError: () => toast.error('Error al actualizar departamento')
  })
  const mutDeleteDept = useMutation({
    mutationFn: deleteDepartamento,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Departamento eliminado') },
    onError: () => toast.error('Error al eliminar departamento')
  })

  // Ciudades
  const mutCreateCity = useMutation({
    mutationFn: createCiudad,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Ciudad creada'); setViewMode('list') },
    onError: () => toast.error('Error al crear ciudad')
  })
  const mutUpdateCity = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateCiudad(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Ciudad actualizada'); setViewMode('list') },
    onError: () => toast.error('Error al actualizar ciudad')
  })
  const mutDeleteCity = useMutation({
    mutationFn: deleteCiudad,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Ciudad eliminada') },
    onError: () => toast.error('Error al eliminar ciudad')
  })

  // Comunas
  const mutCreateComuna = useMutation({
    mutationFn: createComuna,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Comuna creada'); setViewMode('list') },
    onError: () => toast.error('Error al crear comuna')
  })
  const mutUpdateComuna = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateComuna(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Comuna actualizada'); setViewMode('list') },
    onError: () => toast.error('Error al actualizar comuna')
  })
  const mutDeleteComuna = useMutation({
    mutationFn: deleteComuna,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Comuna eliminada') },
    onError: () => toast.error('Error al eliminar comuna')
  })

  // Barrios
  const mutCreateBarrio = useMutation({
    mutationFn: createBarrio,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Barrio creado'); setViewMode('list') },
    onError: () => toast.error('Error al crear barrio')
  })
  const mutUpdateBarrio = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateBarrio(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Barrio actualizado'); setViewMode('list') },
    onError: () => toast.error('Error al actualizar barrio')
  })
  const mutDeleteBarrio = useMutation({
    mutationFn: deleteBarrio,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geolocation-state'] }); toast.success('Barrio eliminado') },
    onError: () => toast.error('Error al eliminar barrio')
  })

  // Resetear filtros al cambiar de pestaña
  useEffect(() => {
    setSearch('')
    setViewMode('list')
  }, [activeLevel])

  const handleResetTemplate = () => {
    if (window.confirm('¿Está seguro de restablecer los datos a la plantilla oficial de Colombia (32 departamentos y capitales)? Se perderán los registros modificados actualmente.')) {
      mutReset.mutate()
    }
  }

  // Abrir Formularios
  const handleOpenNew = () => {
    setEditingId(null)
    if (activeLevel === 'PAISES') setFormPais({ nombre: '', codigo: '', codigoDianExogena: '', indicativoTelefonico: '' })
    if (activeLevel === 'DEPARTAMENTOS') setFormDept({ nombre: '', paisId: data.paises[0]?.id || 0, codigo: '' })
    if (activeLevel === 'CIUDADES') setFormCity({ nombre: '', departamentoId: data.departamentos[0]?.id || 0, codigoDian: '' })
    if (activeLevel === 'COMUNAS') setFormComuna({ nombre: '', ciudadId: data.ciudades[0]?.id || 0 })
    if (activeLevel === 'BARRIOS') {
      const firstCityId = data.ciudades[0]?.id || 0
      const relatedComunas = data.comunas.filter(c => c.ciudadId === firstCityId)
      setFormBarrio({ nombre: '', ciudadId: firstCityId, comunaId: relatedComunas[0]?.id || undefined })
    }
    setViewMode('form')
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    if (activeLevel === 'PAISES') setFormPais({ codigoDianExogena: '', indicativoTelefonico: '', ...item })
    if (activeLevel === 'DEPARTAMENTOS') setFormDept({ ...item })
    if (activeLevel === 'CIUDADES') setFormCity({ ...item })
    if (activeLevel === 'COMUNAS') setFormComuna({ ...item })
    if (activeLevel === 'BARRIOS') setFormBarrio({ ...item })
    setViewMode('form')
  }

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      if (activeLevel === 'PAISES') {
        const hasChild = data.departamentos.some(d => d.paisId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene departamentos asociados.')
        mutDeletePais.mutate(id)
      }
      if (activeLevel === 'DEPARTAMENTOS') {
        const hasChild = data.ciudades.some(c => c.departamentoId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene ciudades asociadas.')
        mutDeleteDept.mutate(id)
      }
      if (activeLevel === 'CIUDADES') {
        const hasChild = data.comunas.some(c => c.ciudadId === id) || data.barrios.some(b => b.ciudadId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene comunas o barrios asociados.')
        mutDeleteCity.mutate(id)
      }
      if (activeLevel === 'COMUNAS') {
        const hasChild = data.barrios.some(b => b.comunaId === id)
        if (hasChild) return alert('No se puede eliminar porque contiene barrios asociados.')
        mutDeleteComuna.mutate(id)
      }
      if (activeLevel === 'BARRIOS') {
        mutDeleteBarrio.mutate(id)
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeLevel === 'PAISES') {
      if (!formPais.nombre || !formPais.codigo || !formPais.codigoDianExogena || !formPais.indicativoTelefonico) {
        return alert('Nombre, Código ISO, Código DIAN e Indicativo son obligatorios.')
      }
      if (editingId) {
        mutUpdatePais.mutate({ id: editingId, dto: formPais })
      } else {
        mutCreatePais.mutate(formPais)
      }
    }
    if (activeLevel === 'DEPARTAMENTOS') {
      if (!formDept.nombre || !formDept.paisId || !formDept.codigo) {
        return alert('Nombre, País y Código son obligatorios.')
      }
      const payload = { nombre: formDept.nombre, codigo: formDept.codigo, paisId: Number(formDept.paisId) }
      if (editingId) {
        mutUpdateDept.mutate({ id: editingId, dto: payload })
      } else {
        mutCreateDept.mutate(payload)
      }
    }
    if (activeLevel === 'CIUDADES') {
      if (!formCity.nombre || !formCity.departamentoId || !formCity.codigoDian) {
        return alert('Nombre, Departamento y Código DIAN/DIVIPOLA son obligatorios.')
      }
      const payload = { nombre: formCity.nombre, codigoDian: formCity.codigoDian, departamentoId: Number(formCity.departamentoId) }
      if (editingId) {
        mutUpdateCity.mutate({ id: editingId, dto: payload })
      } else {
        mutCreateCity.mutate(payload)
      }
    }
    if (activeLevel === 'COMUNAS') {
      if (!formComuna.nombre || !formComuna.ciudadId) return alert('Nombre y Ciudad son obligatorios.')
      const payload = { nombre: formComuna.nombre, ciudadId: Number(formComuna.ciudadId) }
      if (editingId) {
        mutUpdateComuna.mutate({ id: editingId, dto: payload })
      } else {
        mutCreateComuna.mutate(payload)
      }
    }
    if (activeLevel === 'BARRIOS') {
      if (!formBarrio.nombre || !formBarrio.ciudadId) return alert('Nombre y Ciudad son obligatorios.')
      const payload = {
        nombre: formBarrio.nombre,
        ciudadId: Number(formBarrio.ciudadId),
        comunaId: formBarrio.comunaId ? Number(formBarrio.comunaId) : undefined
      }
      if (editingId) {
        mutUpdateBarrio.mutate({ id: editingId, dto: payload })
      } else {
        mutCreateBarrio.mutate(payload)
      }
    }
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
        return d.nombre.toLowerCase().includes(s) || country.toLowerCase().includes(s) || (d.codigo || '').toLowerCase().includes(s)
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
  const isMutating = mutReset.isPending || mutCreatePais.isPending || mutUpdatePais.isPending || mutCreateDept.isPending || mutUpdateDept.isPending || mutCreateCity.isPending || mutUpdateCity.isPending || mutCreateComuna.isPending || mutUpdateComuna.isPending || mutCreateBarrio.isPending || mutUpdateBarrio.isPending

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />
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
                Administra la estructura geográfica del sistema para clientes, proveedores y envíos logísticos en la Base de Datos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetTemplate}
                disabled={isMutating}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                title="Restablecer a la plantilla oficial con todos los departamentos y capitales en BD"
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
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando datos del servidor...</div>
            ) : (
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
                              <td className="p-4 font-mono text-slate-600">{item.codigo || '-'}</td>
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
            )}
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
                      <Field label="Código DIVIPOLA *">
                        <Input
                          value={formDept.codigo}
                          onChange={(v: string) => setFormDept(f => ({ ...f, codigo: v }))}
                          placeholder="Ej. 05"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="País Asociado *">
                        <Select
                          value={String(formDept.paisId || '')}
                          onChange={(v) => setFormDept(f => ({ ...f, paisId: Number(v) }))}
                          options={data.paises.map(p => ({ value: String(p.id), label: p.nombre }))}
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
                          value={String(formCity.departamentoId || '')}
                          onChange={(v) => setFormCity(f => ({ ...f, departamentoId: Number(v) }))}
                          options={data.departamentos.map(d => {
                            const cName = data.paises.find(p => p.id === d.paisId)?.nombre || ''
                            return { value: String(d.id), label: `${d.nombre} (${cName})` }
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
                          value={String(formComuna.ciudadId || '')}
                          onChange={(v) => setFormComuna(f => ({ ...f, ciudadId: Number(v) }))}
                          options={data.ciudades.map(c => {
                            const dName = data.departamentos.find(d => d.id === c.departamentoId)?.nombre || ''
                            return { value: String(c.id), label: `${c.nombre} (${dName})` }
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
                          value={String(formBarrio.ciudadId || '')}
                          onChange={(v) => {
                            const relatedComunas = data.comunas.filter(c => c.ciudadId === Number(v))
                            setFormBarrio(f => ({ ...f, ciudadId: Number(v), comunaId: relatedComunas[0]?.id ? Number(relatedComunas[0].id) : undefined }))
                          }}
                          options={data.ciudades.map(c => ({ value: String(c.id), label: c.nombre }))}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-4">
                      <Field label="Comuna / Localidad (Opcional)">
                        <Select
                          value={String(formBarrio.comunaId || '')}
                          onChange={(v) => setFormBarrio(f => ({ ...f, comunaId: v ? Number(v) : undefined }))}
                          options={[
                            { value: '', label: '-- No aplica / Ninguna --' },
                            ...data.comunas
                              .filter(c => c.ciudadId === formBarrio.ciudadId)
                              .map(c => ({ value: String(c.id), label: c.nombre }))
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
                  disabled={isMutating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                  {isMutating ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
