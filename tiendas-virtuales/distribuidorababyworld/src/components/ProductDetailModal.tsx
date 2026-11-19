import React, { useState, useEffect } from 'react'
import { X, Star, CheckCircle2, ShoppingBag, MessageCircle, Plus, Minus, Sparkles, ZoomIn } from 'lucide-react'
import { Product, ProductVariant } from '../data/productos'
import { BnplCreditSimulator } from './BnplCreditSimulator'
import { getOptimizedImageUrl } from '../lib/imageOptimizer'
import { extraerAtributosVisuales, buscarHexColor } from '../lib/variantesColores'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (p: Product, quantity?: number, selectedVariant?: ProductVariant) => void
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(product?.imagen)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    if (product) {
      setCurrentImage(product.imagen)
      setQuantity(1)
      setIsHovering(false)
      if (product.variantes && product.variantes.length > 0) {
        const firstInStock = product.variantes.find(v => v.stockDisponible > 0) || product.variantes[0]
        setSelectedVariant(firstInStock)
      } else {
        setSelectedVariant(null)
      }
    }
  }, [product])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setZoomPos({ x, y })
  }

  if (!product) return null

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const effectivePrice = selectedVariant && Number(selectedVariant.precioBase) > 0
    ? Number(selectedVariant.precioBase)
    : product.precio

  const effectiveStock = selectedVariant
    ? selectedVariant.stockDisponible
    : product.stock

  const isAgotado = effectiveStock <= 0

  const handleAdd = () => {
    if (isAgotado) return
    onAddToCart(product, quantity, selectedVariant || undefined)
    setQuantity(1)
  }

  const varLabel = selectedVariant ? ` [${selectedVariant.nombre}]` : ''
  const whatsappMessage = encodeURIComponent(
    isAgotado
      ? `Hola Baby-World! Me interesa el producto agotado: "${product?.nombre}${varLabel}" (${fmtPrice(effectivePrice)}). ¿Cuándo tendrán disponibilidad nuevamente?`
      : `Hola Baby-World! Me interesa el producto: "${product?.nombre}${varLabel}" (${fmtPrice(effectivePrice)}). ¿Tienen disponibilidad inmediata?`
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

        {/* Product Image Stage */}
        <div className="w-full sm:w-1/2 flex flex-col gap-3 flex-shrink-0">
          <div 
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
            className="aspect-square bg-white rounded-2xl overflow-hidden relative shadow-inner border border-slate-200/90 cursor-crosshair select-none flex items-center justify-center group"
          >
            <img
              src={getOptimizedImageUrl(currentImage, 900)}
              alt={product.nombre}
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isHovering ? 'scale(2.2)' : 'scale(1)',
              }}
              className="w-full h-full object-contain p-2 transition-transform duration-150 ease-out pointer-events-none"
              loading="eager"
              decoding="async"
            />
            {isAgotado && (
              <span className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md tracking-wider pointer-events-none z-10">
                Agotado
              </span>
            )}
            {product.etapa && !isAgotado && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[9px] px-2.5 py-1 rounded-full shadow-sm border border-slate-100 pointer-events-none z-10">
                {product.etapa}
              </span>
            )}
            {/* Pill indicador de lupa */}
            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
              <ZoomIn size={12} className="text-sky-300" />
              <span>{isHovering ? 'Pasa el cursor' : 'Lupa zoom'}</span>
            </div>
          </div>
          
          {/* Thumbnails */}
          {product.imagenes && product.imagenes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.imagenes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(img)}
                  className={`w-14 h-14 shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                    currentImage === img ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img, 160)}
                    alt={`${product.nombre} - ${idx}`}
                    className="w-full h-full object-contain bg-white p-0.5"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="w-full sm:w-1/2 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.subcategoria ? `${product.categoria} • ${product.subcategoria}` : product.categoria}
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
                <span className={`font-bold flex items-center gap-1 text-[11px] ${
                  effectiveStock > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  <CheckCircle2 size={12} /> {effectiveStock > 0 ? `En Stock (${effectiveStock} und)` : 'Agotado'}
                </span>
              </div>

              {product.precioAnterior && product.precioAnterior > effectivePrice && (
                <div className="flex items-center justify-between text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl font-bold mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 line-through text-xs font-semibold">{fmtPrice(product.precioAnterior)}</span>
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      -{Math.round(((product.precioAnterior - effectivePrice) / product.precioAnterior) * 100)}% OFF
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-700">
                    ¡Ahorras {fmtPrice(product.precioAnterior - effectivePrice)}!
                  </span>
                </div>
              )}

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {fmtPrice(effectivePrice)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">COP</span>
              </div>

              {/* Simulador de Cuotas Addi y Sistecrédito */}
              <BnplCreditSimulator price={effectivePrice} className="mt-2" />
            </div>

            {/* Selector de Variantes (Colores y Tallas) */}
            {product.variantes && product.variantes.length > 0 && (
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles size={13} className="text-sky-500" />
                    <span>Color / Talla:</span>
                  </span>
                  {selectedVariant && (
                    <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                      {selectedVariant.nombre}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {product.variantes.map((v) => {
                    const visual = extraerAtributosVisuales(v.atributos, v.nombre)
                    const hexColor = visual.colorHex || buscarHexColor(v.nombre)
                    const isSelected = selectedVariant?.id === v.id
                    const inStock = v.stockDisponible > 0

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v)
                          setQuantity(1)
                        }}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/70 shadow-xs ring-2 ring-sky-200'
                            : inStock
                              ? 'border-slate-200 hover:border-slate-300 bg-white'
                              : 'border-slate-200/60 bg-slate-50 opacity-60'
                        }`}
                        title={`${v.nombre} (${inStock ? `${v.stockDisponible} disponibles` : 'Sin stock'})`}
                      >
                        {hexColor ? (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                            style={{ backgroundColor: hexColor }}
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {visual.tallaLabel || '•'}
                          </span>
                        )}
                        <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                          {v.nombre}
                        </span>
                        {!inStock && (
                          <span className="text-[9px] text-rose-500 font-semibold">(Agotado)</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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
            {!isAgotado ? (
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
                    onClick={() => setQuantity(Math.min(effectiveStock || 999, quantity + 1))}
                    className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
                <span>⚠️ Opción seleccionada agotada en inventario</span>
                <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-full">0 disponibles</span>
              </div>
            )}

            <div className="flex gap-2">
              {!isAgotado ? (
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-slate-900 hover:bg-sky-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={15} />
                  <span>Añadir a mi Bolsa ({fmtPrice(effectivePrice * quantity)})</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <span>Temporalmente Agotado</span>
                </button>
              )}

              <a
                href={`https://wa.me/573023863380?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                  isAgotado
                    ? 'px-4 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                }`}
                title={isAgotado ? 'Consultar reposición por WhatsApp' : 'Consultar por WhatsApp'}
              >
                <MessageCircle size={18} />
                {isAgotado && <span className="hidden sm:inline">Preguntar llegada</span>}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
