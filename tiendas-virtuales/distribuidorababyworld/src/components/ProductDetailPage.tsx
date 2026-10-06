import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, Star, ShoppingBag, MessageCircle, CheckCircle2, 
  Truck, ShieldCheck, HeartHandshake, Share2, Plus, Minus,
  ChevronRight, Sparkles, Tag, PackageCheck
} from 'lucide-react'
import { Product } from '../data/productos'
import { ProductCard } from './ProductCard'
import toast from 'react-hot-toast'

interface ProductDetailPageProps {
  product: Product
  allProducts: Product[]
  onBack: () => void
  onSelectProduct: (p: Product) => void
  onAddToCart: (p: Product, quantity?: number) => void
  onOpenCart: () => void
}

export function ProductDetailPage({
  product,
  allProducts,
  onBack,
  onSelectProduct,
  onAddToCart,
  onOpenCart
}: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1)

  // Scroll to top whenever product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setQuantity(1)
  }, [product.id])

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const handleAdd = () => {
    onAddToCart(product, quantity)
  }

  const handleBuyNow = () => {
    onAddToCart(product, quantity)
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

  const whatsappMessage = encodeURIComponent(
    `Hola Baby-World! Me interesa ordenar: "${product.nombre}" (${fmtPrice(product.precio)} x ${quantity} und). ¿Tienen disponibilidad para envío?`
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
            
            {/* Product Image Stage */}
            <div className="relative">
              <div className="aspect-square bg-slate-50 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-inner flex items-center justify-center relative group">
                <img
                  src={product.imagen}
                  alt={product.nombre}
                  className="w-full h-full object-cover sm:object-contain group-hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
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
                </div>
              </div>
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

                {/* In Stock Badge */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-md">
                    <PackageCheck size={13} />
                    <span>En Stock para Despacho Inmediato</span>
                  </span>
                  <span className="text-slate-400 font-medium">• Pago contra entrega</span>
                </div>

                {/* Clean Price (No strikethrough/discount) */}
                <div className="py-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {fmtPrice(product.precio)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase">COP</span>
                </div>

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
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
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
                    <span>Añadir a mi Bolsa • {fmtPrice(product.precio * quantity)}</span>
                  </button>
                </div>

                {/* Direct WhatsApp Ordering */}
                <a
                  href={`https://wa.me/573023863380?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <MessageCircle size={18} />
                  <span>Pedir / Consultar por WhatsApp</span>
                </a>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                    <Truck size={15} className="text-sky-500" />
                    <span>Envíos Nacionales</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                    <HeartHandshake size={15} className="text-pink-500" />
                    <span>Pago Contra Entrega</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    <span>Garantía Baby-World</span>
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
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Total</span>
          <span className="text-base font-black text-slate-900 truncate block mt-0.5">
            {fmtPrice(product.precio * quantity)}
          </span>
        </div>

        <button
          onClick={handleAdd}
          className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all"
        >
          <ShoppingBag size={15} />
          <span>Añadir a la Bolsa</span>
        </button>
      </div>
    </div>
  )
}
