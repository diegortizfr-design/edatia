import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Truck, Pencil, Trash2, Phone, Mail, Clock, CreditCard, MapPin } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProveedores, deleteProveedor } from '../../services/inventario.service'
import toast, { Toaster } from 'react-hot-toast'
import { getApiError } from '../../services/api'

export function Proveedores() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [q, setQ] = useState('')

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => getProveedores(),
  })

  const mutDelete = useMutation({
    mutationFn: (id: number) => deleteProveedor(id),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      qc.invalidateQueries({ queryKey: ['terceros-erp'] })
      toast.success(data?.mensaje || 'Proveedor procesado correctamente')
    },
    onError: (err: any) => {
      toast.error(getApiError(err, 'No se pudo eliminar el proveedor'))
    }
  })

  const handleDelete = (proveedor: any) => {
    if (window.confirm(`¿Está seguro de que desea retirar a ${proveedor.nombre} de los proveedores? Si tiene órdenes de compra o facturas asociadas, se mantendrán protegidas en el historial contable.`)) {
      mutDelete.mutate(proveedor.id)
    }
  }

  const filtrados = (proveedores as any[]).filter(p => {
    if (!q) return true
    const term = q.toLowerCase()
    return (
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.numeroDocumento || '').includes(term) ||
      (p.nombreComercial || '').toLowerCase().includes(term) ||
      (p.contactoNombre || '').toLowerCase().includes(term) ||
      (p.telefono || '').includes(term) ||
      (p.ciudad || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Inventario</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Proveedores</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Truck size={24} className="text-indigo-600" />
            Proveedores
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isLoading ? 'Cargando proveedores...' : `${filtrados.length} proveedores registrados`}
          </p>
        </div>
        <button
          onClick={() => navigate('/inventario/proveedores/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
        >
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, NIT, contacto o teléfono..."
            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs w-full outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
            Cargando base de datos de proveedores...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/75">
                  <th className="px-5 py-3.5 text-left font-bold">Proveedor / Razón Social</th>
                  <th className="px-4 py-3.5 text-left font-bold">Identificación</th>
                  <th className="px-4 py-3.5 text-left font-bold">Contacto Principal</th>
                  <th className="px-4 py-3.5 text-left font-bold">Ubicación</th>
                  <th className="px-4 py-3.5 text-left font-bold">Condiciones de Pago</th>
                  <th className="px-4 py-3.5 text-left font-bold">Tiempo Entrega</th>
                  <th className="px-4 py-3.5 text-center font-bold">Estado</th>
                  <th className="px-4 py-3.5 text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                          <Truck size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{p.nombre}</p>
                          {p.nombreComercial && p.nombreComercial !== p.nombre && (
                            <p className="text-[10px] text-slate-400 font-medium">{p.nombreComercial}</p>
                          )}
                          {p.sucursales && p.sucursales.length > 0 && (
                            <span className="inline-block mt-1 text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              {p.sucursales.length} {p.sucursales.length === 1 ? 'sucursal' : 'sucursales'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Identificación */}
                    <td className="px-4 py-4 text-slate-700 text-xs font-mono font-medium">
                      {p.tipoDocumento || 'NIT'} {p.numeroDocumento || '—'}
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-4 text-xs">
                      <div className="space-y-0.5">
                        {p.contactoNombre && (
                          <p className="font-semibold text-slate-700 text-[11px]">{p.contactoNombre}</p>
                        )}
                        {(p.telefono) && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Phone size={11} className="text-slate-400" />
                            {p.telefono}
                          </div>
                        )}
                        {p.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </div>
                        )}
                        {!p.contactoNombre && !p.telefono && !p.email && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{p.ciudad || '—'}</span>
                      </div>
                      {p.direccion && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">{p.direccion}</p>
                      )}
                    </td>

                    {/* Condiciones de Pago */}
                    <td className="px-4 py-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <CreditCard size={12} className="text-slate-400" />
                          {p.condicionesPago || 'CONTADO'}
                        </span>
                        {p.descuentoBase !== undefined && Number(p.descuentoBase) > 0 && (
                          <p className="text-[10px] text-emerald-600 font-medium">Dcto: {Number(p.descuentoBase)}%</p>
                        )}
                      </div>
                    </td>

                    {/* Plazo Entrega */}
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {p.plazoEntregaDias ? (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Clock size={12} className="text-slate-400" />
                          <span>{p.plazoEntregaDias} días</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Inmediato</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/inventario/proveedores/${p.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar ficha completa de proveedor"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar o desactivar proveedor de forma segura"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <Truck size={48} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500 font-medium">No se encontraron proveedores registrados.</p>
                      <button 
                        onClick={() => navigate('/inventario/proveedores/nuevo')}
                        className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors inline-block"
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

export default Proveedores
