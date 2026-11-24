import React, { useState } from 'react'
import { Star, Plus, Play, Share2 } from 'lucide-react'
import { Product } from '../data/productos'
import { BnplCreditSimulator } from './BnplCreditSimulator'
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../lib/imageOptimizer'

interface ProductCardProps {
  product: Product
  onAddToCart: (p: Product) => void
  onViewDetails: (p: Product) => void
  onShare?: (p: Product) => void
  priority?: boolean
  compact?: boolean
}

export function ProductCard({ product, onAddToCart, onViewDetails, onShare, priority = false, compact = false }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const discountPercent = product.precioAnterior
    ? Math.round(((product.precioAnterior - product.precio) / product.precioAnterior) * 100)
    : null

  const getCategoryBadgeColor = (cat: string) => {
    const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (c.includes('panal') || c.includes('cuidado') || c.includes('aseo') || c.includes('toalla')) return 'bg-sky-50 text-sky-600 border-sky-100'
    if (c.includes('juguet')) return 'bg-amber-50 text-amber-600 border-amber-100'
    if (c.includes('variedad') || c.includes('ropa')) return 'bg-pink-50 text-pink-600 border-pink-100'
    if (c.includes('aliment') || c.includes('tetero') || c.includes('leche')) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (c.includes('calzado')) return 'bg-indigo-50 text-indigo-600 border-indigo-100'
    return 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className={`group bg-white ${compact ? 'rounded-2xl' : 'rounded-2xl sm:rounded-2xl'} border border-slate-100/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col h-full relative animate-fade-in-up`} style={{ animationFillMode: 'both' }}>
      {/* Product Image Box */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative overflow-hidden aspect-square bg-white cursor-pointer select-none flex items-center justify-center p-2.5 sm:p-3"
      >
        {/* Skeleton Shimmer de carga mientras se descarga la imagen */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-sky-400 animate-spin opacity-40" />
          </div>
        )}

        <img
          src={getOptimizedImageUrl(product.imagen, 500)}
          alt={product.nombre}
          className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-500 ${
            imageLoaded
              ? product.stock <= 0
                ? 'opacity-75 grayscale-[20%]'
                : 'opacity-100'
              : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.currentTarget
            if (target.src !== FALLBACK_IMAGE) {
              target.src = FALLBACK_IMAGE
            }
            setImageLoaded(true)
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {product.stock <= 0 ? (
            <span className="bg-slate-900/85 backdrop-blur-sm text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full shadow-xs tracking-wide shrink-0">
              Agotado
            </span>
          ) : discountPercent ? (
            <span className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-amber-300 border border-amber-400/40 font-black text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 shrink-0">
              <span>🔥</span>
              <span className="tracking-tight">BLACK FRIDAY -{discountPercent}%</span>
            </span>
          ) : <span />}

          <div className="flex items-center gap-1 shrink-0">
            {product.videos && product.videos.length > 0 && (
              <span className="bg-black/75 backdrop-blur-xs text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Play size={8} fill="currentColor" />
                <span>Video</span>
              </span>
            )}
            {product.etapa && (
              <span className="bg-white/90 backdrop-blur-sm text-slate-700 font-bold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full shadow-xs border border-slate-100 truncate max-w-[40%] shrink-0">
                {product.etapa}
              </span>
            )}
          </div>
        </div>

        {/* Botón Flotante para Compartir en Redes Sociales */}
        {onShare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onShare(product)
            }}
            className="absolute bottom-2 right-2 z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white/95 hover:bg-white text-slate-500 hover:text-sky-600 shadow-xs hover:shadow border border-slate-200/90 flex items-center justify-center transition-all duration-200 active:scale-90 opacity-90 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
            title={`Compartir ${product.nombre} en redes sociales`}
            aria-label={`Compartir ${product.nombre}`}
          >
            <Share2 size={13} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Info Body */}
      <div className={`${compact ? 'p-2 sm:p-2.5 space-y-1' : 'p-2.5 sm:p-3 space-y-1.5'} flex-1 flex flex-col justify-between`}>
        <div className="space-y-1">
          {/* Category Tag & Rating */}
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md border truncate max-w-[90px] sm:max-w-[110px] ${getCategoryBadgeColor(product.categoria)}`}>
              {product.subcategoria || product.categoria}
            </span>
            <div className="flex items-center gap-0.5 text-amber-500 text-[9px] sm:text-[10px] font-bold shrink-0">
              <Star size={10} fill="currentColor" />
              <span>{product.rating}</span>
            </div>
          </div>
          
          {/* Title with consistent height across all cards */}
          <h3 
            onClick={() => onViewDetails(product)}
            className={`font-bold text-slate-800 ${compact ? 'text-[11px] sm:text-xs min-h-[1.8rem] sm:min-h-[2rem]' : 'text-xs sm:text-[13px] min-h-[2rem] sm:min-h-[2.2rem]'} hover:text-sky-600 transition-colors line-clamp-2 leading-snug cursor-pointer flex items-center`}
            title={product.nombre}
          >
            {product.nombre}
          </h3>
        </div>

        {/* Pricing & Add to Cart */}
        <div className={`${compact ? 'pt-1.5 space-y-1.5' : 'pt-2 space-y-1.5'} border-t border-slate-100 mt-auto`}>
          {/* Precio Anterior / Descuento (si tiene oferta activa) */}
          {product.precioAnterior && product.precioAnterior > product.precio && (
            <div className="flex items-center justify-between gap-1 leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-semibold">
                  {fmtPrice(product.precioAnterior)}
                </span>
                {discountPercent && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-1.5 py-0.2 rounded-md shadow-2xs">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              {/* Alerta de urgencia si quedan pocas unidades */}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-[8px] font-extrabold text-amber-600 animate-pulse truncate">
                  ¡Últimas {product.stock}!
                </span>
              )}
            </div>
          )}

          {/* Fila Principal: Precio y Botón de Añadir */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <span className={`font-black text-slate-900 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} leading-none block whitespace-nowrap`}>
                {fmtPrice(product.precio)}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block mt-0.5 truncate">
                {product.ivaPct > 0 ? `IVA ${product.ivaPct}%` : 'IVA incl.'}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                if (product.stock > 0) {
                  onAddToCart(product)
                } else {
                  onViewDetails(product)
                }
              }}
              disabled={product.stock <= 0}
              className={`${compact ? 'h-7 sm:h-7.5 px-2 text-[10px]' : 'h-8 sm:h-9 px-2.5 sm:px-3 text-xs'} rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 font-bold shadow-2xs ${
                product.stock > 0
                  ? 'bg-slate-900 hover:bg-sky-600 active:scale-90 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={product.stock > 0 ? `Agregar a la bolsa (${product.stock} disp.)` : 'Producto agotado en inventario'}
              aria-label={product.stock > 0 ? `Agregar ${product.nombre} al carrito` : `${product.nombre} está agotado`}
            >
              {product.stock > 0 ? (
                <>
                  <Plus size={compact ? 12 : 14} strokeWidth={2.5} />
                  <span className="font-bold">Añadir</span>
                </>
              ) : (
                <span className="font-bold">Agotado</span>
              )}
            </button>
          </div>

          {/* Simulador Cuotas Addi y Sistecrédito */}
          <div className="pt-0.5">
            <BnplCreditSimulator price={product.precio} compact />
          </div>

          {/* Disponibilidad de Stock */}
          <div className="min-h-[12px] flex items-center text-[8px] sm:text-[9px]">
            {product.stock > 0 && product.stock <= 5 ? (
              <p className="font-bold text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>¡Últimas {product.stock} unds!</span>
              </p>
            ) : product.stock > 5 ? (
              <p className="font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Disponible ({product.stock} unds)</span>
              </p>
            ) : (
              <p className="font-medium text-rose-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Agotado temporalmente</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
