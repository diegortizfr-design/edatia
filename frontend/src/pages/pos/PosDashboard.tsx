import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getCajas, getSesiones, abrirCaja, getDashboardPos } from '../../services/pos.service'
import { Monitor, Plus, LogIn, Settings, TrendingUp, ShoppingBag, Layers } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function PosDashboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAbrir, setShowAbrir] = useState<any>(null)
  const [montoInicial, setMontoInicial] = useState('')

  const { data: cajas = [] } = useQuery(['pos-cajas'], getCajas)
  const { data: sesiones = [] } = useQuery(['pos-sesiones', 'ABIERTA'], () => getSesiones({ estado: 'ABIERTA' }))
  const { data: dashboard } = useQuery(['pos-dashboard'], getDashboardPos)

  const mutAbrir = useMutation({
    mutationFn: abrirCaja,
    onSuccess: (sesion) => {
      qc.invalidateQueries(['pos-cajas'])
      qc.invalidateQueries(['pos-sesiones'])
      qc.invalidateQueries(['pos-dashboard'])
      navigate(`/pos/screen/${sesion.id}`)
    },
  })

  const sesionAbiertaDeCaja = (cajaId: number) =>
    (sesiones as any[]).find((s: any) => s.cajaId === cajaId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Monitor size={24} className="text-indigo-600" /> Punto de Venta (POS)
          </h1>
          <p className="text-slate-550 text-sm mt-0.5">Selecciona una caja para comenzar a vender</p>
        </div>
        <button onClick={() => navigate('/pos/config')}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-650 hover:bg-slate-50">
          <Settings size={16} /> Configurar cajas
        </button>
      </div>

      {/* KPIs del día */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas de Hoy</p>
              <h3 className="text-lg font-bold text-slate-850 mt-0.5">{fmt(dashboard.ventasHoy ?? 0)}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShoppingBag size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transacciones</p>
              <h3 className="text-lg font-bold text-slate-850 mt-0.5">{dashboard.transaccionesHoy ?? 0}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cajas Activas</p>
              <h3 className="text-lg font-bold text-slate-850 mt-0.5">{dashboard.cajasActivas ?? 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Cajas registradoras */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(cajas as any[]).map((caja: any) => {
          const s = sesionAbiertaDeCaja(caja.id)
          return (
            <div key={caja.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${s ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-sm">{caja.nombre}</h2>
                      <p className="text-slate-450 text-[10px] font-mono mt-0.5">{caja.codigo || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${s ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {s ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>

                {s && (
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <p><strong>Cajero:</strong> {s.vendedorNombre}</p>
                    <p><strong>Inició:</strong> {new Date(s.abiertaAt).toLocaleString('es-CO')}</p>
                    <p><strong>Base inicial:</strong> {fmt(s.montoInicial)}</p>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0">
                {s ? (
                  <button onClick={() => navigate(`/pos/screen/${s.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                    <LogIn size={14} /> Entrar al POS
                  </button>
                ) : (
                  <button onClick={() => { setShowAbrir(caja); setMontoInicial('') }}
                    className="w-full border border-indigo-200 text-indigo-600 rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm bg-white">
                    Abrir turno / caja
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {(cajas as any[]).length === 0 && (
          <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Monitor size={48} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm font-semibold">No hay cajas registradoras creadas.</p>
            <p className="text-xs text-slate-400 mt-1">Haga clic en el botón de Configuración arriba para crear una.</p>
          </div>
        )}
      </div>

      {/* Modal abrir caja */}
      {showAbrir && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Abrir {showAbrir.nombre}</h2>
              <button onClick={() => setShowAbrir(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Monto inicial en caja *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number" min={0} value={montoInicial}
                    onChange={e => setMontoInicial(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Efectivo en caja al momento de apertura (billetes de cambio, etc.)</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAbrir(null)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => mutAbrir.mutate({
                  cajaId: showAbrir.id,
                  montoInicial: parseFloat(montoInicial) || 0,
                })}
                disabled={mutAbrir.isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-bold transition-colors shadow-sm">
                {mutAbrir.isLoading ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
