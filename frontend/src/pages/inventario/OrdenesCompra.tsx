import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrdenesCompra } from '../../services/inventario.service'
import { Plus, ShoppingCart, ChevronRight, Clock, CheckCircle, XCircle, Package } from 'lucide-react'

const ESTADOS: Record<string, { label: string; color: string; Icon: any }> = {
  BORRADOR:         { label: 'Borrador',        color: 'bg-slate-100 text-slate-600',   Icon: Clock },
  APROBADA:         { label: 'Aprobada',         color: 'bg-blue-100 text-blue-700',     Icon: CheckCircle },
  ENVIADA:          { label: 'Enviada',          color: 'bg-indigo-100 text-indigo-700', Icon: ShoppingCart },
  RECIBIDA_PARCIAL: { label: 'Parcial',          color: 'bg-amber-100 text-amber-700',   Icon: Package },
  RECIBIDA:         { label: 'Recibida',         color: 'bg-green-100 text-green-700',   Icon: CheckCircle },
  ANULADA:          { label: 'Anulada',          color: 'bg-red-100 text-red-600',       Icon: XCircle },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function OrdenesCompra() {
  const [estado, setEstado] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['ordenes-compra', estado],
    queryFn: () => getOrdenesCompra({ estado: estado || undefined }),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Órdenes de Compra</h1>
          <p className="text-slate-500 text-sm">{data.length} órdenes</p>
        </div>
        <Link
          to="/inventario/ordenes-compra/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Nueva OC
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setEstado('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${estado === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
        >
          Todas
        </button>
        {Object.entries(ESTADOS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setEstado(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${estado === key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400">No hay órdenes de compra{estado ? ` en estado ${ESTADOS[estado]?.label}` : ''}</p>
            <Link to="/inventario/ordenes-compra/nueva" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
              <Plus size={14} /> Crear primera OC
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N° OC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proveedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Bodega</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(oc => {
                const cfg = ESTADOS[oc.estado] ?? ESTADOS.BORRADOR
                return (
                  <tr key={oc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{oc.numero}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{oc.proveedor?.nombre}</p>
                      {oc.proveedor?.nombreComercial && oc.proveedor.nombreComercial !== oc.proveedor.nombre && (
                        <p className="text-xs text-slate-400">{oc.proveedor.nombreComercial}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">{oc.bodega?.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <cfg.Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(Number(oc.total))}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                      {new Date(oc.fechaEmision).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/inventario/ordenes-compra/${oc.id}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                        Ver <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
