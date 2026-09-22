import React from 'react'
import { ShieldCheck, Truck, Heart, MessageCircle } from 'lucide-react'

interface HeroBannerProps {
  onSelectCategory: (category: string) => void
}

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  return (
    <div className="relative bg-gradient-to-b from-pink-50/40 via-white to-amber-50/30 border-b border-slate-100 pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
      
      {/* Decoración Izquierda (Estrella) */}
      <div className="absolute left-[-2rem] md:left-4 lg:left-12 top-1/3 text-amber-200/60 hidden md:block animate-[pulse_4s_ease-in-out_infinite]">
        <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="rotate-12">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Decoración Derecha (Mascota como marca de agua) */}
      <div className="absolute right-[-4rem] md:right-0 lg:right-10 top-0 w-48 sm:w-64 lg:w-[22rem] hidden md:block pointer-events-none drop-shadow-xl z-10 opacity-25">
        <img src="/mascotas.png" alt="Baby World Mascotas" className="w-full h-full object-contain" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* Main Content */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-blush-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border border-blush-100 shadow-sm">
            <span>✨ Todo para tu bebé en un solo lugar</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex flex-col items-center">
            <span>Bienvenido a</span>
            <span className="font-baby font-normal tracking-wider text-6xl sm:text-8xl leading-none mt-1 sm:-mt-1"><span className="text-blush-300">Baby</span> <span className="text-baby-300">World</span></span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Pañales de las mejores marcas, juguetes didácticos para estimulación y hermosas variedades para consentir a tu pequeño.
          </p>

          {/* Botones CTA Principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-8">
            <button 
              onClick={() => {
                const el = document.getElementById('catalogo-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-blush-400 hover:bg-blush-500 text-white rounded-full font-bold shadow-lg shadow-blush-400/40 hover:-translate-y-1 transition-all active:scale-95 text-sm"
            >
              Ver catálogo
            </button>
            <a 
              href="https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-full font-bold shadow-md shadow-slate-200/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-100 text-sm"
            >
              <MessageCircle size={18} className="text-emerald-500 fill-emerald-50" />
              Pedir por WhatsApp
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-slate-500 font-medium pt-2">
            <div className="flex items-center gap-1.5">
              <Truck size={15} className="text-sky-400" />
              <span>Envíos rápidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={15} className="text-pink-400" />
              <span>Paga contra entrega</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>100% Garantizado</span>
            </div>
          </div>

        </div>

        {/* Quick Categories (Estilo más amplio y separado) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
          {/* 1. Pañales y Cuidado */}
          <button
            onClick={() => onSelectCategory('Pañales y Cuidado')}
            className="group p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-sky-100/50 hover:border-sky-200 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-sky-50 flex items-center justify-center text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform shadow-inner">
              🍼
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-sky-600 transition-colors">
              Pañales & Cuidado
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Pañales, cremas & aseo</span>
          </button>

          {/* 2. Juguetería */}
          <button
            onClick={() => onSelectCategory('Juguetería')}
            className="group p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-amber-100/50 hover:border-amber-200 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-50 flex items-center justify-center text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform shadow-inner">
              🧸
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-amber-500 transition-colors">
              Juguetería
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Estimulación temprana</span>
          </button>

          {/* 3. Variedades */}
          <button
            onClick={() => onSelectCategory('Variedades')}
            className="group p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-pink-100/50 hover:border-pink-200 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pink-50 flex items-center justify-center text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform shadow-inner">
              🎀
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-pink-500 transition-colors">
              Variedades
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Ropa & accesorios</span>
          </button>
        </div>
      </div>
    </div>
  )
}
