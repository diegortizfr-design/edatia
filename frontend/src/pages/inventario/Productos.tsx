import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProductos, updateProducto } from '../../services/inventario.service'
import { Plus, Search, Package, ChevronRight } from 'lucide-react'

const IVA_LABELS: Record<string, string> = {
  EXENTO: 'Exento', EXCLUIDO: 'Excluido',
  GRAVADO_5: 'IVA 5%', GRAVADO_19: 'IVA 19%',
}

const ABC_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-slate-100 text-slate-600',
}

function StockBadge({ stock }: { stock?: any[] }) {
  if (!stock || stock.length === 0) return <span className="text-xs text-slate-400">Sin stock</span>
  const total = stock.reduce((acc, s) => acc + parseFloat(s.cantidad ?? 0), 0)
  const color = total <= 0 ? 'bg-red-100 text-red-700' : total < 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{total.toFixed(0)} und</span>
}

export function Productos() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [activo, setActivo] = useState<boolean | undefined>(true)

  const { data = [], isLoading } = useQuery({
    queryKey: ['productos', q, activo],
    queryFn: () => getProductos({ q: q || undefined, activo }),
  })

  const toggleActivo = useMutation({
    mutationFn: ({ id, val }: { id: number; val: boolean }) => updateProducto(id, { activo: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  })

  const filteredData = data.filter(p =>
    !q || p.nombre.toLowerCase().includes(q.toLowerCase()) ||
    p.sku.toLowerCase().includes(q.toLowerCase()) ||
    (p.codigoBarras ?? '').includes(q)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
          <p className="text-slate-500 text-sm">{data.length} productos</p>
        </div>
        <Link to="/inventario/productos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={activo === undefined ? '' : String(activo)}
          onChange={e => setActivo(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Cargando...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400">No hay productos{q ? ` para "${q}"` : ''}</p>
            <Link to="/inventario/productos/nuevo" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
              <Plus size={14} /> Crear primer producto
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">IVA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">CPP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">ABC</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.sku}{p.codigoBarras ? ` · ${p.codigoBarras}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{p.categoria?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">{IVA_LABELS[p.tipoIva] ?? p.tipoIva}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(p.costoPromedio))}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(p.precioBase))}
                  </td>
                  <td className="px-4 py-3 text-center"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {p.claseAbc ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ABC_COLORS[p.claseAbc] ?? ''}`}>{p.claseAbc}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/inventario/productos/${p.id}`}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                      Editar <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
