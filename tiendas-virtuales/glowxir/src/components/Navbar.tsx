import React, { useState } from 'react'
import { ShoppingBag, Search, MessageCircle, Calculator, Sparkles, Heart, X, PhoneCall, Gift, PartyPopper } from 'lucide-react'
import { BabyWorldLogo } from './BabyWorldLogo'
import { CATEGORIAS_PRODUCTOS } from '../data/productos'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onOpenCalculator: () => void
  selectedGender: string
  setSelectedGender: (gender: string) => void
}

export function Navbar({
  cartCount,
  onCartClick,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onOpenCalculator,
  selectedGender,
  setSelectedGender
}: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pañalera & Cuidado': return '🍼'
      case 'Juguetería': return '🧸'
      case 'Ropa & Ajuares': return '👶'
      case 'Baby Shower': return '🎉'
      case 'Revelación de Género': return '🎀'
      case 'Paseo & Habitación': return '🚼'
      default: return '✨'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Wholesale & Trust Announcement Bar */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-pink-500 text-white text-[11px] font-medium py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              Distribuidora Oficial
            </span>
            <span className="hidden sm:inline">🚚 Envíos a toda Colombia | Precios de Mayorista para Pañaleras & Eventos</span>
            <span className="sm:hidden">🚚 Envíos a todo el país • Mayor & Detal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://wa.me/573001234567?text=Hola%20Distribuidora%20Baby%20World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-bold transition-colors shadow-sm"
            >
              <MessageCircle size={12} />
              <span>WhatsApp Ventas</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div 
            className="cursor-pointer" 
            onClick={() => {
              setActiveCategory('Todos')
              setSelectedGender('Todos')
              setSearchQuery('')
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
                placeholder="Buscar pañales, ropa, teteros, confeti revelación..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all shadow-inner"
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

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2.5 text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-2xl transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Diaper Calculator Trigger */}
            <button
              onClick={onOpenCalculator}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-butter-100 to-amber-100 text-amber-900 border border-amber-200/80 rounded-2xl text-xs font-bold hover:shadow-md transition-all active:scale-95"
            >
              <Calculator size={16} className="text-amber-600" />
              <span>Calculadora Pañales</span>
            </button>

            {/* Gender Reveal / Baby Shower Quick Link */}
            <button
              onClick={() => setActiveCategory('Revelación de Género')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-pink-50 hover:bg-pink-100/80 text-pink-600 border border-pink-200/60 rounded-2xl text-xs font-bold transition-all active:scale-95"
            >
              <PartyPopper size={15} className="text-pink-500" />
              <span>Revelación & Shower</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Box (Collapsible) */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pañales, juguetes, ropa de bebé..."
                autoFocus
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white"
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

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {CATEGORIAS_PRODUCTOS.map((cat) => {
            const isActive = activeCategory === cat
            const isGenderSpecial = cat === 'Revelación de Género' || cat === 'Baby Shower'
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 ${
                  isActive
                    ? isGenderSpecial
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md shadow-pink-500/20 scale-105'
                      : 'bg-slate-900 text-white shadow-md scale-105'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </button>
            )
          })}

          {/* Quick Diaper Calc chip on mobile */}
          <button
            onClick={onOpenCalculator}
            className="lg:hidden flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/60"
          >
            <span>🧮</span>
            <span>Calculadora</span>
          </button>
        </div>
      </div>
    </header>
  )
}
