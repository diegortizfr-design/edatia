import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Truck, ChevronRight, Phone, Mail } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getProveedores } from '../../services/inventario.service'

export function Proveedores() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => getProveedores(),
  })

  const filtrados = (proveedores as any[]).filter(p => {
    if (!q) return true
    return (
      p.nombre?.toLowerCase().includes(q.toLowerCase()) ||
      p.numeroDocumento?.includes(q) ||
      (p.nombreComercial || '').toLowerCase().includes(q.toLowerCase())
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm">
            {isLoading ? 'Cargando...' : `${filtrados.length} proveedores registrados`}
          </p>
        </div>
        <button
          onClick={() => navigate('/configuracion/terceros/nuevo?role=proveedor')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, NIT..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            Cargando proveedores de la base de datos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proveedor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Condiciones</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">OC</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <Truck size={14} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{p.nombre}</p>
                          {p.nombreComercial && p.nombreComercial !== p.nombre && (
                            <p className="text-xs text-slate-400">{p.nombreComercial}</p>
                          )}
                          {p.numeroDocumento && (
                            <p className="text-xs text-slate-400 font-mono">{p.tipoDocumento} {p.numeroDocumento}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {p.email && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail size={11} /> {p.email}
                          </div>
                        )}
                        {p.telefono && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone size={11} /> {p.telefono}
                          </div>
                        )}
                        {!p.email && !p.telefono && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Pago: {p.condicionesPago || 'CONTADO'}</p>
                        {p.descuentoBase !== undefined && (
                          <p className="text-xs text-slate-500">Descuento: {Number(p.descuentoBase)}%</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-slate-700">0</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/configuracion/terceros/prov_${p.id}?role=proveedor`)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Editar <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Truck size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400">No hay proveedores registrados aún.</p>
                      <button 
                        onClick={() => navigate('/configuracion/terceros/nuevo?role=proveedor')}
                        className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Crear el primer proveedor
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

