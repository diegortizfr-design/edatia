import React from 'react'

interface BabyWorldLogoProps {
  className?: string
  variant?: 'full' | 'compact'
  inverted?: boolean
}

export function BabyWorldLogo({ className = "", variant = 'full', inverted = false }: BabyWorldLogoProps) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img 
        src="/logo.png" 
        alt="Pañalera Baby World" 
        // Ajustamos la altura de la imagen dependiendo del variante (full vs compact)
        className={`object-contain transition-transform hover:scale-105 duration-300 ${
          variant === 'full' ? 'h-12 sm:h-16' : 'h-8 sm:h-10'
        } ${inverted ? 'brightness-0 invert opacity-90' : ''}`}
      />
    </div>
  )
}
