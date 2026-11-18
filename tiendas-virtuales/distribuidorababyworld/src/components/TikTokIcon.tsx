import React from 'react'

interface TikTokIconProps {
  className?: string
  size?: number
  chromatic?: boolean
}

/**
 * Icono vectorial SVG oficial de TikTok.
 * Con chromatic={true}: Renderiza la clásica aberración cromática oficial de la marca:
 * Capa Cian (#25F4EE) + Capa Magenta (#FE2C55) + Centro Blanco (#FFFFFF), ideal sobre fondos oscuros.
 * Con chromatic={false}: Renderiza la silueta monocromática clásica compatible con fill="currentColor".
 */
export function TikTokIcon({ className = '', size = 18, chromatic = false }: TikTokIconProps) {
  if (!chromatic) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 ${className}`}
        aria-label="TikTok"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.87 2.89 2.89 0 0 1-2.88-2.87 2.89 2.89 0 0 1 2.88-2.87c.34 0 .66.05.96.15V9.45a6.33 6.33 0 0 0-.96-.07A6.35 6.35 0 0 0 3.15 15.72a6.35 6.35 0 0 0 6.35 6.35 6.35 6.35 0 0 0 6.34-6.35V8.58a8.2 8.2 0 0 0 4.75 1.52V6.69z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="TikTok"
    >
      {/* Capa Cian (#25F4EE) desplazada a la izquierda */}
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.87 2.89 2.89 0 0 1-2.88-2.87 2.89 2.89 0 0 1 2.88-2.87c.34 0 .66.05.96.15V9.45a6.33 6.33 0 0 0-.96-.07A6.35 6.35 0 0 0 3.15 15.72a6.35 6.35 0 0 0 6.35 6.35 6.35 6.35 0 0 0 6.34-6.35V8.58a8.2 8.2 0 0 0 4.75 1.52V6.69z"
        fill="#25F4EE"
        transform="translate(-1, -0.6)"
      />
      {/* Capa Magenta (#FE2C55) desplazada a la derecha */}
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.87 2.89 2.89 0 0 1-2.88-2.87 2.89 2.89 0 0 1 2.88-2.87c.34 0 .66.05.96.15V9.45a6.33 6.33 0 0 0-.96-.07A6.35 6.35 0 0 0 3.15 15.72a6.35 6.35 0 0 0 6.35 6.35 6.35 6.35 0 0 0 6.34-6.35V8.58a8.2 8.2 0 0 0 4.75 1.52V6.69z"
        fill="#FE2C55"
        transform="translate(1, 0.6)"
      />
      {/* Capa central Blanca (#FFFFFF) */}
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.87 2.89 2.89 0 0 1-2.88-2.87 2.89 2.89 0 0 1 2.88-2.87c.34 0 .66.05.96.15V9.45a6.33 6.33 0 0 0-.96-.07A6.35 6.35 0 0 0 3.15 15.72a6.35 6.35 0 0 0 6.35 6.35 6.35 6.35 0 0 0 6.34-6.35V8.58a8.2 8.2 0 0 0 4.75 1.52V6.69z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
