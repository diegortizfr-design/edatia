import React, { useState } from 'react'
import { ShoppingBag, Search, MessageCircle, X, Sparkles, Baby, Heart } from 'lucide-react'
import { BabyWorldLogo } from './BabyWorldLogo'
import { CATEGORIAS_PRODUCTOS } from '../data/productos'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Navbar({
  cartCount,
  onCartClick,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
}: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pañalera': return '🍼'
      case 'Juguetería': return '🧸'
      case 'Variedades': return '🎀'
      default: return '✨'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Delivery & WhatsApp Quick Banner */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sky-400 font-bold">🚚 Envíos a todo el país</span>
            <span className="text-slate-400 hidden sm:inline">• Atención personalizada por WhatsApp</span>
          </div>

          <a
            href="https://wa.me/573205704262?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold text-[11px] transition-colors"
          >
            <MessageCircle size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Pedir por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo */}
          <div
            className="cursor-pointer select-none"
            onClick={() => {
              setActiveCategory('Todos')
              setSearchQuery('')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <BabyWorldLogo />
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pañales, juguetes, ropa, teteros..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Buscar"
            >
              <Search size={19} />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all"
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

        {/* Mobile Search Box (Collapsible) */}
        {isSearchOpen && (
          <div className="md:hidden pb-2.5 pt-0.5">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en Baby-World..."
                autoFocus
                className="w-full pl-9 pr-9 py-2 bg-slate-100/90 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Horizontal Category Filter Pills (Mobile Swipe) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 no-scrollbar scroll-smooth">
          {CATEGORIAS_PRODUCTOS.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  const el = document.getElementById('catalogo-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
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
