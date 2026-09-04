import React from 'react'
import { Star, Plus, Eye } from 'lucide-react'
import { Product } from '../data/productos'

interface ProductCardProps {
  product: Product
  onAddToCart: (p: Product) => void
  onViewDetails: (p: Product) => void
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const discountPercent = product.precioAnterior
    ? Math.round(((product.precioAnterior - product.precio) / product.precioAnterior) * 100)
    : null

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Pañalera': return 'bg-sky-50 text-sky-600 border-sky-100'
      case 'Juguetería': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'Variedades': return 'bg-pink-50 text-pink-600 border-pink-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col h-full relative">
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative overflow-hidden aspect-square bg-slate-50 cursor-pointer select-none"
      >
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {discountPercent ? (
            <span className="bg-rose-500 text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          ) : <span />}

          {product.etapa && (
            <span className="bg-white/90 backdrop-blur-sm text-slate-700 font-bold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
              {product.etapa}
            </span>
          )}
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Category Tag */}
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeColor(product.categoria)}`}>
              {product.categoria}
            </span>
            <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
              <Star size={11} fill="currentColor" />
              <span>{product.rating}</span>
            </div>
          </div>
          
          {/* Title */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-800 text-xs sm:text-sm hover:text-sky-600 transition-colors line-clamp-2 leading-tight cursor-pointer pt-0.5"
            title={product.nombre}
          >
            {product.nombre}
          </h3>
          
          {/* Short description for larger screens */}
          <p className="text-[11px] text-slate-500 line-clamp-1 hidden sm:block">
            {product.descripcion}
          </p>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            {product.precioAnterior && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through block font-medium leading-none mb-0.5">
                {fmtPrice(product.precioAnterior)}
              </span>
            )}
            <span className="font-extrabold text-slate-900 text-xs sm:text-base truncate block">
              {fmtPrice(product.precio)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm active:scale-90 flex-shrink-0"
            title="Agregar a la bolsa"
            aria-label={`Agregar ${product.nombre} al carrito`}
          >
            <Plus size={15} />
            <span className="hidden sm:inline text-xs font-bold">Añadir</span>
          </button>
        </div>
      </div>
    </div>
  )
}
