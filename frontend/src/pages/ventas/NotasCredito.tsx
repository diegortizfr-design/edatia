import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, XCircle, FileText, X, Trash2, Search, AlertTriangle } from 'lucide-react'
import {
  getNotasCredito, createNotaCredito, anularNotaCredito,
  getFacturas, getClientes,
} from '../../services/ventas.service'
import { getDocumentosConfig, incrementarConsecutivo } from '../../services/configuracion.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const MOTIVO_CONFIG: Record<string, { label: string; color: string }> = {
  DEVOLUCION: { label: 'Devolución',  color: 'bg-orange-100 text-orange-700' },
  DESCUENTO:  { label: 'Descuento',   color: 'bg-blue-100 text-blue-700' },
  ANULACION:  { label: 'Anulación',   color: 'bg-red-100 text-red-700' },
  OTRO:       { label: 'Otro',        color: 'bg-slate-100 text-slate-600' },
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  EMITIDA:  { label: 'Emitida',  color: 'bg-blue-100 text-blue-700' },
  ANULADA:  { label: 'Anulada',  color: 'bg-red-100 text-red-700' },
}

const DIAN_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600' },
  GENERADA:  { label: 'Generada',  color: 'bg-blue-100 text-blue-700' },
  ACEPTADA:  { label: 'Aceptada',  color: 'bg-green-100 text-green-700' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
}

function Badge({ value, config }: { value: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[value] ?? { label: value, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const TIPO_IVA_OPTIONS = ['IVA_19', 'IVA_5', 'IVA_0', 'EXCLUIDO']

const NC_LINE_DEFAULT = () => ({
  _key: Math.random().toString(36).slice(2),
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  tipoIva: 'IVA_19',
})

export function NotasCredito() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ['notas-credito'],
    queryFn: () => getNotasCredito(),
  })

  const mutAnular = useMutation({
    mutationFn: (id: number) => anularNotaCredito(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas-credito'] }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notas Crédito</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(notas as any[]).length} nota(s) registrada(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Nueva nota crédito
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-16 text-slate-400">Cargando notas crédito...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Número', 'Factura ref.', 'Cliente', 'Motivo', 'Total', 'Estado', 'DIAN', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(notas as any[]).map((n: any) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">
                      <Link to={`/ventas/notas-credito/${n.id}`} className="hover:underline">
                        {n.prefijo || ''}{n.numero}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-mono">
                      {n.factura?.prefijo || ''}{n.factura?.numero ?? 'No Referenciado'}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-[140px] truncate">
                      {n.factura?.cliente?.nombre ?? n.cliente?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      {n.motivo ? <Badge value={n.motivo} config={MOTIVO_CONFIG} /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{fmt(Number(n.total ?? 0))}</td>
                    <td className="px-5 py-3">
                      <Badge value={n.estado} config={ESTADO_CONFIG} />
                    </td>
                    <td className="px-5 py-3">
                      {n.estadoDIAN ? <Badge value={n.estadoDIAN} config={DIAN_CONFIG} /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/ventas/notas-credito/${n.id}`} className="text-xs font-bold text-indigo-650 hover:text-indigo-800">
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
                {(notas as any[]).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400">No hay notas crédito registradas</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <NuevaNotaCreditoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['notas-credito'] })
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function NuevaNotaCreditoModal({ onClose, onSuccess }: any) {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [isReferenced, setIsReferenced] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [motivo, setMotivo] = useState('DEVOLUCION')
  const [descripcion, setDescripcion] = useState('')
  
  // Referenced Factura fields
  const [facturaQ, setFacturaQ] = useState('')
  const [facturaId, setFacturaId] = useState('')
  const [ncMode, setNcMode] = useState<'PRODUCTOS' | 'MANUAL'>('PRODUCTOS')
  const [manualTotal, setManualTotal] = useState('')
  const [manualIva, setManualIva] = useState('IVA_19')
  const [facturaItemsLines, setFacturaItemsLines] = useState<any[]>([])

  // Non-referenced Cliente fields
  const [clienteQ, setClienteQ] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [manualItems, setManualItems] = useState<any[]>([
    {
      _key: Math.random().toString(36).slice(2),
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      tipoIva: 'IVA_19',
    }
  ])

  // Queries
  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => getFacturas(),
  })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(),
  })

  const { data: docConfigs = [] } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  })

  const ncDocs = useMemo(() => 
    docConfigs.filter((d: any) => d.sigla === 'NC' && d.estado === 'ACTIVO'),
    [docConfigs]
  )

  useEffect(() => {
    if (ncDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(String(ncDocs[0].id))
    }
  }, [ncDocs, selectedDocId])

  const facturasFiltradas = useMemo(() => {
    if (!facturaQ) return facturas as any[]
    return (facturas as any[]).filter((f: any) =>
      `${f.prefijo ?? ''}${f.numero}`.includes(facturaQ) ||
      f.cliente?.nombre?.toLowerCase().includes(facturaQ.toLowerCase())
    )
  }, [facturas, facturaQ])

  const clientesFiltrados = useMemo(() => {
    if (!clienteQ) return clientes as any[]
    return (clientes as any[]).filter((c: any) =>
      c.nombre?.toLowerCase().includes(clienteQ.toLowerCase()) ||
      c.numeroDocumento?.includes(clienteQ)
    )
  }, [clientes, clienteQ])

  const facturaSeleccionada = (facturas as any[]).find((f: any) => String(f.id) === facturaId)
  const clienteSeleccionado = (clientes as any[]).find((c: any) => String(c.id) === clienteId)

  // When a factura is selected, populate items
  useEffect(() => {
    if (facturaSeleccionada) {
      setFacturaItemsLines(
        (facturaSeleccionada.items ?? []).map((item: any) => ({
          id: item.id,
          productoId: item.productoId,
          descripcion: item.descripcion || item.producto?.nombre,
          maxCantidad: Number(item.cantidad),
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
          tipoIva: item.tipoIva,
          checked: true,
        }))
      )
    } else {
      setFacturaItemsLines([])
    }
  }, [facturaSeleccionada])

  const mutIncrementConsecutive = useMutation({
    mutationFn: (id: number) => incrementarConsecutivo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-config'] })
    }
  })

  const mutCreate = useMutation({
    mutationFn: createNotaCredito,
    onSuccess: async (data: any) => {
      if (selectedDocId) {
        try {
          await mutIncrementConsecutive.mutateAsync(Number(selectedDocId))
        } catch (e) {
          console.error("Error updating consecutive on server:", e)
        }
      }
      onSuccess()
      navigate(`/ventas/notas-credito/${data.id}`)
    }
  })

  const computedConsecutive = useMemo(() => {
    if (!selectedDocId) return ''
    const doc = docConfigs.find((d: any) => String(d.id) === String(selectedDocId))
    if (!doc) return ''
    return `${doc.prefijo ?? ''}${doc.consecutivoSiguiente}`
  }, [selectedDocId, docConfigs])

  // Non-referenced manual items management
  const addManualLine = () => {
    setManualItems(prev => [
      ...prev,
      {
        _key: Math.random().toString(36).slice(2),
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        tipoIva: 'IVA_19',
      }
    ])
  }

  const removeManualLine = (key: string) => {
    setManualItems(prev => prev.filter(l => l._key !== key))
  }

  const updateManualLine = (key: string, field: string, value: any) => {
    setManualItems(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))
  }

  // Referenced items management
  const toggleFacturaItem = (id: number) => {
    setFacturaItemsLines(prev => prev.map(l => l.id === id ? { ...l, checked: !l.checked } : l))
  }

  const updateFacturaItem = (id: number, field: string, val: any) => {
    setFacturaItemsLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocId) return alert('Seleccione un documento/prefijo para la Nota Crédito')

    let payloadItems = []
    
    if (isReferenced) {
      if (!facturaId) return alert('Debe seleccionar una factura de referencia')
      if (ncMode === 'MANUAL') {
        const val = parseFloat(manualTotal)
        if (isNaN(val) || val <= 0) return alert('Ingrese un valor manual válido mayor a cero')
        payloadItems.push({
          descripcion: `Ajuste de valor manual: ${descripcion || 'Ajuste general'}`,
          cantidad: 1,
          precioUnitario: val,
          tipoIva: manualIva,
        })
      } else {
        const checkedLines = facturaItemsLines.filter(l => l.checked)
        if (checkedLines.length === 0) return alert('Debe seleccionar al menos un producto para la devolución')
        
        for (const line of checkedLines) {
          const c = parseFloat(String(line.cantidad))
          const p = parseFloat(String(line.precioUnitario))
          if (isNaN(c) || c <= 0) return alert(`Cantidad inválida para: ${line.descripcion}`)
          if (c > line.maxCantidad) return alert(`La cantidad para "${line.descripcion}" no puede exceder la facturada (${line.maxCantidad})`)
          if (isNaN(p) || p < 0) return alert(`Precio inválido para: ${line.descripcion}`)
          
          payloadItems.push({
            productoId: line.productoId,
            descripcion: line.descripcion,
            cantidad: c,
            precioUnitario: p,
            tipoIva: line.tipoIva,
          })
        }
      }
    } else {
      if (!clienteId) return alert('Debe seleccionar un cliente para la Nota Crédito')
      if (manualItems.length === 0) return alert('Debe agregar al menos un ítem a la Nota Crédito')
      
      for (const line of manualItems) {
        if (!line.descripcion.trim()) return alert('Debe ingresar la descripción de todos los ítems')
        const c = parseFloat(String(line.cantidad))
        const p = parseFloat(String(line.precioUnitario))
        if (isNaN(c) || c <= 0) return alert(`Cantidad inválida para: ${line.descripcion}`)
        if (isNaN(p) || p < 0) return alert(`Precio inválido para: ${line.descripcion}`)
        
        payloadItems.push({
          descripcion: line.descripcion,
          cantidad: c,
          precioUnitario: p,
          tipoIva: line.tipoIva,
        })
      }
    }

    mutCreate.mutate({
      facturaId: isReferenced ? Number(facturaId) : undefined,
      clienteId: isReferenced ? undefined : Number(clienteId),
      motivo,
      descripcion: descripcion || 'Nota Crédito de venta',
      numero: computedConsecutive,
      items: payloadItems,
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Crear Nota Crédito de Venta</h2>
            <p className="text-xs text-slate-400 mt-0.5">Registre notas de crédito referenciadas o de ajuste libre</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Reference Mode Select */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Nota Crédito</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="refMode" 
                  checked={isReferenced} 
                  onChange={() => { setIsReferenced(true); setClienteId(''); setClienteQ('') }}
                  className="accent-indigo-650"
                />
                Referenciada a Factura
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="refMode" 
                  checked={!isReferenced} 
                  onChange={() => { setIsReferenced(false); setFacturaId(''); setFacturaQ('') }}
                  className="accent-indigo-650"
                />
                Sin Factura (No Referenciada)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prefijo Documento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Prefijo / Consecutivo (Documento NC) *</label>
              <select 
                required 
                value={selectedDocId} 
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                {ncDocs.length === 0 && <option value="">No hay prefijos NC configurados</option>}
                {ncDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo || 'Sin prefijo'} - Sig. #{d.consecutivoSiguiente})
                  </option>
                ))}
              </select>
              {computedConsecutive && (
                <p className="text-[10px] text-indigo-650 font-bold mt-1">Número calculado: {computedConsecutive}</p>
              )}
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Motivo de Acreditación *</label>
              <select 
                required 
                value={motivo} 
                onChange={e => setMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="DEVOLUCION">Devolución parcial de bienes/servicios</option>
                <option value="DESCUENTO">Descuento o rebaja comercial general</option>
                <option value="ANULACION">Anulación total de la factura de venta</option>
                <option value="OTRO">Otros motivos de ajuste contable</option>
              </select>
            </div>
          </div>

          {/* Referenced Invoice Lookup */}
          {isReferenced ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Factura de referencia *</label>
              {facturaSeleccionada ? (
                <div className="flex items-center gap-3 p-3 border border-indigo-200 bg-indigo-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-855">
                      {facturaSeleccionada.prefijo || ''}{facturaSeleccionada.numero} — {facturaSeleccionada.cliente?.nombre}
                    </p>
                    <p className="text-xs text-indigo-600">Total Facturado: {fmt(Number(facturaSeleccionada.total ?? 0))} · Saldo: {fmt(Number(facturaSeleccionada.saldo ?? 0))}</p>
                  </div>
                  <button type="button" onClick={() => { setFacturaId(''); setFacturaQ('') }}
                    className="text-xs font-bold text-red-505 hover:text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 px-3 py-2 bg-white">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input 
                      value={facturaQ} 
                      onChange={e => setFacturaQ(e.target.value)}
                      placeholder="Escriba número de factura o cliente..."
                      className="w-full text-sm outline-none bg-transparent" 
                    />
                  </div>
                  {facturaQ && facturasFiltradas.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
                      {facturasFiltradas.slice(0, 10).map((f: any) => (
                        <button key={f.id} type="button"
                          onClick={() => { setFacturaId(String(f.id)); setFacturaQ(`${f.prefijo ?? ''}${f.numero}`) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs transition-colors flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-slate-805">{f.prefijo || ''}{f.numero}</p>
                            <p className="text-slate-500">{f.cliente?.nombre}</p>
                          </div>
                          <div className="text-right font-mono font-bold text-slate-700">
                            {fmt(Number(f.total ?? 0))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Non-referenced Cliente Lookup */
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Cliente (Adquirente) *</label>
              {clienteSeleccionado ? (
                <div className="flex items-center gap-3 p-3 border border-indigo-200 bg-indigo-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-855">
                      {clienteSeleccionado.nombre}
                    </p>
                    <p className="text-xs text-indigo-600">NIT/CC: {clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento}</p>
                  </div>
                  <button type="button" onClick={() => { setClienteId(''); setClienteQ('') }}
                    className="text-xs font-bold text-red-505 hover:text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 px-3 py-2 bg-white">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input 
                      value={clienteQ} 
                      onChange={e => setClienteQ(e.target.value)}
                      placeholder="Escriba NIT o Nombre del cliente..."
                      className="w-full text-sm outline-none bg-transparent" 
                    />
                  </div>
                  {clienteQ && clientesFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
                      {clientesFiltrados.slice(0, 10).map((c: any) => (
                        <button key={c.id} type="button"
                          onClick={() => { setClienteId(String(c.id)); setClienteQ(c.nombre) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs transition-colors">
                          <p className="font-semibold text-slate-805">{c.nombre}</p>
                          <p className="text-slate-400 text-[10px]">NIT: {c.numeroDocumento}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- Items Section (REFERENCED) --- */}
          {isReferenced && facturaSeleccionada && (
            <div className="space-y-4">
              <div className="border-t border-slate-150 pt-4 flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Ajuste de Ítems facturados</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ncModeModal" 
                      value="PRODUCTOS" 
                      checked={ncMode === 'PRODUCTOS'} 
                      onChange={() => setNcMode('PRODUCTOS')}
                      className="accent-indigo-650"
                    />
                    Acreditar Ítems específicos
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ncModeModal" 
                      value="MANUAL" 
                      checked={ncMode === 'MANUAL'} 
                      onChange={() => setNcMode('MANUAL')}
                      className="accent-indigo-650"
                    />
                    Ajuste manual de valor
                  </label>
                </div>
              </div>

              {ncMode === 'MANUAL' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor de Ajuste (Bruto) *</label>
                    <input 
                      type="number" 
                      required
                      min="1" 
                      step="any"
                      placeholder="Ingrese el valor a acreditar..."
                      value={manualTotal}
                      onChange={e => setManualTotal(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tarifa de IVA Aplicable *</label>
                    <select 
                      required 
                      value={manualIva} 
                      onChange={e => setManualIva(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="IVA_19">IVA 19%</option>
                      <option value="IVA_5">IVA 5%</option>
                      <option value="IVA_0">IVA 0%</option>
                      <option value="EXCLUIDO">Excluido / No Sujeto</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="w-10 px-3 py-2 text-center"></th>
                        <th className="px-3 py-2 text-left">Ítem / Descripción</th>
                        <th className="px-3 py-2 text-right w-20">Cant. Fact.</th>
                        <th className="px-3 py-2 text-right w-24">Cant. Dev.</th>
                        <th className="px-3 py-2 text-right w-28">Precio Acreditado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {facturaItemsLines.map((l: any) => (
                        <tr key={l.id} className={`hover:bg-slate-50/50 ${!l.checked ? 'opacity-60 bg-slate-50/20' : ''}`}>
                          <td className="px-3 py-2.5 text-center">
                            <input 
                              type="checkbox" 
                              checked={l.checked} 
                              onChange={() => toggleFacturaItem(l.id)}
                              className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-slate-805">{l.descripcion}</p>
                            <span className="text-[10px] text-slate-400 font-mono">IVA: {l.tipoIva.replace('_', ' ')}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-slate-505">{l.maxCantidad}</td>
                          <td className="px-3 py-2.5">
                            <input 
                              type="number" 
                              disabled={!l.checked}
                              required={l.checked}
                              min="0.001" 
                              step="any"
                              max={l.maxCantidad}
                              value={l.cantidad}
                              onChange={e => updateFacturaItem(l.id, 'cantidad', e.target.value)}
                              className="w-full px-2 py-1 text-right border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white disabled:opacity-50"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input 
                              type="number" 
                              disabled={!l.checked}
                              required={l.checked}
                              min="0" 
                              step="any"
                              value={l.precioUnitario}
                              onChange={e => updateFacturaItem(l.id, 'precioUnitario', e.target.value)}
                              className="w-full px-2 py-1 text-right border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* --- Items Section (NON-REFERENCED) --- */}
          {!isReferenced && clienteSeleccionado && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Ítems de Acreditación Manual</label>
                <button 
                  type="button" 
                  onClick={addManualLine}
                  className="text-xs text-indigo-650 hover:text-indigo-850 flex items-center gap-1 font-bold"
                >
                  <Plus size={12} /> Agregar Fila
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="px-3 py-2 text-left">Descripción del Ítem *</th>
                      <th className="px-3 py-2 text-right w-16">Cant. *</th>
                      <th className="px-3 py-2 text-right w-24">Precio Unit. *</th>
                      <th className="px-3 py-2 text-left w-24">IVA *</th>
                      <th className="w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {manualItems.map(l => (
                      <tr key={l._key} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2">
                          <input 
                            value={l.descripcion} 
                            onChange={e => updateManualLine(l._key, 'descripcion', e.target.value)}
                            required
                            placeholder="Ej: Ajuste por servicio..."
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            min="0.001" 
                            step="any"
                            value={l.cantidad}
                            onChange={e => updateManualLine(l._key, 'cantidad', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            min="0" 
                            step="any"
                            value={l.precioUnitario}
                            onChange={e => updateManualLine(l._key, 'precioUnitario', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select 
                            value={l.tipoIva} 
                            onChange={e => updateManualLine(l._key, 'tipoIva', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            <option value="IVA_19">IVA 19%</option>
                            <option value="IVA_5">IVA 5%</option>
                            <option value="IVA_0">IVA 0%</option>
                            <option value="EXCLUIDO">Excluido</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {manualItems.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeManualLine(l._key)}
                              className="text-slate-350 hover:text-red-500 transition-colors p-1 hover:bg-slate-50 rounded-lg"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mutCreate.isError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{(mutCreate.error as any)?.response?.data?.message ?? 'Error al procesar la Nota Crédito'}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={mutCreate.isPending}
            className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md active:scale-95"
          >
            {mutCreate.isPending ? 'Creando Nota...' : 'Crear Nota Crédito'}
          </button>
        </div>

      </div>
    </div>
  )
}
