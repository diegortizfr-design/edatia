import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getCajas, getSesiones, abrirCaja, getDashboardPos, deleteCaja } from '../../services/pos.service'
import { Monitor, Plus, LogIn, Settings, TrendingUp, ShoppingBag, Layers, Trash2, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiError } from '../../services/api'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function PosDashboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAbrir, setShowAbrir] = useState<any>(null)
  const [montoInicial, setMontoInicial] = useState('')
  const [modalDelete, setModalDelete] = useState<{ open: boolean; caja: any; code: string }>({
    open: false,
    caja: null,
    code: '',
  })

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

  const mutDelete = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) => deleteCaja(id, code),
    onSuccess: () => {
      qc.invalidateQueries(['pos-cajas'])
      qc.invalidateQueries(['pos-dashboard'])
      toast.success('Caja POS eliminada correctamente')
      setModalDelete({ open: false, caja: null, code: '' })
    },
    onError: (e: any) => {
      if (e?.response?.status === 403) {
        toast.error('Código de autorización incorrecto')
      } else {
        toast.error(getApiError(e, 'Error al eliminar la caja'))
      }
    },
  })

  const handleConfirmDelete = () => {
    if (!modalDelete.caja) return
    if (!modalDelete.code.trim()) {
      toast.error('Debe ingresar el código de autorización')
      return
    }
    mutDelete.mutate({ id: modalDelete.caja.id, code: modalDelete.code.trim() })
  }

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
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${s ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {s ? 'Abierta' : 'Cerrada'}
                    </span>
                    {!s && (
                      <button
                        onClick={() => setModalDelete({ open: true, caja, code: '' })}
                        title="Eliminar caja registradora"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
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

      {/* Modal Confirmación Eliminación con Contraseña */}
      {modalDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">Eliminar Caja POS</h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Está seguro de eliminar la caja <strong className="text-slate-700 font-semibold">{modalDelete.caja?.nombre}</strong>?
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Esta acción requiere autorización de administrador y retirará la caja del punto de venta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDelete({ open: false, caja: null, code: '' })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Clave de Autorización de Administrador *
              </label>
              <input
                type="password"
                autoFocus
                value={modalDelete.code}
                onChange={e => setModalDelete(prev => ({ ...prev, code: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && modalDelete.code.trim()) {
                    handleConfirmDelete()
                  }
                }}
                placeholder="Ingrese clave de administrador..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 block">
                Configurada en Configuración → Empresa → pestaña Código de Administrador.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalDelete({ open: false, caja: null, code: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!modalDelete.code.trim() || mutDelete.isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {mutDelete.isPending ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
