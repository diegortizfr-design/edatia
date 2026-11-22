import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { VideoInfo } from '../lib/videoEmbed'

interface VideoPlayerProps {
  video: VideoInfo
  title: string
  poster?: string
}

/**
 * Reproductor universal:
 * - Para TikTok: resuelve en vivo el stream MP4 directo de alta calidad (100% libre de marcas de agua, likes o botones de terceros).
 * - Doble canal de resolución: API directa en cliente con respaldo a la API backend de Edatia (a prueba de adblockers).
 * - Para YouTube, Instagram, Facebook, Vimeo: iframe oficial optimizado.
 * - Para archivos directos: <video> HTML5 nativo con controles.
 */
export function VideoPlayer({ video, title, poster }: VideoPlayerProps) {
  const [cargado, setCargado] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(
    video.plataforma === 'tiktok' ? null : video.embedUrl
  )
  const [usarIframe, setUsarIframe] = useState(video.esIframe)
  const [fallo, setFallo] = useState(false)
  const [resolviendo, setResolviendo] = useState(video.plataforma === 'tiktok')

  // En celulares o videos sin autoplay, no dejamos el spinner pegado
  useEffect(() => {
    if (usarIframe || !streamUrl) return
    const timer = setTimeout(() => setCargado(true), 1500)
    return () => clearTimeout(timer)
  }, [usarIframe, streamUrl])

  // Resolver stream MP4 limpio en vivo para TikTok
  useEffect(() => {
    if (video.plataforma !== 'tiktok') {
      setStreamUrl(video.embedUrl)
      setResolviendo(false)
      return
    }

    let cancelado = false
    setResolviendo(true)
    setCargado(false)
    setFallo(false)

    async function resolverTikTok() {
      // 1. Intento directo en cliente con la API oficial pública de TikWM (CORS *)
      try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(video.url)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelado && data.code === 0 && data.data?.play) {
            setStreamUrl(data.data.play)
            setResolviendo(false)
            return
          }
        }
      } catch {
        // Posible adblocker local bloqueando dominios externos
      }

      // 2. Intento de respaldo a través de nuestra propia API backend
      try {
        const apiBase = import.meta.env.VITE_API_BASE || 'https://api.edatia.com/api/v1'
        const res = await fetch(
          `${apiBase}/public/tiendas/distribuidorababyworld/video-stream?url=${encodeURIComponent(video.url)}`
        )
        if (res.ok) {
          const data = await res.json()
          if (!cancelado && data?.playUrl) {
            setStreamUrl(data.playUrl)
            setResolviendo(false)
            return
          }
        }
      } catch {
        // Fallback final
      }

      // 3. Si ambos fallan, intentamos el iframe oficial antes de dar error fatal
      if (!cancelado) {
        setResolviendo(false)
        if (video.iframeFallbackUrl) {
          setUsarIframe(true)
        } else {
          setFallo(true)
        }
      }
    }

    resolverTikTok()
    return () => {
      cancelado = true
    }
  }, [video.url, video.plataforma, video.embedUrl, video.iframeFallbackUrl])

  const handleVideoError = () => {
    // Si el video HTML5 dispara error, intentar fallback a iframe
    if (!usarIframe && video.iframeFallbackUrl) {
      setUsarIframe(true)
    } else {
      setFallo(true)
    }
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {(!cargado || resolviendo) && !fallo && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/90 pointer-events-none">
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
            />
          )}
          <Loader2 size={32} className="animate-spin relative text-rose-500" />
          <span className="text-xs font-bold relative">
            {resolviendo ? 'Preparando video en alta definición…' : 'Cargando video…'}
          </span>
        </div>
      )}

      {fallo ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <AlertCircle size={32} className="text-rose-400" />
          <p className="text-sm font-bold">No pudimos reproducir este video</p>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            <span>Ver video original</span>
          </a>
        </div>
      ) : usarIframe ? (
        <iframe
          src={video.iframeFallbackUrl || video.embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={() => setCargado(true)}
        />
      ) : streamUrl ? (
        <video
          key={streamUrl}
          src={streamUrl}
          poster={poster}
          title={title}
          className="w-full h-full object-contain"
          controls
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          {...({ referrerPolicy: 'no-referrer' } as any)}
          onLoadedData={() => setCargado(true)}
          onCanPlay={() => setCargado(true)}
          onPlay={() => setCargado(true)}
          onError={handleVideoError}
        />
      ) : null}
    </div>
  )
}
