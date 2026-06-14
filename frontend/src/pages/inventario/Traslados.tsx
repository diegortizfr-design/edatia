import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  getMovimientos, 
  getBodegas, 
  recibirTraslado 
} from '../../services/inventario.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'
import { 
  ArrowLeftRight, FileText, Printer, X, ClipboardCheck, Clock, Search, Plus, Calendar, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

export function Traslados() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes')
  
  // Search / Filters
  const [filtroQ, setFiltroQ] = useState('')

  // Modals state
  const [selectedTraslado, setSelectedTraslado] = useState<any | null>(null)
  const [showGestionModal, setShowGestionModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Manage reception form state
  const [recibirRpDocId, setRecibirRpDocId] = useState('')
  const [observacionRec, setObservacionRec] = useState('')
  const [errorRec, setErrorRec] = useState<string | null>(null)

  // 1. Fetch data
  const { data: movementsData, isLoading: loadingMovs } = useQuery({ 
    queryKey: ['kardex-movimientos'], 
    queryFn: () => getMovimientos({ limit: 100 }) 
  })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas-movimientos'], queryFn: getBodegas })
  const { data: documentosConfig = [] } = useQuery({
    queryKey: ['documentos-config-movimientos'],
    queryFn: getDocumentosConfig,
  })

  const dbMovements = movementsData?.data || []

  // Extract transfers and map them
  const traslados = dbMovements
    .filter((m: any) => m.tipo === 'TRASLADO_SALIDA')
    .map((m: any) => {
      const bodegaOrigen = bodegas.find((b: any) => String(b.id) === String(m.bodegaOrigenId))
      const bodegaDestino = bodegas.find((b: any) => String(b.id) === String(m.bodegaDestinoId))
      
      const serialesStr = (m.serialesSalida || m.serialesEntrada || []).map((s: any) => s.serial).join(', ')
      const lote = m.notas?.match(/\[Lote:\s*(.+?)\]/)?.[1] || null

      return {
        id: m.numero || `TI-${m.id}`,
        dbId: m.id,
        numero: m.numero,
        tipo: 'TI',
        bodegaOrigenId: m.bodegaOrigenId,
        bodegaOrigenNombre: bodegaOrigen?.nombre || m.bodegaOrigen?.nombre || 'Bodega Origen',
        bodegaOrigenSucursalId: bodegaOrigen?.sucursalId || null,
        bodegaDestinoId: m.bodegaDestinoId,
        bodegaDestinoNombre: bodegaDestino?.nombre || m.bodegaDestino?.nombre || 'Bodega Destino',
        bodegaDestinoSucursalId: bodegaDestino?.sucursalId || null,
        productoId: m.productoId,
        productoNombre: m.producto?.nombre || 'Producto',
        productoSku: m.producto?.sku || '',
        cantidad: Number(m.cantidad),
        costoUnitario: Number(m.costoUnitario),
        total: Number(m.cantidad) * Number(m.costoUnitario),
        estado: m.estado || 'EN_TRANSITO',
        fecha: m.fechaMovimiento,
        notas: m.notas || '',
        lote,
        seriales: serialesStr,
        usuarioId: m.usuarioId,
        movimientoParId: m.movimientoParId
      }
    })

  // Sort transfers by date (most recent first)
  const sortedTraslados = traslados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  // Filter pending/history list
  const listItems = sortedTraslados.filter(t => {
    if (activeTab === 'pendientes' && t.estado !== 'EN_TRANSITO') return false
    
    if (filtroQ.trim()) {
      const q = filtroQ.toLowerCase()
      return (
        t.id.toLowerCase().includes(q) ||
        t.productoNombre.toLowerCase().includes(q) ||
        t.productoSku.toLowerCase().includes(q) ||
        t.bodegaOrigenNombre.toLowerCase().includes(q) ||
        t.bodegaDestinoNombre.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Resolve RP document configurations for the selected transfer's destination sucursal
  const destSucursalId = selectedTraslado?.bodegaDestinoSucursalId
  const rpDocs = documentosConfig.filter((d: any) => {
    if (d.tipoOperacion !== 'INVENTARIO' || d.estado !== 'ACTIVO') return false
    if (d.sigla !== 'RP') return false
    if (d.sucursalId && destSucursalId) {
      return Number(d.sucursalId) === Number(destSucursalId)
    }
    return !d.sucursalId
  })

  // Mutation to receive transfer
  const recibirTrasladoMutation = useMutation({
    mutationFn: ({ idNum, documentoId, notas }: { idNum: number; documentoId?: number; notas?: string }) => {
      // Pass the notes if they are customized
      return recibirTraslado(idNum, documentoId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['stock-movimientos'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      toast.success('Traslado recibido e ingresado a inventario correctamente')
      setShowGestionModal(false)
      setSelectedTraslado(null)
      setRecibirRpDocId('')
      setObservacionRec('')
      setErrorRec(null)
    },
    onError: (err: any) => {
      setErrorRec(getApiError(err, 'Error al confirmar la recepción del traslado'))
    }
  })

  const handleOpenPrintModal = (t: any) => {
    setSelectedTraslado(t)
    setShowPrintModal(true)
  }

  const handleOpenGestionModal = (t: any) => {
    setSelectedTraslado(t)
    setRecibirRpDocId('')
    setObservacionRec('')
    setErrorRec(null)
    setShowGestionModal(true)
  }

  const handleConfirmarRecepcion = () => {
    setErrorRec(null)
    if (!selectedTraslado) return

    // Since it's sucursal-to-sucursal (implied when in transit), require RP document
    if (!recibirRpDocId) {
      setErrorRec('Por favor seleccione una configuración de documento de recepción (RP) para cruzar.')
      return
    }

    recibirTrasladoMutation.mutate({
      idNum: selectedTraslado.dbId,
      documentoId: Number(recibirRpDocId),
      notas: observacionRec.trim() || undefined
    })
  }

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight size={22} className="text-indigo-600" />
            Traslados de Inventario
          </h1>
          <p className="text-xs text-slate-400">Administra, envía y recibe mercancía entre tus sucursales y bodegas.</p>
        </div>

        <Link
          to="/inventario/control-existencias/nuevo-traslado"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
        >
          <Plus size={14} /> Registrar Traslado (TI)
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex gap-1">
          <button
            onClick={() => { setActiveTab('pendientes'); setFiltroQ('') }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pendientes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Clock size={14} />
            Pendientes de Recepción
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'pendientes' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {sortedTraslados.filter(t => t.estado === 'EN_TRANSITO').length}
            </span>
          </button>
          
          <button
            onClick={() => { setActiveTab('historial'); setFiltroQ('') }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'historial'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} />
            Historial de Traslados
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'historial' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {sortedTraslados.length}
            </span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filtroQ}
            onChange={e => setFiltroQ(e.target.value)}
            placeholder="Buscar por prefijo, producto o bodega..."
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingMovs ? (
          <div className="text-center py-16 text-slate-400 font-semibold animate-pulse text-xs">
            Cargando traslados de inventario...
          </div>
        ) : listItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-semibold">
            {activeTab === 'pendientes'
              ? 'No hay traslados pendientes de recepción.'
              : 'No se encontraron registros de traslados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="text-left px-6 py-4">Documento</th>
                  <th className="text-left px-6 py-4">Origen</th>
                  <th className="text-left px-6 py-4">Destino</th>
                  <th className="text-left px-6 py-4">Producto</th>
                  <th className="text-right px-6 py-4">Cantidad</th>
                  <th className="text-left px-6 py-4">Fecha</th>
                  <th className="text-center px-6 py-4">Estado</th>
                  <th className="text-right px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listItems.map((t, idx) => {
                  let tagColor = "bg-slate-100 text-slate-700"
                  if (t.estado === 'RECIBIDO' || t.estado === 'COMPLETADO') {
                    tagColor = "bg-green-50 text-green-700 border-green-150"
                  } else if (t.estado === 'EN_TRANSITO') {
                    tagColor = "bg-amber-50 text-amber-700 border-amber-150"
                  }

                  return (
                    <tr key={t.id + '-' + idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        <button
                          onClick={() => handleOpenPrintModal(t)}
                          className="text-indigo-600 hover:text-indigo-850 hover:underline font-bold text-left"
                        >
                          {t.id}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{t.bodegaOrigenNombre}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{t.bodegaDestinoNombre}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div>{t.productoNombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {t.productoSku}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800">{t.cantidad}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {new Date(t.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex font-bold px-2 py-0.5 rounded text-[9px] ${tagColor}`}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.estado === 'EN_TRANSITO' ? (
                          <button
                            onClick={() => handleOpenGestionModal(t)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-all shadow-sm"
                          >
                            Gestionar Recepción (RP)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPrintModal(t)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-[10px] transition-all"
                          >
                            Ver Comprobante
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Gestionar Recepción (Formulario sin diseño de impresión) */}
      {showGestionModal && selectedTraslado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Gestionar Recepción de Traslado
                </h3>
              </div>
              <button
                onClick={() => setShowGestionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {errorRec && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                  {errorRec}
                </div>
              )}

              {/* Transfer Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span><strong>Traslado Ref:</strong></span>
                  <span className="font-mono font-bold text-slate-800">{selectedTraslado.id}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Origen:</strong></span>
                  <span className="font-semibold text-slate-800">{selectedTraslado.bodegaOrigenNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Destino:</strong></span>
                  <span className="font-semibold text-slate-800">{selectedTraslado.bodegaDestinoNombre}</span>
                </div>
                
                <div className="border-t border-slate-200 my-2 pt-2">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>{selectedTraslado.productoNombre}</span>
                    <span>Cant: {selectedTraslado.cantidad}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">SKU: {selectedTraslado.productoSku}</div>
                  {selectedTraslado.lote && (
                    <div className="text-[10px] text-amber-700 font-semibold mt-1">Lote: {selectedTraslado.lote}</div>
                  )}
                  {selectedTraslado.seriales && (
                    <div className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 p-1.5 rounded font-mono mt-1 break-all">
                      <strong>Seriales:</strong> {selectedTraslado.seriales}
                    </div>
                  )}
                </div>
              </div>

              {/* Documento Config (RP) Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Documento de Recepción (RP) *</label>
                <select
                  value={recibirRpDocId}
                  onChange={e => setRecibirRpDocId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="">— Seleccionar RP —</option>
                  {rpDocs.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d.prefijo}) — Folio: {d.consecutivoSiguiente}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-1">Este ingreso de inventario afectará las existencias bajo el consecutivo del documento de recepción seleccionado.</p>
              </div>

              {/* Observaciones de recepción */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observación / Novedades de Recepción</label>
                <textarea
                  value={observacionRec}
                  onChange={e => setObservacionRec(e.target.value)}
                  placeholder="Detalles sobre el estado físico de los productos al recibirlos..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGestionModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRecepcion}
                disabled={recibirTrasladoMutation.isPending}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                {recibirTrasladoMutation.isPending ? 'Procesando...' : 'Confirmar e Ingresar Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Comprobante Imprimible (Diseño Voucher) */}
      {showPrintModal && selectedTraslado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Comprobante de Traslado
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Printer size={14} /> Imprimir Comprobante
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  <X size={14} /> Cerrar
                </button>
              </div>
            </div>

            {/* Voucher Printable Layout */}
            <div className="overflow-y-auto p-8 flex-1 bg-slate-100/30">
              <div 
                id="printable-voucher" 
                className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 max-w-[210mm] mx-auto text-slate-800"
                style={{ minHeight: '200mm' }}
              >
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight text-slate-900">EDATIA S.A.S.</h2>
                    <p className="text-[10px] text-slate-500 font-medium">NIT: 901.458.332-1</p>
                    <p className="text-[10px] text-slate-400">Régimen Común de IVA</p>
                    <p className="text-[10px] text-slate-400">Calle 100 # 15-22, Of. 504, Bogotá D.C.</p>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block">
                      <span className="block text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                        Comprobante de Traslado
                      </span>
                      <span className="block text-sm font-black font-mono text-indigo-600 mt-0.5">
                        N° {selectedTraslado.id}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                      <p>Fecha Emisión: {new Date(selectedTraslado.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <p>
                        Estado:{' '}
                        <span className="font-extrabold uppercase text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[8px]">
                          {selectedTraslado.estado}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-150 rounded-xl p-4 text-[11px] text-slate-600 leading-relaxed">
                  <div>
                    <h4 className="font-black text-slate-950 uppercase tracking-wider text-[9px] mb-1">Origen</h4>
                    <p><strong className="font-bold text-slate-750">Bodega:</strong> {selectedTraslado.bodegaOrigenNombre}</p>
                    {selectedTraslado.usuarioId && <p><strong className="font-bold text-slate-750">Despachado por (ID):</strong> {selectedTraslado.usuarioId}</p>}
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <h4 className="font-black text-slate-950 uppercase tracking-wider text-[9px] mb-1">Destino</h4>
                    <p><strong className="font-bold text-slate-750">Bodega:</strong> {selectedTraslado.bodegaDestinoNombre}</p>
                    {selectedTraslado.movimientoParId && <p><strong className="font-bold text-slate-750">Cruce de Recepción:</strong> {selectedTraslado.movimientoParId}</p>}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Descripción del Producto</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Costo Unit.</th>
                        <th className="px-4 py-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-650">{selectedTraslado.productoSku}</td>
                        <td className="px-4 py-3 space-y-1">
                          <span className="font-semibold text-slate-900">{selectedTraslado.productoNombre}</span>
                          {selectedTraslado.lote && (
                            <div className="mt-0.5">
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                Lote: {selectedTraslado.lote}
                              </span>
                            </div>
                          )}
                          {selectedTraslado.seriales && (
                            <div className="text-[8px] text-indigo-700 bg-indigo-50 border border-indigo-150 p-1.5 rounded leading-tight font-mono mt-1">
                              <strong>Seriales:</strong> {selectedTraslado.seriales}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">{selectedTraslado.cantidad}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{fmtMoneda(selectedTraslado.costoUnitario)}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">{fmtMoneda(selectedTraslado.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Voucher Summary */}
                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1 space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones / Notas de Envío</h5>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                      {selectedTraslado.notas || 'Sin observaciones registradas para este documento.'}
                    </p>
                  </div>

                  <div className="w-64 border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                    <div className="flex justify-between px-4 py-3 bg-slate-900 text-white font-black text-xs">
                      <span>VALOR TOTAL</span>
                      <span>{fmtMoneda(selectedTraslado.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 pt-12 text-[9px] text-slate-500">
                  <div className="space-y-1.5 text-center">
                    <div className="border-b border-slate-300 h-10 w-full"></div>
                    <p className="font-black uppercase tracking-wider text-[8px] text-slate-700">Elaborado por (Auxiliar)</p>
                  </div>
                  <div className="space-y-1.5 text-center">
                    <div className="border-b border-slate-300 h-10 w-full"></div>
                    <p className="font-black uppercase tracking-wider text-[8px] text-slate-700">Autorizado por (Auditor)</p>
                  </div>
                  <div className="space-y-1.5 text-center">
                    <div className="border-b border-slate-300 h-10 w-full"></div>
                    <p className="font-black uppercase tracking-wider text-[8px] text-slate-700">Recibido por (Tercero)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
