import React from 'react'

interface WhatsAppIconProps {
  className?: string
  size?: number
}

/**
 * Componente SVG con el diseño de insignia de WhatsApp solicitado por el usuario:
 * - Contorno exterior verde fino
 * - Aro de separación blanco limpio
 * - Burbuja verde oficial con cola
 * - Auricular blanco en diagonal
 * Con transparencia 100% real (sin la cuadrícula de ajedrez de falsos PNGs).
 */
export function WhatsAppIcon({ className = '', size = 18 }: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="WhatsApp"
    >
      {/* 1. Aro y silueta exterior verde */}
      <path
        d="M50 7C26.25 7 7 26.25 7 50c0 7.82 2.11 15.17 5.79 21.49L7 93l22.06-5.63C35.12 90.58 42.27 93 50 93c23.75 0 43-19.25 43-43S73.75 7 50 7z"
        stroke="#28971B"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 2. Aro intermedio blanco de separación */}
      <path
        d="M50 10C27.91 10 10 27.91 10 50c0 7.28 1.96 14.12 5.39 20L10 90l20.53-5.24C36.14 87.75 42.79 90 50 90c22.09 0 40-17.91 40-40S72.09 10 50 10z"
        fill="#FFFFFF"
      />

      {/* 3. Burbuja interior verde oficial */}
      <path
        d="M50 14C30.12 14 14 30.12 14 50c0 6.55 1.76 12.7 4.85 18L14 86l18.48-4.71C37.52 83.97 43.51 86 50 86c19.88 0 36-16.12 36-36S69.88 14 50 14z"
        fill="#28971B"
      />

      {/* 4. Auricular telefónico blanco en diagonal */}
      <path
        d="M69.85 62.42c-.99-.5-5.88-2.9-6.79-3.23-.91-.34-1.57-.5-2.23.5-.66.99-2.56 3.23-3.14 3.89-.58.66-1.16.74-2.15.25-1-.5-4.2-1.55-8-4.94-2.96-2.64-4.96-5.89-5.54-6.89-.58-.99-.06-1.53.43-2.02.45-.45.99-1.16 1.49-1.74.5-.58.66-.99.99-1.65.33-.66.17-1.24-.08-1.74-.25-.5-2.23-5.37-3.06-7.36-.8-1.93-1.62-1.67-2.23-1.7h-1.9c-.66 0-1.74.25-2.65 1.24-1.04 1.13-3.47 3.39-3.47 8.26 0 4.87 3.55 9.58 4.05 10.25.5.66 6.99 10.67 16.93 14.97 2.37 1.02 4.22 1.63 5.66 2.09 2.38.76 4.54.65 6.25.4 1.91-.28 5.88-2.4 6.71-4.71.83-2.31.83-4.3.58-4.71-.25-.42-.91-.66-1.9-.99z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
