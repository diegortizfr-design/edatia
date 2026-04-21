import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvKpis, clasificarAbc,
} from '../../services/inventario.service'
import {
  Package, Warehouse, TrendingUp, AlertTriangle, ArrowRight,
  Activity, Truck, ShoppingCart, RefreshCw, BarChart2,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('es-CO').format(n)
}

function KpiCard({ icon, label, value, sub, color = 'indigo', to }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50  text-green-600',
    amber:  'bg-amber-50  text-amber-600',
    red:    'bg-red-50    text-red-600',
    blue:   'bg-blue-50   text-blue-600',
    teal:   'bg-teal-50   text-teal-600',
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

const TIPO_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  ENTRADA:          { label: 'Entradas',     color: 'bg-green-500',  Icon: ArrowDownLeft },
  SALIDA:           { label: 'Salidas',      color: 'bg-red-500',    Icon: ArrowUpRight },
  TRASLADO_SALIDA:  { label: 'Traslados',    color: 'bg-blue-500',   Icon: ArrowLeftRight },
  TRASLADO_ENTRADA: { label: 'Traslados E.', color: 'bg-blue-400',   Icon: ArrowLeftRight },
  AJUSTE_POSITIVO:  { label: 'Ajuste (+)',   color: 'bg-teal-500',   Icon: Settings2 },
  AJUSTE_NEGATIVO:  { label: 'Ajuste (−)',   color: 'bg-orange-500', Icon: Settings2 },
}

const ABC_COLOR: Record<string, string> = { A: 'bg-green-500', B: 'bg-amber-400', C: 'bg-red-400', sinClase: 'bg-slate-300' }
const ABC_TEXT: Record<string, string>  = { A: 'text-green-700', B: 'text-amber-700', C: 'text-red-700', sinClase: 'text-slate-500' }
const OC_LABEL: Record<string, { label: string; dot: string }> = {
  BORRADOR:         { label: 'Borrador',         dot: 'bg-slate-400' },
  APROBADA:         { label: 'Aprobada',          dot: 'bg-blue-500' },
  RECIBIDA_PARCIAL: { label: 'Parcial',           dot: 'bg-amber-500' },
  RECIBIDA:         { label: 'Recibida',          dot: 'bg-green-500' },
  ANULADA:          { label: 'Anulada',           dot: 'bg-red-400' },
}

export function InvDashboard() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['inv-kpis'], queryFn: getInvKpis })
  const [abcMsg, setAbcMsg] = useState<string | null>(null)

  const mutAbc = useMutation({
    mutationFn: clasificarAbc,
    onSuccess: (res: any) => {
      setAbcMsg(res.mensaje)
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      setTimeout(() => setAbcMsg(null), 3000)
    },
  })

  if (isLoading) return <div className="text-center py-20 text-slate-400">Cargando dashboard...</div>
  if (!data) return null

  const maxMovs = Math.max(...(data.movimientosPorTipo ?? []).map((m: any) => m.cantidad), 1)
  const totalAbc = (data.claseAbcDistribucion?.A ?? 0) + (data.claseAbcDistribucion?.B ?? 0) +
                   (data.claseAbcDistribucion?.C ?? 0) + (data.claseAbcDistribucion?.sinClase ?? 0)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Inventario</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general · Sprint 3</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutAbc.mutate()}
            disabled={mutAbc.isPending}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="Recalcular clasificación ABC"
          >
            <RefreshCw size={14} className={mutAbc.isPending ? 'animate-spin' : ''} />
            {mutAbc.isPending ? 'Calculando...' : 'Recalcular ABC'}
          </button>
          <Link to="/inventario/movimientos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Activity size={16} />
            Nuevo movimiento
          </Link>
        </div>
      </div>

      {abcMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          ✓ {abcMsg}
        </div>
      )}

      {/* ── KPIs principales (6 tarjetas) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={<Package size={20} />}      label="Productos activos"   value={fmtNum(data.totalProductos)}     color="indigo" to="/inventario/productos" />
        <KpiCard icon={<Warehouse size={20} />}     label="Bodegas activas"     value={fmtNum(data.totalBodegas)}       color="blue"   to="/inventario/bodegas" />
        <KpiCard icon={<Truck size={20} />}         label="Proveedores"         value={fmtNum(data.totalProveedores)}   color="teal"   to="/inventario/proveedores" />
        <KpiCard icon={<TrendingUp size={20} />}    label="Valor inventario"    value={fmt(data.valorTotal)}            color="green"  sub="CPP vigente" />
        <KpiCard icon={<Activity size={20} />}      label="Movs. este mes"      value={fmtNum(data.movimientosDelMes)}  color="indigo" to="/inventario/movimientos" />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          label="Alertas de stock"
          value={fmtNum(data.productosAlertas)}
          color={data.productosAlertas > 0 ? 'amber' : 'green'}
          sub="Bajo punto de reorden"
          to="/inventario/alertas"
        />
      </div>

      {/* ── Fila media: movs por tipo + OC por estado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Movimientos por tipo — últimos 30 días */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Movimientos últimos 30 días</h2>
            </div>
            <Link to="/inventario/movimientos" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {(data.movimientosPorTipo ?? []).length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">Sin movimientos en los últimos 30 días</p>
            )}
            {(data.movimientosPorTipo ?? []).map((m: any) => {
              const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'bg-slate-400', Icon: Activity }
              const pct = Math.round((m.cantidad / maxMovs) * 100)
              return (
                <div key={m.tipo} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <cfg.Icon size={13} className="text-slate-500" />
                      <span className="text-slate-700 font-medium">{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{m.cantidad} movs.</span>
                      <span className="font-semibold text-slate-700">{fmt(m.total)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${cfg.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* OC por estado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Órdenes de Compra</h2>
            </div>
            <Link to="/inventario/ordenes-compra" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {Object.entries(data.ocPorEstado ?? {}).map(([estado, count]) => {
              const cfg = OC_LABEL[estado] ?? { label: estado, dot: 'bg-slate-400' }
              return (
                <div key={estado} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div>
                    <p className="text-xs text-slate-500">{cfg.label}</p>
                    <p className="text-xl font-bold text-slate-800">{count as number}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Fila inferior: Top productos + ABC + Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 por valor */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Top 5 por valor</h2>
            <Link to="/inventario/reportes" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Reportes <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.topProductos.map((p: any, i: number) => (
              <div key={p.productoId} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.sku} · {fmtNum(p.cantidad)} und</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-700">{fmt(p.valor)}</p>
                  {p.claseAbc && (
                    <span className={`text-xs font-bold ${ABC_TEXT[p.claseAbc] ?? 'text-slate-500'}`}>
                      Clase {p.claseAbc}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data.topProductos.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">Sin datos de stock aún</p>
            )}
          </div>
        </div>

        {/* Distribución ABC */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Clasificación ABC</h2>
            <Link to="/inventario/reportes?tab=abc" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver detalle <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {/* Barra apilada */}
            {totalAbc > 0 && (
              <div className="flex h-4 w-full rounded-full overflow-hidden">
                {Object.entries(data.claseAbcDistribucion ?? {}).map(([clase, cnt]) => {
                  const pct = ((cnt as number) / totalAbc) * 100
                  return pct > 0 ? (
                    <div key={clase} className={`${ABC_COLOR[clase]} transition-all`} style={{ width: `${pct}%` }} title={`${clase}: ${cnt}`} />
                  ) : null
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.claseAbcDistribucion ?? {}).map(([clase, cnt]) => (
                <div key={clase} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className={`w-3 h-3 rounded-sm shrink-0 ${ABC_COLOR[clase]}`} />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      {clase === 'sinClase' ? 'Sin clase' : `Clase ${clase}`}
                    </p>
                    <p className="text-lg font-bold text-slate-800">{cnt as number}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              A = 80 % valor · B = 80–95 % · C = resto
            </p>
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Stock crítico (= 0)</h2>
            <Link to="/inventario/alertas" className="text-xs text-red-600 hover:underline flex items-center gap-1">
              Ver alertas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.alertasCriticas.map((s: any) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.producto?.nombre}</p>
                  <p className="text-xs text-slate-400">{s.bodega?.nombre}</p>
                </div>
                <span className="text-sm font-bold text-red-600 shrink-0">{parseFloat(s.cantidad).toFixed(0)}</span>
              </div>
            ))}
            {data.alertasCriticas.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-green-600 text-sm font-medium">✓ Sin stock crítico</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Últimos movimientos ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Últimos movimientos</h2>
          <Link to="/inventario/movimientos" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-5 py-2.5 text-left font-semibold">Nº</th>
                <th className="px-5 py-2.5 text-left font-semibold">Tipo</th>
                <th className="px-5 py-2.5 text-left font-semibold">Producto</th>
                <th className="px-5 py-2.5 text-left font-semibold">Bodega</th>
                <th className="px-5 py-2.5 text-right font-semibold">Cantidad</th>
                <th className="px-5 py-2.5 text-right font-semibold">Costo total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data.ultimosMovimientos ?? []).map((m: any) => {
                const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'bg-slate-400', Icon: Activity }
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{m.numero}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${m.tipo.includes('ENTRADA') || m.tipo === 'AJUSTE_POSITIVO' ? 'bg-green-50 text-green-700' :
                          m.tipo.includes('SALIDA') || m.tipo === 'AJUSTE_NEGATIVO' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{m.producto?.nombre}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {m.bodegaOrigen?.nombre ?? m.bodegaDestino?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmtNum(parseFloat(m.cantidad))}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{fmt(parseFloat(m.costoTotal))}</td>
                  </tr>
                )
              })}
              {(data.ultimosMovimientos ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Sin movimientos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/inventario/productos',    label: 'Productos',    icon: <Package size={18} /> },
          { to: '/inventario/bodegas',      label: 'Bodegas',      icon: <Warehouse size={18} /> },
          { to: '/inventario/alertas',      label: 'Alertas',      icon: <AlertTriangle size={18} /> },
          { to: '/inventario/reportes',     label: 'Reportes',     icon: <BarChart2 size={18} /> },
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
