import React from 'react'

interface WazeIconProps {
  className?: string
  size?: number
}

/**
 * Icono vectorial oficial de Waze (Carita sonriente en forma de globo con ruedas)
 * Colores corporativos oficiales de Waze:
 * - Cuerpo celeste Waze: #33CCFF
 * - Ojos, sonrisa y ruedas: #1E293B
 * - Rines interiores: #FFFFFF
 */
export function WazeIcon({ className = '', size = 18 }: WazeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Waze"
    >
      {/* Cuerpo principal celeste oficial de Waze */}
      <path
        fill="#33CCFF"
        d="M13.314 1.59c-.225.003-.45.013-.675.03-2.165.155-4.295.924-6.069 2.327-2.194 1.732-3.296 4.325-3.496 7.05h.002c-.093 1.22-.23 2.15-.469 2.63-.238.479-.42.638-1.24.639C.27 14.259-.4 15.612.266 16.482c1.248 1.657 2.902 2.705 4.72 3.364a2.198 2.198 0 00-.033.367 2.198 2.198 0 002.2 2.197 2.198 2.198 0 002.128-1.668c1.307.12 2.607.14 3.824.1.364-.012.73-.045 1.094-.092a2.198 2.198 0 002.127 1.66 2.198 2.198 0 002.2-2.197 2.198 2.198 0 00-.151-.797 12.155 12.155 0 002.303-1.549c2.094-1.807 3.511-4.399 3.302-7.404-.112-1.723-.761-3.298-1.748-4.608-2.143-2.86-5.53-4.309-8.918-4.265z"
      />

      {/* Ruedas inferiores oscuras */}
      <circle cx="6.8" cy="20.4" r="2.1" fill="#1E293B" />
      <circle cx="16.5" cy="20.4" r="2.1" fill="#1E293B" />
      <circle cx="6.8" cy="20.4" r="0.75" fill="#FFFFFF" />
      <circle cx="16.5" cy="20.4" r="0.75" fill="#FFFFFF" />

      {/* Ojos expresivos oscuros */}
      <circle cx="9.75" cy="8.9" r="1.3" fill="#1E293B" />
      <circle cx="15.25" cy="8.9" r="1.3" fill="#1E293B" />

      {/* Sonrisa amigable de Waze */}
      <path
        d="M9.64 11.78a.72.72 0 00-.59.32.69.69 0 00-.11.54c.35 1.78 2.18 3.13 4.26 3.13h.13c1.06-.03 2.03-.34 2.82-.92.77-.56 1.29-1.32 1.48-2.14a.75.75 0 00-.1-.55.69.69 0 00-.44-.32.71.71 0 00-.87.54c-.22.93-1.3 1.9-2.93 1.94-1.57.05-2.74-.99-2.93-1.96a.72.72 0 00-.72-.58z"
        fill="#1E293B"
      />
    </svg>
  )
}
