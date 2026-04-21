import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReporteStock, getReporteMovimientos, getReporteAbc, clasificarAbc,
} from '../../services/inventario.service'
import {
  BarChart2, Download, RefreshCw, AlertTriangle, Package,
  TrendingUp, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2, Activity,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function fmtN(n: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: 'Entrada', SALIDA: 'Salida',
  TRASLADO_SALIDA: 'Traslado S.', TRASLADO_ENTRADA: 'Traslado E.',
  AJUSTE_POSITIVO: 'Ajuste (+)', AJUSTE_NEGATIVO: 'Ajuste (−)',
}
const ABC_COLOR: Record<string, string> = { A: 'bg-green-100 text-green-700', B: 'bg-amber-100 text-amber-700', C: 'bg-red-100 text-red-700', '—': 'bg-slate-100 text-slate-500' }

type Tab = 'stock' | 'movimientos' | 'abc'

function exportCsv(headers: string[], rows: string[][], filename: string) {
  const bom = '\uFEFF'
  const content = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function Reportes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) ?? 'stock'
  const setTab = (t: Tab) => setSearchParams({ tab: t })

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')

  const qc = useQueryClient()

  const stockQ = useQuery({
    queryKey: ['reporte-stock'],
    queryFn: getReporteStock,
    enabled: tab === 'stock',
  })

  const movsQ = useQuery({
    queryKey: ['reporte-movimientos', desde, hasta, tipoFiltro],
    queryFn: () => getReporteMovimientos({ desde, hasta, tipo: tipoFiltro }),
    enabled: tab === 'movimientos',
  })

  const abcQ = useQuery({
    queryKey: ['reporte-abc'],
    queryFn: getReporteAbc,
    enabled: tab === 'abc',
  })

  const mutAbc = useMutation({
    mutationFn: clasificarAbc,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reporte-abc'] }),
  })

  // ── CSV helpers ──────────────────────────────────────────────────────────
  const exportarStock = () => {
    const filas = stockQ.data?.filas ?? []
    exportCsv(
      ['SKU', 'Producto', 'Categoría', 'Marca', 'Unidad', 'Bodega', 'Cantidad', 'Disponible', 'Costo CPP', 'Valor Total', 'Clase ABC', 'Alerta'],
      filas.map((f: any) => [f.sku, f.nombre, f.categoria, f.marca, f.unidad, f.bodega, fmtN(f.cantidad), fmtN(f.disponible), fmtN(f.costoPromedio), fmtN(f.valorTotal), f.claseAbc, f.alerta]),
      `reporte-stock-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const exportarMovimientos = () => {
    const filas = movsQ.data?.filas ?? []
    exportCsv(
      ['Número', 'Fecha', 'Tipo', 'Concepto', 'SKU', 'Producto', 'Bodega Origen', 'Bodega Destino', 'Cantidad', 'Costo Unitario', 'Costo Total', 'Saldo Cantidad', 'Saldo CPP'],
      filas.map((f: any) => [
        f.numero, new Date(f.fecha).toLocaleDateString('es-CO'), TIPO_LABEL[f.tipo] ?? f.tipo,
        f.concepto, f.sku, f.producto, f.bodegaOrigen, f.bodegaDestino,
        fmtN(f.cantidad), fmtN(f.costoUnitario), fmtN(f.costoTotal), fmtN(f.saldoCantidad), fmtN(f.saldoCpp),
      ]),
      `reporte-movimientos-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const exportarAbc = () => {
    const filas = abcQ.data?.filas ?? []
    exportCsv(
      ['SKU', 'Producto', 'Categoría', 'Cantidad', 'Costo CPP', 'Valor Inventario', '% del Total', '% Acumulado', 'Clase ABC'],
      filas.map((f: any) => [
        f.sku, f.nombre, f.categoria, fmtN(f.cantidad), fmtN(f.costoPromedio),
        fmtN(f.valorInventario), fmtN(f.pctDelTotal), fmtN(f.pctAcumulado), f.claseAbc,
      ]),
      `reporte-abc-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'stock',       label: 'Stock valorado',      icon: Package },
    { key: 'movimientos', label: 'Movimientos',          icon: Activity },
    { key: 'abc',         label: 'Clasificación ABC',   icon: BarChart2 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes de Inventario</h1>
          <p className="text-slate-500 text-sm mt-0.5">Exporta y analiza los datos de tu inventario</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: STOCK ══════════════════════════════════════════════════════ */}
      {tab === 'stock' && (
        <div className="space-y-4">
          {stockQ.isLoading && <p className="text-center py-16 text-slate-400">Cargando reporte...</p>}
          {stockQ.data && (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Registros',         value: stockQ.data.resumen.totalRegistros,    icon: Package,        color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Valor total',        value: fmt(stockQ.data.resumen.valorTotalInventario), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
                  { label: 'En alerta',          value: stockQ.data.resumen.productosEnAlerta, icon: AlertTriangle,  color: 'text-amber-600 bg-amber-50' },
                  { label: 'Críticos (stock=0)', value: stockQ.data.resumen.productosCriticos, icon: AlertTriangle,  color: 'text-red-600 bg-red-50' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                    <div className={`p-2 rounded-lg ${c.color}`}><c.icon size={18} /></div>
                    <div>
                      <p className="text-xs text-slate-500">{c.label}</p>
                      <p className="text-xl font-bold text-slate-800">{typeof c.value === 'number' && c.label !== 'Valor total' ? fmtN(c.value) : c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla + exportar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">Detalle por producto y bodega</h2>
                  <button onClick={exportarStock}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                    <Download size={13} /> Exportar CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        {['SKU','Producto','Categoría','Bodega','Cantidad','Disponible','Costo CPP','Valor Total','Clase ABC','Alerta'].map(h => (
                          <th key={h} className={`px-4 py-2.5 font-semibold ${h === 'SKU' || h === 'Producto' || h === 'Categoría' || h === 'Bodega' ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stockQ.data.filas.map((f: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{f.sku}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{f.nombre}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{f.categoria}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{f.bodega}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{fmtN(f.cantidad)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtN(f.disponible)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(f.costoPromedio)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(f.valorTotal)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {f.claseAbc !== '—' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ABC_COLOR[f.claseAbc] ?? 'bg-slate-100 text-slate-500'}`}>
                                {f.claseAbc}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              f.alerta === 'CRITICO' ? 'bg-red-100 text-red-700' :
                              f.alerta === 'BAJO'    ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'}`}>
                              {f.alerta}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ TAB: MOVIMIENTOS ════════════════════════════════════════════════ */}
      {tab === 'movimientos' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value="">Todos</option>
                {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={exportarMovimientos}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors ml-auto">
              <Download size={14} /> Exportar CSV
            </button>
          </div>

          {movsQ.isLoading && <p className="text-center py-16 text-slate-400">Cargando movimientos...</p>}
          {movsQ.data && (
            <>
              {/* Resumen por tipo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(movsQ.data.resumen.totalesPorTipo).map(([tipo, tots]: any) => {
                  const IcoMap: any = {
                    ENTRADA: ArrowDownLeft, SALIDA: ArrowUpRight,
                    TRASLADO_SALIDA: ArrowLeftRight, TRASLADO_ENTRADA: ArrowLeftRight,
                    AJUSTE_POSITIVO: Settings2, AJUSTE_NEGATIVO: Settings2,
                  }
                  const Ico = IcoMap[tipo] ?? Activity
                  return (
                    <div key={tipo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Ico size={13} className="text-slate-400" />
                        <p className="text-xs text-slate-500">{TIPO_LABEL[tipo] ?? tipo}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-800">{fmtN(tots.cantidad)}</p>
                      <p className="text-xs text-slate-400">{fmt(tots.costoTotal)}</p>
                    </div>
                  )
                })}
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-semibold text-slate-800">
                    {movsQ.data.resumen.totalMovimientos} movimientos
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        {['Nº','Fecha','Tipo','Producto','Bodega Origen','Bodega Destino','Cantidad','Costo Total','Saldo Cant.','Saldo CPP'].map(h => (
                          <th key={h} className={`px-4 py-2.5 font-semibold ${['Cantidad','Costo Total','Saldo Cant.','Saldo CPP'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {movsQ.data.filas.map((f: any) => (
                        <tr key={f.numero} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{f.numero}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(f.fecha).toLocaleDateString('es-CO')}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              f.tipo.includes('ENTRADA') || f.tipo === 'AJUSTE_POSITIVO' ? 'bg-green-50 text-green-700' :
                              f.tipo.includes('SALIDA') || f.tipo === 'AJUSTE_NEGATIVO'  ? 'bg-red-50 text-red-700' :
                              'bg-blue-50 text-blue-700'}`}>
                              {TIPO_LABEL[f.tipo] ?? f.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[160px] truncate">{f.producto}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.bodegaOrigen}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.bodegaDestino}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtN(f.cantidad)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(f.costoTotal)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmtN(f.saldoCantidad)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{fmt(f.saldoCpp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ TAB: ABC ════════════════════════════════════════════════════════ */}
      {tab === 'abc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-slate-500">
              Clasifica automáticamente los productos según su participación en el valor del inventario.
            </p>
            <div className="flex gap-2">
              <button onClick={() => mutAbc.mutate()} disabled={mutAbc.isPending}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={mutAbc.isPending ? 'animate-spin' : ''} />
                {mutAbc.isPending ? 'Calculando...' : 'Recalcular ABC'}
              </button>
              <button onClick={exportarAbc}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                <Download size={14} /> Exportar CSV
              </button>
            </div>
          </div>

          {abcQ.isLoading && <p className="text-center py-16 text-slate-400">Cargando clasificación ABC...</p>}
          {abcQ.data && (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { clase: 'A', label: 'Clase A — Alto valor',    color: 'border-green-200 bg-green-50', text: 'text-green-700', val: abcQ.data.distribucion.A },
                  { clase: 'B', label: 'Clase B — Valor medio',   color: 'border-amber-200 bg-amber-50', text: 'text-amber-700', val: abcQ.data.distribucion.B },
                  { clase: 'C', label: 'Clase C — Bajo valor',    color: 'border-red-200   bg-red-50',   text: 'text-red-700',   val: abcQ.data.distribucion.C },
                  { clase: '—', label: 'Sin clasificar',          color: 'border-slate-200 bg-slate-50', text: 'text-slate-600', val: abcQ.data.distribucion.sinClase },
                ].map(c => (
                  <div key={c.clase} className={`rounded-xl border p-4 ${c.color} shadow-sm`}>
                    <p className={`text-xs font-semibold ${c.text}`}>{c.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${c.text}`}>{c.val}</p>
                    <p className={`text-xs ${c.text} opacity-70 mt-0.5`}>productos</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Valor total inventario: <strong className="text-slate-700">{fmt(abcQ.data.valorTotal)}</strong>
              </p>

              {/* Tabla */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        {['#','SKU','Producto','Categoría','Cantidad','Costo CPP','Valor Inventario','% del Total','% Acumulado','Clase ABC'].map(h => (
                          <th key={h} className={`px-4 py-2.5 font-semibold ${['#'].includes(h) || ['SKU','Producto','Categoría'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {abcQ.data.filas.map((f: any, i: number) => (
                        <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{f.sku}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{f.nombre}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.categoria}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{fmtN(f.cantidad)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(f.costoPromedio)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(f.valorInventario)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{f.pctDelTotal.toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${f.pctAcumulado <= 80 ? 'bg-green-500' : f.pctAcumulado <= 95 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(f.pctAcumulado, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">{f.pctAcumulado.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ABC_COLOR[f.claseAbc] ?? 'bg-slate-100 text-slate-500'}`}>
                              {f.claseAbc}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
