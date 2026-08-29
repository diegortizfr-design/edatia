import React, { useState } from 'react'
import { X, Star, CheckCircle2, ShoppingBag, MessageCircle, ShieldCheck, Truck, Sparkles, Plus, Minus } from 'lucide-react'
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
    `Hola Distribuidora Baby World! Tengo una consulta sobre el producto: "${product.nombre}" (Precio: ${fmtPrice(product.precio)}). ¿Tienen disponibilidad?`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6 p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Product Image */}
        <div className="w-full md:w-1/2 aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden relative shadow-inner">
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
          {product.etapa && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[10px] px-3 py-1 rounded-full shadow-sm">
              {product.etapa}
            </span>
          )}
        </div>

        {/* Content Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-sky-100 text-sky-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {product.categoria}
                </span>
                {product.esMayorista && (
                  <span className="text-[10px] bg-pink-100 text-pink-700 font-black px-2 py-0.5 rounded-full uppercase">
                    Precio Mayorista
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display leading-snug">
                {product.nombre}
              </h2>

              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={14} fill="currentColor" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> {product.stock > 0 ? 'En Stock para Envío Inmediato' : 'Bajo Pedido'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                {product.precioAnterior && (
                  <span className="text-xs text-slate-400 line-through">
                    {fmtPrice(product.precioAnterior)}
                  </span>
                )}
                <span className="text-2xl font-black text-slate-900 font-display">
                  {fmtPrice(product.precio)}
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.descripcionLarga || product.descripcion}
              </p>
            </div>

            {/* Bullet Points */}
            <div className="space-y-1.5 pt-1">
              {product.detalles.map((d, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>

            {/* Specifications if any */}
            {product.especificaciones && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] space-y-1">
                {Object.entries(product.especificaciones).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400 font-semibold">{key}:</span>
                    <span className="text-slate-700 font-bold">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity & CTA */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Cantidad:</span>
              <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-slate-800 text-xs w-8 text-center">{quantity}</span>
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
                className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <ShoppingBag size={16} />
                <span>Agregar a mi Pedido ({fmtPrice(product.precio * quantity)})</span>
              </button>

              <a
                href={`https://wa.me/573001234567?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl transition-all flex items-center justify-center"
                title="Consultar por WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
