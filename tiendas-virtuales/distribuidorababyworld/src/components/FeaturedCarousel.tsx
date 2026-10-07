import React, { useRef } from 'react'
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

  const featured = products.filter(p => p.esDestacado).slice(0, 8)

  if (featured.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section className="bg-white pt-10 pb-6 border-b border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-500 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Lo Más Recomendado</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Los favoritos de las mamás</p>
            </div>
          </div>
          
          {/* Botones de navegación (Desktop) */}
          <div className="hidden sm:flex gap-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor Carrusel */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory no-scrollbar"
        >
          {featured.map(product => (
            <div key={product.id} className="min-w-[160px] sm:min-w-[220px] max-w-[160px] sm:max-w-[220px] flex-shrink-0 snap-start h-full">
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
