import React from 'react'
import { Home, ShoppingBag, Baby, Sparkles, Heart } from 'lucide-react'

interface MobileBottomNavProps {
  activeCategory: string
  onSelectCategory: (category: string) => void
  quickCategories?: string[]
  cartCount: number
  onOpenCart: () => void
  onOpenWhatsApp?: () => void
}

export function MobileBottomNav({
  activeCategory,
  onSelectCategory,
  quickCategories = [],
  cartCount,
  onOpenCart,
}: MobileBottomNavProps) {
  const visibleCats = quickCategories.slice(0, 3)

  const renderCategoryIcon = (cat: string, isActive: boolean) => {
    const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const strokeClass = isActive ? 'stroke-[2.5]' : 'stroke-2'
    if (c.includes('panal') || c.includes('cuidado') || c.includes('aseo') || c.includes('aliment')) {
      return <Baby size={20} className={strokeClass} />
    }
    if (c.includes('juguet') || c.includes('estimul')) {
      return <Sparkles size={20} className={strokeClass} />
    }
    return <Heart size={20} className={strokeClass} />
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {/* 1. Inicio */}
        <button
          onClick={() => {
            onSelectCategory('Todos')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all ${
            activeCategory === 'Todos' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-full transition-transform active:scale-90 ${activeCategory === 'Todos' ? 'bg-sky-50' : ''}`}>
            <Home size={20} className={activeCategory === 'Todos' ? 'stroke-[2.5]' : 'stroke-2'} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full px-1">Inicio</span>
        </button>

        {/* Categorías dinámicas del ERP */}
        {visibleCats.map((cat) => {
          const isActive = activeCategory === cat
          const shortLabel = cat.split(/\s+y\s+|\s*\/\s*/i)[0].trim()
          return (
            <button
              key={cat}
              onClick={() => {
                onSelectCategory(cat)
                const el = document.getElementById('catalogo-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-xl transition-all ${
                isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={cat}
            >
              <div className={`p-1 rounded-full transition-transform active:scale-90 ${isActive ? 'bg-sky-50' : ''}`}>
                {renderCategoryIcon(cat, isActive)}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full px-1">
                {shortLabel}
              </span>
            </button>
          )
        })}

        {/* Bolsa / Carrito */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 text-slate-700 relative active:scale-90 transition-transform"
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
