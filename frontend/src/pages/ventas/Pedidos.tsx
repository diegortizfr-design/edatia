import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, Search, RefreshCw, FileCheck, Ban } from 'lucide-react'
import { getPedidos, cambiarEstadoPedido, getClientes } from '../../services/ventas.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR:  'bg-slate-100 text-slate-600 border border-slate-200',
  APROBADO:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  FACTURADO: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  ANULADO:   'bg-rose-100 text-rose-700 border border-rose-200',
}

export function Pedidos() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('')
  const [clienteQ, setClienteQ] = useState('')

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos', { estado: estado || undefined }],
    queryFn: () => getPedidos({ estado: estado || undefined }),
  })

  const mutEstado = useMutation({
    mutationFn: ({ id, e }: { id: number; e: string }) => cambiarEstadoPedido(id, e),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  })

  const lista = (pedidos as any[]).filter(c => {
    if (!clienteQ) return true
    return c.cliente?.nombre?.toLowerCase().includes(clienteQ.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos y Prefacturas</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(pedidos as any[]).length} registro(s)</p>
        </div>
        <Link to="/ventas/pedidos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors shadow-sm">
          <Plus size={16} /> Nuevo Pedido (Pre-factura)
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={clienteQ} onChange={e => setClienteQ(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 w-52 transition-all" />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white">
          <option value="">Todos los estados</option>
          {['BORRADOR','APROBADO','FACTURADO','ANULADO'].map(e =>
            <option key={e} value={e}>{e}</option>
          )}
        </select>
        <span className="ml-auto text-xs text-slate-400">{lista.length} resultado(s)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw size={24} className="animate-spin mb-2" />
            <span>Cargando pedidos...</span>
          </div>
        )}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                  {['Número','Cliente','Fecha','Bodega','Total','Estado','Acciones'].map(h =>
                    <th key={h} className="px-4 py-3.5 text-left font-semibold">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">
                      <Link to={`/ventas/pedidos/${c.id}`} className="hover:text-pink-600 transition-colors">
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
                      Bodega {c.bodegaId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">
                      {fmt(Number(c.total ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ESTADO_COLOR[c.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/ventas/pedidos/${c.id}`}
                          className="text-xs text-slate-600 hover:text-pink-600 font-medium">
                          {c.estado === 'BORRADOR' ? 'Editar' : 'Ver'}
                        </Link>
                        {c.estado === 'BORRADOR' && (
                          <button
                            onClick={() => mutEstado.mutate({ id: c.id, e: 'APROBADO' })}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                            <FileCheck size={12} /> Aprobar
                          </button>
                        )}
                        {c.estado === 'APROBADO' && (
                          <button
                            onClick={() => navigate(`/ventas/facturas/nueva?pedidoId=${c.id}`)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            <FileText size={12} /> Facturar
                          </button>
                        )}
                        {(c.estado === 'BORRADOR' || c.estado === 'APROBADO') && (
                          <button
                            onClick={() => {
                              if (confirm('¿Está seguro de anular esta prefactura / pedido?')) {
                                mutEstado.mutate({ id: c.id, e: 'ANULADO' })
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium">
                            <Ban size={12} /> Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                      <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                      No se encontraron pedidos. Crea uno nuevo para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
