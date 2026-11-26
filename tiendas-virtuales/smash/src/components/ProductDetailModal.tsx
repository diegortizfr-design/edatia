import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import {
  formatCOP,
  getProductCode,
  getProductName,
  getProductPrice,
  getProductCategory,
  getProductBrand,
  getProductDescription,
  getProductImage,
  WHATSAPP_PHONE,
} from '../lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, quantity?: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const code = getProductCode(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const category = getProductCategory(product);
  const brand = getProductBrand(product);
  const desc = getProductDescription(product);
  const image = getProductImage(product);

  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );
  const [quantity, setQuantity] = useState<number>(1);

  const isModel2026 = product.badge?.includes('2026') || name.includes('2026');

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hola Smash Tenis & Pádel, estoy interesado en el producto:\n*${name}*\nRef: ${code}\nPrecio: ${formatCOP(price)}${
        selectedSize ? `\nTalla/Grip: ${selectedSize}` : ''
      }\n¿Tienen disponibilidad para despacho inmediato?`
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`, '_blank');
  };

  const handleAdd = () => {
    onAddToCart(product, selectedSize || undefined, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image or Technical Card */}
          <div className="relative aspect-square md:aspect-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-6 text-white overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center relative z-10 p-4">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-lime-400/50 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lime-400 font-mono text-sm font-bold tracking-widest">SMASH</span>
                </div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest block mb-1">
                  {brand}
                </span>
                <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-md border border-slate-700 inline-block mb-3">
                  Ref: {code}
                </span>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Equipamiento profesional de alto rendimiento garantizado por Edatia ERP.
                </p>
              </div>
            )}

            {isModel2026 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wide shadow-lg">
                Colección 2026
              </span>
            )}
          </div>

          {/* Right Column: Details & Order Form */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Brand */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-lime-700 uppercase tracking-wider">{category}</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                  En Stock
                </span>
              </div>

              {/* Title & Ref */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-heading leading-tight mb-2">
                {name}
              </h2>
              <p className="text-xs text-slate-500 font-mono mb-4">
                Código SKU: <span className="text-slate-800 font-semibold">{code}</span>
              </p>

              {/* Price */}
              <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Precio oficial Colombia</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-heading">
                  {formatCOP(price)}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {desc}
              </p>

              {/* Size / Grip selector if applicable */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wide">
                    Seleccionar Medida / Grip / Talla:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-lime-400 border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-6">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Cantidad:
                </label>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-slate-900 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <button
                onClick={handleAdd}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-sm transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar al Carrito ({quantity})</span>
              </button>

              <button
                onClick={handleWhatsAppInquiry}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Garantía Oficial Distribuidor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Envíos a todo el país</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
