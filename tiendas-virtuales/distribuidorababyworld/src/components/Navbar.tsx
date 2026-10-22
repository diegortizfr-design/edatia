import React from 'react'
import { ShoppingBag, Search, X } from 'lucide-react'
import { BabyWorldLogo } from './BabyWorldLogo'
import { WhatsAppIcon } from './WhatsAppIcon'
import { CATEGORIAS_PRODUCTOS } from '../data/productos'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  categories?: readonly string[]
}

export function Navbar({
  cartCount,
  onCartClick,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  categories = CATEGORIAS_PRODUCTOS,
}: NavbarProps) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pañales y Cuidado':
      case 'Pañalera': return '🍼'
      case 'Calzado': return '👟'
      case 'Juguetería': return '🧸'
      case 'Variedades': return '🎀'
      case 'Ropa': return '👕'
      case 'Alimentación': return '🍼'
      default: return '✨'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Delivery & WhatsApp Quick Banner */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sky-400 font-bold animate-pulse">🚀 Envío GRATIS en compras superiores a $150.000 COP</span>
            <span className="text-slate-400 hidden sm:inline">• Atención personalizada</span>
          </div>

          <a
            href="https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 hover:border-[#25D366] px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] transition-all shadow-2xs hover:shadow-emerald-500/20 active:scale-95 shrink-0"
            title="Escríbenos por WhatsApp"
          >
            <WhatsAppIcon size={16} />
            <span className="hidden sm:inline text-emerald-300">Pedir por WhatsApp</span>
            <span className="sm:hidden text-emerald-300">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo */}
          <div
            className="cursor-pointer select-none flex items-center gap-2"
            onClick={() => {
              setActiveCategory('Todos')
              setSearchQuery('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <BabyWorldLogo />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-baby font-normal text-2xl tracking-tight leading-none mt-1">
                <span className="text-blush-300">Baby</span> <span className="text-baby-300">World</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 ml-0.5">Pañalera Baby World</span>
            </div>
          </div>

          {/* Search Bar (Responsive: Always visible) */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pañales, juguetes, ropa..."
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Shopping Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all shrink-0"
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="bg-white text-sky-600 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Category Filter Pills (Mobile Swipe) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  const el = document.getElementById('catalogo-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
