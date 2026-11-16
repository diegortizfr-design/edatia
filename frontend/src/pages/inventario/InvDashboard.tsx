import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvKpis, clasificarAbc,
} from '../../services/inventario.service'
import { formatCOP, formatNum } from '../../lib/utils'
import {
  Package, Warehouse, TrendingUp, AlertTriangle, ArrowRight,
  Activity, Truck, ShoppingCart, RefreshCw, BarChart2,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2,
  Layers,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: 'indigo' | 'green' | 'emerald' | 'amber' | 'red' | 'blue' | 'teal' | 'purple' | 'sky'
  to?: string
  className?: string
  highlight?: 'emerald' | 'blue' | 'indigo' | 'amber'
}

function KpiCard({ icon, label, value, sub, color = 'indigo', to, className = '', highlight }: KpiCardProps) {
  const colors: Record<string, string> = {
    indigo:  'bg-indigo-50 text-indigo-600',
    green:   'bg-green-50  text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50  text-amber-600',
    red:     'bg-red-50    text-red-600',
    blue:    'bg-blue-50   text-blue-600',
    teal:    'bg-teal-50   text-teal-600',
    purple:  'bg-purple-50 text-purple-600',
    sky:     'bg-sky-50    text-sky-600',
  }

  const highlightBorder = highlight === 'emerald'
    ? 'border-emerald-200/90 bg-gradient-to-br from-white via-white to-emerald-50/40 ring-1 ring-emerald-100 shadow-xs'
    : highlight === 'blue'
    ? 'border-blue-200/90 bg-gradient-to-br from-white via-white to-blue-50/40 ring-1 ring-blue-100 shadow-xs'
    : 'border-slate-200 bg-white shadow-xs'

  const card = (
    <div className={`rounded-xl border p-3.5 sm:p-4 flex items-start gap-3 sm:gap-3.5 hover:shadow-md transition-all h-full ${highlightBorder}`}>
      <div className={`p-2.5 rounded-lg shrink-0 ${colors[color] ?? colors.indigo}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg sm:text-xl xl:text-lg 2xl:text-xl font-bold text-slate-800 mt-0.5 truncate" title={typeof value === 'string' ? value : String(value)}>
          {value}
        </p>
        {sub && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className={`block group h-full ${className}`}>{card}</Link> : <div className={className}>{card}</div>
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
  const [modoCosto, setModoCosto] = useState<'ultimo' | 'cpp'>('ultimo')

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
    <div className="space-y-5 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard de Inventario</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Resumen general y valoración de existencias</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => mutAbc.mutate()}
            disabled={mutAbc.isPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs sm:text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="Recalcular clasificación ABC"
          >
            <RefreshCw size={14} className={mutAbc.isPending ? 'animate-spin' : ''} />
            {mutAbc.isPending ? 'Calculando...' : 'Recalcular ABC'}
          </button>
          <Link
            to="/inventario/control-existencias/nuevo-ajuste"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Activity size={16} />
            <span>Nuevo ajuste</span>
          </Link>
        </div>
      </div>

      {abcMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs sm:text-sm text-green-700 font-medium">
          ✓ {abcMsg}
        </div>
      )}

      {/* ── KPIs principales (7 tarjetas responsivas con ambos indicadores de valor) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        <KpiCard
          icon={<Package size={20} />}
          label="Productos activos"
          value={formatNum(data.totalProductos)}
          color="indigo"
          to="/inventario/productos"
        />
        <KpiCard
          icon={<Warehouse size={20} />}
          label="Bodegas activas"
          value={formatNum(data.totalBodegas)}
          color="blue"
          to="/inventario/bodegas"
        />
        <KpiCard
          icon={<Truck size={20} />}
          label="Proveedores"
          value={formatNum(data.totalProveedores ?? 0)}
          color="teal"
          to="/inventario/proveedores"
        />

        {/* Indicador 1: VALOR ÚLTIMO COSTO (Suma de último costo * unidades con stock) */}
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Valor (Último Costo)"
          value={formatCOP(data.valorTotalUltimoCosto ?? data.valorTotal)}
          sub="Últ. costo × unidades"
          color="emerald"
          highlight="emerald"
          className="col-span-2 sm:col-span-1"
          to="/inventario/reportes"
        />

        {/* Indicador 2: VALOR COSTO PROMEDIO (CPP ponderado * unidades con stock) */}
        <KpiCard
          icon={<Layers size={20} />}
          label="Valor (Costo Promedio)"
          value={formatCOP(data.valorTotalCostoPromedio ?? data.valorTotal)}
          sub="CPP ponderado × stock"
          color="blue"
          highlight="blue"
          className="col-span-2 sm:col-span-1"
          to="/inventario/reportes"
        />

        <KpiCard
          icon={<Activity size={20} />}
          label="Movs. este mes"
          value={formatNum(data.movimientosDelMes ?? 0)}
          color="purple"
          to="/inventario/movimientos"
        />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          label="Alertas de stock"
          value={formatNum(data.productosAlertas)}
          color={data.productosAlertas > 0 ? 'amber' : 'green'}
          sub="Bajo punto reorden"
          className="col-span-2 sm:col-span-1"
          to="/inventario/alertas"
        />
      </div>

      {/* ── Fila media: movs por tipo + OC por estado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Movimientos por tipo — últimos 30 días */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Movimientos últimos 30 días</h2>
            </div>
            <Link to="/inventario/movimientos" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {(data.movimientosPorTipo ?? []).length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">Sin movimientos en los últimos 30 días</p>
            )}
            {(data.movimientosPorTipo ?? []).map((m: any) => {
              const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'bg-slate-400', Icon: Activity }
              const pct = Math.round((m.cantidad / maxMovs) * 100)
              return (
                <div key={m.tipo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <cfg.Icon size={13} className="text-slate-500 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 shrink-0">
                      <span>{m.cantidad} movs.</span>
                      <span className="font-semibold text-slate-700">{formatCOP(m.total)}</span>
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
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Órdenes de Compra</h2>
            </div>
            <Link to="/inventario/ordenes-compra" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
            {Object.entries(data.ocPorEstado ?? {}).map(([estado, count]) => {
              const cfg = OC_LABEL[estado] ?? { label: estado, dot: 'bg-slate-400' }
              return (
                <div key={estado} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-lg">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">{cfg.label}</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-800">{count as number}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Fila inferior: Top productos + ABC + Alertas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Top 5 por valor */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Top 5 por valor</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Ordenado por {modoCosto === 'ultimo' ? 'último costo' : 'costo promedio (CPP)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setModoCosto('ultimo')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    modoCosto === 'ultimo'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Ordenar por último costo de compra"
                >
                  Últ. Costo
                </button>
                <button
                  type="button"
                  onClick={() => setModoCosto('cpp')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    modoCosto === 'cpp'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Ordenar por costo promedio ponderado"
                >
                  CPP
                </button>
              </div>
              <Link to="/inventario/reportes" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <span className="hidden sm:inline">Reportes</span> <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {(modoCosto === 'ultimo'
              ? (data.topProductosUltimoCosto ?? data.topProductos)
              : (data.topProductosCostoPromedio ?? data.topProductos)
            ).map((p: any, i: number) => {
              const costoMostrar = modoCosto === 'ultimo'
                ? (p.costoUltimo ?? (p.cantidad > 0 ? p.valor / p.cantidad : 0))
                : (p.costoPromedio ?? (p.cantidad > 0 ? p.valor / p.cantidad : 0))
              return (
                <div key={p.productoId} className="px-4 sm:px-5 py-3 flex items-center gap-2.5 sm:gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      {p.sku} · {formatNum(p.cantidad)} und · {modoCosto === 'ultimo' ? 'Últ. Costo' : 'CPP'}: {formatCOP(costoMostrar)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">{formatCOP(p.valor)}</p>
                    {p.claseAbc && (
                      <span className={`text-[10px] sm:text-xs font-bold ${ABC_TEXT[p.claseAbc] ?? 'text-slate-500'}`}>
                        Clase {p.claseAbc}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {data.topProductos.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">Sin datos de stock aún</p>
            )}
          </div>
        </div>

        {/* Distribución ABC */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Clasificación ABC</h2>
            <Link to="/inventario/reportes?tab=abc" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver detalle <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
            {/* Barra apilada */}
            {totalAbc > 0 && (
              <div className="flex h-3.5 sm:h-4 w-full rounded-full overflow-hidden">
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
                <div key={clase} className="flex items-center gap-2 p-2 sm:p-2.5 bg-slate-50 rounded-lg">
                  <span className={`w-3 h-3 rounded-sm shrink-0 ${ABC_COLOR[clase]}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">
                      {clase === 'sinClase' ? 'Sin clase' : `Clase ${clase}`}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-800">{cnt as number}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 text-center">
              A = 80 % valor · B = 80–95 % · C = resto
            </p>
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Stock crítico (≤ 0)</h2>
            <Link to="/inventario/alertas" className="text-xs text-red-600 hover:underline flex items-center gap-1">
              Ver alertas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.alertasCriticas.map((s: any) => (
              <div key={s.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">{s.producto?.nombre}</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">{s.bodega?.nombre}</p>
                </div>
                <span className="text-xs sm:text-sm font-bold text-red-600 shrink-0">{parseFloat(s.cantidad).toFixed(0)}</span>
              </div>
            ))}
            {data.alertasCriticas.length === 0 && (
              <div className="px-4 sm:px-5 py-8 text-center">
                <p className="text-green-600 text-sm font-medium">✓ Sin stock crítico</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Últimos movimientos (Tabla responsive con scroll horizontal) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Últimos movimientos</h2>
          <Link to="/inventario/movimientos" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 sm:px-5 py-2.5 text-left font-semibold">Nº</th>
                <th className="px-4 sm:px-5 py-2.5 text-left font-semibold">Tipo</th>
                <th className="px-4 sm:px-5 py-2.5 text-left font-semibold">Producto</th>
                <th className="px-4 sm:px-5 py-2.5 text-left font-semibold">Bodega</th>
                <th className="px-4 sm:px-5 py-2.5 text-right font-semibold">Cantidad</th>
                <th className="px-4 sm:px-5 py-2.5 text-right font-semibold">Costo total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data.ultimosMovimientos ?? []).map((m: any) => {
                const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'bg-slate-400', Icon: Activity }
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-5 py-3 text-slate-500 font-mono text-xs">{m.numero}</td>
                    <td className="px-4 sm:px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                        ${m.tipo.includes('ENTRADA') || m.tipo === 'AJUSTE_POSITIVO' ? 'bg-green-50 text-green-700' :
                          m.tipo.includes('SALIDA') || m.tipo === 'AJUSTE_NEGATIVO' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 font-medium text-slate-800 truncate max-w-[200px]">{m.producto?.nombre}</td>
                    <td className="px-4 sm:px-5 py-3 text-slate-500 text-xs truncate max-w-[150px]">
                      {m.bodegaOrigen?.nombre ?? m.bodegaDestino?.nombre ?? '—'}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right font-semibold text-slate-800">{formatNum(parseFloat(m.cantidad))}</td>
                    <td className="px-4 sm:px-5 py-3 text-right text-slate-600 font-medium">{formatCOP(parseFloat(m.costoTotal))}</td>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { to: '/inventario/productos', label: 'Productos', icon: <Package size={18} /> },
          { to: '/inventario/bodegas',   label: 'Bodegas',   icon: <Warehouse size={18} /> },
          { to: '/inventario/alertas',   label: 'Alertas',   icon: <AlertTriangle size={18} /> },
          { to: '/inventario/reportes',  label: 'Reportes',  icon: <BarChart2 size={18} /> },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-xs"
          >
            <span className="text-indigo-600 shrink-0">{link.icon}</span>
            <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">{link.label}</span>
            <ArrowRight size={14} className="ml-auto text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  )
}
