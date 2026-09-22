import React, { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface FloatingWhatsAppButtonProps {
  phone?: string
  defaultMessage?: string
}

export function FloatingWhatsAppButton({
  phone = '573023863380',
  defaultMessage = '¡Hola Distribuidora Baby-World! Deseo información sobre sus productos y envíos.'
}: FloatingWhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true)

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(defaultMessage)
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 select-none group">
      {/* Tooltip / Popup Badge */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-1.5 bg-white text-slate-800 text-xs font-bold py-1.5 px-3 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>¿Dudas? ¡Escríbenos al WhatsApp!</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowTooltip(false)
            }}
            className="text-slate-400 hover:text-slate-600 ml-1 p-0.5"
            aria-label="Cerrar tooltip"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={handleOpenWhatsApp}
        className="relative h-13 w-13 sm:h-14 sm:w-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_24px_rgba(37,211,102,0.55)] active:scale-90 transition-all duration-300 animate-bounce hover:animate-none"
        aria-label="Contactar por WhatsApp"
      >
        {/* Subtle Radar Wave */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping -z-10" />

        {/* WhatsApp Icon */}
        <MessageCircle size={28} className="fill-white stroke-[#25D366]" />

        {/* Online Green Dot Badge */}
        <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
      </button>
    </div>
  )
}
