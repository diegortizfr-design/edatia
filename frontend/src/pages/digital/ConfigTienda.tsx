import { useState, useEffect } from 'react'
import { Settings, Globe, Palette, Share2, Phone, Save, Loader2, Link2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface TiendaConfig {
  nombreTienda: string;
  slugTienda: string;
  dominioPropio?: string;
  colorPrimario: string;
  whatsappVentas: string;
  instagramUrl: string;
  facebookUrl: string;
}

export function ConfigTienda() {
  const [config, setConfig] = useState<TiendaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get('/digital/config')
      setConfig(res.data)
    } catch (error) {
      toast.error('No se pudo cargar la configuración de la tienda')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    try {
      setSaving(true)
      await api.patch('/digital/config', config)
      toast.success('Configuración guardada correctamente')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p>Cargando ajustes de la tienda...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ajustes de Tienda Virtual</h1>
          <p className="text-slate-500 text-sm">Personaliza el branding, enlaces y contacto de tu presencia online.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium">
          <Globe size={14} />
          {`edatia.com/t/${config?.slugTienda}`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branding */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
            <Palette size={18} />
            Branding y Estilo
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Identificador de la Tienda (Slug / URL) *</label>
            <input 
              type="text" 
              value={config?.slugTienda || ''}
              onChange={(e) => {
                const cleanSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                setConfig(prev => prev ? {...prev, slugTienda: cleanSlug} : null)
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="ej: glowxir" 
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Define tu URL de acceso (ej: glowxir.edatia.com o edatia.com/t/glowxir). Solo minúsculas, números y guiones.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dominio Personalizado (Opcional)</label>
            <input 
              type="text" 
              value={config?.dominioPropio || ''}
              onChange={(e) => {
                const cleanDom = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')
                setConfig(prev => prev ? {...prev, dominioPropio: cleanDom} : null)
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="ej: glowxir.com" 
            />
            <p className="text-[10px] text-slate-400 mt-1">Si posees un dominio propio, ingrésalo aquí y apunta tu CNAME o registro A en tu proveedor DNS a la IP del ERP.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Tienda</label>
            <input 
              type="text" 
              value={config?.nombreTienda || ''}
              onChange={(e) => setConfig(prev => prev ? {...prev, nombreTienda: e.target.value} : null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Ej: Mi Boutique Digital" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color Primario</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={config?.colorPrimario || '#4F46E5'}
                onChange={(e) => setConfig(prev => prev ? {...prev, colorPrimario: e.target.value} : null)}
                className="h-10 w-10 rounded border border-slate-200 cursor-pointer p-1" 
              />
              <input 
                type="text" 
                value={config?.colorPrimario || ''}
                onChange={(e) => setConfig(prev => prev ? {...prev, colorPrimario: e.target.value} : null)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" 
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
            <Phone size={18} />
            Canales de Venta
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp de Pedidos</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={config?.whatsappVentas || ''}
                onChange={(e) => setConfig(prev => prev ? {...prev, whatsappVentas: e.target.value} : null)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="+57 300 000 0000" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram (Usuario o URL)</label>
            <div className="relative">
              <Share2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={config?.instagramUrl || ''}
                onChange={(e) => setConfig(prev => prev ? {...prev, instagramUrl: e.target.value} : null)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="ej: @mi_tienda" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* URL de la tienda */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-700 rounded-lg">
                <Link2 className="text-indigo-400" size={20} />
             </div>
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tu URL Pública</p>
                <p className="text-lg font-mono text-indigo-300">edatia.com/t/{config?.slugTienda}</p>
             </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`edatia.com/t/${config?.slugTienda}`)
              toast.success('URL copiada al portapapeles')
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors"
          >
            COPIAR LINK
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          type="submit"
          disabled={saving}
          className={`
            flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200
            ${saving ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
        </button>
      </div>
    </form>
  )
}
