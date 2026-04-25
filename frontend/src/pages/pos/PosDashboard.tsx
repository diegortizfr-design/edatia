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
  const [vendedor, setVendedor] = useState('')

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
          <p className="text-slate-500 text-sm mt-0.5">Selecciona una caja para comenzar a vender</p>
        </div>
        <button onClick={() => navigate('/pos/config')}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <Settings size={16} /> Configurar cajas
        </button>
      </div>

      {/* KPIs del día */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
              <div>
                <div className="text-xs text-slate-500">Ventas hoy</div>
                <div className="text-xl font-bold text-slate-800">{fmt(dashboard.ventasHoy ?? 0)}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><ShoppingBag size={20} className="text-blue-600" /></div>
              <div>
                <div className="text-xs text-slate-500">Transacciones hoy</div>
                <div className="text-xl font-bold text-slate-800">{dashboard.transaccionesHoy ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg"><Layers size={20} className="text-indigo-600" /></div>
              <div>
                <div className="text-xs text-slate-500">Cajas abiertas</div>
                <div className="text-xl font-bold text-slate-800">{dashboard.sesionesAbiertas ?? 0} / {dashboard.totalCajas ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cajas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(cajas as any[]).map((caja: any) => {
          const sesionAbierta = sesionAbiertaDeCaja(caja.id)
          return (
            <div key={caja.id} className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden ${
              sesionAbierta ? 'border-green-300' : 'border-slate-200'
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between ${
                sesionAbierta ? 'bg-green-50' : 'bg-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Monitor size={18} className={sesionAbierta ? 'text-green-600' : 'text-slate-400'} />
                  <span className="font-bold text-slate-800">{caja.nombre}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  sesionAbierta ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {sesionAbierta ? '● ABIERTA' : '○ CERRADA'}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-xs text-slate-500">
                  <span className="font-medium">Bodega:</span> {caja.bodega?.nombre}
                </div>
                {caja.cuentaPUC && (
                  <div className="text-xs text-slate-500">
                    <span className="font-medium">Cuenta PUC:</span> {caja.cuentaPUC.codigo} — {caja.cuentaPUC.nombre}
                  </div>
                )}
                {sesionAbierta && (
                  <div className="text-xs text-slate-500">
                    <span className="font-medium">Vendedor:</span> {sesionAbierta.vendedorNombre}
                  </div>
                )}

                <div className="pt-2">
                  {sesionAbierta ? (
                    <button
                      onClick={() => navigate(`/pos/screen/${sesionAbierta.id}`)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <LogIn size={16} /> Entrar a la caja
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAbrir(caja)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Plus size={16} /> Abrir caja
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {(cajas as any[]).length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Monitor size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay cajas configuradas.</p>
            <button onClick={() => navigate('/pos/config')}
              className="mt-3 text-indigo-600 hover:underline text-sm font-medium">
              Configurar primera caja →
            </button>
          </div>
        )}
      </div>

      {/* Modal abrir caja */}
      {showAbrir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Abrir {showAbrir.nombre}</h2>
              <button onClick={() => setShowAbrir(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del vendedor *</label>
                <input value={vendedor} onChange={e => setVendedor(e.target.value)}
                  placeholder="Nombre de quien abre la caja"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
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
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={() => mutAbrir.mutate({
                  cajaId: showAbrir.id,
                  montoInicial: parseFloat(montoInicial) || 0,
                  vendedorNombre: vendedor || 'Vendedor',
                })}
                disabled={!vendedor || mutAbrir.isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
                {mutAbrir.isLoading ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
