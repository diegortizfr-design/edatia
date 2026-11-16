import React from 'react'

interface InstagramIconProps {
  className?: string
  size?: number
}

/**
 * Icono vectorial SVG oficial de Instagram con degradado de marca característico
 * (amarillo/naranja cálido -> rosa fucsia -> violeta púrpura).
 */
export function InstagramIcon({ className = '', size = 18 }: InstagramIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Instagram"
    >
      <defs>
        <linearGradient id="bw-ig-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      {/* Contorno redondeado de la cámara */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#bw-ig-gradient)" strokeWidth="2" />
      {/* Lente circular central */}
      <circle cx="12" cy="12" r="4.2" stroke="url(#bw-ig-gradient)" strokeWidth="2" />
      {/* Flash superior derecho */}
      <circle cx="17.2" cy="6.8" r="1.2" fill="url(#bw-ig-gradient)" />
    </svg>
  )
}

