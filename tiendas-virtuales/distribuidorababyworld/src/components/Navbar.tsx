import React from 'react'
import { ShoppingBag, Search, X, Layers } from 'lucide-react'
import { BabyWorldLogo } from './BabyWorldLogo'
import { LocationPinIcon } from './LocationPinIcon'
import { BlackDaysTopBar } from './BlackDaysTopBar'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  categories?: readonly string[]
  onOpenLocation?: () => void
  onPromoClick?: () => void
  onOpenCategories?: () => void
}

export function Navbar({
  cartCount,
  onCartClick,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  onOpenLocation,
  onPromoClick,
  onOpenCategories,
}: NavbarProps) {
  return (
    <>
      {/* Dynamic Black Friday Top Bar with Live Urgency Countdown & Rotating Promos */}
      <BlackDaysTopBar onPromoClick={onPromoClick} />

      {/* Encabezado Fijo de Navegación (Sticky) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
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
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 ml-0.5">
                  Pañalera y Juguetería
                </span>
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
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón Categorías Rápido */}
              {onOpenCategories && (
                <button
                  onClick={onOpenCategories}
                  className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-50 hover:bg-sky-100/80 border border-sky-200/80 text-sky-700 rounded-full font-bold text-xs transition-all active:scale-95 shadow-2xs"
                  title="Ver todas las categorías y departamentos"
                >
                  <Layers size={14} className="text-sky-600 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Categorías</span>
                </button>
              )}

              {/* Store Location Button */}
              {onOpenLocation && (
                <button
                  onClick={onOpenLocation}
                  className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-full font-bold text-xs transition-all active:scale-95"
                  title="Ver ubicación de tienda física y horarios"
                >
                  <LocationPinIcon size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Tienda Física</span>
                  <span className="sm:hidden text-[11px]">Tienda</span>
                </button>
              )}

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
        </div>
      </header>
    </>
  )
}
