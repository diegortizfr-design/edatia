import { useState, useEffect } from 'react'
import { Eye, Users, ShoppingBag, ShoppingCart, CreditCard, Loader2, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface Estadisticas {
  rangoDias: number
  resumen: {
    visitas: number
    visitantesUnicos: number
    productosVistos: number
    agregadosCarrito: number
    iniciosCheckout: number
    conversionCheckoutPct: number
  }
  porDia: { dia: string; visitas: number; visitantes: number }[]
  porOrigen: { origen: string; visitas: number }[]
  porDispositivo: { dispositivo: string; visitas: number }[]
  topProductos: { productoId: number; nombre: string; vistas: number }[]
}

const RANGOS = [7, 30, 90]

const Tarjeta = ({ icono, titulo, valor, sufijo }: { icono: React.ReactNode; titulo: string; valor: number; sufijo?: string }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
      {icono}
      {titulo}
    </div>
    <p className="text-3xl font-bold text-slate-800 mt-2">
      {valor.toLocaleString('es-CO')}
      {sufijo && <span className="text-lg text-slate-400 ml-1">{sufijo}</span>}
    </p>
  </div>
)

export function VisitasTienda() {
  const [dias, setDias] = useState(30)
  const [datos, setDatos] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      try {
        setLoading(true)
        const res = await api.get('/digital/analitica', { params: { dias } })
        if (!cancelado) setDatos(res.data)
      } catch {
        if (!cancelado) toast.error('No se pudieron cargar las estadísticas de la tienda')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [dias])

  const maxDia = Math.max(1, ...(datos?.porDia.map(d => d.visitas) ?? [1]))
  const maxOrigen = Math.max(1, ...(datos?.porOrigen.map(o => o.visitas) ?? [1]))
  const maxProducto = Math.max(1, ...(datos?.topProductos.map(p => p.vistas) ?? [1]))

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visitas de la Tienda Virtual</h1>
          <p className="text-slate-500 text-sm">Cuántas personas entran, de dónde llegan y qué productos miran.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {RANGOS.map(r => (
            <button
              key={r}
              onClick={() => setDias(r)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${dias === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {r} días
            </button>
          ))}
        </div>
      </div>

      {loading && !datos ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p>Cargando estadísticas...</p>
        </div>
      ) : datos && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Tarjeta icono={<Eye size={14} />} titulo="Visitas" valor={datos.resumen.visitas} />
            <Tarjeta icono={<Users size={14} />} titulo="Visitantes únicos" valor={datos.resumen.visitantesUnicos} />
            <Tarjeta icono={<ShoppingBag size={14} />} titulo="Productos vistos" valor={datos.resumen.productosVistos} />
            <Tarjeta icono={<ShoppingCart size={14} />} titulo="Al carrito" valor={datos.resumen.agregadosCarrito} />
            <Tarjeta icono={<CreditCard size={14} />} titulo="Inician compra" valor={datos.resumen.iniciosCheckout} />
          </div>

          <div className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-lg font-medium w-fit">
            <TrendingUp size={16} />
            {`De cada 100 visitas, ${datos.resumen.conversionCheckoutPct} inician una compra`}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4">Visitas por día</h2>
            {datos.porDia.length === 0 ? (
              <p className="text-sm text-slate-400">Aún no hay visitas registradas en este periodo.</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {datos.porDia.map(d => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-colors"
                      style={{ height: `${Math.max(4, (d.visitas / maxDia) * 100)}%` }}
                    />
                    <span className="absolute -top-6 hidden group-hover:block text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                      {`${d.dia}: ${d.visitas} visitas`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-4">¿De dónde llegan?</h2>
              <div className="space-y-3">
                {datos.porOrigen.length === 0 && <p className="text-sm text-slate-400">Sin datos todavía.</p>}
                {datos.porOrigen.map(o => (
                  <div key={o.origen}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{o.origen}</span>
                      <span className="font-semibold text-slate-800">{o.visitas}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(o.visitas / maxOrigen) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {datos.porDispositivo.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
                  {datos.porDispositivo.map(d => (
                    <span key={d.dispositivo} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                      {`${d.dispositivo.toLowerCase()}: ${d.visitas}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-700 mb-4">Productos más vistos</h2>
              <div className="space-y-3">
                {datos.topProductos.length === 0 && <p className="text-sm text-slate-400">Sin datos todavía.</p>}
                {datos.topProductos.map(p => (
                  <div key={p.productoId}>
                    <div className="flex justify-between text-sm mb-1 gap-3">
                      <span className="text-slate-600 truncate">{p.nombre}</span>
                      <span className="font-semibold text-slate-800">{p.vistas}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.vistas / maxProducto) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
