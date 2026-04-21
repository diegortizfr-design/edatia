import { useQuery } from '@tanstack/react-query'
import { getAlertas } from '../../services/inventario.service'
import { AlertTriangle, AlertOctagon, CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function Alertas() {
  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['inv-alertas'],
    queryFn: getAlertas,
    refetchInterval: 60_000,
  })

  const criticas  = (alertas as any[]).filter(a => a.nivelAlerta === 'CRITICO')
  const bajas     = (alertas as any[]).filter(a => a.nivelAlerta === 'BAJO')

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando alertas...</div>

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alertas de Stock</h1>
          <p className="text-slate-500 text-sm mt-0.5">Productos en o por debajo del punto de reorden</p>
        </div>
        <Link to="/inventario/movimientos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Package size={16} />
          Registrar entrada
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-red-50">
            <AlertOctagon size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Stock crítico (= 0)</p>
            <p className="text-2xl font-bold text-red-600">{criticas.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-50">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Stock bajo</p>
            <p className="text-2xl font-bold text-amber-600">{bajas.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-lg bg-slate-100">
            <Package size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total alertas</p>
            <p className="text-2xl font-bold text-slate-800">{(alertas as any[]).length}</p>
          </div>
        </div>
      </div>

      {(alertas as any[]).length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-green-700">¡Todo en orden!</p>
          <p className="text-slate-400 text-sm mt-1">No hay productos en alerta de stock.</p>
        </div>
      )}

      {/* Tabla críticos */}
      {criticas.length > 0 && (
        <AlertTable
          titulo="Stock crítico — Cantidad = 0"
          nivel="CRITICO"
          filas={criticas}
        />
      )}

      {/* Tabla bajos */}
      {bajas.length > 0 && (
        <AlertTable
          titulo="Stock bajo — En o debajo del punto de reorden"
          nivel="BAJO"
          filas={bajas}
        />
      )}
    </div>
  )
}

function AlertTable({ titulo, nivel, filas }: { titulo: string; nivel: string; filas: any[] }) {
  const isRed = nivel === 'CRITICO'
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 border-b flex items-center gap-2 ${isRed ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}>
        {isRed
          ? <AlertOctagon size={16} className="text-red-600" />
          : <AlertTriangle size={16} className="text-amber-600" />}
        <h2 className={`font-semibold text-sm ${isRed ? 'text-red-800' : 'text-amber-800'}`}>{titulo}</h2>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {filas.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="px-5 py-2.5 text-left font-semibold">Producto</th>
              <th className="px-5 py-2.5 text-left font-semibold">SKU</th>
              <th className="px-5 py-2.5 text-left font-semibold">Bodega</th>
              <th className="px-5 py-2.5 text-right font-semibold">Disponible</th>
              <th className="px-5 py-2.5 text-right font-semibold">Pto. Reorden</th>
              <th className="px-5 py-2.5 text-right font-semibold">Stk. mínimo</th>
              <th className="px-5 py-2.5 text-right font-semibold">Costo CPP</th>
              <th className="px-5 py-2.5 text-center font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filas.map((a: any) => (
              <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${isRed ? 'bg-red-50/20' : ''}`}>
                <td className="px-5 py-3 font-medium text-slate-800">{a.producto?.nombre}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.producto?.sku}</td>
                <td className="px-5 py-3 text-slate-600 text-xs">{a.bodega?.nombre}</td>
                <td className={`px-5 py-3 text-right font-bold ${isRed ? 'text-red-600' : 'text-amber-600'}`}>
                  {parseFloat(a.disponible).toFixed(0)}
                </td>
                <td className="px-5 py-3 text-right text-slate-500">{parseFloat(a.producto?.puntoReorden ?? 0).toFixed(0)}</td>
                <td className="px-5 py-3 text-right text-slate-500">{parseFloat(a.producto?.stockMinimo ?? 0).toFixed(0)}</td>
                <td className="px-5 py-3 text-right text-slate-600">{fmt(parseFloat(a.producto?.costoPromedio ?? 0))}</td>
                <td className="px-5 py-3 text-center">
                  <Link
                    to={`/inventario/movimientos/nuevo?productoId=${a.productoId}&bodegaId=${a.bodegaId}`}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                  >
                    Registrar entrada <ArrowRight size={11} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
