import { Settings, Globe, Palette, Share2, Phone } from 'lucide-react'

export function ConfigTienda() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ajustes de Tienda Virtual</h1>
        <p className="text-slate-500 text-sm">Personaliza el branding, enlaces y contacto de tu presencia online.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branding */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
            <Palette size={18} />
            Branding y Estilo
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color Primario</label>
            <div className="flex gap-2">
              <input type="color" className="h-10 w-10 rounded border border-slate-200 cursor-pointer" defaultValue="#4F46E5" />
              <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue="#4F46E5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slogan de la Tienda</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ej: Calidad y estilo en cada paso" />
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
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="+57 300 000 0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram (URL)</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="https://instagram.com/tu_tienda" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}
