import React from 'react'

interface TikTokIconProps {
  className?: string
  size?: number
}

/**
 * Icono vectorial SVG oficial de la nota musical de TikTok.
 * Usa fill="currentColor" para permitir integración flexible con clases de Tailwind.
 */
export function TikTokIcon({ className = '', size = 18 }: TikTokIconProps) {
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

