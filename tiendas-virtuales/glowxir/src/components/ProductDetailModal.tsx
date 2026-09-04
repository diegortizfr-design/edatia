import React, { useState } from 'react'
import { X, Star, CheckCircle2, ShoppingBag, MessageCircle, Plus, Minus } from 'lucide-react'
import { Product } from '../data/productos'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (p: Product, quantity?: number) => void
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const handleAdd = () => {
    onAddToCart(product, quantity)
    setQuantity(1)
  }

  const whatsappMessage = encodeURIComponent(
    `Hola Baby-World! Me interesa el producto: "${product.nombre}" (${fmtPrice(product.precio)}). ¿Tienen disponibilidad inmediata?`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal / Mobile Bottom Sheet Card */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 border border-slate-100 flex flex-col sm:flex-row gap-5 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-1" />

        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100/80 transition-all z-10"
        >
          <X size={18} />
        </button>

        {/* Product Image */}
        <div className="w-full sm:w-1/2 aspect-square bg-slate-50 rounded-2xl overflow-hidden relative shadow-inner flex-shrink-0">
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
          {product.etapa && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[9px] px-2.5 py-1 rounded-full shadow-sm border border-slate-100">
              {product.etapa}
            </span>
          )}
        </div>

        {/* Content Info */}
        <div className="w-full sm:w-1/2 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.categoria}
              </span>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-snug">
                {product.nombre}
              </h2>

              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={13} fill="currentColor" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 size={12} /> {product.stock > 0 ? 'En Stock' : 'Bajo Pedido'}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                {product.precioAnterior && (
                  <span className="text-xs text-slate-400 line-through">
                    {fmtPrice(product.precioAnterior)}
                  </span>
                )}
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {fmtPrice(product.precio)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {product.descripcionLarga || product.descripcion}
            </p>

            {/* Bullet Points */}
            <div className="space-y-1 pt-1">
              {product.detalles.slice(0, 3).map((d, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                  <CheckCircle2 size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Cantidad:</span>
              <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl px-2 py-0.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-slate-800 text-xs w-7 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-3 bg-slate-900 hover:bg-sky-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={15} />
                <span>Añadir a mi Bolsa ({fmtPrice(product.precio * quantity)})</span>
              </button>

              <a
                href={`https://wa.me/573205704262?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl transition-all flex items-center justify-center"
                title="Consultar por WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
