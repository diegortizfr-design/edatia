import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FileText, Search, RefreshCw } from 'lucide-react'
import { getCotizaciones, cambiarEstadoCotizacion, getClientes } from '../../services/ventas.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR:  'bg-slate-100 text-slate-600',
  ENVIADA:   'bg-blue-100 text-blue-700',
  ACEPTADA:  'bg-green-100 text-green-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  VENCIDA:   'bg-amber-100 text-amber-700',
  FACTURADA: 'bg-indigo-100 text-indigo-700',
}

export function Cotizaciones() {
  const qc = useQueryClient()
  const [estado, setEstado] = useState('')
  const [clienteQ, setClienteQ] = useState('')

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', { estado: estado || undefined }],
    queryFn: () => getCotizaciones({ estado: estado || undefined }),
  })

  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => getClientes() })

  const mutEstado = useMutation({
    mutationFn: ({ id, e }: { id: number; e: string }) => cambiarEstadoCotizacion(id, e),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
  })

  const lista = (cotizaciones as any[]).filter(c => {
    if (!clienteQ) return true
    return c.cliente?.nombre?.toLowerCase().includes(clienteQ.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cotizaciones</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(cotizaciones as any[]).length} registro(s)</p>
        </div>
        <Link to="/ventas/cotizaciones/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Nueva cotización
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={clienteQ} onChange={e => setClienteQ(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-52" />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="">Todos los estados</option>
          {['BORRADOR','ENVIADA','ACEPTADA','RECHAZADA','VENCIDA','FACTURADA'].map(e =>
            <option key={e} value={e}>{e}</option>
          )}
        </select>
        <span className="ml-auto text-xs text-slate-400">{lista.length} resultado(s)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && <p className="text-center py-16 text-slate-400">Cargando...</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                  {['Número','Cliente','Fecha','Vence','Total','Estado','Acciones'].map(h =>
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lista.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                      <Link to={`/ventas/cotizaciones/${c.id}`} className="hover:text-indigo-600">
                        {c.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-xs">{c.cliente?.nombre}</p>
                      <p className="text-xs text-slate-400">{c.cliente?.tipoDocumento} {c.cliente?.numeroDocumento}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.fecha ? new Date(c.fecha).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">
                      {fmt(Number(c.total ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLOR[c.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/ventas/cotizaciones/${c.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Ver
                        </Link>
                        {c.estado === 'BORRADOR' && (
                          <button
                            onClick={() => mutEstado.mutate({ id: c.id, e: 'ENVIADA' })}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            <RefreshCw size={11} /> Enviar
                          </button>
                        )}
                        {c.estado === 'ENVIADA' && (
                          <>
                            <button onClick={() => mutEstado.mutate({ id: c.id, e: 'ACEPTADA' })}
                              className="text-xs text-green-600 hover:text-green-800 font-medium">Aceptar</button>
                            <button onClick={() => mutEstado.mutate({ id: c.id, e: 'RECHAZADA' })}
                              className="text-xs text-red-500 hover:text-red-700 font-medium">Rechazar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                    No hay cotizaciones. Crea la primera.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
