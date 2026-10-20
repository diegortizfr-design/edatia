import { useState } from 'react'
import { Plus, Search, Users, Pencil, Trash2, Phone, Mail, UserCheck, CreditCard, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClientes, deleteCliente } from '../../services/ventas.service'
import toast, { Toaster } from 'react-hot-toast'
import { getApiError } from '../../services/api'

const REGIMEN_CONFIG: Record<string, { label: string; color: string }> = {
  '48': { label: 'Resp. IVA (48)', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  '49': { label: 'No Resp. (49)',  color: 'bg-slate-100 text-slate-700 border border-slate-200' },
}

function RegimenBadge({ regimen }: { regimen?: string }) {
  const cfg = regimen ? (REGIMEN_CONFIG[regimen] ?? { label: `Régimen ${regimen}`, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' }) : null
  if (!cfg) return <span className="text-slate-400 text-xs">—</span>
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function Clientes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [q, setQ] = useState('')

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(),
  })

  const mutDelete = useMutation({
    mutationFn: (id: number) => deleteCliente(id),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['terceros-erp'] })
      toast.success(data?.mensaje || 'Cliente procesado correctamente')
    },
    onError: (err: any) => {
      toast.error(getApiError(err, 'No se pudo eliminar el cliente'))
    }
  })

  const handleDelete = (cliente: any) => {
    if (window.confirm(`¿Está seguro de que desea retirar a ${cliente.nombre} de los clientes? Si tiene documentos asociados, se mantendrán protegidos en el historial contable.`)) {
      mutDelete.mutate(cliente.id)
    }
  }

  const filtrados = (clientes as any[]).filter(c => {
    if (!q) return true
    const term = q.toLowerCase()
    return (
      (c.nombre || '').toLowerCase().includes(term) ||
      (c.numeroDocumento || '').includes(term) ||
      (c.nombreComercial || '').toLowerCase().includes(term) ||
      (c.telefono || '').includes(term) ||
      (c.municipio || '').toLowerCase().includes(term) ||
      (c.vendedorAsignado?.nombre || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Ventas</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Clientes</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Clientes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isLoading ? 'Cargando clientes...' : `${filtrados.length} clientes registrados`}
          </p>
        </div>
        <button
          onClick={() => navigate('/ventas/clientes/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-[0.98]">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, NIT/CC, teléfono o vendedor..."
            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
            Cargando base de datos de clientes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/75">
                  <th className="px-5 py-3.5 text-left font-bold">Cliente / Razón Social</th>
                  <th className="px-4 py-3.5 text-left font-bold">Identificación</th>
                  <th className="px-4 py-3.5 text-left font-bold">Contacto</th>
                  <th className="px-4 py-3.5 text-left font-bold">Ubicación</th>
                  <th className="px-4 py-3.5 text-left font-bold">Vendedor Asignado</th>
                  <th className="px-4 py-3.5 text-left font-bold">Crédito</th>
                  <th className="px-4 py-3.5 text-left font-bold">Régimen DIAN</th>
                  <th className="px-4 py-3.5 text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nombre y Nombre Comercial */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-xs">{c.nombre}</p>
                      {c.nombreComercial && c.nombreComercial !== c.nombre && (
                        <p className="text-[10px] text-slate-400 font-medium">{c.nombreComercial}</p>
                      )}
                      {c.sucursales && c.sucursales.length > 0 && (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {c.sucursales.length} {c.sucursales.length === 1 ? 'sucursal' : 'sucursales'}
                        </span>
                      )}
                    </td>

                    {/* Documento */}
                    <td className="px-4 py-4 text-slate-700 text-xs font-mono font-medium">
                      {c.tipoDocumento} {c.numeroDocumento}
                      {c.digitoVerificacion ? `-${c.digitoVerificacion}` : ''}
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-4 text-xs">
                      <div className="space-y-0.5">
                        {(c.telefono || c.celular) && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Phone size={12} className="text-slate-400" />
                            {c.telefono || c.celular}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                        {!c.telefono && !c.celular && !c.email && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Ciudad */}
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{c.municipio || '—'}</span>
                      </div>
                      {c.direccion && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">{c.direccion}</p>
                      )}
                    </td>

                    {/* Vendedor Asignado */}
                    <td className="px-4 py-4 text-xs">
                      {c.vendedorAsignado ? (
                        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                          <UserCheck size={13} className="text-indigo-500" />
                          <span>{c.vendedorAsignado.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Crédito */}
                    <td className="px-4 py-4 text-xs">
                      {c.cupoCredito && Number(c.cupoCredito) > 0 ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-[11px] font-mono">
                            ${Number(c.cupoCredito).toLocaleString('es-CO')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {c.plazoCredito ? `${c.plazoCredito} días` : 'Contado'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Contado</span>
                      )}
                    </td>

                    {/* Régimen DIAN */}
                    <td className="px-4 py-4">
                      <RegimenBadge regimen={c.regimenFiscal} />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/ventas/clientes/${c.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar ficha completa de cliente">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar o desactivar cliente de forma segura">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <Users size={48} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500 font-medium">No se encontraron clientes registrados.</p>
                      <button 
                        onClick={() => navigate('/ventas/clientes/nuevo')}
                        className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors inline-block"
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

export default Clientes
