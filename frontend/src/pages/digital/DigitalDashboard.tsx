import { LayoutDashboard, ShoppingBag, Settings, Globe } from 'lucide-react'

export function DigitalDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Módulo Digital</h1>
          <p className="text-slate-500 text-sm">Resumen de tu tienda virtual y presencia online.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Globe size={16} /> Ver mi tienda
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ventas Web (Hoy)', value: '$0', icon: <ShoppingBag className="text-indigo-600" /> },
          { label: 'Visitas Online', value: '0', icon: <Globe className="text-blue-600" /> },
          { label: 'Pedidos Pendientes', value: '0', icon: <LayoutDashboard className="text-amber-600" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+0%</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-20 text-center">
        <Globe size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Configuración Pendiente</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          Aún no has configurado tu tienda virtual. Empieza por el catálogo o ajusta tu branding.
        </p>
      </div>
    </div>
  )
}
