import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';
import {
  formatCOP,
  FREE_SHIPPING_THRESHOLD,
  getProductCode,
  getProductName,
  getProductPrice,
  getProductImage,
} from '../lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0
  );

  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const shippingCost = items.length === 0 ? 0 : qualifiesForFreeShipping ? 0 : 15000;
  const total = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-lime-400" />
            <h2 className="font-heading font-bold text-base sm:text-lg">Tu Carrito Smash</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-semibold text-lime-400 border border-slate-700">
              {items.reduce((acc, it) => acc + it.quantity, 0)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Truck className="w-4 h-4 text-emerald-600" />
              {qualifiesForFreeShipping ? (
                <strong className="text-emerald-700">¡Calificas para Envío Gratis!</strong>
              ) : (
                <span>
                  Faltan <strong className="text-slate-900">{formatCOP(shippingNeeded)}</strong> para Envío Gratis
                </span>
              )}
            </span>
            <span className="font-mono text-slate-500 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                qualifiesForFreeShipping
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-lime-500 to-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-700 text-base mb-1">Tu carrito está vacío</p>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                Explora nuestras raquetas, cuerdas, calzado y accesorios oficiales 2026.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-lime-400 text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Comenzar a Comprar
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const code = getProductCode(item.product);
              const name = getProductName(item.product);
              const price = getProductPrice(item.product);
              const image = getProductImage(item.product);

              return (
                <div
                  key={`${code}-${item.selectedSize || 'default'}-${idx}`}
                  className="flex gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs items-center"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center text-white">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[9px] font-mono font-bold text-lime-400 text-center px-1">
                        REF<br />{code}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {name}
                    </h4>
                    {item.selectedSize && (
                      <span className="inline-block text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                        {item.selectedSize}
                      </span>
                    )}
                    <p className="font-bold text-slate-900 text-xs mt-1">
                      {formatCOP(price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-slate-50 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold text-slate-900 text-[11px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors ml-auto"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span className="font-semibold text-slate-900">
                  {qualifiesForFreeShipping ? (
                    <span className="text-emerald-600 font-bold">¡GRATIS!</span>
                  ) : (
                    formatCOP(shippingCost)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-heading">{formatCOP(total)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-sm transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Finalizar Compra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
