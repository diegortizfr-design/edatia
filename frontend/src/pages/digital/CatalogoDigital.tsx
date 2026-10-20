import { useState, useEffect, useMemo } from 'react'
import { Package, Search, Globe, Eye, Loader2, Save, EyeOff, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, { getMediaUrl } from '../../services/api'
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
  activo?: boolean;
  categoria?: { id: number; nombre: string };
}

export function CatalogoDigital() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<ProductoWeb[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const handlePreview = (p: ProductoWeb) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const storeUrl = isLocal ? 'http://localhost:5173' : 'https://distribuidorababyworld.edatia.com'
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
      toast.success(currentStatus ? 'Producto retirado de la tienda virtual (solo inventario ERP)' : '¡Producto publicado exitosamente en la tienda virtual!')
    } catch (error) {
      toast.error('No se pudo actualizar el estado del producto')
    }
  }

  const publishedCount = useMemo(() => productos.filter(p => p.publicadoWeb).length, [productos])
  const hiddenCount = useMemo(() => productos.filter(p => !p.publicadoWeb).length, [productos])

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all' || (filter === 'published' && p.publicadoWeb) || (filter === 'hidden' && !p.publicadoWeb)
      return matchesSearch && matchesFilter
    })
  }, [productos, search, filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="text-indigo-600" size={24} />
            Catálogo y Vitrina Virtual
          </h1>
          <p className="text-slate-500 text-sm">Gestiona cuáles productos de tu inventario están visibles en la tienda de Baby World y cuáles permanecen exclusivamente en ERP.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePreview({} as any)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
            title="Abrir tienda virtual pública de Baby World"
          >
            <ExternalLink size={15} />
            Ver Tienda Baby World
          </button>
          <button 
            onClick={fetchProductos}
            className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors"
            title="Refrescar catálogo"
          >
            <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Productos</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">{productos.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">En el catálogo general de inventario</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter(prev => prev === 'published' ? 'all' : 'published')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filter === 'published'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/30 shadow-sm'
              : 'bg-white border-slate-200/80 hover:bg-emerald-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Publicados en Tienda Web
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{publishedCount}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">
            {filter === 'published' ? 'Mostrando solo publicados' : 'Visibles para clientes en Baby World (Clic para filtrar)'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter(prev => prev === 'hidden' ? 'all' : 'hidden')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filter === 'hidden'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/30 shadow-sm'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">No Publicados (Solo Inventario)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <EyeOff size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 tracking-tight">{hiddenCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filter === 'hidden' ? 'Mostrando solo ocultos' : 'Guardados en ERP, ocultos en la tienda (Clic para filtrar)'}
          </p>
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
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs" 
          />
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs cursor-pointer text-slate-700"
        >
          <option value="all">🌐 Todos los productos ({productos.length})</option>
          <option value="published">✅ Solo publicados en tienda ({publishedCount})</option>
          <option value="hidden">⚪ No publicados / Solo Inventario ({hiddenCount})</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio ERP</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio Web</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado en Tienda</th>
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
                              src={getMediaUrl(p.imagen)} 
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
                      <div className="flex flex-col items-center gap-1.5">
                        <button 
                          onClick={() => handleToggle(p.id, p.publicadoWeb)}
                          className={`
                            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                            ${p.publicadoWeb ? 'bg-emerald-600' : 'bg-slate-300'}
                          `}
                          title={p.publicadoWeb ? "Publicado en Baby World. Clic para ocultar y dejar solo en ERP" : "Oculto en Baby World. Clic para publicar en tienda"}
                        >
                          <span className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${p.publicadoWeb ? 'translate-x-5' : 'translate-x-0'}
                          `} />
                        </button>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          p.publicadoWeb 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {p.publicadoWeb ? <Globe size={10} className="text-emerald-600" /> : <EyeOff size={10} className="text-slate-400" />}
                          {p.publicadoWeb ? 'Publicado' : 'No publicado'}
                        </span>
                      </div>
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
