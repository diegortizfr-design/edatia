import React from 'react'
import { Play } from 'lucide-react'
import { VideoInfo, PlataformaVideo } from '../lib/videoEmbed'
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../lib/imageOptimizer'

export function PlatformBadge({ className = '' }: { plataforma?: PlataformaVideo; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${className}`}>
      <Play size={9} fill="currentColor" />
      <span>Video</span>
    </span>
  )
}

interface VideoPosterProps {
  video: VideoInfo
  /** Foto del producto: se usa como portada cuando la plataforma no entrega miniatura (TikTok, Instagram...) */
  fallbackImage?: string
  alt: string
  size?: number
  /** Versión pequeña para miniaturas (sin etiqueta de plataforma) */
  compact?: boolean
}

/** Portada liviana del video (no carga el reproductor hasta que el cliente toca "play"). */
export function VideoPoster({ video, fallbackImage, alt, size = 400, compact = false }: VideoPosterProps) {
  const src = video.thumbnail || getOptimizedImageUrl(fallbackImage, size)
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget
    if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {video.thumbnail ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={handleError} className="w-full h-full object-cover" />
      ) : (
        <>
          {/* Fondo desenfocado + producto completo al centro: se ve como portada de video, sin recortar la foto */}
          <img src={src} alt="" aria-hidden loading="lazy" decoding="async" onError={handleError} className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-70" />
          <img src={src} alt={alt} loading="lazy" decoding="async" onError={handleError} className="relative w-full h-full object-contain p-2" />
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${compact ? 'w-8 h-8' : 'w-14 h-14'} rounded-full bg-white/95 text-rose-500 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Play size={compact ? 14 : 24} fill="currentColor" className="ml-0.5" />
        </span>
      </div>

      {!compact && <PlatformBadge plataforma={video.plataforma} className="absolute top-2.5 left-2.5" />}
    </div>
  )
}

