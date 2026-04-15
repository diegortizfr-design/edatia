import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { getMovimientos, getBodegas } from '../../services/inventario.service'
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Settings2 } from 'lucide-react'

const TIPO_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  ENTRADA:          { label: 'Entrada',        color: 'text-green-600 bg-green-50',   Icon: ArrowDownLeft },
  SALIDA:           { label: 'Salida',          color: 'text-red-600 bg-red-50',       Icon: ArrowUpRight },
  TRASLADO_SALIDA:  { label: 'Traslado S.',     color: 'text-blue-600 bg-blue-50',     Icon: ArrowLeftRight },
  TRASLADO_ENTRADA: { label: 'Traslado E.',     color: 'text-blue-600 bg-blue-50',     Icon: ArrowLeftRight },
  AJUSTE_POSITIVO:  { label: 'Ajuste (+)',      color: 'text-teal-600 bg-teal-50',     Icon: Settings2 },
  AJUSTE_NEGATIVO:  { label: 'Ajuste (−)',      color: 'text-orange-600 bg-orange-50', Icon: Settings2 },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function Movimientos() {
  const [tipo, setTipo] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 30

  const { data, isLoading } = useQuery({
    queryKey: ['movimientos', tipo, bodegaId, offset],
    queryFn: () => getMovimientos({
      tipo: tipo || undefined,
      bodegaId: bodegaId ? +bodegaId : undefined,
      limit, offset,
    }),
  })

  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Movimientos de inventario</h1>
          {data && <p className="text-slate-500 text-sm">{data.total} movimientos totales</p>}
        </div>
        <Link to="/inventario/movimientos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />Nuevo movimiento
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select value={tipo} onChange={e => { setTipo(e.target.value); setOffset(0) }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={bodegaId} onChange={e => { setBodegaId(e.target.value); setOffset(0) }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Todas las bodegas</option>
          {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Cargando...</div>
        ) : !data?.data.length ? (
          <div className="text-center py-16 text-slate-400">No hay movimientos registrados aún</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N°</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Bodega</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Costo total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Saldo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map(m => {
                  const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: 'text-slate-600 bg-slate-50', Icon: Settings2 }
                  const bodega = m.bodegaOrigen ?? m.bodegaDestino
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.numero}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          <cfg.Icon size={11} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{m.producto?.nombre}</p>
                        <p className="text-xs text-slate-400">{m.producto?.sku}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">{bodega?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{Number(m.cantidad).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell">{fmt(Number(m.costoTotal))}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell">{Number(m.saldoCantidad).toFixed(2)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400">
                        {new Date(m.fechaMovimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Mostrando {offset + 1}–{Math.min(offset + limit, data.total)} de {data.total}</p>
              <div className="flex gap-2">
                <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - limit))}
                  className="px-3 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40">Anterior</button>
                <button disabled={offset + limit >= data.total} onClick={() => setOffset(o => o + limit)}
                  className="px-3 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
