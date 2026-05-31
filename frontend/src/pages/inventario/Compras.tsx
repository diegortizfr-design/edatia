import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrdenesCompra, getFacturasCompra, FacturaCompra } from '../../services/inventario.service'
import { 
  Plus, ShoppingCart, ChevronRight, Clock, CheckCircle, XCircle, 
  Package, FileText, Upload, Calendar, ArrowUpRight, CheckSquare, Library
} from 'lucide-react'

const ESTADOS: Record<string, { label: string; color: string; Icon: any }> = {
  BORRADOR:         { label: 'Borrador',        color: 'bg-slate-100 text-slate-600 border-slate-200',   Icon: Clock },
  APROBADA:         { label: 'Aprobada',         color: 'bg-blue-50 text-blue-700 border-blue-200',     Icon: CheckCircle },
  ENVIADA:          { label: 'Enviada',          color: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: ShoppingCart },
  RECIBIDA_PARCIAL: { label: 'Parcial',          color: 'bg-amber-50 text-amber-700 border-amber-200',   Icon: Package },
  RECIBIDA:         { label: 'Recibida',         color: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle },
  ANULADA:          { label: 'Anulada',          color: 'bg-red-50 text-red-600 border-red-200',       Icon: XCircle },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}



export function Compras() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'oc' | 'fc' | 'rp'>('oc')
  const [filtroEstado, setFiltroEstado] = useState('')

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
                    <th className="text-left px-6 py-4 hidden md:table-cell">Fecha Emisión</th>
                    <th className="text-center px-6 py-4">Soporte XML</th>
                    <th className="text-center px-6 py-4">Cruce Recepción</th>
                    <th className="text-right px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fcs.map(fc => (
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
                        {fc.recepcionId ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            {fc.recepcionId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            Sin Cruzar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800">{fmt(fc.total)}</td>
                    </tr>
                  ))}
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
                    <th className="text-left px-6 py-4">N° Recepción</th>
                    <th className="text-left px-6 py-4">Orden de Compra</th>
                    <th className="text-left px-6 py-4">Proveedor</th>
                    <th className="text-left px-6 py-4 hidden md:table-cell">Bodega</th>
                    <th className="text-center px-6 py-4">Artículos Recibidos</th>
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
                      <td className="px-6 py-4">
                        <Link to={`/inventario/ordenes-compra/${rec.ocId}`} className="font-mono font-semibold text-indigo-600 hover:underline">
                          {rec.ocNumero}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{rec.proveedorNombre}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-medium">{rec.bodegaNombre}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{rec.totalArticulos}</td>
                      <td className="px-6 py-4 hidden lg:table-cell text-slate-400 font-medium">
                        {new Date(rec.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/inventario/ordenes-compra/${rec.ocId}`} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold">
                          Detalle OC <ArrowUpRight size={12} />
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
    </div>
  )
}
