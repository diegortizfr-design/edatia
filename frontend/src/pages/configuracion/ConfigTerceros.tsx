import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Users, Eye, Pencil, Trash2, SlidersHorizontal, Check, X, Building2, User } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import { getClientesERP, getProveedores, deleteClienteERP, deleteProveedor } from '../../services/erp.service'

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Sucursal {
  id: string
  codigo: string
  descripcion: string
  direccion: string
  telefono: string
  ciudad: string
  departamento: string
  contacto: string
  cargo: string
}

export interface Tercero {
  id: string
  tipoPersona: 'NATURAL' | 'JURIDICA'
  tipoDocumento: 'NIT' | 'CC' | 'CE' | 'PASAPORTE' | 'PEP'
  numeroDocumento: string
  digitoVerificacion: string
  codigo: string
  fechaCreacion: string
  nombre: string
  nombreComercial: string
  activo: boolean
  cliente: boolean
  proveedor: boolean
  empleado: boolean
  prospecto: boolean
  
  vendedor: string
  email: string
  emailNovedades: string
  telefono: string
  telefono2: string
  telefono3: string
  celular: string
  
  pais: string
  departamento: string
  ciudad: string
  direccionFiscal: string
  direccionDespachos: string
  
  cumpleanosDia: number
  cumpleanosMes: number
  cartera: string
  formaPago: string
  nivelPrecio: string
  clasificacion: string
  cupoCredito: boolean
  cupoCreditoValor: number
  
  paginaWeb: string
  paginaWeb2: string
  paginaWeb3: string
  tokenPosgold: string
  observacion: string
  
  sucursales?: Sucursal[]
  regimenFiscal?: string
  responsabilidades?: string[]
  actividadEconomica?: string
  
  crearUsuarioWeb?: boolean
  usuarioWebEmail?: string
  usuarioWebRol?: string
}

// ── Seed / Default Data ──────────────────────────────────────────────────────
export const DEFAULT_TERCEROS: Tercero[] = [
  {
    id: 'ter_4526049',
    tipoPersona: 'NATURAL',
    tipoDocumento: 'NIT',
    numeroDocumento: '4526049',
    digitoVerificacion: '3',
    codigo: '4526049',
    fechaCreacion: '31/07/2023',
    nombre: 'JHON FREDY GIRALDO ZULUAGA',
    nombreComercial: 'JHON FREDY GIRALDO ZULUAGA',
    activo: true,
    cliente: true,
    proveedor: true,
    empleado: false,
    prospecto: false,
    vendedor: '99 - VENDEDOR VARIOS',
    email: 'info@hangarwatches.com',
    emailNovedades: 'correo@ejemplo.com',
    telefono: '8882163',
    telefono2: '',
    telefono3: '',
    celular: '3157778899',
    pais: 'COLOMBIA',
    departamento: '76 - VALLE',
    ciudad: '76001 - CALI',
    direccionFiscal: 'CRA 7 13 70 LC 76',
    direccionDespachos: 'CRA 7 13 70 LC 76',
    cumpleanosDia: 12,
    cumpleanosMes: 8,
    cartera: 'PR - PROVEEDORES',
    formaPago: '01 - EFECTIVO',
    nivelPrecio: 'Precio Estándar',
    clasificacion: 'Ninguna',
    cupoCredito: false,
    cupoCreditoValor: 0,
    paginaWeb: 'www.hangarwatches.com',
    paginaWeb2: '',
    paginaWeb3: '',
    tokenPosgold: 'POSGOLD_TOKEN_4526049',
    observacion: 'Observaciones especiales del tercero de prueba Posgold.',
    regimenFiscal: '48',
    responsabilidades: ['O-13', 'O-23'],
    actividadEconomica: '4773', // Comercio al por menor de artículos de joyería
    sucursales: [
      {
        id: 'suc_1',
        codigo: 'CALI-LC76',
        descripcion: 'Local Principal Cali',
        direccion: 'CRA 7 13 70 LC 76',
        telefono: '8882163',
        ciudad: 'CALI',
        departamento: 'VALLE',
        contacto: 'JHON FREDY GIRALDO',
        cargo: 'Gerente General'
      }
    ]
  },
  {
    id: 'ter_900456123',
    tipoPersona: 'JURIDICA',
    tipoDocumento: 'NIT',
    numeroDocumento: '900456123',
    digitoVerificacion: '1',
    codigo: '900456123',
    fechaCreacion: '15/01/2024',
    nombre: 'JOYERÍA LA ESMERALDA SAS',
    nombreComercial: 'La Esmeralda Joyas',
    activo: true,
    cliente: false,
    proveedor: true,
    empleado: false,
    prospecto: false,
    vendedor: '01 - DISTRIBUIDOR REGIONAL',
    email: 'compras@laesmeralda.com.co',
    emailNovedades: '',
    telefono: '3105554433',
    telefono2: '6012223344',
    telefono3: '',
    celular: '3105554433',
    pais: 'COLOMBIA',
    departamento: '11 - BOGOTA D.C.',
    ciudad: '11001 - BOGOTA',
    direccionFiscal: 'Calle 15 # 4-50 Of 401',
    direccionDespachos: 'Calle 15 # 4-50 Of 401',
    cumpleanosDia: 25,
    cumpleanosMes: 5,
    cartera: 'PR - PROVEEDORES',
    formaPago: '02 - CRÉDITO 30 DÍAS',
    nivelPrecio: 'Precio Distribuidor',
    clasificacion: 'Ninguna',
    cupoCredito: true,
    cupoCreditoValor: 50000000,
    paginaWeb: 'www.laesmeraldajoyas.com',
    paginaWeb2: '',
    paginaWeb3: '',
    tokenPosgold: '',
    observacion: 'Proveedor principal de piedras preciosas y esmeraldas talladas.',
    regimenFiscal: '48',
    responsabilidades: ['O-13', 'O-15'],
    actividadEconomica: '3210',
    sucursales: []
  },
  {
    id: 'ter_16789123',
    tipoPersona: 'NATURAL',
    tipoDocumento: 'CC',
    numeroDocumento: '16789123',
    digitoVerificacion: '4',
    codigo: '16789123',
    fechaCreacion: '10/06/2022',
    nombre: 'CARLOS ARTURO GÓMEZ RESTREPO',
    nombreComercial: 'Joyas Carlos Gómez',
    activo: true,
    cliente: true,
    proveedor: false,
    empleado: false,
    prospecto: false,
    vendedor: '99 - VENDEDOR VARIOS',
    email: 'carlos.gomez@gmail.com',
    emailNovedades: 'carlos.gomez@gmail.com',
    telefono: '3154443322',
    telefono2: '',
    telefono3: '',
    celular: '3154443322',
    pais: 'COLOMBIA',
    departamento: '76 - VALLE',
    ciudad: '76001 - CALI',
    direccionFiscal: 'Av. Pasoancho # 80-12',
    direccionDespachos: 'Av. Pasoancho # 80-12',
    cumpleanosDia: 5,
    cumpleanosMes: 11,
    cartera: 'CL - CLIENTES',
    formaPago: '01 - EFECTIVO',
    nivelPrecio: 'Precio Estándar',
    clasificacion: 'Cliente VIP',
    cupoCredito: true,
    cupoCreditoValor: 10000000,
    paginaWeb: '',
    paginaWeb2: '',
    paginaWeb3: '',
    tokenPosgold: '',
    observacion: 'Cliente frecuente de alta joyería en oro amarillo.',
    regimenFiscal: '49',
    responsabilidades: ['R-99-PN'],
    actividadEconomica: '9609',
    sucursales: []
  },
  {
    id: 'ter_31456789',
    tipoPersona: 'NATURAL',
    tipoDocumento: 'CC',
    numeroDocumento: '31456789',
    digitoVerificacion: '2',
    codigo: '31456789',
    fechaCreacion: '22/02/2021',
    nombre: 'MARÍA HELENA RESTREPO URREGO',
    nombreComercial: 'María Helena Restrepo',
    activo: true,
    cliente: false,
    proveedor: false,
    empleado: true,
    prospecto: false,
    vendedor: '',
    email: 'maria.restrepo@edatia.com',
    emailNovedades: '',
    telefono: '3004445566',
    telefono2: '',
    telefono3: '',
    celular: '3004445566',
    pais: 'COLOMBIA',
    departamento: '05 - ANTIOQUIA',
    ciudad: '05001 - MEDELLIN',
    direccionFiscal: 'Calle 5 # 34-10 Apt 802',
    direccionDespachos: '',
    cumpleanosDia: 14,
    cumpleanosMes: 9,
    cartera: '',
    formaPago: '01 - EFECTIVO',
    nivelPrecio: '',
    clasificacion: '',
    cupoCredito: false,
    cupoCreditoValor: 0,
    paginaWeb: '',
    paginaWeb2: '',
    paginaWeb3: '',
    tokenPosgold: '',
    observacion: 'Diseñadora de Joyas Senior en planta Medellín.',
    regimenFiscal: '49',
    responsabilidades: ['R-99-PN'],
    actividadEconomica: '7410',
    sucursales: []
  }
]

export function ConfigTerceros() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  // Queries
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-erp'],
    queryFn: getClientesERP,
  })

  const { data: proveedores = [], isLoading: loadingProveedores } = useQuery({
    queryKey: ['proveedores-erp'],
    queryFn: getProveedores,
  })

  // Mutations
  const mutDeleteCliente = useMutation({
    mutationFn: (id: number) => deleteClienteERP(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes-erp'] })
      toast.success('Cliente eliminado')
    },
    onError: () => toast.error('Error al eliminar cliente')
  })

  const mutDeleteProveedor = useMutation({
    mutationFn: (id: number) => deleteProveedor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores-erp'] })
      toast.success('Proveedor eliminado')
    },
    onError: () => toast.error('Error al eliminar proveedor')
  })

  // Merge logic in memory
  const terceros = useMemo(() => {
    const mergedMap = new Map<string, Tercero>()

    clientes.forEach((cli: any) => {
      const key = cli.numeroDocumento || `cli_${cli.id}`
      mergedMap.set(key, {
        id: `cli_${cli.id}`,
        tipoPersona: cli.tipoPersona || 'JURIDICA',
        tipoDocumento: cli.tipoDocumento || 'NIT',
        numeroDocumento: cli.numeroDocumento,
        digitoVerificacion: cli.digitoVerificacion || '',
        codigo: cli.numeroDocumento || '',
        fechaCreacion: cli.createdAt ? new Date(cli.createdAt).toLocaleDateString() : '',
        nombre: cli.nombre,
        nombreComercial: cli.nombreComercial || cli.nombre,
        activo: cli.activo !== false,
        cliente: true,
        proveedor: false,
        empleado: false,
        prospecto: false,
        vendedor: cli.vendedorId ? String(cli.vendedorId) : '',
        email: cli.email || '',
        emailNovedades: '',
        telefono: cli.telefono || '',
        telefono2: '',
        telefono3: '',
        celular: cli.celular || '',
        pais: cli.pais || 'COLOMBIA',
        departamento: cli.departamento || '',
        ciudad: cli.municipio || '',
        direccionFiscal: cli.direccion || '',
        direccionDespachos: cli.direccion || '',
        cumpleanosDia: 0,
        cumpleanosMes: 0,
        cartera: 'CL - CLIENTES',
        formaPago: '01 - EFECTIVO',
        nivelPrecio: 'Precio Estándar',
        cupoCredito: cli.cupoCredito ? true : false,
        cupoCreditoValor: cli.cupoCredito ? Number(cli.cupoCredito) : 0,
        paginaWeb: '',
        paginaWeb2: '',
        paginaWeb3: '',
        tokenPosgold: '',
        observacion: cli.notas || '',
        sucursales: cli.sucursales || [],
        regimenFiscal: cli.regimenFiscal || '49',
        responsabilidades: cli.responsabilidades || [],
        actividadEconomica: cli.actividadEconomica || '',
      })
    })

    proveedores.forEach((prov: any) => {
      const key = prov.numeroDocumento || `prov_${prov.id}`
      const existing = mergedMap.get(key)
      if (existing) {
        existing.id = `dual_${existing.id.replace('cli_', '')}_${prov.id}`
        existing.proveedor = true
        if (!existing.email) existing.email = prov.email || ''
        if (!existing.telefono) existing.telefono = prov.telefono || ''
        if (!existing.direccionFiscal) existing.direccionFiscal = prov.direccion || ''
        if (!existing.ciudad) existing.ciudad = prov.ciudad || ''
        if (!existing.nombreComercial) existing.nombreComercial = prov.nombreComercial || ''
        if (prov.sucursales && prov.sucursales.length > 0) {
          existing.sucursales = prov.sucursales
        }
      } else {
        mergedMap.set(key, {
          id: `prov_${prov.id}`,
          tipoPersona: 'JURIDICA',
          tipoDocumento: prov.tipoDocumento || 'NIT',
          numeroDocumento: prov.numeroDocumento || '',
          digitoVerificacion: '',
          codigo: prov.numeroDocumento || '',
          fechaCreacion: prov.createdAt ? new Date(prov.createdAt).toLocaleDateString() : '',
          nombre: prov.nombre,
          nombreComercial: prov.nombreComercial || prov.nombre,
          activo: prov.activo !== false,
          cliente: false,
          proveedor: true,
          empleado: false,
          prospecto: false,
          vendedor: '',
          email: prov.email || '',
          emailNovedades: '',
          telefono: prov.telefono || '',
          telefono2: '',
          telefono3: '',
          celular: '',
          pais: prov.pais || 'COLOMBIA',
          departamento: '',
          ciudad: prov.ciudad || '',
          direccionFiscal: prov.direccion || '',
          direccionDespachos: prov.direccion || '',
          cumpleanosDia: 0,
          cumpleanosMes: 0,
          cartera: 'PR - PROVEEDORES',
          formaPago: prov.condicionesPago || '01 - EFECTIVO',
          nivelPrecio: 'Precio Estándar',
          cupoCredito: false,
          cupoCreditoValor: 0,
          paginaWeb: '',
          paginaWeb2: '',
          paginaWeb3: '',
          tokenPosgold: '',
          observacion: prov.notes || prov.notas || '',
          sucursales: prov.sucursales || [],
          regimenFiscal: '49',
          responsabilidades: [],
          actividadEconomica: '',
        })
      }
    })

    return Array.from(mergedMap.values())
  }, [clientes, proveedores])

  // Estados de Filtros
  const [filterNit, setFilterNit] = useState('')
  const [filterCodigo, setFilterCodigo] = useState('')
  const [filterNombre, setFilterNombre] = useState('')
  const [filterRazonSocial, setFilterRazonSocial] = useState('')
  const [filterCartera, setFilterCartera] = useState('')
  const [filterFormaPago, setFilterFormaPago] = useState('')
  const [filterActivo, setFilterActivo] = useState('SI') // Default SI like Posgold
  const [filterCliente, setFilterCliente] = useState('TODOS')
  const [filterEmpleado, setFilterEmpleado] = useState('TODOS')
  const [filterProveedor, setFilterProveedor] = useState('TODOS')
  const [filterPrecio, setFilterPrecio] = useState('TODOS')

  // Filtrado de la lista
  const filtered = terceros.filter(t => {
    if (filterNit && !t.numeroDocumento.includes(filterNit)) return false
    if (filterCodigo && !t.codigo.includes(filterCodigo)) return false
    if (filterNombre && !t.nombre.toLowerCase().includes(filterNombre.toLowerCase())) return false
    if (filterRazonSocial && !t.nombreComercial?.toLowerCase().includes(filterRazonSocial.toLowerCase())) return false
    
    if (filterCartera && t.cartera !== filterCartera) return false
    if (filterFormaPago && t.formaPago !== filterFormaPago) return false
    
    if (filterActivo === 'SI' && !t.activo) return false
    if (filterActivo === 'NO' && t.activo) return false
    
    if (filterCliente === 'SI' && !t.cliente) return false
    if (filterCliente === 'NO' && t.cliente) return false
    
    if (filterEmpleado === 'SI' && !t.empleado) return false
    if (filterEmpleado === 'NO' && t.empleado) return false
    
    if (filterProveedor === 'SI' && !t.proveedor) return false
    if (filterProveedor === 'NO' && t.proveedor) return false
    
    if (filterPrecio !== 'TODOS' && t.nivelPrecio !== filterPrecio) return false
    
    return true
  })

  // Eliminar tercero
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar a ${name} de los terceros?`)) {
      console.log('Intentando eliminar tercero. ID recibido:', id);
      const numbers = id.match(/\d+/g);
      
      if (!numbers || numbers.length === 0) {
        toast.error('ID de tercero no válido (no numérico)');
        console.error('Error al intentar eliminar. ID no contiene números:', id);
        return;
      }

      if (id.includes('dual') || numbers.length >= 2) {
        const cliId = parseInt(numbers[0], 10);
        const provId = parseInt(numbers[1], 10);
        console.log(`Eliminando registro dual - Cliente ID: ${cliId}, Proveedor ID: ${provId}`);
        
        if (!isNaN(cliId)) mutDeleteCliente.mutate(cliId);
        if (!isNaN(provId)) mutDeleteProveedor.mutate(provId);
      } else if (id.includes('cli') || id.startsWith('cli_')) {
        const dbId = parseInt(numbers[0], 10);
        console.log(`Eliminando Cliente ID: ${dbId}`);
        if (!isNaN(dbId)) mutDeleteCliente.mutate(dbId);
      } else if (id.includes('prov') || id.startsWith('prov_')) {
        const dbId = parseInt(numbers[0], 10);
        console.log(`Eliminando Proveedor ID: ${dbId}`);
        if (!isNaN(dbId)) mutDeleteProveedor.mutate(dbId);
      } else {
        // Fallback por si acaso el formato es diferente pero tiene un número
        const dbId = parseInt(numbers[0], 10);
        console.log(`Eliminando por fallback ID: ${dbId}`);
        if (!isNaN(dbId)) mutDeleteCliente.mutate(dbId);
      }
    }
  }

  // Contar estadísticas rápidas
  const totalClientes = terceros.filter(t => t.cliente).length
  const totalProveedores = terceros.filter(t => t.proveedor).length
  const totalEmpleados = terceros.filter(t => t.empleado).length

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Configuración</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Gestión de Terceros</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5 tracking-tight">
            <Users size={24} className="text-indigo-600" />
            Gestión de Terceros
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Administra la base unificada de Clientes, Proveedores, Empleados y Prospectos del sistema.
          </p>
        </div>

        <button
          onClick={() => navigate('/configuracion/terceros/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Nuevo Tercero
        </button>
      </div>

      {/* KPI Cards Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Terceros</p>
            <p className="text-xl font-extrabold text-slate-800">{terceros.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <User size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</p>
            <p className="text-xl font-extrabold text-slate-800">{totalClientes}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedores</p>
            <p className="text-xl font-extrabold text-slate-800">{totalProveedores}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empleados</p>
            <p className="text-xl font-extrabold text-slate-800">{totalEmpleados}</p>
          </div>
        </div>
      </div>

      {/* Panel de Filtros de Búsqueda (Captura 2) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
          <SlidersHorizontal size={14} className="text-indigo-650" />
          Filtros de Búsqueda
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Fila 1 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NIT / Cédula</label>
            <input
              type="text"
              value={filterNit}
              onChange={e => setFilterNit(e.target.value)}
              placeholder="Nit o documento"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código</label>
            <input
              type="text"
              value={filterCodigo}
              onChange={e => setFilterCodigo(e.target.value)}
              placeholder="Código"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción / Nombre</label>
            <input
              type="text"
              value={filterNombre}
              onChange={e => setFilterNombre(e.target.value)}
              placeholder="Nombre / Razón Social"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={filterRazonSocial}
              onChange={e => setFilterRazonSocial(e.target.value)}
              placeholder="Nombre Comercial / Razón Social"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>

          {/* Fila 2 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cartera</label>
            <select
              value={filterCartera}
              onChange={e => setFilterCartera(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Todos</option>
              <option value="CL - CLIENTES">CL - CLIENTES</option>
              <option value="PR - PROVEEDORES">PR - PROVEEDORES</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Forma de Pago</label>
            <select
              value={filterFormaPago}
              onChange={e => setFilterFormaPago(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Todos</option>
              <option value="01 - EFECTIVO">01 - EFECTIVO</option>
              <option value="02 - CRÉDITO 30 DÍAS">02 - CRÉDITO 30 DÍAS</option>
              <option value="03 - TRANSFERENCIA">03 - TRANSFERENCIA</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Activo</label>
            <select
              value={filterActivo}
              onChange={e => setFilterActivo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="TODOS">Todos</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente</label>
            <select
              value={filterCliente}
              onChange={e => setFilterCliente(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="TODOS">Todos</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Proveedor</label>
            <select
              value={filterProveedor}
              onChange={e => setFilterProveedor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="TODOS">Todos</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>

          {/* Fila Adicional */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empleado</label>
            <select
              value={filterEmpleado}
              onChange={e => setFilterEmpleado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="TODOS">Todos</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nivel de Precio</label>
            <select
              value={filterPrecio}
              onChange={e => setFilterPrecio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="TODOS">Todos</option>
              <option value="Precio Estándar">Precio Estándar</option>
              <option value="Precio Distribuidor">Precio Distribuidor</option>
              <option value="Precio Mayorista">Precio Mayorista</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            <button
              onClick={() => {
                setFilterNit('')
                setFilterCodigo('')
                setFilterNombre('')
                setFilterRazonSocial('')
                setFilterCartera('')
                setFilterFormaPago('')
                setFilterActivo('SI')
                setFilterCliente('TODOS')
                setFilterEmpleado('TODOS')
                setFilterProveedor('TODOS')
                setFilterPrecio('TODOS')
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              Limpiar Filtros
            </button>
            <span className="text-[10px] text-slate-450 font-medium ml-auto pb-2">
              Se encontraron {filtered.length} registro(s)
            </span>
          </div>
        </div>
      </div>

      {/* Resultados de Búsqueda */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-28">Acciones</th>
                <th className="p-4">NIT / Cédula</th>
                <th className="p-4">Descripción (Nombre Completo)</th>
                <th className="p-4">Roles</th>
                <th className="p-4">Dirección</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Celular</th>
                <th className="p-4">Ciudad / Dpto</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700 font-sans">
              {loadingClientes || loadingProveedores ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-sm">
                    <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Cargando terceros...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/configuracion/terceros/${t.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.nombre)}
                          className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {t.numeroDocumento}{t.digitoVerificacion ? `-${t.digitoVerificacion}` : ''}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{t.nombre}</p>
                      {t.nombreComercial && t.nombreComercial !== t.nombre && (
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.nombreComercial}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {t.cliente && (
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.25 rounded-md uppercase">
                            Cliente
                          </span>
                        )}
                        {t.proveedor && (
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.25 rounded-md uppercase">
                            Proveedor
                          </span>
                        )}
                        {t.empleado && (
                          <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.25 rounded-md uppercase">
                            Empleado
                          </span>
                        )}
                        {t.prospecto && (
                          <span className="text-[9px] font-extrabold text-slate-700 bg-slate-50 border border-slate-100 px-1.5 py-0.25 rounded-md uppercase">
                            Prospecto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-550 max-w-[150px] truncate">{t.direccionFiscal || '—'}</td>
                    <td className="p-4 font-mono text-slate-550">{t.telefono || '—'}</td>
                    <td className="p-4 font-mono text-slate-550">{t.celular || '—'}</td>
                    <td className="p-4 text-slate-600 font-medium">{t.ciudad ? (t.ciudad.includes(' - ') ? t.ciudad.split(' - ')[1] : t.ciudad) : '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        t.activo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Realice una búsqueda para ver resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
