import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBalanceComprobacion, getEstadoResultados, getBalanceGeneral } from '../../services/contabilidad.service'
import { BarChart2, TrendingUp, Scale, Download, Check, X } from 'lucide-react'

type Tab = 'balance' | 'resultados' | 'general'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n ?? 0)

const hoy = new Date()
const primerDiaMes = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-01`
const hoyStr = hoy.toISOString().split('T')[0]

export function ContReportes() {
  const [tab, setTab] = useState<Tab>('balance')
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyStr)
  const [consultado, setConsultado] = useState(false)

  const { data: balance, isLoading: loadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['balance-comprobacion', desde, hasta],
    queryFn: () => getBalanceComprobacion(desde, hasta),
    enabled: false,
  })

  const { data: resultados, isLoading: loadingResultados, refetch: refetchResultados } = useQuery({
    queryKey: ['estado-resultados', desde, hasta],
    queryFn: () => getEstadoResultados(desde, hasta),
    enabled: false,
  })

  const { data: general, isLoading: loadingGeneral, refetch: refetchGeneral } = useQuery({
    queryKey: ['balance-general', hasta],
    queryFn: () => getBalanceGeneral(hasta),
    enabled: false,
  })

  function consultar() {
    setConsultado(true)
    if (tab === 'balance') refetchBalance()
    if (tab === 'resultados') refetchResultados()
    if (tab === 'general') refetchGeneral()
  }

  function exportarCSV(datos: any[], nombre: string) {
    const bom = '\uFEFF'
    const header = 'Código;Nombre;Tipo;Débitos;Créditos;Saldo\n'
    const rows = datos.map((r: any) =>
      `${r.codigo};"${r.nombre}";${r.tipo};${r.debitos ?? 0};${r.creditos ?? 0};${r.saldo ?? 0}`
    ).join('\n')
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${nombre}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'balance',    label: 'Balance de Comprobación', icon: Scale },
    { id: 'resultados', label: 'Estado de Resultados',    icon: TrendingUp },
    { id: 'general',    label: 'Balance General',         icon: BarChart2 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes Contables</h1>
        <p className="text-slate-500 text-sm mt-0.5">Estados financieros según PUC colombiano</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setConsultado(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Filtros de período */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        {tab !== 'general' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{tab === 'general' ? 'Hasta (fecha corte)' : 'Hasta'}</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <button onClick={consultar}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Consultar
        </button>
      </div>

      {/* Contenido por tab */}
      {tab === 'balance' && (
        <BalanceComprobacion data={balance} loading={loadingBalance} consultado={consultado} exportar={exportarCSV} />
      )}
      {tab === 'resultados' && (
        <EstadoResultados data={resultados} loading={loadingResultados} consultado={consultado} />
      )}
      {tab === 'general' && (
        <BalanceGeneral data={general} loading={loadingGeneral} consultado={consultado} />
      )}
    </div>
  )
}

// ── Balance de Comprobación ───────────────────────────────────────────────────

function BalanceComprobacion({ data, loading, consultado, exportar }: any) {
  if (!consultado) return <EmptyState icon={Scale} msg="Selecciona el período y haz clic en Consultar" />
  if (loading) return <p className="text-center py-12 text-slate-400">Calculando...</p>
  if (!data?.length) return <EmptyState icon={Scale} msg="Sin movimientos en el período seleccionado" />

  const totalDB  = data.reduce((a: number, r: any) => a + r.debitos, 0)
  const totalCR  = data.reduce((a: number, r: any) => a + r.creditos, 0)
  const totalSDB = data.reduce((a: number, r: any) => a + r.saldoDebito, 0)
  const totalSCR = data.reduce((a: number, r: any) => a + r.saldoCredito, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">Balance de Comprobación</p>
        <button onClick={() => exportar(data, 'balance-comprobacion')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
          <Download size={13} /> Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wide border-b border-slate-100 text-right">
              <th className="px-4 py-2.5 text-left">Código</th>
              <th className="px-4 py-2.5 text-left">Nombre</th>
              <th className="px-4 py-2.5 text-left">Tipo</th>
              <th className="px-4 py-2.5">Débitos</th>
              <th className="px-4 py-2.5">Créditos</th>
              <th className="px-4 py-2.5">Saldo Débito</th>
              <th className="px-4 py-2.5">Saldo Crédito</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((r: any) => (
              <tr key={r.codigo} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono font-bold text-indigo-700">{r.codigo}</td>
                <td className="px-4 py-2 text-slate-700">{r.nombre}</td>
                <td className="px-4 py-2 text-slate-500">{r.tipo}</td>
                <td className="px-4 py-2 text-right text-slate-600">{r.debitos ? cop(r.debitos) : ''}</td>
                <td className="px-4 py-2 text-right text-slate-600">{r.creditos ? cop(r.creditos) : ''}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-800">{r.saldoDebito ? cop(r.saldoDebito) : ''}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-800">{r.saldoCredito ? cop(r.saldoCredito) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-right text-slate-800">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-left">TOTALES</td>
              <td className="px-4 py-3">{cop(totalDB)}</td>
              <td className="px-4 py-3">{cop(totalCR)}</td>
              <td className="px-4 py-3">{cop(totalSDB)}</td>
              <td className="px-4 py-3">{cop(totalSCR)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Estado de Resultados ──────────────────────────────────────────────────────

function EstadoResultados({ data, loading, consultado }: any) {
  if (!consultado) return <EmptyState icon={TrendingUp} msg="Selecciona el período y haz clic en Consultar" />
  if (loading) return <p className="text-center py-12 text-slate-400">Calculando...</p>
  if (!data) return null

  return (
    <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="font-bold text-slate-800">Estado de Resultados</p>
        <p className="text-xs text-slate-500">Del {data.periodo?.desde} al {data.periodo?.hasta}</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Ingresos */}
        <Section title="(+) INGRESOS OPERACIONALES" color="text-green-700 bg-green-50" cuentas={data.ingresos} total={data.totalIngresos} totalColor="text-green-800" />
        {/* Costos */}
        <Section title="(-) COSTO DE VENTAS" color="text-amber-700 bg-amber-50" cuentas={data.costos} total={data.totalCostos} totalColor="text-amber-800" />
        {/* Utilidad Bruta */}
        <div className="flex justify-between items-center py-3 border-t-2 border-slate-300">
          <span className="font-bold text-slate-800">= UTILIDAD BRUTA</span>
          <span className={`font-bold text-lg ${data.utilidadBruta >= 0 ? 'text-green-700' : 'text-red-700'}`}>{cop(data.utilidadBruta)}</span>
        </div>
        {/* Gastos */}
        <Section title="(-) GASTOS OPERACIONALES" color="text-red-700 bg-red-50" cuentas={data.gastos} total={data.totalGastos} totalColor="text-red-800" />
        {/* Utilidad Neta */}
        <div className={`flex justify-between items-center py-4 px-5 rounded-xl ${data.utilidadNeta >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <span className="font-bold text-slate-800 text-base">= UTILIDAD NETA DEL EJERCICIO</span>
          <span className={`font-bold text-2xl ${data.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>{cop(data.utilidadNeta)}</span>
        </div>
      </div>
    </div>
  )
}

function Section({ title, color, cuentas, total, totalColor }: any) {
  return (
    <div>
      <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg mb-2 ${color}`}>{title}</div>
      {(cuentas ?? []).map((c: any) => (
        <div key={c.codigo} className="flex justify-between py-1 px-3 text-sm text-slate-600">
          <span className="font-mono text-xs text-slate-400 mr-2">{c.codigo}</span>
          <span className="flex-1 text-xs">{c.nombre}</span>
          <span className="text-xs font-medium">{cop(Math.abs(c.saldo))}</span>
        </div>
      ))}
      <div className={`flex justify-between py-2 px-3 font-bold text-sm border-t border-slate-200 mt-1 ${totalColor}`}>
        <span>Total</span>
        <span>{cop(Math.abs(total))}</span>
      </div>
    </div>
  )
}

// ── Balance General ───────────────────────────────────────────────────────────

function BalanceGeneral({ data, loading, consultado }: any) {
  if (!consultado) return <EmptyState icon={BarChart2} msg="Selecciona la fecha de corte y haz clic en Consultar" />
  if (loading) return <p className="text-center py-12 text-slate-400">Calculando...</p>
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Indicador cuadre */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${data.cuadra ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        {data.cuadra ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}
        <span className={`text-sm font-semibold ${data.cuadra ? 'text-green-700' : 'text-red-700'}`}>
          {data.cuadra ? 'Cuadra ✓ — Activos = Pasivos + Patrimonio' : 'No cuadra ✗ — Revisar comprobantes'}
        </span>
        <span className="ml-auto text-xs text-slate-500">Corte: {data.fecha}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100">
            <p className="font-bold text-teal-800 text-sm">ACTIVOS</p>
            <p className="text-teal-600 font-bold">{cop(data.totalActivos)}</p>
          </div>
          <CuentasList cuentas={data.activos} />
        </div>
        {/* Pasivos + Patrimonio */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
              <p className="font-bold text-orange-800 text-sm">PASIVOS</p>
              <p className="text-orange-600 font-bold">{cop(data.totalPasivos)}</p>
            </div>
            <CuentasList cuentas={data.pasivos} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-violet-50 border-b border-violet-100">
              <p className="font-bold text-violet-800 text-sm">PATRIMONIO</p>
              <p className="text-violet-600 font-bold">{cop(data.totalPatrimonio)}</p>
            </div>
            <CuentasList cuentas={data.patrimonio} />
          </div>
          <div className="bg-slate-800 rounded-xl px-5 py-3 flex justify-between items-center">
            <span className="text-white font-bold text-sm">TOTAL PASIVOS + PATRIMONIO</span>
            <span className="text-white font-bold">{cop(data.totalPasivos + data.totalPatrimonio)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CuentasList({ cuentas }: any) {
  return (
    <div className="divide-y divide-slate-50">
      {(cuentas ?? []).map((c: any) => (
        <div key={c.codigo} className="flex items-center px-5 py-2 text-xs gap-2">
          <span className="font-mono text-slate-400 w-16 shrink-0">{c.codigo}</span>
          <span className="flex-1 text-slate-600">{c.nombre}</span>
          <span className="font-medium text-slate-800">{cop(Math.abs(c.saldo))}</span>
        </div>
      ))}
      {(!cuentas?.length) && <p className="px-5 py-4 text-xs text-slate-400">Sin movimientos</p>}
    </div>
  )
}

function EmptyState({ icon: Icon, msg }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
      <Icon size={40} className="text-slate-300" />
      <p className="text-sm">{msg}</p>
    </div>
  )
}
