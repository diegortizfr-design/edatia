import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Download, Send, XCircle, FileText } from 'lucide-react'
import {
  getFacturas, emitirFactura, anularFactura,
} from '../../services/ventas.service'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.edatia.com/api/v1'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  EMITIDA:  { label: 'Emitida',  color: 'bg-blue-100 text-blue-700' },
  PAGADA:   { label: 'Pagada',   color: 'bg-green-100 text-green-700' },
  PARCIAL:  { label: 'Parcial',  color: 'bg-yellow-100 text-yellow-700' },
  ANULADA:  { label: 'Anulada',  color: 'bg-red-100 text-red-700' },
}

const DIAN_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: 'bg-slate-100 text-slate-600' },
  GENERADA:   { label: 'Generada',   color: 'bg-blue-100 text-blue-700' },
  ACEPTADA:   { label: 'Aceptada',   color: 'bg-green-100 text-green-700' },
  RECHAZADA:  { label: 'Rechazada',  color: 'bg-red-100 text-red-700' },
}

function Badge({ value, config }: { value: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[value] ?? { label: value, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function Facturas() {
  const qc = useQueryClient()
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas', estado, desde, hasta],
    queryFn: () => getFacturas({
      estado: estado || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    }),
  })

  const mutEmitir = useMutation({
    mutationFn: (id: number) => emitirFactura(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facturas'] }),
  })

  const mutAnular = useMutation({
    mutationFn: (id: number) => anularFactura(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facturas'] }),
  })

  const exportCSV = () => {
    const rows = (facturas as any[]).map((f: any) => [
      `${f.prefijo ?? ''}${f.numero}`,
      f.cliente?.nombre ?? '',
      f.fecha ?? '',
      f.fechaVencimiento ?? '',
      f.total ?? 0,
      f.saldo ?? 0,
      f.estado ?? '',
      f.estadoDIAN ?? '',
    ])
    const header = ['Número', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Saldo', 'Estado', 'Estado DIAN']
    const csv = [header, ...rows].map(r => r.map(String).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = 'facturas.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturas de Venta</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(facturas as any[]).length} factura(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            <Download size={14} /> Exportar CSV
          </button>
          <Link to="/ventas/facturas/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Nueva factura
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <select value={estado} onChange={e => setEstado(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        {(estado || desde || hasta) && (
          <button onClick={() => { setEstado(''); setDesde(''); setHasta('') }}
            className="text-xs text-slate-500 hover:text-red-600 underline">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{(facturas as any[]).length} resultado(s)</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-16 text-slate-400">Cargando facturas...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Número', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Saldo', 'Estado', 'DIAN', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(facturas as any[]).map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">
                      {f.prefijo}{f.numero}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[140px] truncate">
                      {f.cliente?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {f.fecha ? new Date(f.fecha).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {fmt(Number(f.total ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {fmt(Number(f.saldo ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={f.estado} config={ESTADO_CONFIG} />
                    </td>
                    <td className="px-4 py-3">
                      {f.estadoDIAN ? <Badge value={f.estadoDIAN} config={DIAN_CONFIG} /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {f.estado === 'BORRADOR' && (
                          <button
                            onClick={() => mutEmitir.mutate(f.id)}
                            disabled={mutEmitir.isPending}
                            title="Emitir factura"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">
                            <Send size={12} /> Emitir
                          </button>
                        )}
                        {f.cufe && (
                          <button
                            onClick={() => window.open(API_URL + `/ventas/facturas/${f.id}/xml`, '_blank')}
                            title="Descargar XML"
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600">
                            <Download size={12} /> XML
                          </button>
                        )}
                        {f.estado !== 'ANULADA' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Anular la factura ${f.prefijo ?? ''}${f.numero}? Esta acción no se puede deshacer.`)) {
                                mutAnular.mutate(f.id)
                              }
                            }}
                            disabled={mutAnular.isPending}
                            title="Anular factura"
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                            <XCircle size={12} /> Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(facturas as any[]).length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400">No hay facturas con los filtros seleccionados</p>
                      <Link to="/ventas/facturas/nueva"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                        <Plus size={14} /> Crear primera factura
                      </Link>
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
