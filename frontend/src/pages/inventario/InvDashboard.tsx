import { useQuery } from '@tanstack/react-query'
import { getInvKpis } from '../../services/inventario.service'
import { Package, Warehouse, TrendingUp, AlertTriangle, ArrowRight, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function KpiCard({ icon, label, value, sub, color = 'indigo' }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function InvDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['inv-kpis'], queryFn: getInvKpis })

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando dashboard...</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general del módulo</p>
        </div>
        <Link to="/inventario/movimientos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Activity size={16} />
          Nuevo movimiento
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Package size={20} />} label="Productos activos" value={data.totalProductos} color="indigo" />
        <KpiCard icon={<Warehouse size={20} />} label="Bodegas" value={data.totalBodegas} color="green" />
        <KpiCard icon={<TrendingUp size={20} />} label="Valor del inventario" value={fmt(data.valorTotal)} color="indigo" sub="CPP vigente" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Alertas de stock" value={data.productosAlertas} color={data.productosAlertas > 0 ? 'amber' : 'green'} sub="Bajo punto de reorden" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Top productos por valor</h2>
            <Link to="/inventario/stock" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.topProductos.map((p, i) => (
              <div key={p.productoId} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.sku} · {p.cantidad} und</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{fmt(p.valor)}</span>
              </div>
            ))}
            {data.topProductos.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">Sin datos de stock aún</p>
            )}
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Alertas críticas</h2>
            <Link to="/inventario/stock?soloAlertas=true" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver alertas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.alertasCriticas.map((s: any) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.producto?.nombre}</p>
                  <p className="text-xs text-slate-400">{s.bodega?.nombre}</p>
                </div>
                <span className="text-sm font-bold text-red-600">{parseFloat(s.cantidad).toFixed(0)}</span>
              </div>
            ))}
            {data.alertasCriticas.length === 0 && (
              <p className="px-5 py-8 text-center text-green-600 text-sm">Sin alertas críticas</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/inventario/productos', label: 'Productos', icon: <Package size={18} /> },
          { to: '/inventario/bodegas', label: 'Bodegas', icon: <Warehouse size={18} /> },
          { to: '/inventario/movimientos', label: 'Movimientos', icon: <Activity size={18} /> },
          { to: '/inventario/maestros', label: 'Maestros', icon: <TrendingUp size={18} /> },
        ].map(link => (
          <Link key={link.to} to={link.to}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm">
            <span className="text-indigo-600">{link.icon}</span>
            <span className="text-sm font-medium text-slate-700">{link.label}</span>
            <ArrowRight size={14} className="ml-auto text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
