import React from 'react'
import { Home, ShoppingBag, Baby, Sparkles, Heart } from 'lucide-react'

interface MobileBottomNavProps {
  activeCategory: string
  onSelectCategory: (category: string) => void
  cartCount: number
  onOpenCart: () => void
  onOpenWhatsApp: () => void
}

export function MobileBottomNav({
  activeCategory,
  onSelectCategory,
  cartCount,
  onOpenCart,
  onOpenWhatsApp,
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center justify-items-center">
        {/* 1. Inicio */}
        <button
          onClick={() => {
            onSelectCategory('Todos')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
            activeCategory === 'Todos' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeCategory === 'Todos' ? 'bg-sky-50' : ''}`}>
            <Home size={20} className={activeCategory === 'Todos' ? 'stroke-[2.5]' : 'stroke-2'} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Inicio</span>
        </button>

        {/* 2. Pañalera */}
        <button
          onClick={() => {
            onSelectCategory('Pañalera')
            const el = document.getElementById('catalogo-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
            activeCategory === 'Pañalera' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeCategory === 'Pañalera' ? 'bg-sky-50' : ''}`}>
            <Baby size={20} className={activeCategory === 'Pañalera' ? 'stroke-[2.5]' : 'stroke-2'} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Pañalera</span>
        </button>

        {/* 3. Juguetería */}
        <button
          onClick={() => {
            onSelectCategory('Juguetería')
            const el = document.getElementById('catalogo-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
            activeCategory === 'Juguetería' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeCategory === 'Juguetería' ? 'bg-sky-50' : ''}`}>
            <Sparkles size={20} className={activeCategory === 'Juguetería' ? 'stroke-[2.5]' : 'stroke-2'} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Juguetes</span>
        </button>

        {/* 4. Variedades */}
        <button
          onClick={() => {
            onSelectCategory('Variedades')
            const el = document.getElementById('catalogo-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
            activeCategory === 'Variedades' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeCategory === 'Variedades' ? 'bg-sky-50' : ''}`}>
            <Heart size={20} className={activeCategory === 'Variedades' ? 'stroke-[2.5]' : 'stroke-2'} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Variedades</span>
        </button>

        {/* 5. Bolsa / Carrito */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full py-1 text-slate-700 relative active:scale-90 transition-transform"
          aria-label="Ver bolsa de compras"
        >
          <div className="relative p-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
              <ShoppingBag size={16} />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-800 tracking-tight mt-0.5">Bolsa</span>
        </button>
      </div>
    </div>
  )
}
