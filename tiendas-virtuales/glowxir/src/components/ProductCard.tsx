import React from 'react'
import { Star, Plus } from 'lucide-react'
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

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Product Image */}
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
        {product.stock <= 15 && (
          <span className="absolute top-3 left-3 bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
            Últimas unidades
          </span>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            <span>{product.categoria}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-medium">
              <Star size={10} fill="currentColor" />
              <span>{product.rating}</span>
            </div>
          </div>
          
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-800 text-sm hover:text-glowxir-600 transition-colors line-clamp-1 cursor-pointer"
          >
            {product.nombre}
          </h3>
          <p className="text-xs text-slate-450 mt-1 line-clamp-2 leading-relaxed">
            {product.descripcion}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-extrabold text-slate-900 text-sm sm:text-base">
            {fmtPrice(product.precio)}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            className="p-2 bg-glowxir-50 hover:bg-glowxir-600 text-glowxir-600 hover:text-white border border-glowxir-100 hover:border-glowxir-600 rounded-lg transition-all flex items-center justify-center active:scale-95"
            title="Agregar al Carrito"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
