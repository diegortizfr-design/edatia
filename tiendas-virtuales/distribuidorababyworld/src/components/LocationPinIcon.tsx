import React from 'react'

interface LocationPinIconProps {
  className?: string
  size?: number
}

/**
 * Icono de Pin Rojo de Ubicación clásico (Google Maps / Geolocation Pin)
 * Silueta roja con centro blanco perforado, universalmente reconocido.
 */
export function LocationPinIcon({ className = '', size = 16 }: LocationPinIconProps) {
  const width = size
  const height = Math.round(size * 1.25)

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Ubicación"
    >
      {/* Sombra sutil en la base */}
      <ellipse cx="12" cy="28.5" rx="4.5" ry="1.5" fill="#000000" fillOpacity="0.12" />
      
      {/* Cuerpo del pin rojo oficial */}
      <path
        d="M12 1C6.2 1 1.5 5.7 1.5 11.5c0 7.8 9.2 15.6 9.9 16.2.3.2.9.2 1.2 0 .7-.6 9.9-8.4 9.9-16.2C22.5 5.7 17.8 1 12 1z"
        fill="#EA4335"
      />
      
      {/* Brillo sutil superior */}
      <path
        d="M12 2C6.8 2 2.5 6.3 2.5 11.5c0 2.2.8 4.2 2.1 5.8 1.4-4.8 5.4-8.3 10.3-8.3 1.8 0 3.5.5 5 1.3C18.6 5.4 15.6 2 12 2z"
        fill="#FFFFFF"
        fillOpacity="0.18"
      />
      
      {/* Centro blanco perforado característico */}
      <circle cx="12" cy="11.5" r="4.2" fill="#FFFFFF" />
    </svg>
  )
}
