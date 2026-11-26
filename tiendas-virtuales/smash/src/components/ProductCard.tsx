import React from 'react';
import { ShoppingBag, Eye, Zap, Check } from 'lucide-react';
import { Product } from '../types';
import {
  formatCOP,
  getProductCode,
  getProductName,
  getProductPrice,
  getProductCategory,
  getProductBrand,
  getProductImage,
} from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, size?: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const code = getProductCode(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const category = getProductCategory(product);
  const brand = getProductBrand(product);
  const image = getProductImage(product);

  const isModel2026 = product.badge?.includes('2026') || name.includes('2026');
  const isStringing = category.toLowerCase().includes('servicio') || name.toLowerCase().includes('encordado');

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
      {/* Top Image / Technical Placeholder */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          /* Technical Tennis/Padel Reference Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Racket string pattern outline */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-lime-400/40 flex items-center justify-center mb-3">
              <span className="text-lime-400 font-mono text-xs font-bold tracking-widest uppercase">SMASH</span>
            </div>

            <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
              {brand}
            </span>
            <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              Ref: {code}
            </span>
            <span className="text-[11px] text-slate-400 mt-2 max-w-[180px] line-clamp-1">
              {category}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {isModel2026 && (
            <span className="px-2.5 py-1 rounded-md bg-lime-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wide shadow-md">
              Modelo 2026
            </span>
          )}
          {product.badge && !isModel2026 && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide shadow-md">
              {product.badge}
            </span>
          )}
          {product.gender && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-xs">
              {product.gender}
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/95 text-slate-800 hover:text-slate-950 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
          title="Vista Rápida"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{brand}</span>
            <span className="font-mono text-[11px] text-slate-400">Ref: {code}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-lime-700 cursor-pointer transition-colors"
          >
            {name}
          </h3>

          {/* Sizes / Grips Preview */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {product.sizes.slice(0, 3).map((sz) => (
                <span
                  key={sz}
                  className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
                >
                  {sz}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium self-center">
                  +{product.sizes.length - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Precio COP</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-950 font-heading">
              {formatCOP(price)}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product, product.sizes?.[0])}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
              isStringing
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-lime-400 hover:text-lime-300'
            }`}
            title="Agregar al carrito"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
