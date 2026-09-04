import React from 'react'
import { Sparkles, ArrowRight, ShieldCheck, Truck, HeartHandshake, Baby, Heart } from 'lucide-react'

interface HeroBannerProps {
  onSelectCategory: (category: string) => void
}

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  return (
    <div className="bg-gradient-to-b from-sky-50/70 via-white to-slate-50/50 border-b border-slate-100 py-5 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile-First Header Highlight */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/80 text-sky-800 text-[11px] font-extrabold uppercase tracking-wider">
            <span>✨ Todo para tu bebé en un solo lugar</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bienvenido a <span className="text-sky-500">Baby-World</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Pañales de las mejores marcas, juguetes didácticos para estimulación y hermosas variedades para consentir a tu pequeño.
          </p>
        </div>

        {/* 3 Quick Category Access Cards (Touch-Friendly on Mobile) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
          {/* 1. Pañalera */}
          <button
            onClick={() => onSelectCategory('Pañalera')}
            className="group p-3 sm:p-4 bg-white rounded-2xl border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform">
              🍼
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              Pañalera
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline-block">Pañales & Cuidado</span>
          </button>

          {/* 2. Juguetería */}
          <button
            onClick={() => onSelectCategory('Juguetería')}
            className="group p-3 sm:p-4 bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform">
              🧸
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
              Juguetería
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline-block">Estimulación</span>
          </button>

          {/* 3. Variedades */}
          <button
            onClick={() => onSelectCategory('Variedades')}
            className="group p-3 sm:p-4 bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all flex flex-col items-center text-center active:scale-95"
          >
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform">
              🎀
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
              Variedades
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline-block">Ropa & Accesorios</span>
          </button>
        </div>

        {/* Quick Micro Trust Badges */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 mt-5 pt-4 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Truck size={14} className="text-sky-500 shrink-0" />
            <span>Envíos rápidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HeartHandshake size={14} className="text-pink-500 shrink-0" />
            <span>Paga contra entrega</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>100% Garantizado</span>
          </div>
        </div>
      </div>
    </div>
  )
}
