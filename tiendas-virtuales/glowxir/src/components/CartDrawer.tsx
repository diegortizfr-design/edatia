import React from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, ArrowRight, Truck } from 'lucide-react'
import { Product } from '../data/productos'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: number, q: number) => void
  onRemoveItem: (id: number) => void
  onCheckout: () => void
}

const FREE_SHIPPING_THRESHOLD = 150000

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.precio * item.quantity, 0)
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  // Generate formatted WhatsApp Order Text
  const handleWhatsAppOrder = () => {
    let message = `🍼 *NUEVO PEDIDO - BABY-WORLD*\n\n`
    message += `¡Hola! Deseo ordenar los siguientes productos:\n\n`
    items.forEach((it) => {
      message += `• *${it.quantity}x* ${it.product.nombre} (${fmtPrice(it.product.precio * it.quantity)})\n`
    })
    message += `\n💰 *Total Estimado:* ${fmtPrice(subtotal)}\n`
    message += `\n📍 Por favor indíquenme disponibilidad para coordinar el envío. ¡Gracias!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/573205704262?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag size={18} className="text-sky-500" />
              <span>Mi Bolsa de Compras</span>
              <span className="text-xs bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-2.5 bg-sky-50/80 border-b border-sky-100 text-xs">
            {remainingForFreeShipping > 0 ? (
              <div className="space-y-1">
                <p className="text-slate-600 font-medium flex items-center justify-between text-[11px]">
                  <span>Agrega <b>{fmtPrice(remainingForFreeShipping)}</b> más para <b>Envío Gratis</b></span>
                  <Truck size={13} className="text-sky-600" />
                </p>
                <div className="w-full h-1.5 bg-sky-200/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <span>🎉 ¡Calificas para <b>Envío Gratis</b> en tu compra!</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
                <div className="h-16 w-16 bg-sky-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                  🍼
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-sm">Tu bolsa está vacía</p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                    Explora pañales, juguetes y variedades para agregar productos a tu orden.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              items.map(item => (
                <div 
                  key={item.product.id} 
                  className="flex gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-2xl relative group"
                >
                  <img
                    src={item.product.imagen}
                    alt={item.product.nombre}
                    className="w-14 h-14 object-cover rounded-xl bg-white border border-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="pr-6">
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">
                        {item.product.nombre}
                      </h4>
                      <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">
                        {item.product.categoria}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg px-1 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-0.5 hover:text-sky-600 text-slate-400 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="font-bold text-slate-800 text-xs w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-0.5 hover:text-sky-600 text-slate-400 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      
                      <span className="font-extrabold text-slate-900 text-xs">
                        {fmtPrice(item.product.precio * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkouts */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold text-xs">Subtotal:</span>
                <span className="font-black text-slate-900 text-lg">
                  {fmtPrice(subtotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={onCheckout}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Finalizar Pedido</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle size={15} />
                  <span>Pedir Directo por WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
