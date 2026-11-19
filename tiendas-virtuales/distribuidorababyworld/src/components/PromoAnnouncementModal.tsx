import React, { useEffect } from 'react'
import { X, ArrowRight, Sparkles } from 'lucide-react'

interface PromoAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onAction: () => void
  imageUrl?: string
}

export function PromoAnnouncementModal({
  isOpen,
  onClose,
  onAction,
  imageUrl = '/anuncio-black-days.jpg'
}: PromoAnnouncementModalProps) {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop con desenfoque suave */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Contenedor del Modal */}
      <div 
        className="relative max-w-[340px] sm:max-w-[400px] w-full rounded-[2rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-2 border-white/20 bg-slate-950 z-10 animate-in zoom-in-95 duration-300 flex flex-col group"
        role="dialog"
        aria-modal="true"
        aria-label="Anuncio promocional Black Days"
      >
        {/* Botón flotante para cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar anuncio"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Imagen del anuncio clicable */}
        <div 
          onClick={onAction}
          className="relative cursor-pointer overflow-hidden select-none"
          title="Toca para ver las ofertas de Juguetería"
        >
          <img
            src={imageUrl}
            alt="Black Days Hasta 60% DTO en Juguetería | Pañalera Baby World"
            className="w-full h-auto block object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            loading="eager"
            decoding="async"
          />

          {/* Brillo dinámico sutil al hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Barra de acción inferior con botón temático Dorado / Black */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-amber-500/20 text-center space-y-1.5">
          <button
            type="button"
            onClick={onAction}
            className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="text-slate-900 shrink-0" />
            <span>¡Ver Ofertas en Juguetería!</span>
            <ArrowRight size={16} strokeWidth={3} className="shrink-0" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer pt-0.5"
          >
            Continuar en la tienda
          </button>
        </div>
      </div>
    </div>
  )
}
