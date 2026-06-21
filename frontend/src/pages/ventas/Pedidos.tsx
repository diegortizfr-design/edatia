import { ClipboardList, HardHat } from 'lucide-react'

export function Pedidos() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 flex items-center justify-center rounded-2xl border border-amber-100 animate-pulse">
          <HardHat size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Submódulo en Construcción</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            La sección de gestión de pedidos y pre-facturación se encuentra actualmente en desarrollo y no es prioritaria.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ClipboardList size={14} />
          <span>Módulo de Ventas · Edatia ERP</span>
        </div>
      </div>
    </div>
  )
}
