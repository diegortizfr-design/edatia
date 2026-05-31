import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  getOrdenesCompra, 
  getMovimientos, 
  getBodegas, 
  getProductos, 
  getFacturasCompra, 
  recibirTraslado, 
  getStock, 
  postAjuste,
  FacturaCompra
} from '../../services/inventario.service'
import { 
  FileText, RotateCcw, AlertTriangle, Trash2, Search, ArrowUpRight, 
  ArrowDownLeft, ArrowLeftRight, Clock, CheckCircle, Plus, BookOpen, 
  HelpCircle, Sparkles, Layers, Box, CheckSquare 
} from 'lucide-react'

export function Movimientos() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'docs' | 'kardex' | 'bolsas'>('docs')
  
  // Tab 1 filters
  const [filtroDocTipo, setFiltroDocTipo] = useState<string>('todos')
  const [filtroDocQ, setFiltroDocQ] = useState<string>('')

  // Tab 2 filters
  const [kardexProductoId, setKardexProductoId] = useState<string>('todos')
  const [kardexBodegaId, setKardexBodegaId] = useState<string>('todos')
  const [kardexQ, setKardexQ] = useState<string>('')

  // Sub-tab inside Bolsas
  const [activeBolsaTab, setActiveBolsaTab] = useState<'averia' | 'perdida'>('averia')
  
  // Modals / forms for quick actions in bolsas
  const [bajaModalItem, setBajaModalItem] = useState<{ id: number; sku: string; nombre: string; cantidad: number; bodegaId: number; bolsa: 'averia' | 'perdida' } | null>(null)
  const [bajaObservacion, setBajaObservacion] = useState('')
  const [bajaAutorizado, setBajaAutorizado] = useState('')
  const [bajaCantidad, setBajaCantidad] = useState('')
  const [bajaError, setBajaError] = useState<string | null>(null)

  // 1. Fetch backend databases
  const { data: ocs = [] } = useQuery({ queryKey: ['ocs-movimientos'], queryFn: () => getOrdenesCompra() })
  const { data: movementsData } = useQuery({ 
    queryKey: ['kardex-movimientos'], 
    queryFn: () => getMovimientos({ limit: 100 }) 
  })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas-movimientos'], queryFn: getBodegas })
  const { data: productos = [] } = useQuery({ queryKey: ['productos-movimientos'], queryFn: () => getProductos({ activo: true }) })

  // 2. Fetch backend Facturas de Compra
  const { data: fcs = [] } = useQuery({
    queryKey: ['facturas-compra'],
    queryFn: () => getFacturasCompra()
  })

  // 3. Fetch backend stocks for Bags of Control
  const { data: stockItems = [] } = useQuery({
    queryKey: ['stock-movimientos'],
    queryFn: () => getStock()
  })

  const dbMovements = movementsData?.data || []

  // Extract real transfers from dbMovements
  const traslados = dbMovements
    .filter((m: any) => m.tipo === 'TRASLADO_SALIDA')
    .map((m: any) => ({
      id: String(m.id),
      numero: m.numero,
      tipo: 'TI',
      bodegaOrigenId: m.bodegaOrigenId,
      bodegaOrigenNombre: m.bodegaOrigen?.nombre || 'Bodega Origen',
      bodegaDestinoId: m.bodegaDestinoId,
      bodegaDestinoNombre: m.bodegaDestino?.nombre || 'Bodega Destino',
      productoId: m.productoId,
      productoNombre: m.producto?.nombre || 'Producto',
      productoSku: m.producto?.sku || '',
      cantidad: Number(m.cantidad),
      estado: m.estado || 'EN_TRANSITO',
      fecha: m.fechaMovimiento,
      fechaVerificacion: m.fechaVerificacion,
      autorizadoPor: 'Supervisor'
    }))

  // Extract real adjustments from dbMovements
  const ajustes = dbMovements
    .filter((m: any) => m.tipo === 'AJUSTE_POSITIVO' || m.tipo === 'AJUSTE_NEGATIVO')
    .map((m: any) => {
      // Determine motivo if possible from notes/concept
      let motivo = 'GENERAL'
      const notasLower = (m.notas || '').toLowerCase()
      if (m.concepto === 'DAR_DE_BAJA' || notasLower.includes('baja contable') || notasLower.includes('dar de baja')) {
        motivo = 'DAR_DE_BAJA'
      } else if (notasLower.includes('averia') || notasLower.includes('avería')) {
        motivo = 'AVERIA'
      } else if (notasLower.includes('perdida') || notasLower.includes('pérdida')) {
        motivo = 'PERDIDA'
      }

      return {
        id: m.numero || `AI-${m.id}`,
        dbId: m.id,
        tipo: m.tipo === 'AJUSTE_POSITIVO' ? 'AINE' : 'AINS',
        motivo,
        bodegaNombre: m.bodegaOrigen?.nombre || m.bodegaDestino?.nombre || 'Bodega Especial',
        cantidad: Math.abs(Number(m.cantidad)),
        observacion: m.notas || m.concepto || '',
        autorizadoPor: 'Supervisor',
        fecha: m.fechaMovimiento
      }
    })

  // Extract bags of control from backend Stock items
  const bolsaAverias = stockItems
    .filter((s: any) => s.bodega?.codigo === 'B-AVERIAS' && Number(s.cantidad) > 0)
    .map((s: any) => ({
      id: s.id,
      sku: s.producto?.sku || '',
      nombre: s.producto?.nombre || 'Producto',
      cantidad: Number(s.cantidad),
      bodegaId: s.bodegaId,
      fecha: s.updatedAt || new Date().toISOString()
    }))

  const bolsaPerdidas = stockItems
    .filter((s: any) => s.bodega?.codigo === 'B-PERDIDAS' && Number(s.cantidad) > 0)
    .map((s: any) => ({
      id: s.id,
      sku: s.producto?.sku || '',
      nombre: s.producto?.nombre || 'Producto',
      cantidad: Number(s.cantidad),
      bodegaId: s.bodegaId,
      fecha: s.updatedAt || new Date().toISOString()
    }))

  const recibirTrasladoMutation = useMutation({
    mutationFn: (idNum: number) => recibirTraslado(idNum),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['stock-movimientos'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al verificar la recepción del traslado')
    }
  })

  // Dual verification: receive Traslado
  const handleVerifyTraslado = (id: string) => {
    recibirTrasladoMutation.mutate(Number(id))
  }

  // 3. Consolidate ALL documents
  const allDocs: any[] = []

  // Add OCs
  ocs.forEach(oc => {
    allDocs.push({
      id: oc.numero || `OC-SIM-${oc.id}`,
      dbId: oc.id,
      tipo: 'OC',
      tipoLabel: 'Orden de Compra',
      origenDestino: oc.proveedor?.nombre || 'Proveedor',
      total: oc.total,
      fecha: oc.fechaEmision,
      estado: oc.estado,
      documentosRelacionados: {
        rp: oc.recepciones?.map((r: any) => r.numero).join(', ') || null,
        fc: fcs.find(f => f.recepcionId && oc.recepciones?.some((r: any) => r.numero === f.recepcionId))?.id || null
      }
    })

    // Extract RPs from OCs
    if (oc.recepciones) {
      oc.recepciones.forEach((rp: any) => {
        allDocs.push({
          id: rp.numero,
          tipo: 'RP',
          tipoLabel: 'Recepción de Producto',
          origenDestino: `Bodega: ${oc.bodega?.nombre || 'Destino'}`,
          total: null,
          fecha: rp.fecha,
          estado: 'PROCESADA',
          documentosRelacionados: {
            oc: oc.numero,
            fc: fcs.find(f => f.recepcionId === rp.numero)?.id || null
          }
        })
      })
    }
  })

  // Add FCs
  fcs.forEach(fc => {
    allDocs.push({
      id: fc.numero,
      dbId: fc.id,
      tipo: 'FC',
      tipoLabel: 'Factura de Compra',
      origenDestino: fc.proveedor?.nombre || 'Proveedor',
      total: Number(fc.total),
      fecha: fc.fechaEmision,
      estado: fc.estado || (fc.recepcionId ? 'CRUZADA' : 'REGISTRADA'),
      documentosRelacionados: {
        rp: fc.recepcionId,
        oc: ocs.find(oc => oc.recepciones?.some((r: any) => r.numero === fc.recepcionId))?.numero || null
      }
    })
  })

  // Add AIs (Ajustes)
  ajustes.forEach(ai => {
    allDocs.push({
      id: ai.id,
      tipo: ai.tipo,
      tipoLabel: ai.tipo === 'AINE' ? 'Ajuste Entrada (AINE)' : `Ajuste Salida (AINS - ${ai.motivo})`,
      origenDestino: `Bodega: ${ai.bodegaNombre}`,
      total: null,
      fecha: ai.fecha,
      estado: 'COMPLETADO',
      documentosRelacionados: {
        autorizado: ai.autorizadoPor,
        obs: ai.observacion
      }
    })
  })

  // Add TIs (Traslados)
  traslados.forEach(ti => {
    allDocs.push({
      id: ti.id,
      tipo: 'TI',
      tipoLabel: 'Traslado de Inventario',
      origenDestino: `De ${ti.bodegaOrigenNombre} a ${ti.bodegaDestinoNombre}`,
      total: null,
      fecha: ti.fecha,
      estado: ti.estado,
      documentosRelacionados: {
        autorizado: ti.autorizadoPor,
        verif: ti.estado === 'RECIBIDO' ? 'Recibido y Verificado' : 'Pendiente Verificación'
      }
    })
  })

  // Sort and filter documents
  const sortedDocs = allDocs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  
  const filteredDocs = sortedDocs.filter(d => {
    const matchTipo = filtroDocTipo === 'todos' || 
      (filtroDocTipo === 'OC' && d.tipo === 'OC') ||
      (filtroDocTipo === 'FC' && d.tipo === 'FC') ||
      (filtroDocTipo === 'RP' && d.tipo === 'RP') ||
      (filtroDocTipo === 'TI' && d.tipo === 'TI') ||
      (filtroDocTipo === 'AI' && (d.tipo === 'AINE' || d.tipo === 'AINS'))

    const matchQ = !filtroDocQ || 
      d.id.toLowerCase().includes(filtroDocQ.toLowerCase()) ||
      d.origenDestino.toLowerCase().includes(filtroDocQ.toLowerCase()) ||
      d.tipoLabel.toLowerCase().includes(filtroDocQ.toLowerCase())

    return matchTipo && matchQ
  })

  // 4. Kardex list consolidation & deduplication
  const combinedMovements = dbMovements
    .filter((m: any, i: number, arr: any[]) => arr.findIndex(x => x.id === m.id) === i)
    .sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime())

  const filteredKardex = combinedMovements.filter(m => {
    const matchProd = kardexProductoId === 'todos' || String(m.productoId) === kardexProductoId
    const matchBodega = kardexBodegaId === 'todos' || 
      (m.bodegaOrigen && String(m.bodegaOrigen.id) === kardexBodegaId) ||
      (m.bodegaDestino && String(m.bodegaDestino.id) === kardexBodegaId)
    
    const matchQ = !kardexQ || 
      m.numero.toLowerCase().includes(kardexQ.toLowerCase()) ||
      m.producto?.nombre.toLowerCase().includes(kardexQ.toLowerCase()) ||
      m.producto?.sku.toLowerCase().includes(kardexQ.toLowerCase())

    return matchProd && matchBodega && matchQ
  })

  // 5. Submit Definitive Baja from control bolsas
  const handleOpenBaja = (item: any, bolsa: 'averia' | 'perdida') => {
    setBajaModalItem({ ...item, bolsa })
    setBajaCantidad(String(item.cantidad))
    setBajaObservacion('')
    setBajaAutorizado('')
    setBajaError(null)
  }

  const postAjusteMutation = useMutation({
    mutationFn: (payload: any) => postAjuste(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['stock-movimientos'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      setBajaModalItem(null)
    },
    onError: (err: any) => {
      setBajaError(err?.response?.data?.message || 'Error al procesar la baja definitiva')
    }
  })

  const handleSubmitBaja = () => {
    setBajaError(null)
    if (!bajaModalItem) return
    const cantVal = parseFloat(bajaCantidad)
    if (!bajaCantidad || cantVal <= 0 || cantVal > bajaModalItem.cantidad) {
      return setBajaError('Ingrese una cantidad válida que no supere el saldo de la bolsa')
    }
    if (!bajaObservacion.trim()) {
      return setBajaError('La justificación / observación es obligatoria para dar de baja definitiva')
    }
    if (!bajaAutorizado.trim()) {
      return setBajaError('Indique quién autoriza la baja definitiva')
    }

    const prodObj = productos.find(p => p.sku === bajaModalItem.sku)
    if (!prodObj) {
      return setBajaError('Producto no encontrado en catálogo')
    }

    // Build positive/negative adjustment payload (negative to deduct stock)
    const payload = {
      productoId: prodObj.id,
      bodegaId: bajaModalItem.bodegaId,
      cantidad: -cantVal,
      motivo: 'DAR_DE_BAJA',
      notas: `Baja contable definitiva desde Bolsa de ${bajaModalItem.bolsa === 'averia' ? 'Averías' : 'Pérdidas'}. Autorizado por: ${bajaAutorizado.trim()}. Justificación: ${bajaObservacion.trim()}`
    }

    postAjusteMutation.mutate(payload)
  }

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="space-y-6 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="text-indigo-600" />
            Movimientos y Auditoría de Documentos
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Historial de documentos comerciales, valoraciones de Kardex CPP y control de bolsas de merma
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/inventario/control-existencias/nuevo-ajuste"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm active:scale-95"
          >
            <Plus size={14} /> Registrar Ajuste (AI)
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full md:w-fit flex">
        {(
          [['docs', 'Historial de Documentos', sortedDocs.length], 
           ['kardex', 'Kardex Valorizado (CPP)', combinedMovements.length], 
           ['bolsas', 'Bolsas de Control', (bolsaAverias.length + bolsaPerdidas.length)]
          ] as [typeof activeTab, string, number][]
        ).map(([tab, label, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: Historial de Documentos */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          
          {/* Filtros */}
          <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Filtrar Tipo:</span>
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [['todos', 'Todos'], 
                   ['OC', 'OC'], 
                   ['FC', 'FC'], 
                   ['RP', 'RP'], 
                   ['TI', 'Traslados'], 
                   ['AI', 'Ajustes']
                  ] as [string, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFiltroDocTipo(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      filtroDocTipo === key 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filtroDocQ}
                onChange={e => setFiltroDocQ(e.target.value)}
                placeholder="Buscar por código de documento, proveedor..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          {/* Tabla de Documentos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                No se encontraron documentos comerciales con los filtros indicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="text-left px-6 py-4">Documento</th>
                      <th className="text-left px-6 py-4">Tipo</th>
                      <th className="text-left px-6 py-4">Origen / Destino</th>
                      <th className="text-left px-6 py-4">Fecha</th>
                      <th className="text-center px-6 py-4">Estado</th>
                      <th className="text-right px-6 py-4">Total</th>
                      <th className="text-left px-6 py-4">Documentos Cruzados / Notas</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc, idx) => {
                      let tagColor = "bg-slate-100 text-slate-700"
                      if (doc.estado === 'APROBADA' || doc.estado === 'RECIBIDO' || doc.estado === 'PROCESADA' || doc.estado === 'COMPLETADO') {
                        tagColor = "bg-green-50 text-green-700 border-green-150"
                      } else if (doc.estado === 'ENVIADA' || doc.estado === 'CRUZADA' || doc.estado === 'REGISTRADA') {
                        tagColor = "bg-blue-50 text-blue-700 border-blue-150"
                      } else if (doc.estado === 'EN_TRANSITO') {
                        tagColor = "bg-amber-50 text-amber-700 border-amber-150"
                      }

                      return (
                        <tr key={doc.id + '-' + idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{doc.id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{doc.tipoLabel}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{doc.origenDestino}</td>
                          <td className="px-6 py-4 text-slate-400 font-medium">
                            {new Date(doc.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex font-bold px-2 py-0.5 rounded text-[9px] ${tagColor}`}>
                              {doc.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800">
                            {doc.total ? fmtMoneda(doc.total) : '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {doc.tipo === 'OC' && (
                              <p className="text-[10px]">
                                {doc.documentosRelacionados.rp ? `Recepción: ${doc.documentosRelacionados.rp}` : 'Sin recepción asociada'}
                                {doc.documentosRelacionados.fc && ` · Factura: ${doc.documentosRelacionados.fc}`}
                              </p>
                            )}
                            {doc.tipo === 'FC' && (
                              <p className="text-[10px]">
                                {doc.documentosRelacionados.rp ? `Cruce RP: ${doc.documentosRelacionados.rp}` : 'Cruce manual'}
                                {doc.documentosRelacionados.oc && ` · Orden: ${doc.documentosRelacionados.oc}`}
                              </p>
                            )}
                            {doc.tipo === 'RP' && (
                              <p className="text-[10px]">
                                {`Orden Origen: ${doc.documentosRelacionados.oc}`}
                                {doc.documentosRelacionados.fc && ` · Cruzado en Factura: ${doc.documentosRelacionados.fc}`}
                              </p>
                            )}
                            {(doc.tipo === 'AINE' || doc.tipo === 'AINS') && (
                              <p className="text-[10px] truncate max-w-xs" title={doc.documentosRelacionados.obs}>
                                {`Autorizado: ${doc.documentosRelacionados.autorizado} · Obs: ${doc.documentosRelacionados.obs || 'S/N'}`}
                              </p>
                            )}
                            {doc.tipo === 'TI' && (
                              <p className="text-[10px]">
                                {`Resp: ${doc.documentosRelacionados.autorizado} · ${doc.documentosRelacionados.verif}`}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {doc.tipo === 'TI' && doc.estado === 'EN_TRANSITO' && (
                              <button
                                onClick={() => handleVerifyTraslado(doc.id)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] transition-colors"
                              >
                                Verificar Entrada (RP)
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
        </div>
      )}

      {/* TAB 2: Kardex Valorizado */}
      {activeTab === 'kardex' && (
        <div className="space-y-4">
          
          {/* Filtros de Kardex */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filtrar Producto</label>
              <select
                value={kardexProductoId}
                onChange={e => setKardexProductoId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="todos">Todos los productos</option>
                {productos.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.nombre} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filtrar Bodega</label>
              <select
                value={kardexBodegaId}
                onChange={e => setKardexBodegaId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="todos">Todas las bodegas</option>
                {bodegas.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Buscar por código/motivo</label>
              <input
                value={kardexQ}
                onChange={e => setKardexQ(e.target.value)}
                placeholder="Buscar por SKU, nombre, N° de documento..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Tabla Kardex */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredKardex.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                No hay movimientos registrados para los criterios seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="text-left px-6 py-4">Fecha</th>
                      <th className="text-left px-6 py-4">Doc / N°</th>
                      <th className="text-left px-6 py-4">Tipo Mov</th>
                      <th className="text-left px-6 py-4">Producto</th>
                      <th className="text-left px-6 py-4">Bodega</th>
                      <th className="text-right px-6 py-4">Cantidad</th>
                      <th className="text-right px-6 py-4">CPP Promedio</th>
                      <th className="text-right px-6 py-4">Costo Total</th>
                      <th className="text-left px-6 py-4">Justificación / Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKardex.map((m, idx) => {
                      let movColor = "text-slate-700 bg-slate-50"
                      let movLabel = m.tipo

                      if (m.tipo === 'AJUSTE_POSITIVO' || m.tipo === 'ENTRADA' || m.tipo === 'TRASLADO_ENTRADA') {
                        movColor = "text-green-700 bg-green-50 border-green-200"
                        movLabel = m.tipo === 'AJUSTE_POSITIVO' ? 'AJUSTE (+)' : m.tipo
                      } else if (m.tipo === 'AJUSTE_NEGATIVO' || m.tipo === 'SALIDA' || m.tipo === 'TRASLADO_SALIDA') {
                        movColor = "text-red-700 bg-red-50 border-red-200"
                        movLabel = m.tipo === 'AJUSTE_NEGATIVO' ? 'AJUSTE (−)' : m.tipo
                      }

                      const bodegaTxt = m.bodegaOrigen?.nombre || m.bodegaDestino?.nombre || 'General'

                      return (
                        <tr key={m.id + '-' + idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-400 font-medium">
                            {new Date(m.fechaMovimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{m.numero}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex font-bold px-2 py-0.5 rounded text-[9px] ${movColor}`}>
                              {movLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{m.producto?.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">{m.producto?.sku}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{bodegaTxt}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800">{m.cantidad}</td>
                          <td className="px-6 py-4 text-right text-slate-600 font-semibold">{m.saldoCpp ? fmtMoneda(m.saldoCpp) : '—'}</td>
                          <td className="px-6 py-4 text-right text-slate-700 font-bold">{m.costoTotal ? fmtMoneda(m.costoTotal) : '—'}</td>
                          <td className="px-6 py-4 text-slate-400 font-medium truncate max-w-xs" title={m.concepto || m.notas}>
                            {m.concepto || m.notas || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Bolsas de Control */}
      {activeTab === 'bolsas' && (
        <div className="space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveBolsaTab('averia')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeBolsaTab === 'averia' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bolsa de Averías ({bolsaAverias.length})
              </button>
              <button
                onClick={() => setActiveBolsaTab('perdida')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeBolsaTab === 'perdida' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bolsa de Pérdidas ({bolsaPerdidas.length})
              </button>
            </div>

            <div className="flex gap-2 items-center text-xs text-slate-500">
              <HelpCircle size={14} className="text-indigo-500" />
              <span>Los productos en bolsas están apartados del stock disponible y esperando auditoría o destrucción física definitiva.</span>
            </div>
          </div>

          {/* Tabla de Bolsa Activa */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {activeBolsaTab === 'averia' ? (
              bolsaAverias.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                  No hay productos registrados en la Bolsa de Averías.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                        <th className="text-left px-6 py-4">Producto</th>
                        <th className="text-left px-6 py-4">SKU</th>
                        <th className="text-center px-6 py-4">Cantidad Dañada / Averiada</th>
                        <th className="text-left px-6 py-4">Fecha Movimiento</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bolsaAverias.map(item => (
                        <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-500">{item.sku}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-red-600">{item.cantidad}</td>
                          <td className="px-6 py-4 text-slate-400 font-medium">
                            {new Date(item.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenBaja(item, 'averia')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[10px] transition-colors"
                            >
                              Dar de Baja Definitiva
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              bolsaPerdidas.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                  No hay productos registrados en la Bolsa de Pérdidas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                        <th className="text-left px-6 py-4">Producto</th>
                        <th className="text-left px-6 py-4">SKU</th>
                        <th className="text-center px-6 py-4">Cantidad Perdida</th>
                        <th className="text-left px-6 py-4">Fecha Movimiento</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bolsaPerdidas.map(item => (
                        <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-500">{item.sku}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-red-600">{item.cantidad}</td>
                          <td className="px-6 py-4 text-slate-400 font-medium">
                            {new Date(item.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenBaja(item, 'perdida')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[10px] transition-colors"
                            >
                              Dar de Baja Definitiva
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Baja modal Simulation (Premium inline popup overlay) */}
      {bajaModalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="font-extrabold text-slate-800 text-base">Dar de Baja Definitiva</h3>
            </div>
            
            <p className="text-xs text-slate-500">
              Esta operación retirará físicamente y de forma definitiva el inventario del producto{' '}
              <strong className="text-slate-800 font-bold">{bajaModalItem.nombre}</strong>.
            </p>

            {bajaError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-[10px] font-bold">
                {bajaError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cantidad a retirar (Máx: {bajaModalItem.cantidad})</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={bajaCantidad}
                  onChange={e => setBajaCantidad(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Autorizado por *</label>
                <input
                  value={bajaAutorizado}
                  onChange={e => setBajaAutorizado(e.target.value)}
                  placeholder="Supervisor o Auditor de almacén"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observación / Justificación de la baja *</label>
                <textarea
                  value={bajaObservacion}
                  onChange={e => setBajaObservacion(e.target.value)}
                  placeholder="Justifique detalladamente el motivo de la baja definitiva..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBajaModalItem(null)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitBaja}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                Confirmar Baja Definitiva
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
