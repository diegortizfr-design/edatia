import React, { useEffect } from 'react'
import { X } from 'lucide-react'

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
  imageUrl = '/anuncio-black-friday.webp?v=7'
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
      {/* Backdrop con desenfoque suave (clic afuera para cerrar) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity cursor-pointer"
        aria-hidden="true"
        title="Haz clic afuera para cerrar"
      />

      {/* Contenedor del Modal: solo la imagen con bordes redondeados y sombra elegante */}
      <div 
        className="relative max-w-[340px] sm:max-w-[420px] w-full rounded-[2rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-white/20 bg-transparent z-10 animate-in zoom-in-95 duration-300 group select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Anuncio promocional Black Friday"
      >
        {/* Botón flotante para cerrar (X visible y fácil de tocar) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Cerrar anuncio"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white flex items-center justify-center shadow-lg border border-white/40 backdrop-blur-md transition-all hover:scale-110 active:scale-90 cursor-pointer"
          title="Cerrar"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Imagen del anuncio clicable (clic para ir a Juguetería) */}
        <div 
          onClick={onAction}
          className="cursor-pointer overflow-hidden block"
          title="Toca la imagen para ver las ofertas de Juguetería"
        >
          <img
            src={imageUrl}
            alt="Black Friday Hasta 60% DTO en Juguetería | Pañalera Baby World"
            className="w-full h-auto block object-contain transition-transform duration-300 group-hover:scale-[1.015]"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}
