import React, { useState } from 'react'
import { X } from 'lucide-react'
import { WhatsAppIcon } from './WhatsAppIcon'

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

      {/* Main Floating Button (El logo actúa como el botón flotante directo sin círculo verde redundante) */}
      <button
        onClick={handleOpenWhatsApp}
        className="relative group/btn focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 animate-bounce hover:animate-none"
        aria-label="Contactar por WhatsApp"
      >
        {/* Subtle Radar Wave */}
        <span className="absolute inset-1 rounded-full bg-[#28971B]/25 animate-ping -z-10" />

        {/* WhatsApp Badge Icon */}
        <WhatsAppIcon 
          size={54} 
          className="drop-shadow-[0_6px_16px_rgba(40,151,27,0.4)] group-hover/btn:drop-shadow-[0_10px_24px_rgba(40,151,27,0.6)] transition-all" 
        />

        {/* Online Green Dot Badge */}
        <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
      </button>
    </div>
  )
}
