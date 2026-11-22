import React, { useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Product } from '../data/productos'
import { ProductCard } from './ProductCard'

interface FeaturedCarouselProps {
  products: Product[]
  onAddToCart: (p: Product) => void
  onViewDetails: (p: Product) => void
}

export function FeaturedCarousel({ products, onAddToCart, onViewDetails }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Selección inteligente de productos para el carrusel de recomendados:
  // 1. Prioriza productos destacados con stock disponible.
  // 2. Si casi todos los destacados están agotados, complementa con referencias que sí tengan stock.
  const featured = useMemo(() => {
    const destacados = products.filter(p => p.esDestacado)
    const destacadosConStock = destacados.filter(p => p.stock > 0)
    const destacadosSinStock = destacados.filter(p => p.stock <= 0)

    if (destacadosConStock.length >= 6) {
      return [...destacadosConStock, ...destacadosSinStock].slice(0, 16)
    }

    // Complementar con productos con inventario disponible para no mostrar una vitrina agotada
    const otrosConStock = products.filter(p => !p.esDestacado && p.stock > 0)
    return [...destacadosConStock, ...otrosConStock, ...destacadosSinStock].slice(0, 16)
  }, [products])

  if (featured.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section className="bg-white pt-4 pb-2 sm:pt-6 sm:pb-3 border-b border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Encabezado Compacto */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-500 rounded-xl">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">Lo Más Recomendado</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Los favoritos de las mamás</p>
            </div>
          </div>
          
          {/* Botones de navegación (Desktop) */}
          <div className="hidden sm:flex gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Contenedor Carrusel Compacto y Fluido */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-2.5 sm:gap-3.5 pb-3 sm:pb-4 snap-x snap-mandatory no-scrollbar"
        >
          {featured.map((product, idx) => (
            <div
              key={product.id}
              className="min-w-[145px] sm:min-w-[180px] max-w-[155px] sm:max-w-[190px] flex-shrink-0 snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
                priority={idx < 4}
                compact={true}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
