import { useState } from 'react'
import { Plus, Search, Users, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClientes } from '../../services/ventas.service'

const REGIMEN_CONFIG: Record<string, { label: string; color: string }> = {
  '48': { label: 'Resp. IVA', color: 'bg-green-100 text-green-700' },
  '49': { label: 'No Resp.',  color: 'bg-slate-100 text-slate-600' },
}

function RegimenBadge({ regimen }: { regimen?: string }) {
  const cfg = regimen ? (REGIMEN_CONFIG[regimen] ?? { label: regimen, color: 'bg-blue-100 text-blue-700' }) : null
  if (!cfg) return <span className="text-slate-400 text-xs">—</span>
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function Clientes() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(),
  })

  const filtrados = (clientes as any[]).filter(c => {
    if (!q) return true
    return (
      c.nombre?.toLowerCase().includes(q.toLowerCase()) ||
      c.numeroDocumento?.includes(q) ||
      (c.nombreComercial || '').toLowerCase().includes(q.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isLoading ? 'Cargando...' : `${filtrados.length} clientes registrados`}
          </p>
        </div>
        <button
          onClick={() => navigate('/configuracion/terceros/nuevo?role=cliente')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            Cargando clientes de la base de datos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                  {['Nombre', 'Documento', 'Ciudad / Municipio', 'Régimen', 'Email', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{c.nombre}</p>
                      {c.nombreComercial && c.nombreComercial !== c.nombre && (
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{c.nombreComercial}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                      {c.tipoDocumento} {c.numeroDocumento}
                      {c.digitoVerificacion ? `-${c.digitoVerificacion}` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {c.municipio || '—'}
                    </td>
                    <td className="px-6 py-4"><RegimenBadge regimen={c.regimenFiscal} /></td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{c.email || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/configuracion/terceros/cli_${c.id}?role=cliente`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver y Editar en Configuración">
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <Users size={48} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 font-medium">No hay clientes registrados aún.</p>
                      <button 
                        onClick={() => navigate('/configuracion/terceros/nuevo?role=cliente')}
                        className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Crear el primer cliente
                      </button>
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
