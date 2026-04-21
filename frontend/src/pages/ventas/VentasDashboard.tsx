import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, TrendingUp, FileText, AlertCircle, DollarSign, ArrowRight,
} from 'lucide-react'
import { getVentasKpis } from '../../services/ventas.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  EMITIDA:  { label: 'Emitida',  color: 'bg-blue-100 text-blue-700' },
  PAGADA:   { label: 'Pagada',   color: 'bg-green-100 text-green-700' },
  PARCIAL:  { label: 'Parcial',  color: 'bg-yellow-100 text-yellow-700' },
  ANULADA:  { label: 'Anulada',  color: 'bg-red-100 text-red-700' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function KpiCard({ icon, label, value, sub, color = 'indigo', to }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50  text-green-600',
    amber:  'bg-amber-50  text-amber-600',
    red:    'bg-red-50    text-red-600',
    blue:   'bg-blue-50   text-blue-600',
  }
  const card = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export function VentasDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['ventas-kpis'], queryFn: getVentasKpis })

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando dashboard...</div>
  if (!data) return null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Ventas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general del módulo de ventas</p>
        </div>
        <Link to="/ventas/facturas/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <FileText size={16} /> Nueva factura
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icon={<Users size={20} />}
          label="Total clientes"
          value={new Intl.NumberFormat('es-CO').format(data.totalClientes ?? 0)}
          color="indigo"
          to="/ventas/clientes"
        />
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Ventas del mes"
          value={fmt(data.ventasMes?.total ?? 0)}
          sub={`${data.ventasMes?.cantidad ?? 0} facturas`}
          color="green"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Facturas del mes"
          value={new Intl.NumberFormat('es-CO').format(data.ventasMes?.cantidad ?? 0)}
          color="blue"
          to="/ventas/facturas"
        />
        <KpiCard
          icon={<FileText size={20} />}
          label="Cartera por cobrar"
          value={fmt(data.carteraPorCobrar ?? 0)}
          color="amber"
        />
        <KpiCard
          icon={<AlertCircle size={20} />}
          label="Facturas vencidas"
          value={new Intl.NumberFormat('es-CO').format(data.facturasvencidas ?? 0)}
          color={data.facturasvencidas > 0 ? 'red' : 'green'}
          sub="Con saldo pendiente"
          to="/ventas/facturas"
        />
      </div>

      {/* Últimas facturas + Top clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Últimas 8 facturas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Últimas facturas</h2>
            </div>
            <Link to="/ventas/facturas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Número', 'Cliente', 'Fecha', 'Total', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data.ultimasFacturas ?? []).slice(0, 8).map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">
                      {f.prefijo}{f.numero}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-[160px] truncate">
                      {f.cliente?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {f.fecha ? new Date(f.fecha).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {fmt(Number(f.total ?? 0))}
                    </td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={f.estado} />
                    </td>
                  </tr>
                ))}
                {(data.ultimasFacturas ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      No hay facturas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 clientes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Top 5 clientes</h2>
            </div>
            <Link to="/ventas/clientes" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(data.topClientes ?? []).slice(0, 5).map((c: any, i: number) => (
              <div key={c.clienteId ?? i} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.nombre ?? c.cliente?.nombre}</p>
                  <p className="text-xs text-slate-400">{c.cantidadFacturas ?? 0} facturas</p>
                </div>
                <p className="text-sm font-semibold text-slate-700 shrink-0">
                  {fmt(Number(c.totalVentas ?? c.total ?? 0))}
                </p>
              </div>
            ))}
            {(data.topClientes ?? []).length === 0 && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/ventas/clientes',      label: 'Clientes',       icon: <Users size={18} /> },
          { to: '/ventas/facturas',      label: 'Facturas',       icon: <FileText size={18} /> },
          { to: '/ventas/notas-credito', label: 'Notas crédito',  icon: <TrendingUp size={18} /> },
          { to: '/ventas/recibo-caja',   label: 'Recibos de caja',icon: <DollarSign size={18} /> },
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
