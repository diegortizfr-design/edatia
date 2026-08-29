import React from 'react'
import { Star, Plus, Eye, Sparkles, Heart } from 'lucide-react'
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

  return (
    <div className="group bg-white rounded-3xl border border-slate-100/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-200/80 transition-all duration-300 flex flex-col h-full relative">
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative overflow-hidden aspect-[4/5] bg-slate-50 cursor-pointer"
      >
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {discountPercent && (
              <span className="bg-pink-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                -{discountPercent}% OFF
              </span>
            )}
            {product.esMayorista && (
              <span className="bg-sky-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                Mayorista
              </span>
            )}
          </div>

          {product.etapa && (
            <span className="bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200/60 font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
              {product.etapa}
            </span>
          )}
        </div>

        {/* Hover Quick View overlay */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-800 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye size={14} /> Ver Detalle
          </span>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="truncate max-w-[150px] text-sky-600 font-extrabold">{product.categoria}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-bold flex-shrink-0">
              <Star size={12} fill="currentColor" />
              <span>{product.rating}</span>
              {product.reviewsCount && (
                <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
              )}
            </div>
          </div>
          
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-800 text-xs sm:text-sm hover:text-sky-600 transition-colors line-clamp-2 leading-snug cursor-pointer"
            title={product.nombre}
          >
            {product.nombre}
          </h3>
          
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {product.descripcion}
          </p>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
          <div>
            {product.precioAnterior && (
              <span className="text-[10px] text-slate-400 line-through block font-medium">
                {fmtPrice(product.precioAnterior)}
              </span>
            )}
            <span className="font-black text-slate-900 text-sm sm:text-base font-display">
              {fmtPrice(product.precio)}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="p-2.5 sm:px-3 sm:py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-lg active:scale-95 text-xs font-bold"
            title="Agregar al Carrito"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
