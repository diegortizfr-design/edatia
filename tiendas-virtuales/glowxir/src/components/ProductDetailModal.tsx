import React from 'react'
import { X, Star, Heart, CheckCircle2 } from 'lucide-react'
import { Product } from '../data/productos'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (p: Product) => void
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6 p-6">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Product Image */}
        <div className="w-full md:w-1/2 aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden">
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                {product.categoria}
              </span>
              <div className="flex items-center gap-1.5 mt-2.5">
                <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                  <Star size={12} fill="currentColor" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-emerald-600 font-semibold">Disponible</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 font-serif">
                {product.nombre}
              </h2>
              <p className="text-lg font-black text-glowxir-600 mt-1">
                {fmtPrice(product.precio)}
              </p>
            </div>

            <hr className="border-slate-100" />

            <div>
              <p className="text-xs text-slate-450 leading-relaxed">
                {product.descripcionLarga}
              </p>
            </div>

            {/* Bullet points */}
            <div className="space-y-1.5">
              {product.detalles.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-650 font-medium">
                  <CheckCircle2 size={14} className="text-glowxir-500" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onAddToCart(product)}
              className="flex-1 py-3 bg-glowxir-600 hover:bg-glowxir-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Agregar a la bolsa
            </button>
            <button className="p-3 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-rose-500">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
