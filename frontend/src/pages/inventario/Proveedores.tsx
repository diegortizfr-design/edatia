import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProveedores } from '../../services/inventario.service'
import { Plus, Search, Truck, ChevronRight, Phone, Mail } from 'lucide-react'

export function Proveedores() {
  const [q, setQ] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['proveedores', q],
    queryFn: () => getProveedores(q || undefined),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm">{data.length} proveedores registrados</p>
        </div>
        <Link
          to="/inventario/proveedores/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Nuevo proveedor
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, NIT..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16">
          <Truck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">No hay proveedores{q ? ` para "${q}"` : ''}</p>
          <Link to="/inventario/proveedores/nuevo" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
            <Plus size={14} /> Crear primer proveedor
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
              {data.map(p => (
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
                          <p className="text-xs text-slate-400">{p.tipoDocumento} {p.numeroDocumento}</p>
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
                      {p.plazoEntregaDias && (
                        <p className="text-xs text-slate-500">Lead time: {p.plazoEntregaDias} días</p>
                      )}
                      {p.condicionesPago && (
                        <p className="text-xs text-slate-500">Pago: {p.condicionesPago}</p>
                      )}
                      {p.descuentoBase && (
                        <p className="text-xs text-slate-500">Dto: {p.descuentoBase}%</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-slate-700">{p._count?.ordenesCompra ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/inventario/proveedores/${p.id}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                      Editar <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
