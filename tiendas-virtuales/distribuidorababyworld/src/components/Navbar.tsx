import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ShoppingBag, Search, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
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
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  categories = ['Todos'],
  onOpenLocation,
  onPromoClick,
  onOpenCategories,
}: NavbarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Función para evaluar si hay desbordamiento a la izquierda o derecha
  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const tolerance = 4 // Margen de tolerancia para decimales de subpíxeles
    const hasLeft = el.scrollLeft > tolerance
    const hasRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - tolerance)
    setCanScrollLeft(hasLeft)
    setCanScrollRight(hasRight)
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    checkScrollState()
    el.addEventListener('scroll', checkScrollState, { passive: true })
    window.addEventListener('resize', checkScrollState)

    // Reevaluar tras render inicial o cambio en categorías
    const timer = setTimeout(checkScrollState, 150)

    return () => {
      el.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
      clearTimeout(timer)
    }
  }, [categories, checkScrollState])

  // Desplazamiento asistido al hacer clic en las flechas
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollAmount = Math.max(220, Math.floor(el.clientWidth * 0.55))
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (c === 'todos') return '✨'
    if (c.includes('black') || c.includes('oferta')) return '🔥'
    if (c.includes('panal') || c.includes('cuidado') || c.includes('aseo') || c.includes('bano') || c.includes('higiene')) return '🍼'
    if (c.includes('calzado') || c.includes('zapato') || c.includes('tenis')) return '👟'
    if (c.includes('juguet') || c.includes('estimul') || c.includes('didact')) return '🧸'
    if (c.includes('ropa') || c.includes('vest') || c.includes('ajuar') || c.includes('moda')) return '👕'
    if (c.includes('aliment') || c.includes('leche') || c.includes('lactanc') || c.includes('tetero')) return '🥣'
    if (c.includes('coche') || c.includes('paseo') || c.includes('silla') || c.includes('cuna') || c.includes('corral')) return '🛒'
    if (c.includes('variedad') || c.includes('accesori')) return '🎀'
    return '🏷️'
  }

  return (
    <>
      {/* Dynamic Black Days Top Bar with Live Urgency Countdown & Rotating Promos */}
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

          {/* Bar de Categorías Inteligente con Navegación Asistida y Botón "Todas" */}
          <div className="relative flex items-center pb-2.5 pt-0.5 group/nav">
            {/* Botón Destacado: Ver Todas las Categorías */}
            {onOpenCategories && (
              <button
                onClick={onOpenCategories}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-full text-xs font-extrabold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/90 hover:border-sky-300 transition-all shadow-2xs active:scale-95"
                title="Ver todas las categorías y departamentos"
              >
                <Layers size={13} className="text-sky-600 shrink-0" />
                <span className="hidden xs:inline sm:inline">Categorías</span>
                <span className="xs:hidden sm:hidden">Todas</span>
              </button>
            )}

            {/* Flecha Desplazamiento Izquierda (Desktop & Tablet) */}
            {canScrollLeft && (
              <button
                onClick={() => handleScroll('left')}
                className="hidden sm:flex absolute left-24 sm:left-28 z-20 items-center justify-center w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-sky-600 shadow-md border border-slate-200 transition-all active:scale-90"
                aria-label="Desplazar categorías a la izquierda"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Degradado Sombra Izquierda */}
            {canScrollLeft && (
              <div className="hidden sm:block absolute left-20 sm:left-24 top-0 bottom-2.5 w-10 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}

            {/* Contenedor Horizontal Desplazable */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat
                const isBlackDaysTab = cat.toLowerCase().includes('black')
                return (
                  <button
                    key={cat}
                    onClick={(e) => {
                      setActiveCategory(cat)
                      const el = document.getElementById('catalogo-section')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                      // Centrar la píldora pulsada suavemente
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      isBlackDaysTab
                        ? isActive
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md scale-105 border border-amber-300'
                          : 'bg-gradient-to-r from-slate-950 to-slate-900 text-amber-300 border border-amber-400/40 hover:border-amber-300 font-extrabold shadow-xs'
                        : isActive
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105'
                          : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                  </button>
                )
              })}

              {/* Botón "+ Ver más" al final de la fila scrolleable */}
              {onOpenCategories && categories.length > 5 && (
                <button
                  onClick={onOpenCategories}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50/60 hover:bg-sky-100/80 border border-dashed border-sky-300 transition-all active:scale-95"
                >
                  <span>+ Más Secciones</span>
                </button>
              )}
            </div>

            {/* Degradado Sombra Derecha */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-2.5 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}

            {/* Flecha Desplazamiento Derecha (Desktop & Tablet) */}
            {canScrollRight && (
              <button
                onClick={() => handleScroll('right')}
                className="hidden sm:flex absolute right-1 z-20 items-center justify-center w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-sky-600 shadow-md border border-slate-200 transition-all active:scale-90"
                aria-label="Desplazar categorías a la derecha"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
