import React from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, ArrowRight, ShieldCheck, Truck } from 'lucide-react'
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
  onCheckout
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
    let message = `👶 *NUEVO PEDIDO - DISTRIBUIDORA BABY WORLD*\n\n`
    message += `Hola! Deseo realizar el siguiente pedido:\n`
    items.forEach((it, idx) => {
      message += `• *${it.quantity}x* ${it.product.nombre} - ${fmtPrice(it.product.precio * it.quantity)}\n`
    })
    message += `\n*Subtotal Estimado:* ${fmtPrice(subtotal)}\n`
    message += `\nPor favor indíquenme disponibilidad y datos para el despacho. ¡Muchas gracias!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/573001234567?text=${encoded}`, '_blank')
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
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 font-display">
              <ShoppingBag size={20} className="text-sky-500" />
              <span>Mi Bolsa de Compras</span>
              <span className="text-xs bg-sky-100 text-sky-700 font-bold px-2.5 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-sky-50/80 border-b border-sky-100 text-xs">
            {remainingForFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <p className="text-slate-600 font-medium flex items-center justify-between">
                  <span>¡Agrega <b>{fmtPrice(remainingForFreeShipping)}</b> más para <b>Envío Gratis</b>!</span>
                  <Truck size={14} className="text-sky-600" />
                </p>
                <div className="w-full h-2 bg-sky-200/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <span>🎉 ¡Felicitaciones! Calificas para <b>Envío Gratis</b> en tu pedido.</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 bg-sky-50 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                  🍼
                </div>
                <div>
                  <p className="text-slate-800 font-black text-base font-display">Tu bolsa está vacía</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Explora pañales, juguetes, ropa y kits de revelación para llenar tu bolsa.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Ver Catálogo de Productos
                </button>
              </div>
            ) : (
              items.map(item => (
                <div 
                  key={item.product.id} 
                  className="flex gap-4 p-3 bg-slate-50/80 border border-slate-100 rounded-2xl relative group hover:border-sky-200 transition-colors"
                >
                  <img
                    src={item.product.imagen}
                    alt={item.product.nombre}
                    className="w-16 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 leading-snug">
                        {item.product.nombre}
                      </h4>
                      <p className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wider mt-0.5">
                        {item.product.categoria}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 bg-white rounded-xl px-1.5 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-slate-800 text-xs w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      
                      <span className="font-black text-slate-900 text-xs sm:text-sm font-display">
                        {fmtPrice(item.product.precio * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Eliminar item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkouts */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 p-6 bg-slate-50/50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold text-xs">Subtotal Productos</span>
                  <span className="font-black text-slate-900 text-lg sm:text-xl font-display">
                    {fmtPrice(subtotal)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Envío gratis en compras mayores a $150.000 COP. Despachos contra entrega a toda Colombia.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={onCheckout}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Proceder al Pago en Línea</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle size={16} />
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
