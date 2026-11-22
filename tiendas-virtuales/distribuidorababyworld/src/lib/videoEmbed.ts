/**
 * Utilidad para reproducir videos de distintas plataformas DENTRO de la tienda (sin abrir otra página).
 *
 * Soporta: TikTok, YouTube (incluye Shorts), Instagram (Reels/Posts), Facebook, Vimeo
 * y archivos directos (.mp4 / .webm / Cloudinary).
 *
 * Seguridad: nunca se inyecta la URL cruda en el iframe. Se extrae un ID validado con regex estrictas
 * y se construye la URL de embed oficial de cada plataforma. Los archivos directos solo se aceptan por https.
 */

export type PlataformaVideo = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'vimeo' | 'archivo'

export interface RawVideoInput {
  url: string
  titulo?: string
  plataforma?: PlataformaVideo
  vertical?: boolean
}

export interface VideoInfo {
  /** URL pública original (canonizada por el backend) */
  url: string
  titulo?: string
  plataforma: PlataformaVideo
  /** src del iframe (plataformas) o del <video> (archivo directo) */
  embedUrl: string
  esIframe: boolean
  /** Formato vertical 9:16 (TikTok, Shorts, Reels) u horizontal 16:9 */
  vertical: boolean
  /** Miniatura disponible sin API (YouTube, Cloudinary). Si no existe se usa la foto del producto. */
  thumbnail?: string
  /** URL de respaldo en caso de que el stream directo no esté disponible */
  iframeFallbackUrl?: string
}

export const PLATAFORMA_LABEL: Record<PlataformaVideo, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  vimeo: 'Vimeo',
  archivo: 'Video',
}

const MAX_VIDEOS = 6
const MAX_LARGO_URL = 600
const MAX_LARGO_TITULO = 80

const limpiarHost = (u: URL) => u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
const esDominio = (host: string, dominio: string) => host === dominio || host.endsWith(`.${dominio}`)

const posterCloudinary = (url: string) =>
  url
    .replace('/video/upload/', '/video/upload/so_1,w_600,c_limit,f_jpg/')
    .replace(/\.(mp4|webm|m4v|mov)(\?.*)?$/i, '.jpg')

export function parseVideoUrl(raw: unknown, titulo?: unknown): VideoInfo | null {
  if (typeof raw !== 'string') return null
  const texto = raw.trim()
  if (!texto || texto.length > MAX_LARGO_URL) return null

  let u: URL
  try {
    u = new URL(texto)
  } catch {
    return null
  }
  if (u.protocol === 'http:') u.protocol = 'https:'
  if (u.protocol !== 'https:') return null

  const host = limpiarHost(u)
  const tituloLimpio = typeof titulo === 'string' && titulo.trim()
    ? titulo.trim().slice(0, MAX_LARGO_TITULO)
    : undefined
  const base = { url: u.toString(), titulo: tituloLimpio }

  // ── TikTok: /@usuario/video/ID, /embed/v2/ID, /player/v1/ID ──
  if (esDominio(host, 'tiktok.com')) {
    const m = u.pathname.match(/\/(?:video|v|embed\/v2|embed|player\/v1)\/(\d{8,25})/)
    if (!m) return null
    const id = m[1]
    const canonical = `https://www.tiktok.com/@baby.world426/video/${id}`
    return {
      ...base,
      url: canonical,
      plataforma: 'tiktok',
      esIframe: false, // Reproduce nativamente en HTML5 sin marcas de agua de TikTok
      vertical: true,
      embedUrl: canonical,
      // URL de respaldo en iframe por si el stream CDN no responde
      iframeFallbackUrl: `https://www.tiktok.com/player/v1/${id}?embed_from=oembed&autoplay=1&muted=1&loop=1&description=0&music_info=0&rel=0`,
    }
  }

  // ── YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID ──
  if (esDominio(host, 'youtube.com') || host === 'youtu.be' || esDominio(host, 'youtube-nocookie.com')) {
    let id = ''
    let vertical = false
    const partes = u.pathname.split('/')
    if (host === 'youtu.be') {
      id = partes[1] || ''
    } else if (u.pathname.startsWith('/shorts/')) {
      id = partes[2] || ''
      vertical = true
    } else if (/^\/(embed|live|v)\//.test(u.pathname)) {
      id = partes[2] || ''
    } else {
      id = u.searchParams.get('v') || ''
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null
    return {
      ...base,
      plataforma: 'youtube',
      esIframe: true,
      vertical,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    }
  }

  // ── Instagram: /reel/CODE, /reels/CODE, /p/CODE, /tv/CODE ──
  if (esDominio(host, 'instagram.com')) {
    const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/)
    if (!m) return null
    const tipo = m[1] === 'p' ? 'p' : m[1] === 'tv' ? 'tv' : 'reel'
    return {
      ...base,
      plataforma: 'instagram',
      esIframe: true,
      vertical: true,
      embedUrl: `https://www.instagram.com/${tipo}/${m[2]}/embed/`,
    }
  }

  // ── Facebook: /videos/ID, /reel/ID, /watch?v=ID ──
  if (esDominio(host, 'facebook.com')) {
    const esVideo = /\/(videos|reel|watch)(\/|$)/.test(u.pathname) || u.searchParams.has('v')
    if (!esVideo) return null
    return {
      ...base,
      plataforma: 'facebook',
      esIframe: true,
      vertical: u.pathname.includes('/reel'),
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.toString())}&show_text=false&autoplay=true`,
    }
  }

  // ── Vimeo: vimeo.com/ID ──
  if (esDominio(host, 'vimeo.com')) {
    const m = u.pathname.match(/\/(?:video\/)?(\d{6,12})(?:\/|$)/)
    if (!m) return null
    return {
      ...base,
      plataforma: 'vimeo',
      esIframe: true,
      vertical: false,
      embedUrl: `https://player.vimeo.com/video/${m[1]}?autoplay=1&playsinline=1&title=0&byline=0&portrait=0`,
    }
  }

  // ── Archivo directo (.mp4, .webm) o video de Cloudinary ──
  const esCloudinaryVideo = host === 'res.cloudinary.com' && u.pathname.includes('/video/upload/')
  if (esCloudinaryVideo || /\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
    return {
      ...base,
      plataforma: 'archivo',
      esIframe: false,
      vertical: true,
      embedUrl: u.toString(),
      thumbnail: esCloudinaryVideo ? posterCloudinary(u.toString()) : undefined,
    }
  }

  return null
}

/** Convierte metadataWeb.videos (strings u objetos { url, titulo }) en una lista segura y sin duplicados. */
export function normalizarVideos(input: unknown): VideoInfo[] {
  if (!Array.isArray(input)) return []
  const resultado: VideoInfo[] = []
  const vistos = new Set<string>()
  for (const item of input) {
    const esObjeto = item !== null && typeof item === 'object'
    const raw = typeof item === 'string' ? item : esObjeto ? (item as { url?: unknown }).url : null
    const titulo = esObjeto ? (item as { titulo?: unknown }).titulo : undefined
    const info = parseVideoUrl(raw, titulo)
    if (info && !vistos.has(info.embedUrl)) {
      vistos.add(info.embedUrl)
      resultado.push(info)
    }
    if (resultado.length >= MAX_VIDEOS) break
  }
  return resultado
}

