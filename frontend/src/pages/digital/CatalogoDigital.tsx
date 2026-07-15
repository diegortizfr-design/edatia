import { useState, useEffect, useMemo } from 'react'
import { Package, Search, Globe, Eye, Loader2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface ProductoWeb {
  id: number;
  nombre: string;
  sku: string;
  precioBase: number;
  precioWeb: number | null;
  publicadoWeb: boolean;
  slug: string | null;
  imagen: string | null;
}

const getImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.edatia.com';
  return `${BASE_URL}${url}`;
};

export function CatalogoDigital() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<ProductoWeb[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const handlePreview = (p: ProductoWeb) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const storeUrl = isLocal ? 'http://localhost:5173' : 'https://glowxir.edatia.com'
    window.open(storeUrl, '_blank')
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/digital/productos')
      setProductos(res.data)
    } catch (error) {
      toast.error('Error al cargar productos del catálogo')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/digital/productos/${id}/toggle`, { publicado: !currentStatus })
      setProductos(prev => prev.map(p => p.id === id ? { ...p, publicadoWeb: !currentStatus } : p))
      toast.success(currentStatus ? 'Producto retirado de la web' : 'Producto publicado en la web')
    } catch (error) {
      toast.error('No se pudo actualizar el estado del producto')
    }
  }

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all' || (filter === 'published' && p.publicadoWeb) || (filter === 'hidden' && !p.publicadoWeb)
      return matchesSearch && matchesFilter
    })
  }, [productos, search, filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo Web</h1>
          <p className="text-slate-500 text-sm">Gestiona qué productos del inventario se muestran en tu tienda virtual.</p>
        </div>
        <button 
          onClick={fetchProductos}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          title="Refrescar catálogo"
        >
          <Loader2 size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Todos los productos</option>
          <option value="published">Solo publicados</option>
          <option value="hidden">No publicados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio ERP</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio Web</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado Web</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <Loader2 size={32} className="mx-auto animate-spin mb-2" />
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <Package size={40} className="mx-auto text-slate-200 mb-2" />
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                          {p.imagen ? (
                            <img 
                              src={getImageUrl(p.imagen)} 
                              alt={p.nombre} 
                              className="w-full h-full object-contain p-0.5" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100'
                              }}
                            />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{p.nombre}</p>
                          <p className="text-[10px] font-mono text-slate-400">{p.sku || 'SIN SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      ${Number(p.precioBase).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-indigo-600 font-bold">
                        ${Number(p.precioWeb || p.precioBase).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggle(p.id, p.publicadoWeb)}
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                          ${p.publicadoWeb ? 'bg-indigo-600' : 'bg-slate-200'}
                        `}
                      >
                        <span className={`
                          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${p.publicadoWeb ? 'translate-x-5' : 'translate-x-0'}
                        `} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handlePreview(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Vista Previa en Tienda"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/configuracion/productos/${p.id}/detalle?tab=web`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar detalles web"
                        >
                          <Globe size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
