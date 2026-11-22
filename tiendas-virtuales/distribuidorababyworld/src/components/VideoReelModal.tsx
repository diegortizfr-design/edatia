import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ShoppingBag, SlidersHorizontal, ExternalLink } from 'lucide-react'
import { Product } from '../data/productos'
import { VideoInfo } from '../lib/videoEmbed'
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../lib/imageOptimizer'
import { analytics } from '../lib/analytics'
import { VideoPlayer } from './VideoPlayer'
import { PlatformBadge } from './VideoPoster'

export interface VideoReelItem {
  video: VideoInfo
  product: Product
  /** Precio/stock de la variante seleccionada (ficha de producto) */
  precio?: number
  stock?: number
  etiqueta?: string
}

interface VideoReelModalProps {
  items: VideoReelItem[]
  startIndex?: number
  onClose: () => void
  onAddToCart?: (item: VideoReelItem) => void
  /** Si se omite (ya estamos en la ficha), no se muestra "Ver detalles" */
  onViewProduct?: (product: Product) => void
  /** true cuando la talla/color ya está elegida (ficha de producto) */
  variantesResueltas?: boolean
}

const fmtPrice = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

/**
 * Visor de videos estilo "Reels": pantalla completa en celular, centrado en PC.
 * Mantiene al cliente dentro de la tienda con el producto y el botón de compra siempre visibles.
 * El botón "atrás" del celular cierra el visor en lugar de salir de la tienda.
 */
export function VideoReelModal({
  items,
  startIndex = 0,
  onClose,
  onAddToCart,
  onViewProduct,
  variantesResueltas = false,
}: VideoReelModalProps) {
  const total = items.length
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, total - 1)))

  const cerrar = useCallback((despues?: () => void) => {
    onClose()
    despues?.()
  }, [onClose])

  // Bloquear el scroll de la página mientras el visor está abierto
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  const irA = useCallback((delta: number) => {
    if (total <= 1) return
    setIndex(i => (i + delta + total) % total)
  }, [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') irA(1)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') irA(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cerrar, irA])

  const item = items[index]

  useEffect(() => {
    if (item?.product) {
      analytics.verVideo(item.product.id, item.product.nombre, item.video.plataforma)
    }
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null

  const { video, product } = item
  const precio = item.precio ?? product.precio
  const stock = item.stock ?? product.stock
  const agotado = stock <= 0
  const requiereVariante = !variantesResueltas && Boolean(product.tieneVariantes && product.variantes?.length)
  const titulo = video.titulo || product.nombre

  const handleCta = () => {
    if (agotado) return
    if (requiereVariante) {
      if (onViewProduct) cerrar(() => onViewProduct(product))
      else cerrar()
      return
    }
    onAddToCart?.(item)
  }

  const navBtn = 'w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer'

  return (
    <div
      onClick={() => cerrar()}
      className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Video: ${titulo}`}
    >
      {/* Encabezado: progreso, plataforma, título y cerrar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 space-y-2.5 z-10"
      >
        {total > 1 && (
          <div className="flex gap-1 max-w-md mx-auto">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al video ${i + 1}`}
                className={`h-1 flex-1 rounded-full transition-colors cursor-pointer ${i === index ? 'bg-white' : i < index ? 'bg-white/60' : 'bg-white/25'}`}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <PlatformBadge plataforma={video.plataforma} />
            <span className="text-white text-xs sm:text-sm font-bold truncate">{titulo}</span>
            {total > 1 && (
              <span className="text-white/50 text-[11px] font-bold shrink-0">{index + 1}/{total}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Abrir enlace original"
              aria-label="Abrir enlace original"
            >
              <ExternalLink size={17} />
            </a>
            <button
              type="button"
              onClick={() => cerrar()}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar video"
              title="Cerrar (Esc o clic afuera)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Escenario del video (clic en el fondo oscuro cierra el visor) */}
      <div
        onClick={() => cerrar()}
        className="flex-1 min-h-0 relative flex items-center justify-center px-2 sm:px-24 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`${video.vertical ? 'h-full aspect-[9/16] max-w-full' : 'w-full max-w-4xl aspect-video max-h-full'} cursor-default`}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-black">
            <VideoPlayer
              key={`${index}-${video.embedUrl}`}
              video={video}
              title={titulo}
              poster={video.thumbnail || getOptimizedImageUrl(product.imagen, 600)}
            />
          </div>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                irA(-1)
              }}
              className={`${navBtn} hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2`}
              aria-label="Video anterior"
              title="Video anterior (←)"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                irA(1)
              }}
              className={`${navBtn} hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2`}
              aria-label="Video siguiente"
              title="Video siguiente (→)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Barra inferior: producto y botón de compra siempre a mano */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 px-3 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-10"
      >
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {total > 1 && (
            <button type="button" onClick={() => irA(-1)} className={`${navBtn} sm:hidden`} aria-label="Video anterior">
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="flex-1 min-w-0 bg-white rounded-2xl p-2 flex items-center gap-2.5 shadow-xl">
            <button
              type="button"
              onClick={onViewProduct ? () => cerrar(() => onViewProduct(product)) : undefined}
              disabled={!onViewProduct}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left disabled:cursor-default"
              title={onViewProduct ? 'Ver detalles del producto' : undefined}
            >
              <img
                src={getOptimizedImageUrl(product.imagen, 120)}
                alt={product.nombre}
                className="w-11 h-11 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
                onError={(e) => {
                  const target = e.currentTarget
                  if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE
                }}
              />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-1">{product.nombre}</p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {fmtPrice(precio)}
                  {item.etiqueta && <span className="text-[10px] font-bold text-slate-500 ml-1">• {item.etiqueta}</span>}
                </p>
                {onViewProduct && (
                  <span className="text-[10px] font-bold text-sky-600 flex items-center gap-0.5">
                    Ver detalles <ChevronRight size={11} />
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={handleCta}
              disabled={agotado}
              className="shrink-0 h-10 px-3 sm:px-4 rounded-xl bg-slate-900 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              {agotado ? (
                <span>Agotado</span>
              ) : requiereVariante ? (
                <>
                  <SlidersHorizontal size={14} />
                  <span>Elegir opción</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  <span>Añadir</span>
                </>
              )}
            </button>
          </div>

          {total > 1 && (
            <button type="button" onClick={() => irA(1)} className={`${navBtn} sm:hidden`} aria-label="Video siguiente">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
