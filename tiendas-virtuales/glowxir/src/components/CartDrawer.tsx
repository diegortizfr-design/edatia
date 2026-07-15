import React from 'react'
import { X, Trash2, Plus, Minus } from 'lucide-react'
import { Product } from '../data/productos'

interface CartItem {
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

export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout }: CartDrawerProps) {
  if (!isOpen) return null

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.precio * item.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Bolsa de Compras
              <span className="text-xs bg-glowxir-100 text-glowxir-700 font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350">
                  <X size={28} />
                </div>
                <div>
                  <p className="text-slate-700 font-bold text-sm">Tu bolsa está vacía</p>
                  <p className="text-xs text-slate-400 mt-1">Explora nuestros productos y agrega tus favoritos.</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-glowxir-600 text-white rounded-xl text-xs font-bold hover:bg-glowxir-700 transition-all"
                >
                  Seguir Comprando
                </button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.product.id} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl relative group">
                  <img
                    src={item.product.imagen}
                    alt={item.product.nombre}
                    className="w-16 h-20 object-cover rounded-lg bg-slate-100"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{item.product.nombre}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.product.categoria}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg px-1.5 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:text-glowxir-600 text-slate-400 rounded transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-slate-800 text-xs w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:text-glowxir-600 text-slate-400 rounded transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
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

          {/* Footer Subtotal */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium text-xs sm:text-sm">Subtotal Estimado</span>
                <span className="font-black text-slate-900 text-lg sm:text-xl">
                  {fmtPrice(subtotal)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Gastos de envío y tasas fiscales calculados al finalizar el proceso de pago.
              </p>
              <button
                onClick={onCheckout}
                className="w-full py-3 bg-glowxir-600 hover:bg-glowxir-700 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                Proceder al Pago
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
