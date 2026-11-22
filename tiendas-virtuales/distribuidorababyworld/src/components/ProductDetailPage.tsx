import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, Star, ShoppingBag, MessageCircle, CheckCircle2, 
  Truck, HeartHandshake, Share2, Plus, Minus,
  ChevronRight, ChevronLeft, PackageCheck, Sparkles,
  ZoomIn, Maximize2, X, Play
} from 'lucide-react'
import { LocationPinIcon } from './LocationPinIcon'
import { Product, ProductVariant } from '../data/productos'
import { ProductCard } from './ProductCard'
import { BnplCreditSimulator } from './BnplCreditSimulator'
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../lib/imageOptimizer'
import { extraerAtributosVisuales, buscarHexColor } from '../lib/variantesColores'
import { VideoReelModal, VideoReelItem } from './VideoReelModal'
import toast from 'react-hot-toast'

interface ProductDetailPageProps {
  product: Product
  allProducts: Product[]
  onBack: () => void
  onSelectProduct: (p: Product) => void
  onAddToCart: (p: Product, quantity?: number, selectedVariant?: ProductVariant) => void
  onOpenCart: () => void
  onOpenLocation?: () => void
}

export function ProductDetailPage({
  product,
  allProducts,
  onBack,
  onSelectProduct,
  onAddToCart,
  onOpenCart,
  onOpenLocation,
}: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(product.imagen)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [videoModalIndex, setVideoModalIndex] = useState<number | null>(null)

  const gallery = (product.imagenes && product.imagenes.length > 0)
    ? product.imagenes
    : [currentImage || product.imagen]

  // Scroll to top whenever product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setQuantity(1)
    setCurrentImage(product.imagen)
    setIsHovering(false)
    if (product.variantes && product.variantes.length > 0) {
      const firstInStock = product.variantes.find(v => v.stockDisponible > 0) || product.variantes[0]
      setSelectedVariant(firstInStock)
    } else {
      setSelectedVariant(null)
    }
  }, [product.id, product.imagen])

  // Controles de teclado para el Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight' && gallery.length > 1) {
        setLightboxIndex((prev) => (prev + 1) % gallery.length)
      }
      if (e.key === 'ArrowLeft' && gallery.length > 1) {
        setLightboxIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, gallery.length])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setZoomPos({ x, y })
  }

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const getVariantPriceInfo = (v: ProductVariant | null, prod: Product) => {
    if (!v) {
      return {
        precio: prod.precio,
        precioSubtotal: prod.precioSubtotal,
        impuesto: prod.impuesto,
        precioAnterior: prod.precioAnterior,
      }
    }

    if (typeof v.precio === 'number' && v.precio > 0) {
      return {
        precio: v.precio,
        precioSubtotal: typeof v.precioSubtotal === 'number' ? v.precioSubtotal : v.precio,
        impuesto: typeof v.impuesto === 'number' ? v.impuesto : 0,
        precioAnterior: v.precioAnterior ?? prod.precioAnterior,
      }
    }

    // Fallback defensivo:
    // Si precioBase de la variante es <= 0 o igual al precioBase del producto, hereda los precios del producto
    const vBase = Number(v.precioBase || 0)
    const pBase = Number(prod.precioBase || 0)
    if (vBase <= 0 || (pBase > 0 && vBase === pBase)) {
      return {
        precio: prod.precio,
        precioSubtotal: prod.precioSubtotal,
        impuesto: prod.impuesto,
        precioAnterior: prod.precioAnterior,
      }
    }

    // Si tiene un precioBase diferente (variante más cara o más económica), escalar proporcionalmente
    const ratio = pBase > 0 ? (prod.precio / pBase) : 1
    const subRatio = (pBase > 0 && prod.precioSubtotal) ? (prod.precioSubtotal / pBase) : 1
    const taxRatio = (pBase > 0 && prod.impuesto) ? (prod.impuesto / pBase) : 0

    return {
      precio: Math.round(vBase * ratio),
      precioSubtotal: Math.round(vBase * subRatio),
      impuesto: Math.round(vBase * taxRatio),
      precioAnterior: prod.precioAnterior && pBase > 0 ? Math.round(vBase * (prod.precioAnterior / pBase)) : undefined,
    }
  }

  const variantPricing = getVariantPriceInfo(selectedVariant, product)
  const effectivePrice = variantPricing.precio
  const effectiveSubtotal = variantPricing.precioSubtotal
  const effectiveImpuesto = variantPricing.impuesto
  const effectivePrecioAnterior = variantPricing.precioAnterior

  const effectiveStock = selectedVariant
    ? selectedVariant.stockDisponible
    : product.stock

  const isAgotado = effectiveStock <= 0

  const handleAdd = () => {
    if (isAgotado) return
    onAddToCart(product, quantity, selectedVariant || undefined)
  }

  const handleBuyNow = () => {
    if (isAgotado) return
    onAddToCart(product, quantity, selectedVariant || undefined)
    onOpenCart()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nombre,
        text: `Mira ${product.nombre} en Distribuidora Baby-World`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado al portapapeles', { icon: '🔗' })
    }
  }

  const varLabel = selectedVariant ? ` [${selectedVariant.nombre}]` : ''
  const videoItems: VideoReelItem[] = (product.videos || []).map(v => ({
    video: v,
    product,
    precio: effectivePrice,
    stock: effectiveStock,
    etiqueta: selectedVariant ? selectedVariant.nombre : undefined,
  }))
  const whatsappMessage = encodeURIComponent(
    isAgotado
      ? `Hola Baby-World! Me interesa el producto agotado: "${product.nombre}${varLabel}" (${fmtPrice(effectivePrice)}). ¿Cuándo tendrán disponibilidad nuevamente?`
      : `Hola Baby-World! Me interesa ordenar: "${product.nombre}${varLabel}" (${fmtPrice(effectivePrice)} x ${quantity} und). ¿Tienen disponibilidad para envío?`
  )

  // Similar/Related products (excluding current product)
  const similarProducts = allProducts
    .filter(p => p.id !== product.id && (p.categoria === product.categoria || p.subcategoria === product.subcategoria))
    .slice(0, 6)

  // Fallback if not enough similar in same category
  const moreProducts = similarProducts.length >= 4 
    ? similarProducts 
    : [
        ...similarProducts,
        ...allProducts.filter(p => p.id !== product.id && !similarProducts.some(s => s.id === p.id)).slice(0, 6 - similarProducts.length)
      ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-16 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-14 sm:top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft size={15} />
            <span>Volver al Catálogo</span>
          </button>

          {/* Breadcrumb path for desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate max-w-md">
            <span>Inicio</span>
            <ChevronRight size={13} />
            <span className="text-slate-600">{product.categoria}</span>
            {product.subcategoria && (
              <>
                <ChevronRight size={13} />
                <span className="text-slate-600">{product.subcategoria}</span>
              </>
            )}
          </div>

          {/* Quick Share */}
          <button
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            title="Compartir producto"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-start">
            
            {/* Product Image Stage con Lupa Interactiva */}
            <div className="relative space-y-4">
              <div 
                onClick={() => {
                  const currentIdx = gallery.indexOf(currentImage)
                  setLightboxIndex(currentIdx >= 0 ? currentIdx : 0)
                  setIsLightboxOpen(true)
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                className="aspect-square bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex items-center justify-center relative group cursor-crosshair select-none"
              >
                <img
                  src={getOptimizedImageUrl(currentImage, 1000)}
                  alt={product.nombre}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isHovering ? 'scale(2.2)' : 'scale(1)',
                  }}
                  className="w-full h-full object-contain p-2 sm:p-4 transition-transform duration-150 ease-out pointer-events-none"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget
                    if (target.src !== FALLBACK_IMAGE) {
                      target.src = FALLBACK_IMAGE
                    }
                  }}
                />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
                  {isAgotado && (
                    <span className="bg-slate-900/90 backdrop-blur-md text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-md tracking-wider">
                      Agotado
                    </span>
                  )}
                  {product.etapa && (
                    <span className="bg-slate-900/90 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-md">
                      {product.etapa}
                    </span>
                  )}
                  {product.esNovedad && (
                    <span className="bg-sky-500 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-md">
                      ✨ Nuevo
                    </span>
                  )}
                  {product.videos && product.videos.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setVideoModalIndex(0)
                      }}
                      className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                      title="Ver demostración en video"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>Ver en Video</span>
                    </button>
                  )}
                </div>

                {/* Botón flotante de Pantalla Completa */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentIdx = gallery.indexOf(currentImage)
                    setLightboxIndex(currentIdx >= 0 ? currentIdx : 0)
                    setIsLightboxOpen(true)
                  }}
                  className="absolute top-3 right-3 p-2.5 bg-white/95 hover:bg-white text-slate-700 hover:text-sky-600 rounded-2xl shadow-md border border-slate-200/80 transition-all hover:scale-105 active:scale-95 z-10 cursor-pointer"
                  title="Ampliar en pantalla completa"
                >
                  <Maximize2 size={16} />
                </button>

                {/* Indicador inferior de lupa */}
                <div className={`absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-700 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 flex items-center gap-1.5 pointer-events-none transition-all duration-200 z-10 ${
                  isHovering ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}>
                  <ZoomIn size={13} className="text-sky-600" />
                  <span>Pasa el cursor o clic para lupa</span>
                </div>
              </div>
              
              {/* Media Thumbnails: Imágenes y Videos */}
              {((product.imagenes && product.imagenes.length > 1) || (product.videos && product.videos.length > 0)) && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 snap-x">
                  {/* Videos de demostración con badge Play */}
                  {product.videos && product.videos.map((vid, vidIdx) => (
                    <button
                      key={`vid-${vidIdx}`}
                      type="button"
                      onClick={() => setVideoModalIndex(vidIdx)}
                      className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-rose-400 hover:border-rose-500 bg-slate-900 shadow-sm transition-all cursor-pointer group snap-start"
                      title={`Ver video: ${vid.titulo || product.nombre}`}
                    >
                      <img
                        src={vid.thumbnail || getOptimizedImageUrl(product.imagen, 180)}
                        alt="Video"
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (target.src !== FALLBACK_IMAGE) {
                            target.src = FALLBACK_IMAGE
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-white text-rose-500 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play size={13} fill="currentColor" className="ml-0.5" />
                        </span>
                      </div>
                      <span className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-black py-0.5 px-1 rounded truncate text-center uppercase">
                        Video
                      </span>
                    </button>
                  ))}

                  {/* Fotos del producto */}
                  {product.imagenes && product.imagenes.map((img, idx) => (
                    <button
                      key={`img-${idx}`}
                      onClick={() => setCurrentImage(img)}
                      className={`relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer snap-start ${
                        currentImage === img 
                          ? 'border-sky-500 ring-2 ring-sky-200 shadow-sm' 
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(img, 180)}
                        alt={`${product.nombre} view ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (target.src !== FALLBACK_IMAGE) {
                            target.src = FALLBACK_IMAGE
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info & Actions */}
            <div className="flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                {/* Category & Rating */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {product.subcategoria ? `${product.categoria} • ${product.subcategoria}` : product.categoria}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star size={14} fill="currentColor" />
                      <span>{product.rating}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-medium">({product.reviewsCount || 45} pedidos)</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {product.nombre}
                </h1>

                {/* In Stock Badge (Conectado al Control de Existencias) */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {effectiveStock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-md">
                      <PackageCheck size={13} />
                      <span>
                        {effectiveStock < 999
                          ? `En Stock (${effectiveStock} ${effectiveStock === 1 ? 'unidad disponible' : 'unidades disponibles'})`
                          : 'Disponible para Despacho Inmediato'}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 border border-rose-100 font-bold px-2.5 py-0.5 rounded-md">
                      Agotado temporalmente
                    </span>
                  )}
                  <span className="text-slate-400 font-medium">• Pago contra entrega</span>
                </div>

                {/* Price Breakdown: Subtotal + Impuesto (IVA) = Total */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 space-y-2">
                  {effectivePrecioAnterior && effectivePrecioAnterior > effectivePrice && (
                    <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs text-amber-950 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 px-3 py-1.5 rounded-xl font-bold">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 line-through text-xs font-semibold">{fmtPrice(effectivePrecioAnterior)}</span>
                        <span className="bg-gradient-to-r from-slate-950 to-slate-900 text-amber-300 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-xs shrink-0">
                          <span>🔥</span>
                          <span>BLACK FRIDAY -{Math.round(((effectivePrecioAnterior - effectivePrice) / effectivePrecioAnterior) * 100)}%</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-amber-800 shrink-0">
                        ¡Ahorras {fmtPrice(effectivePrecioAnterior - effectivePrice)}!
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Subtotal producto:</span>
                    <span className="font-bold text-slate-800">{fmtPrice(effectiveSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {product.ivaPct > 0
                        ? `Impuesto (IVA ${product.ivaPct}%):`
                        : 'Impuesto (Exento / Excluido):'}
                    </span>
                    <span className="font-bold text-slate-800">{fmtPrice(effectiveImpuesto)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-700">
                      Total (Precio + Impuesto)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {fmtPrice(effectivePrice)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold uppercase">COP</span>
                    </div>
                  </div>
                </div>

                {/* Simulador de Cuotas Addi y Sistecrédito */}
                <BnplCreditSimulator price={effectivePrice} className="my-2" />

                {/* Selector de Variantes (Colores y Tallas) */}
                {product.variantes && product.variantes.length > 0 && (
                  <div className="pt-3 pb-1 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-sky-500" />
                        <span>Selecciona Color / Talla:</span>
                      </span>
                      {selectedVariant && (
                        <span className="font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100 text-xs">
                          {selectedVariant.nombre}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
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
                            className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-2 ring-sky-200'
                                : inStock
                                  ? 'border-slate-200 hover:border-slate-300 bg-white'
                                  : 'border-slate-200/60 bg-slate-50 opacity-60'
                            }`}
                            title={`${v.nombre} (${inStock ? `${v.stockDisponible} disponibles` : 'Sin stock'})`}
                          >
                            {hexColor ? (
                              <span
                                className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                style={{ backgroundColor: hexColor }}
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500 font-mono">
                                {visual.tallaLabel || '•'}
                              </span>
                            )}
                            <div className="text-left">
                              <span className={`text-xs font-bold block leading-tight ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                                {v.nombre}
                              </span>
                              <span className={`text-[10px] block ${inStock ? 'text-emerald-600 font-semibold' : 'text-rose-500'}`}>
                                {inStock ? `${v.stockDisponible} und` : 'Agotado'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {product.descripcionLarga || product.descripcion}
                </p>

                {/* Feature Highlights */}
                {product.detalles && product.detalles.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Características Principales:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.detalles.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          <CheckCircle2 size={15} className="text-sky-500 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Specifications Table */}
                {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Ficha Técnica:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-100 text-xs space-y-1.5">
                      {Object.entries(product.especificaciones).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-slate-200/50 last:border-none">
                          <span className="text-slate-500 font-medium">{key}</span>
                          <span className="text-slate-900 font-bold text-right">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Actions Container */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                {!isAgotado ? (
                  <div className="flex items-center gap-3">
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl p-1 shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
                        aria-label="Disminuir"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="px-3 text-xs sm:text-sm font-extrabold text-slate-900 min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(Math.max(1, effectiveStock), quantity + 1))}
                        disabled={quantity >= effectiveStock}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all disabled:opacity-40"
                        aria-label="Aumentar"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAdd}
                      className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <ShoppingBag size={17} />
                      <span>Añadir a mi Bolsa • {fmtPrice(effectivePrice * quantity)}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-800 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Producto temporalmente agotado</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs">
                      Sin existencias
                    </span>
                  </div>
                )}

                {/* Direct WhatsApp Ordering */}
                <a
                  href={`https://wa.me/573136546975?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 px-4 text-white rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    isAgotado
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  }`}
                >
                  <MessageCircle size={18} />
                  <span>{isAgotado ? 'Consultar disponibilidad por WhatsApp' : 'Asesoría o Pedido por WhatsApp'}</span>
                </a>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                    <Truck size={15} className="text-sky-500" />
                    <span>Envíos Nacionales</span>
                  </div>
                  {onOpenLocation ? (
                    <button
                      type="button"
                      onClick={onOpenLocation}
                      className="p-2 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 rounded-xl flex flex-col items-center gap-1 text-rose-800 transition-all cursor-pointer group"
                      title="Ver ubicación en Poblado Campestre y cómo llegar"
                    >
                      <LocationPinIcon size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="font-bold">Tienda Física</span>
                    </button>
                  ) : (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                      <LocationPinIcon size={16} />
                      <span>Tienda Física</span>
                    </div>
                  )}
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                    <HeartHandshake size={15} className="text-pink-500" />
                    <span>Pago Contra Entrega</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SIMILAR / MORE PRODUCTS SECTION (Continuous Browsing)             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-10 sm:mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-600">
                  Explora más opciones
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                  {product.categoria}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                Productos Similares y Recomendados
              </h2>
            </div>

            <button
              onClick={onBack}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-center"
            >
              <span>Ver todo el catálogo</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Responsive 2-column mobile grid / 3-4 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {moreProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={onAddToCart}
                onViewDetails={onSelectProduct}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Buy Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3.5">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Total</span>
          <span className="text-base font-black text-slate-900 truncate block mt-0.5">
            {fmtPrice(effectivePrice * quantity)}
          </span>
        </div>

        <button
          onClick={handleAdd}
          disabled={isAgotado}
          className={`flex-1 py-3 px-4 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all ${
            isAgotado
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          <ShoppingBag size={16} />
          <span>{isAgotado ? 'Agotado' : 'Añadir a la Bolsa'}</span>
        </button>
      </div>

      {/* ── MODAL LIGHTBOX / ZOOM EN PANTALLA COMPLETA ── */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Lightbox */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                  {product.nombre}
                </span>
                {gallery.length > 1 && (
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full shrink-0">
                    {lightboxIndex + 1} de {gallery.length}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Cerrar (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stage de Imagen del Lightbox */}
            <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-8 overflow-hidden relative select-none min-h-[320px] max-h-[72vh]">
              {gallery.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-lg border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 cursor-pointer"
                  title="Foto anterior (←)"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <img
                src={getOptimizedImageUrl(gallery[lightboxIndex], 1400)}
                alt={`${product.nombre} - ${lightboxIndex + 1}`}
                className="max-h-[68vh] max-w-full object-contain drop-shadow-sm transition-all duration-300"
                onError={(e) => {
                  const target = e.currentTarget
                  if (target.src !== FALLBACK_IMAGE) {
                    target.src = FALLBACK_IMAGE
                  }
                }}
              />

              {gallery.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % gallery.length)}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-lg border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 cursor-pointer"
                  title="Siguiente foto (→)"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Miniaturas en el pie del Lightbox si hay varias fotos */}
            {gallery.length > 1 && (
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-center gap-2 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      lightboxIndex === i 
                        ? 'border-sky-500 ring-2 ring-sky-200 scale-105' 
                        : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img 
                      src={getOptimizedImageUrl(img, 120)} 
                      alt="" 
                      className="w-full h-full object-contain p-0.5" 
                      onError={(e) => {
                        const target = e.currentTarget
                        if (target.src !== FALLBACK_IMAGE) {
                          target.src = FALLBACK_IMAGE
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL REPRODUCTOR DE VIDEO REEL / IN-STORE ── */}
      {videoModalIndex !== null && videoItems.length > 0 && (
        <VideoReelModal
          items={videoItems}
          startIndex={videoModalIndex}
          onClose={() => setVideoModalIndex(null)}
          onAddToCart={() => onAddToCart(product, quantity, selectedVariant || undefined)}
          variantesResueltas={true}
        />
      )}
    </div>
  )
}
