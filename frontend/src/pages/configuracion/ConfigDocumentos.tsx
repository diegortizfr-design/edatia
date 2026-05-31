import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Plus, ShieldCheck, CheckCircle2, Trash2, Edit3, Search,
  Receipt, Building2, SlidersHorizontal
} from 'lucide-react'

// ─── Tipos y Configuración Inicial ──────────────────────────────────────────

interface DocumentoConfig {
  id: string;
  nombre: string;
  sigla: string;
  prefijo: string;
  consecutivoInicial: number;
  consecutivoSiguiente: number;
  tipoOperacion: 'VENTAS' | 'COMPRAS' | 'INVENTARIO' | 'TESORERIA' | 'NOMINA' | 'CONTABILIDAD' | 'COMERCIAL' | 'LOGISTICA' | 'SERVICIOS' | 'CRM' | 'BANCOS' | 'CARTERA' | 'PROVEEDORES' | 'RRHH';
  plantillaImpresion: 'CARTA' | 'TIRILLA_80' | 'TIRILLA_58';
  esElectronico: boolean;
  resolucionDian?: string;
  fechaResolucion?: string;
  vigenciaMeses?: number;
  rangoDesde?: number;
  rangoHasta?: number;
  estado: 'ACTIVO' | 'INACTIVO';
  sucursalId?: string;
}

interface PlantillaDocumento {
  codigo: string;
  documento: string;
  area: string;
  obligatorioDian: 'SI' | 'NO' | 'SEGUN_CASO';
  operativamenteRecomendado: string;
  funcionPrincipal: string;
}

const CATALOGO_PLANTILLAS: PlantillaDocumento[] = [
  // Ventas
  { codigo: 'FV', documento: 'Factura de Venta', area: 'Ventas', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registrar venta oficial y facturación electrónica' },
  { codigo: 'NC', documento: 'Nota Crédito', area: 'Ventas', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Corregir o disminuir una factura' },
  { codigo: 'ND', documento: 'Nota Débito', area: 'Ventas', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Aumentar valor de una factura' },
  { codigo: 'POS', documento: 'Documento POS', area: 'Ventas', obligatorioDian: 'SEGUN_CASO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Ventas rápidas al consumidor final' },
  // Compras
  { codigo: 'DS', documento: 'Documento Soporte', area: 'Compras', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Compras a no obligados a facturar' },
  { codigo: 'NAS', documento: 'Nota Ajuste Documento Soporte', area: 'Compras', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Corrección de documento soporte' },
  { codigo: 'FC', documento: 'Factura de Compra', area: 'Compras', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registrar factura comercial de proveedor (3-Way Match)' },
  { codigo: 'SOL', documento: 'Solicitud de Compra', area: 'Compras', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Solicitar adquisición interna' },
  { codigo: 'OC', documento: 'Orden de Compra', area: 'Compras', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Autorizar compra a proveedor' },
  { codigo: 'DCP', documento: 'Devolución Compra', area: 'Compras', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Retorno de mercancía al proveedor' },
  // Nómina
  { codigo: 'NE', documento: 'Nómina Electrónica', area: 'Nómina', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Reportar pagos laborales a DIAN' },
  { codigo: 'ANE', documento: 'Ajuste Nómina Electrónica', area: 'Nómina', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Corregir nómina electrónica' },
  // Tesorería
  { codigo: 'RC', documento: 'Recibo de Caja', area: 'Tesorería', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registrar recaudo o pago recibido' },
  { codigo: 'CE', documento: 'Comprobante de Egreso', area: 'Tesorería', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registrar pagos realizados' },
  { codigo: 'ACP', documento: 'Anticipo a Proveedor', area: 'Tesorería', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Gestionar pagos anticipados' },
  { codigo: 'ANT', documento: 'Anticipo Cliente', area: 'Tesorería', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Registrar dinero anticipado' },
  { codigo: 'REE', documento: 'Reembolso', area: 'Tesorería', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Reintegros y devoluciones' },
  // Inventario
  { codigo: 'EI', documento: 'Entrada Inventario', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Ingreso de mercancía' },
  { codigo: 'SI', documento: 'Salida Inventario', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Egreso de mercancía' },
  { codigo: 'TI', documento: 'Traslado de Inventario', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Movimiento entre bodegas con verificación en destino' },
  { codigo: 'AI', documento: 'Ajuste Inventario', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Correcciones de stock' },
  { codigo: 'IF', documento: 'Inventario Físico', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Conteo físico' },
  { codigo: 'KR', documento: 'Kardex', area: 'Inventario', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Trazabilidad de movimientos' },
  { codigo: 'RV', documento: 'Reserva Inventario', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Separar stock comprometido' },
  { codigo: 'DEV', documento: 'Devolución Venta', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Retorno de mercancía cliente' },
  { codigo: 'VNC', documento: 'Vencimientos', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Control de lotes y expiración' },
  { codigo: 'LOT', documento: 'Control de Lotes', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Trazabilidad por lote' },
  { codigo: 'RP', documento: 'Recepción de Producto', area: 'Inventario', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Confirmar recepción física de mercancía (3-Way Match)' },
  // Contabilidad
  { codigo: 'CC', documento: 'Comprobante Contable', area: 'Contabilidad', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Soporte contable general' },
  { codigo: 'AJ', documento: 'Comprobante de Ajuste', area: 'Contabilidad', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Ajustes contables y cierres' },
  { codigo: 'CI', documento: 'Comprobante de Ingreso', area: 'Contabilidad', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registrar ingresos contables' },
  { codigo: 'CD', documento: 'Comprobante Diario', area: 'Contabilidad', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Movimientos contables diarios' },
  { codigo: 'CF', documento: 'Comprobante de Cierre', area: 'Contabilidad', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Cierre contable de período' },
  // Comercial
  { codigo: 'CT', documento: 'Cotización', area: 'Comercial', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Oferta comercial al cliente' },
  { codigo: 'PV', documento: 'Pedido de Venta', area: 'Comercial', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Confirmación de intención de compra' },
  { codigo: 'CTT', documento: 'Contrato', area: 'Comercial', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Formalizar acuerdos comerciales' },
  // Logística
  { codigo: 'RM', documento: 'Remisión', area: 'Logística', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Soporte de entrega de mercancía' },
  // Servicios
  { codigo: 'OS', documento: 'Orden de Servicio', area: 'Servicios', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Gestión de trabajos y servicios' },
  // CRM
  { codigo: 'SC', documento: 'Solicitud Cliente', area: 'CRM', obligatorioDian: 'NO', operativamenteRecomendado: 'Recomendado', funcionPrincipal: 'Registro de requerimientos' },
  // Bancos
  { codigo: 'CB', documento: 'Conciliación Bancaria', area: 'Bancos', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Conciliar extractos' },
  { codigo: 'TRB', documento: 'Transferencia Bancaria', area: 'Bancos', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Control de movimientos bancarios' },
  // Cartera
  { codigo: 'CXC', documento: 'Cuenta por Cobrar', area: 'Cartera', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Seguimiento de clientes' },
  // Proveedores
  { codigo: 'CXP', documento: 'Cuenta por Pagar', area: 'Proveedores', obligatorioDian: 'NO', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Seguimiento de obligaciones' },
  // RRHH
  { codigo: 'CTL', documento: 'Contrato Laboral', area: 'RRHH', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Relación laboral' },
  { codigo: 'VAC', documento: 'Vacaciones', area: 'RRHH', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Gestión de descansos' },
  { codigo: 'INC', documento: 'Incapacidad', area: 'RRHH', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Registro de incapacidades' },
  { codigo: 'HE', documento: 'Horas Extras', area: 'RRHH', obligatorioDian: 'NO', operativamenteRecomendado: 'Muy recomendado', funcionPrincipal: 'Liquidación salarial' },
  { codigo: 'LIQ', documento: 'Liquidación', area: 'RRHH', obligatorioDian: 'SI', operativamenteRecomendado: 'Sí', funcionPrincipal: 'Terminación laboral' }
];

const AREA_TO_OPERACION: Record<string, string> = {
  'Ventas': 'VENTAS',
  'Compras': 'COMPRAS',
  'Nómina': 'NOMINA',
  'Tesorería': 'TESORERIA',
  'Inventario': 'INVENTARIO',
  'Contabilidad': 'CONTABILIDAD',
  'Comercial': 'COMERCIAL',
  'Logística': 'LOGISTICA',
  'Servicios': 'SERVICIOS',
  'CRM': 'CRM',
  'Bancos': 'BANCOS',
  'Cartera': 'CARTERA',
  'Proveedores': 'PROVEEDORES',
  'RRHH': 'RRHH'
};

const OPERACION_TO_AREA: Record<string, string> = {
  'VENTAS': 'Ventas',
  'COMPRAS': 'Compras',
  'NOMINA': 'Nómina',
  'TESORERIA': 'Tesorería',
  'INVENTARIO': 'Inventario',
  'CONTABILIDAD': 'Contabilidad',
  'COMERCIAL': 'Comercial',
  'LOGISTICA': 'Logística',
  'SERVICIOS': 'Servicios',
  'CRM': 'CRM',
  'BANCOS': 'Bancos',
  'CARTERA': 'Cartera',
  'PROVEEDORES': 'Proveedores',
  'RRHH': 'RRHH'
};

const DEFAULT_DOCUMENTS: DocumentoConfig[] = [
  {
    id: 'factura_venta',
    nombre: 'Factura de Venta',
    sigla: 'FV',
    prefijo: 'FE',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'VENTAS',
    plantillaImpresion: 'CARTA',
    esElectronico: true,
    resolucionDian: 'Resolución DIAN Nº 187640000123',
    fechaResolucion: '2026-01-01',
    vigenciaMeses: 12,
    rangoDesde: 1,
    rangoHasta: 10000,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'traslados',
    nombre: 'Traslado de Inventario',
    sigla: 'TI',
    prefijo: 'TI',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'INVENTARIO',
    plantillaImpresion: 'CARTA',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'orden_compra',
    nombre: 'Orden de Compra',
    sigla: 'OC',
    prefijo: 'OC',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'COMPRAS',
    plantillaImpresion: 'CARTA',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'factura_compra',
    nombre: 'Factura de Compra',
    sigla: 'FC',
    prefijo: 'FC',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'COMPRAS',
    plantillaImpresion: 'CARTA',
    esElectronico: true,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'recepcion_producto',
    nombre: 'Recepción de Producto',
    sigla: 'RP',
    prefijo: 'RP',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'INVENTARIO',
    plantillaImpresion: 'CARTA',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'ajuste_inventario',
    nombre: 'Ajuste de Inventario',
    sigla: 'AI',
    prefijo: 'AI',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'INVENTARIO',
    plantillaImpresion: 'CARTA',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'recibo_caja',
    nombre: 'Recibo de Caja',
    sigla: 'RC',
    prefijo: 'RC',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'TESORERIA',
    plantillaImpresion: 'TIRILLA_80',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'nota_credito',
    nombre: 'Nota de Crédito',
    sigla: 'NC',
    prefijo: 'NC',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'VENTAS',
    plantillaImpresion: 'CARTA',
    esElectronico: true,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  },
  {
    id: 'cotizacion',
    nombre: 'Cotización',
    sigla: 'COT',
    prefijo: 'COT',
    consecutivoInicial: 1,
    consecutivoSiguiente: 1,
    tipoOperacion: 'VENTAS',
    plantillaImpresion: 'CARTA',
    esElectronico: false,
    estado: 'ACTIVO',
    sucursalId: 'suc_principal'
  }
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

function Input({ value, onChange, placeholder, type = 'text', disabled = false, min }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      min={min}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
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

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfigDocumentos() {
  const [documents, setDocuments] = useState<DocumentoConfig[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('TODOS')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)
  const [sucursales, setSucursales] = useState<{ id: string; codigo: string; nombre: string }[]>([])

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<DocumentoConfig>>({})

  // Cargar sucursales para el anclaje
  useEffect(() => {
    const saved = localStorage.getItem('edatia_config_sucursales')
    if (saved) {
      try {
        setSucursales(JSON.parse(saved))
      } catch (e) {
        setSucursales([
          { id: 'suc_principal', codigo: 'B1', nombre: 'Sucursal Principal Poblado' },
          { id: 'suc_centro', codigo: 'B2', nombre: 'Sucursal Laureles' }
        ])
      }
    } else {
      setSucursales([
        { id: 'suc_principal', codigo: 'B1', nombre: 'Sucursal Principal Poblado' },
        { id: 'suc_centro', codigo: 'B2', nombre: 'Sucursal Laureles' }
      ])
    }
  }, [])

  // Cargar documentos desde localStorage en el inicio con auto-migración
  useEffect(() => {
    const saved = localStorage.getItem('edatia_config_documentos')
    if (saved) {
      try {
        let docs = JSON.parse(saved)
        let modified = false
        // Migración: añadir documentos por defecto faltantes
        DEFAULT_DOCUMENTS.forEach(defDoc => {
          const exists = docs.some((d: any) => d.id === defDoc.id || d.sigla === defDoc.sigla)
          if (!exists) {
            docs.push(defDoc)
            modified = true
          }
        })
        
        // Sincronizar traslados con sigla TI
        const trasladosIdx = docs.findIndex((d: any) => d.id === 'traslados')
        if (trasladosIdx >= 0 && docs[trasladosIdx].sigla === 'TR') {
          docs[trasladosIdx].sigla = 'TI'
          docs[trasladosIdx].prefijo = 'TI'
          docs[trasladosIdx].nombre = 'Traslado de Inventario'
          modified = true
        }

        if (modified) {
          localStorage.setItem('edatia_config_documentos', JSON.stringify(docs))
        }
        setDocuments(docs)
      } catch (e) {
        setDocuments(DEFAULT_DOCUMENTS)
      }
    } else {
      setDocuments(DEFAULT_DOCUMENTS)
      localStorage.setItem('edatia_config_documentos', JSON.stringify(DEFAULT_DOCUMENTS))
    }
  }, [])

  const saveToLocalStorage = (docs: DocumentoConfig[]) => {
    setDocuments(docs)
    localStorage.setItem('edatia_config_documentos', JSON.stringify(docs))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  // Obtener las áreas únicas presentes en los documentos registrados actualmente
  const activeTabs = useMemo(() => [
    'TODOS',
    ...Array.from(new Set(documents.map(d => d.tipoOperacion)))
  ], [documents])

  // Si la pestaña actual ya no existe en las pestañas activas, volver a TODOS
  useEffect(() => {
    if (!activeTabs.includes(tab)) {
      setTab('TODOS')
    }
  }, [documents, activeTabs, tab])

  // Operaciones del Formulario
  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      sigla: '',
      prefijo: '',
      consecutivoInicial: 1,
      consecutivoSiguiente: 1,
      tipoOperacion: 'VENTAS',
      plantillaImpresion: 'CARTA',
      esElectronico: false,
      estado: 'ACTIVO',
      resolucionDian: '',
      fechaResolucion: '',
      vigenciaMeses: 12,
      rangoDesde: 1,
      rangoHasta: 99999,
      sucursalId: sucursales[0]?.id || 'suc_principal'
    })
    setViewMode('form')
  }

  const handleOpenEdit = (doc: DocumentoConfig) => {
    setEditingId(doc.id)
    setForm({
      ...doc,
      sucursalId: doc.sucursalId || sucursales[0]?.id || 'suc_principal'
    })
    setViewMode('form')
  }

  const handleSelectTemplate = (codigo: string) => {
    const plantilla = CATALOGO_PLANTILLAS.find(p => p.codigo === codigo)
    if (!plantilla) return

    const operacion = AREA_TO_OPERACION[plantilla.area] || 'VENTAS'
    const esDian = plantilla.obligatorioDian === 'SI'

    setForm(f => ({
      ...f,
      nombre: plantilla.documento,
      sigla: plantilla.codigo,
      tipoOperacion: operacion as any,
      esElectronico: esDian,
      resolucionDian: esDian ? (f.resolucionDian || '') : '',
      fechaResolucion: esDian ? (f.fechaResolucion || '') : '',
      vigenciaMeses: esDian ? (f.vigenciaMeses || 12) : undefined,
      rangoDesde: esDian ? (f.rangoDesde || 1) : undefined,
      rangoHasta: esDian ? (f.rangoHasta || 10000) : undefined,
    }))
  }

  const handleDelete = (id: string) => {
    const isBaseDoc = DEFAULT_DOCUMENTS.some(d => d.id === id)
    if (isBaseDoc) {
      alert('Los tipos de documentos base del sistema no pueden ser eliminados, solo inhabilitados cambiándolos a estado INACTIVO.')
      return
    }
    if (window.confirm('¿Está seguro de que desea eliminar este tipo de documento? Esta acción no se puede deshacer.')) {
      const updated = documents.filter(d => d.id !== id)
      saveToLocalStorage(updated)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.sigla) {
      alert('Nombre y Sigla son campos obligatorios.')
      return
    }

    const currentTemplate = CATALOGO_PLANTILLAS.find(
      p => p.codigo === form.sigla?.toUpperCase()
    )
    const isDianForced = currentTemplate?.obligatorioDian === 'SI'
    const isDianHidden = currentTemplate?.obligatorioDian === 'NO'
    const esElectronicoEnforced = isDianForced ? true : (isDianHidden ? false : !!form.esElectronico)

    let updated: DocumentoConfig[]
    if (editingId) {
      // Editar
      updated = documents.map(d => (d.id === editingId ? { ...d, ...form, esElectronico: esElectronicoEnforced } as DocumentoConfig : d))
    } else {
      // Crear nuevo
      const newId = `doc_${Date.now()}`
      const newDoc: DocumentoConfig = {
        ...form,
        id: newId,
        nombre: form.nombre!,
        sigla: form.sigla!.toUpperCase(),
        prefijo: (form.prefijo || '').toUpperCase(),
        consecutivoInicial: form.consecutivoInicial || 1,
        consecutivoSiguiente: form.consecutivoSiguiente || 1,
        tipoOperacion: form.tipoOperacion || 'VENTAS',
        plantillaImpresion: form.plantillaImpresion || 'CARTA',
        esElectronico: esElectronicoEnforced,
        estado: form.estado || 'ACTIVO',
        sucursalId: form.sucursalId || sucursales[0]?.id || 'suc_principal'
      } as DocumentoConfig
      updated = [...documents, newDoc]
    }

    saveToLocalStorage(updated)
    setViewMode('list')
  }

  // Filtrado y Búsqueda
  const filtered = documents.filter(d => {
    const matchesSearch =
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.sigla.toLowerCase().includes(search.toLowerCase()) ||
      d.prefijo.toLowerCase().includes(search.toLowerCase())
    const matchesTab = tab === 'TODOS' || d.tipoOperacion === tab
    return matchesSearch && matchesTab
  })

  // Buscar plantilla correspondiente en base a la sigla actual
  const currentTemplate = CATALOGO_PLANTILLAS.find(
    p => p.codigo === form.sigla?.toUpperCase()
  )

  const isDianForced = currentTemplate?.obligatorioDian === 'SI'
  const isDianHidden = currentTemplate?.obligatorioDian === 'NO'
  const showDianSection = !isDianHidden
  const showDianToggle = !currentTemplate || currentTemplate.obligatorioDian === 'SEGUN_CASO'
  const showDianFields = isDianForced || (showDianToggle && form.esElectronico)

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
                <span className="text-slate-600 font-medium">Documentos</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                Configuración de Documentos
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Administración de prefijos, consecutivos iniciales/actuales, resoluciones DIAN y plantillas de impresión del ERP.
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
                Crear tipo de documento
              </button>
            </div>
          </div>

          {/* Filters & Search Control (Compact Underline Tabs) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-0.5">
            {/* Pestañas de tipo de operación con diseño minimalista */}
            <nav className="flex items-center gap-6 overflow-x-auto custom-scrollbar scrollbar-none pb-2 sm:pb-0">
              {activeTabs.map(t => {
                const isActive = tab === t
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                      isActive
                        ? 'text-indigo-600 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t === 'TODOS' ? 'Todos' : OPERACION_TO_AREA[t] || t}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Búsqueda compacta */}
            <div className="relative w-full sm:w-72 pb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, sigla o prefijo..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Main Table Card (Full Width) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Área / Operación</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prefijo y Consecutivo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Formato</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Integración DIAN</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.length > 0 ? (
                    filtered.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Documento y Sigla */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{doc.nombre}</div>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider">Sigla: {doc.sigla}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-indigo-600 font-medium">
                              Sucursal: {(() => {
                                const b = sucursales.find(s => s.id === doc.sucursalId)
                                return b ? `[${b.codigo}] ${b.nombre}` : 'Principal'
                              })()}
                            </span>
                          </div>
                        </td>

                        {/* Área */}
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                            doc.tipoOperacion === 'VENTAS' ? 'bg-blue-50 text-blue-600' :
                            doc.tipoOperacion === 'COMPRAS' ? 'bg-orange-50 text-orange-600' :
                            doc.tipoOperacion === 'INVENTARIO' ? 'bg-emerald-50 text-emerald-600' :
                            doc.tipoOperacion === 'TESORERIA' ? 'bg-purple-50 text-purple-600' :
                            doc.tipoOperacion === 'NOMINA' || doc.tipoOperacion === 'RRHH' ? 'bg-rose-50 text-rose-600' :
                            doc.tipoOperacion === 'CONTABILIDAD' ? 'bg-cyan-50 text-cyan-600' :
                            doc.tipoOperacion === 'COMERCIAL' ? 'bg-indigo-50 text-indigo-600' :
                            doc.tipoOperacion === 'LOGISTICA' || doc.tipoOperacion === 'SERVICIOS' ? 'bg-teal-50 text-teal-600' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {OPERACION_TO_AREA[doc.tipoOperacion] || doc.tipoOperacion}
                          </span>
                        </td>

                        {/* Prefijo y Consecutivo */}
                        <td className="p-4 font-mono text-xs">
                          <div className="font-bold text-slate-800">
                            {doc.prefijo ? `${doc.prefijo} - ` : ''}{doc.consecutivoSiguiente}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Inicial: {doc.consecutivoInicial}</div>
                        </td>

                        {/* Formato */}
                        <td className="p-4">
                          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            {doc.plantillaImpresion === 'CARTA' ? (
                              <>
                                <FileText size={14} className="text-slate-400" />
                                PDF Carta / A4
                              </>
                            ) : (
                              <>
                                <Receipt size={14} className="text-slate-400" />
                                Tirilla {doc.plantillaImpresion === 'TIRILLA_80' ? '80mm' : '58mm'}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Electrónico */}
                        <td className="p-4">
                          {doc.esElectronico ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold leading-none">
                                <ShieldCheck size={12} />
                                DIAN Activo
                              </span>
                              {doc.resolucionDian ? (
                                <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[180px]" title={doc.resolucionDian}>
                                  {doc.resolucionDian}
                                </div>
                              ) : (
                                <div className="text-[10px] text-rose-500 font-semibold leading-tight">
                                  Falta Resolución
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No aplica</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                            doc.estado === 'ACTIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${doc.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-400'}`} />
                            {doc.estado}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(doc)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar parámetros"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar documento"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No se encontraron tipos de documentos con los filtros seleccionados.
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Documentos</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Tipo de Documento' : 'Crear Tipo de Documento'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Establece los parámetros y el comportamiento para los flujos operativos.
              </p>
            </div>
          </div>

          {/* Form Card (Full Width) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Selector de Plantilla Base (Solo para creación) */}
              {!editingId && (
                <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100/60 space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                    <FileText size={15} className="text-indigo-600" />
                    Seleccionar Plantilla de Documento Base
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Elige una plantilla base de la tabla corporativa. Se auto-completarán los datos y se configurarán los campos fiscales correspondientes con la DIAN de manera automática.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <select
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        defaultValue=""
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled>-- Elige un documento base --</option>
                        {Array.from(new Set(CATALOGO_PLANTILLAS.map(p => p.area))).map(areaName => (
                          <optgroup key={areaName} label={areaName}>
                            {CATALOGO_PLANTILLAS.filter(p => p.area === areaName).map(p => (
                              <option key={p.codigo} value={p.codigo}>
                                [{p.codigo}] {p.documento}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Nombre del Documento *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. Factura de Venta POS"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Sigla *">
                    <Input
                      value={form.sigla}
                      onChange={(v: string) => setForm(f => ({ ...f, sigla: v }))}
                      placeholder="Ej. FVP"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Prefijo">
                    <Input
                      value={form.prefijo}
                      onChange={(v: string) => setForm(f => ({ ...f, prefijo: v }))}
                      placeholder="Ej. SETT"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Consecutivo Inicial">
                    <Input
                      type="number"
                      min={1}
                      value={form.consecutivoInicial}
                      onChange={(v: number) => setForm(f => ({ ...f, consecutivoInicial: v }))}
                      placeholder="1"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Consecutivo Siguiente">
                    <Input
                      type="number"
                      min={1}
                      value={form.consecutivoSiguiente}
                      onChange={(v: number) => setForm(f => ({ ...f, consecutivoSiguiente: v }))}
                      placeholder="1"
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Área / Operación">
                    <Select
                      value={form.tipoOperacion || 'VENTAS'}
                      onChange={(v) => setForm(f => ({ ...f, tipoOperacion: v }))}
                      options={[
                        { value: 'VENTAS', label: 'Ventas' },
                        { value: 'COMPRAS', label: 'Compras' },
                        { value: 'NOMINA', label: 'Nómina' },
                        { value: 'TESORERIA', label: 'Tesorería' },
                        { value: 'INVENTARIO', label: 'Inventario' },
                        { value: 'CONTABILIDAD', label: 'Contabilidad' },
                        { value: 'COMERCIAL', label: 'Comercial' },
                        { value: 'LOGISTICA', label: 'Logística' },
                        { value: 'SERVICIOS', label: 'Servicios' },
                        { value: 'CRM', label: 'CRM' },
                        { value: 'BANCOS', label: 'Bancos' },
                        { value: 'CARTERA', label: 'Cartera' },
                        { value: 'PROVEEDORES', label: 'Proveedores' },
                        { value: 'RRHH', label: 'RRHH' }
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Formato de Impresión">
                    <Select
                      value={form.plantillaImpresion || 'CARTA'}
                      onChange={(v) => setForm(f => ({ ...f, plantillaImpresion: v }))}
                      options={[
                        { value: 'CARTA', label: 'Papel Carta / A4 (PDF)' },
                        { value: 'TIRILLA_80', label: 'Tirilla POS Térmica 80mm' },
                        { value: 'TIRILLA_58', label: 'Tirilla POS Térmica 58mm' },
                      ]}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Sucursal Anclada *">
                    <Select
                      value={form.sucursalId || ''}
                      onChange={(v) => setForm(f => ({ ...f, sucursalId: v }))}
                      options={sucursales.map(s => ({
                        value: s.id,
                        label: `[${s.codigo}] ${s.nombre}`
                      }))}
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Estado">
                    <Select
                      value={form.estado || 'ACTIVO'}
                      onChange={(v) => setForm(f => ({ ...f, estado: v }))}
                      options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' },
                      ]}
                    />
                  </Field>
                </div>
              </div>

              {/* Sección DIAN */}
              {showDianSection && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  {isDianForced && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
                      <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold">Obligatoriedad Fiscal:</span> Este tipo de documento ({currentTemplate?.documento}) requiere habilitación y envío electrónico por normativa DIAN.
                      </div>
                    </div>
                  )}

                  {showDianToggle && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 pr-6">
                        <Toggle
                          checked={!!form.esElectronico}
                          onChange={(v) => setForm(f => ({ ...f, esElectronico: v }))}
                          label="Habilitar Facturación/Documentación Electrónica DIAN"
                        />
                        <p className="text-xs text-slate-400 leading-tight">
                          Activa la validación previa, firma digital y envío del XML estructurado a la DIAN de forma automatizada.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Campos condicionales DIAN */}
                  {showDianFields && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Building2 size={14} />
                        Resolución de Autorización de Numeración DIAN
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                          <Field label="Número de Resolución">
                            <Input
                              value={form.resolucionDian}
                              onChange={(v: string) => setForm(f => ({ ...f, resolucionDian: v }))}
                              placeholder="Ej. Resolución Nº 1876400000000000000"
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-3">
                          <Field label="Fecha de Resolución">
                            <Input
                              type="date"
                              value={form.fechaResolucion}
                              onChange={(v: string) => setForm(f => ({ ...f, fechaResolucion: v }))}
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-3">
                          <Field label="Vigencia (Meses)">
                            <Input
                              type="number"
                              min={1}
                              value={form.vigenciaMeses}
                              onChange={(v: number) => setForm(f => ({ ...f, vigenciaMeses: v }))}
                              placeholder="12"
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-6">
                          <Field label="Rango de Consecutivos (Desde)">
                            <Input
                              type="number"
                              min={1}
                              value={form.rangoDesde}
                              onChange={(v: number) => setForm(f => ({ ...f, rangoDesde: v }))}
                              placeholder="1"
                            />
                          </Field>
                        </div>

                        <div className="md:col-span-6">
                          <Field label="Rango de Consecutivos (Hasta)">
                            <Input
                              type="number"
                              min={1}
                              value={form.rangoHasta}
                              onChange={(v: number) => setForm(f => ({ ...f, rangoHasta: v }))}
                              placeholder="10000"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones del Formulario */}
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
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
