import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getOrdenesCompra, getFacturasCompra, FacturaCompra, getOrdenCompra, 
  getBodegas, createRecepcionProducto, getRecepcionesProducto 
} from '../../services/inventario.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'
import { 
  Plus, ShoppingCart, ChevronRight, Clock, CheckCircle, XCircle, 
  Package, FileText, Upload, Calendar, ArrowUpRight, CheckSquare, Library, X, AlertTriangle, Building2
} from 'lucide-react'

const ESTADOS: Record<string, { label: string; color: string; Icon: any }> = {
  BORRADOR:         { label: 'Borrador',        color: 'bg-slate-100 text-slate-600 border-slate-200',   Icon: Clock },
  APROBADA:         { label: 'Aprobada',         color: 'bg-blue-50 text-blue-700 border-blue-200',     Icon: CheckCircle },
  ENVIADA:          { label: 'Enviada',          color: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: ShoppingCart },
  FACTURADA:        { label: 'Facturada',        color: 'bg-purple-50 text-purple-700 border-purple-200', Icon: FileText },
  RECIBIDA_PARCIAL: { label: 'Parcial',          color: 'bg-amber-50 text-amber-700 border-amber-200',   Icon: Package },
  RECIBIDA:         { label: 'Recibida',         color: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle },
  ANULADA:          { label: 'Anulada',          color: 'bg-red-50 text-red-600 border-red-200',       Icon: XCircle },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function Compras() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'oc' | 'fc' | 'rp'>('oc')
  const [filtroEstado, setFiltroEstado] = useState('')

  // For the physical receipt modal (from FC)
  const [selectedFcForRecepcion, setSelectedFcForRecepcion] = useState<any | null>(null)
  const [bodegaDestinoId, setBodegaDestinoId] = useState('')
  const [documentoConfigId, setDocumentoConfigId] = useState('')
  const [recNotas, setRecNotas] = useState('')
  const [recItems, setRecItems] = useState<Record<number, string>>({})
  const [errorRecepcion, setErrorRecepcion] = useState<string | null>(null)

  // Bodegas query
  const { data: bodegas = [] } = useQuery({
    queryKey: ['bodegas'],
    queryFn: () => getBodegas(),
  })

  // RP resolutions
  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-config-rp'],
    queryFn: getDocumentosConfig,
    enabled: !!selectedFcForRecepcion,
  })

  const documentosFiltradosRP = documentos.filter((doc: any) => 
    doc.sigla === 'RP' && doc.estado === 'ACTIVO'
  )

  useEffect(() => {
    if (bodegas.length > 0 && !bodegaDestinoId) {
      const principal = bodegas.find((b: any) => b.esPrincipal) || bodegas[0]
      if (principal) setBodegaDestinoId(String(principal.id))
    }
  }, [bodegas])

  useEffect(() => {
    if (selectedFcForRecepcion) {
      const quantities: Record<number, string> = {}
      for (const fcItem of selectedFcForRecepcion.items || []) {
        const pendiente = parseFloat(String(fcItem.cantidad)) - parseFloat(String(fcItem.cantidadRecibida || 0))
        if (pendiente > 0.001) {
          quantities[fcItem.id] = String(pendiente)
        }
      }
      setRecItems(quantities)
    }
  }, [selectedFcForRecepcion])

  const mutationRecibir = useMutation({
    mutationFn: (data: { fcId: number; payload: any }) => createRecepcionProducto(data.fcId, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas-compra'] })
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] })
      queryClient.invalidateQueries({ queryKey: ['recepciones-producto'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      setSelectedFcForRecepcion(null)
      setRecItems({})
      setRecNotas('')
      setDocumentoConfigId('')
      setErrorRecepcion(null)
    },
    onError: (err: any) => {
      setErrorRecepcion(getApiError(err, 'Error al registrar la recepción de producto'))
    }
  })

  const handleRecibir = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorRecepcion(null)
    if (!selectedFcForRecepcion) return
    if (!bodegaDestinoId) {
      setErrorRecepcion('Selecciona una bodega de destino para ingresar el inventario')
      return
    }

    const itemsToSend: any[] = []
    for (const fcItem of selectedFcForRecepcion.items || []) {
      const cantStr = recItems[fcItem.id]
      if (!cantStr || parseFloat(cantStr) <= 0) continue

      itemsToSend.push({
        productoId: fcItem.productoId,
        facturaCompraItemId: fcItem.id,
        cantidadRecibida: parseFloat(cantStr),
        costoUnitario: parseFloat(String(fcItem.costoUnitario)),
      })
    }

    if (itemsToSend.length === 0) {
      setErrorRecepcion('Ingresa al menos una cantidad a recibir')
      return
    }

    mutationRecibir.mutate({
      fcId: selectedFcForRecepcion.id,
      payload: {
        bodegaId: Number(bodegaDestinoId),
        documentoConfigId: documentoConfigId ? Number(documentoConfigId) : undefined,
        notas: recNotas || undefined,
        items: itemsToSend,
      }
    })
  }

  // 1. Get OCs (from database)
  const { data: ocs = [], isLoading: cargandoOC } = useQuery({
    queryKey: ['ordenes-compra', filtroEstado],
    queryFn: () => getOrdenesCompra({ estado: filtroEstado || undefined }),
  })

  // 2. Facturas de Compra (FC) from backend
  const { data: fcs = [], isLoading: cargandoFC } = useQuery({
    queryKey: ['facturas-compra'],
    queryFn: () => getFacturasCompra(),
  })

  // 3. Consolidated Recepciones de Producto (RP) from OCs
  const recepcionesConsolidadas = ocs.flatMap((oc: any) => 
    (oc.recepciones || []).map((rec: any) => ({
      ...rec,
      ocId: oc.id,
      ocNumero: oc.numero,
      proveedorNombre: oc.proveedor?.nombre,
      bodegaNombre: oc.bodega?.nombre,
      totalArticulos: rec.items?.reduce((sum: number, item: any) => sum + Number(item.cantidadRecibida), 0) || 0
    }))
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="text-indigo-600" />
            Compras e Importaciones
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestión del ciclo de abastecimiento: Órdenes de Compra (OC), Facturas de Proveedor (FC) y Recepciones (RP)
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/inventario/compras/nueva-fc"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm active:scale-95"
          >
            <Upload size={14} /> Registrar Factura Compra (FC)
          </Link>
          <Link
            to="/inventario/ordenes-compra/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Plus size={14} /> Nueva Orden de Compra (OC)
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-full md:w-fit flex">
        {(
          [['oc', 'Órdenes de Compra (OC)', ocs.length], 
           ['fc', 'Facturas de Compra (FC)', fcs.length], 
           ['rp', 'Recepciones de Producto (RP)', recepcionesConsolidadas.length]
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

      {/* TAB 1: Órdenes de Compra (OC) */}
      {activeTab === 'oc' && (
        <div className="space-y-4">
          {/* Filtros de estado */}
          <div className="flex gap-1.5 flex-wrap items-center bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Estado:</span>
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filtroEstado === '' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'border-slate-100 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            {Object.entries(ESTADOS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filtroEstado === key 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {cargandoOC ? (
              <div className="text-center py-16 text-slate-400 text-sm">Cargando órdenes...</div>
            ) : ocs.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">No hay órdenes de compra{filtroEstado ? ` en estado ${ESTADOS[filtroEstado]?.label}` : ''}</p>
                <Link to="/inventario/ordenes-compra/nueva" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-bold">
                  <Plus size={12} /> Crear primera OC
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="text-left px-6 py-4">N° OC</th>
                      <th className="text-left px-6 py-4">Proveedor</th>
                      <th className="text-left px-6 py-4 hidden md:table-cell">Bodega</th>
                      <th className="text-center px-6 py-4">Estado</th>
                      <th className="text-right px-6 py-4">Total</th>
                      <th className="text-left px-6 py-4 hidden lg:table-cell">Fecha</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ocs.map(oc => {
                      const cfg = ESTADOS[oc.estado] ?? ESTADOS.BORRADOR
                      return (
                        <tr key={oc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{oc.numero}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{oc.proveedor?.nombre}</p>
                            {oc.proveedor?.nombreComercial && oc.proveedor.nombreComercial !== oc.proveedor.nombre && (
                              <p className="text-[10px] text-slate-400">{oc.proveedor.nombreComercial}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-medium">{oc.bodega?.nombre}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border text-[10px] ${cfg.color}`}>
                              <cfg.Icon size={10} /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800">{fmt(Number(oc.total))}</td>
                          <td className="px-6 py-4 hidden lg:table-cell text-slate-400 font-medium">
                            {new Date(oc.fechaEmision).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/inventario/ordenes-compra/${oc.id}`} className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold">
                              Ver <ChevronRight size={14} />
                            </Link>
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

      {/* TAB 2: Facturas de Compra (FC) */}
      {activeTab === 'fc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {cargandoFC ? (
            <div className="text-center py-16 text-slate-400">Cargando facturas de compra...</div>
          ) : fcs.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">No hay facturas de compra registradas.</p>
              <Link to="/inventario/compras/nueva-fc" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-bold">
                <Upload size={12} /> Cargar primera factura de proveedor
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="text-left px-6 py-4">Factura Interna</th>
                    <th className="text-left px-6 py-4">N° Factura Proveedor</th>
                    <th className="text-left px-6 py-4">Proveedor</th>
                    <th className="text-left px-6 py-4">Orden de Compra (OC)</th>
                    <th className="text-left px-6 py-4 hidden md:table-cell">Fecha Emisión</th>
                    <th className="text-center px-6 py-4">Soporte XML</th>
                    <th className="text-center px-6 py-4">Estado Recepción</th>
                    <th className="text-right px-6 py-4">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fcs.map((fc: any) => {
                    const estRec = fc.estadoRecepcion || 'PENDIENTE'
                    return (
                      <tr key={fc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          <Link 
                            to={`/inventario/movimientos?ver=${fc.numero}`}
                            className="text-indigo-600 hover:text-indigo-850 hover:underline"
                          >
                            {fc.numero}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {fc.prefijoProveedor ? `${fc.prefijoProveedor}-` : ''}{fc.consecutivoProveedor}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{fc.proveedor?.nombre}</td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                          {fc.ordenCompra ? (
                            <Link to={`/inventario/ordenes-compra/${fc.ordenCompra.id}`} className="text-indigo-600 hover:text-indigo-850 hover:underline">
                              {fc.ordenCompra.numero}
                            </Link>
                          ) : (
                            <span className="text-slate-400 font-sans text-xs">— Directa</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-medium">
                          {new Date(fc.fechaEmision).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {fc.xmlAdjunto ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-bold text-[10px]">
                              <Library size={10} /> XML Cargado
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {estRec === 'RECIBIDO' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              <CheckCircle size={10} /> Recibido
                            </span>
                          ) : estRec === 'PARCIAL' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              <Package size={10} /> Parcial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              <Clock size={10} /> Pendiente RP
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-800">{fmt(fc.total)}</td>
                        <td className="px-6 py-4 text-right">
                          {estRec !== 'RECIBIDO' && fc.estado !== 'ANULADA' && (
                            <button
                              onClick={() => setSelectedFcForRecepcion(fc)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                            >
                              <Package size={12} /> Recibir Mercancía (RP)
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
      )}

      {/* TAB 3: Recepciones de Producto (RP) */}
      {activeTab === 'rp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {recepcionesConsolidadas.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">No se han registrado recepciones físicas de producto aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="text-left px-6 py-4">N° Recepción (RP)</th>
                    <th className="text-left px-6 py-4">Factura de Compra</th>
                    <th className="text-left px-6 py-4">Proveedor</th>
                    <th className="text-left px-6 py-4 hidden md:table-cell">Bodega Destino</th>
                    <th className="text-center px-6 py-4">Ítems Recibidos</th>
                    <th className="text-left px-6 py-4 hidden lg:table-cell">Fecha</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recepcionesConsolidadas.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        <Link 
                          to={`/inventario/movimientos?ver=${rec.numero}`}
                          className="text-indigo-600 hover:text-indigo-850 hover:underline"
                        >
                          {rec.numero}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                        {rec.facturaCompra ? (
                          <span>{rec.facturaCompra.numero} (N° {rec.facturaCompra.consecutivoProveedor})</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {rec.facturaCompra?.proveedor?.nombre || rec.proveedorNombre || 'Proveedor'}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                          <Building2 size={12} className="text-indigo-600" />
                          {rec.bodega?.nombre || rec.bodegaNombre || 'Bodega Principal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {rec.items?.reduce((sum: number, it: any) => sum + Number(it.cantidadRecibida), 0) || 0} und
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-slate-400 font-medium">
                        {new Date(rec.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/inventario/movimientos?ver=${rec.numero}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold">
                          Ver en Kardex <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Recepción de Mercancía (RP) desde Factura de Compra (FC) */}
      {selectedFcForRecepcion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Package className="text-emerald-600" />
                  Registrar Recepción de Producto (RP)
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Cruce con Factura: <span className="font-bold text-slate-600">{selectedFcForRecepcion.numero}</span> (N° Proveedor: <span className="font-bold text-indigo-600">{selectedFcForRecepcion.consecutivoProveedor}</span>)
                </p>
              </div>
              <button 
                onClick={() => setSelectedFcForRecepcion(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRecibir} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {errorRecepcion && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{errorRecepcion}</span>
                  </div>
                )}

                {/* Seleccionar Bodega de Destino */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-600" />
                    Bodega de Destino del Inventario *
                  </label>
                  <select
                    value={bodegaDestinoId}
                    onChange={e => setBodegaDestinoId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Seleccionar Bodega —</option>
                    {bodegas.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} {b.esPrincipal ? '(Principal)' : ''} — {b.codigo}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Los productos recibidos ingresarán al Stock de esta bodega y actualizarán el Kardex.
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Productos de la Factura a Recibir</h4>
                  
                  <div className="space-y-3">
                    {(selectedFcForRecepcion.items || []).map((item: any) => {
                      const cantFacturada = parseFloat(String(item.cantidad))
                      const cantRecibidaPrev = parseFloat(String(item.cantidadRecibida || 0))
                      const pendiente = Math.max(0, cantFacturada - cantRecibidaPrev)

                      return (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm hover:border-slate-300 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <span className="font-mono text-[10px] font-bold text-slate-400 block">{item.producto?.sku}</span>
                              <span className="font-bold text-slate-800 text-xs truncate block">{item.producto?.nombre}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Facturado: <span className="font-bold text-slate-600">{cantFacturada.toFixed(3)}</span> · Previamente Recibido: <span className="font-bold text-emerald-600">{cantRecibidaPrev.toFixed(3)}</span> · Pendiente: <span className="font-bold text-amber-600">{pendiente.toFixed(3)}</span>
                              </span>
                            </div>
                            <div className="w-28 shrink-0 text-right">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cant. Recibir *</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max={pendiente}
                                value={recItems[item.id] ?? ''}
                                onChange={e => setRecItems(prev => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder={String(pendiente.toFixed(3))}
                                required
                                className="w-full text-right px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Documento RP (Resolución) *</label>
                      <select 
                        value={documentoConfigId} 
                        onChange={e => setDocumentoConfigId(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                      >
                        <option value="">— Consecutivo Automático RP —</option>
                        {documentosFiltradosRP.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.nombre} ({d.prefijo})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones de Recepción</label>
                      <input 
                        value={recNotas} 
                        onChange={e => setRecNotas(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                        placeholder="Remisión #, transportadora, notas..." 
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setSelectedFcForRecepcion(null)} 
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={mutationRecibir.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 disabled:opacity-50 active:scale-95"
                >
                  <Package size={14} /> 
                  {mutationRecibir.isPending ? 'Ingresando...' : 'Confirmar e Ingresar a Inventario'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}
