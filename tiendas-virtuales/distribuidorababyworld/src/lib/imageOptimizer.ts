/**
 * Utilidad de optimización dinámica de imágenes para Distribuidora Baby World.
 * Inyecta transformaciones automáticas de CDN (Cloudinary / Unsplash) para reducir el peso
 * hasta en un 95% sirviendo formatos de última generación (WebP / AVIF) y resoluciones acordes.
 */

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80'

export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 500
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_IMAGE
  }

  const cleanUrl = url.trim()

  // 1. Cloudinary: Inyectar transformaciones (f_auto, q_auto, w_X, c_limit)
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/')) {
    // Si ya contiene parámetros de transformación previos, no duplicarlos
    if (cleanUrl.includes('/upload/f_auto') || cleanUrl.includes('/upload/q_auto')) {
      return cleanUrl
    }

    const transformation = `f_auto,q_auto,w_${width},c_limit`
    return cleanUrl.replace('/upload/', `/upload/${transformation}/`)
  }

  // 2. Unsplash: Parametrizar ancho y formato web
  if (cleanUrl.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(cleanUrl)
      parsed.searchParams.set('w', width.toString())
      parsed.searchParams.set('auto', 'format')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('q', '80')
      return parsed.toString()
    } catch {
      return cleanUrl
    }
  }

  // 3. Imágenes locales o relativas (se mantienen intactas)
  return cleanUrl
}
