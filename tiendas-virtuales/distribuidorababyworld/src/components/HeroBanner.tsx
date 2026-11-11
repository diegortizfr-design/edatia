import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroBannerProps {
  onOpenFamiliaRegistro: () => void
}

export function HeroBanner({ onOpenFamiliaRegistro }: HeroBannerProps) {
  return (
    <section className="relative bg-gradient-to-b from-baby-50/50 via-blush-50/25 to-white border-b border-slate-100 pt-3 pb-4 sm:pt-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenFamiliaRegistro}
          className="group relative block w-full text-left rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white shadow-[0_10px_30px_-8px_rgba(14,165,233,0.22)] hover:shadow-[0_18px_42px_-10px_rgba(236,72,153,0.32)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 bg-gradient-to-r from-baby-100 to-blush-100 focus:outline-none focus:ring-4 focus:ring-blush-200 cursor-pointer"
          aria-label="Sé parte de la Familia Baby World. Registra tus datos y accede a muchos beneficios."
        >
          <img
            src="/banner-familia.jpg"
            alt="¡Sé parte de la Familia Baby World! Registra tus datos y accede a muchos beneficios. Regístrate aquí."
            className="w-full h-auto block select-none transition-transform duration-500 group-hover:scale-[1.015]"
            loading="eager"
            decoding="async"
          />

          {/* Barra táctil optimizada para pantallas pequeñas (móvil) */}
          <div className="sm:hidden bg-gradient-to-r from-baby-500 via-lavender-400 to-blush-500 text-white px-3.5 py-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight truncate">
              <Sparkles size={13} className="text-butter-200 shrink-0" />
              <span className="truncate">Toca aquí para registrarte y recibir beneficios</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0">
              <span>Ir</span>
              <ArrowRight size={11} />
            </span>
          </div>
        </button>
      </div>
    </section>
  )
}
