import React, { useMemo } from 'react'

interface SnowflakeConfig {
  id: number
  left: number // porcentaje 0 - 100
  size: number // px
  duration: number // segundos
  delay: number // segundos
  opacity: number
  drift: number // px desplazamiento horizontal
  swayDuration: number
  type: 'crystal' | 'soft-dot' | 'sparkle'
}

interface ChristmasSnowProps {
  className?: string
  /** Cantidad de copos en escritorio (en móvil se reduce automáticamente) */
  density?: 'subtle' | 'medium' | 'dense'
}

export function ChristmasSnow({ className = '', density = 'medium' }: ChristmasSnowProps) {
  // Generamos una distribución fija y armónica para evitar re-cálculos o saltos al re-renderizar
  const flakes = useMemo<SnowflakeConfig[]>(() => {
    const count = density === 'subtle' ? 22 : density === 'dense' ? 44 : 32

    return Array.from({ length: count }, (_, i) => {
      // Determinamos el tipo para tener variedad visual
      const typeChoice = i % 5 === 0 ? 'crystal' : i % 7 === 0 ? 'sparkle' : 'soft-dot'
      
      // Tamaño según tipo
      let size = 5
      if (typeChoice === 'crystal') size = 11 + (i % 6)
      else if (typeChoice === 'sparkle') size = 9 + (i % 4)
      else size = 3 + (i % 4)

      // Distribución horizontal bien espaciada
      const left = Math.round(((i * 97) % 100) + ((i % 3) * 0.5))

      // Duración y retraso variados para flujo continuo y orgánico
      const duration = 6.5 + ((i * 1.7) % 6.5) // Entre 6.5s y 13s
      const delay = -((i * 1.3) % 9) // Negativo para que ya estén cayendo al cargar la página
      const opacity = 0.35 + ((i % 5) * 0.11) // Entre 0.35 y 0.8
      const drift = ((i % 2 === 0 ? 1 : -1) * (12 + (i % 18))) // Desplazamiento -30px a +30px
      const swayDuration = 2.6 + ((i % 4) * 0.7)

      return {
        id: i,
        left,
        size,
        duration,
        delay,
        opacity,
        drift,
        swayDuration,
        type: typeChoice,
      }
    })
  }, [density])

  return (
    <div
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-20 ${className}`}
      aria-hidden="true"
    >
      {/* Sombra sutil de desvanecimiento inferior para que los copos se disuelvan con suavidad */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent pointer-events-none z-10" />

      {flakes.map((flake) => (
        <div
          key={flake.id}
          className={`snow-particle absolute pointer-events-none ${flake.id >= 16 ? 'hidden sm:block' : ''}`}
          style={{
            left: `${flake.left}%`,
            animation: `snowFall ${flake.duration}s linear ${flake.delay}s infinite`,
            opacity: flake.opacity,
            willChange: 'top',
          }}
        >
          <div
            style={{
              animation: `snowSway ${flake.swayDuration}s ease-in-out infinite alternate`,
              transform: `translateX(${flake.drift}px)`,
              willChange: 'transform',
            }}
          >
            {flake.type === 'crystal' ? (
              <span
                className="block text-white select-none drop-shadow-[0_0_3px_rgba(186,224,253,0.9)]"
                style={{ fontSize: `${flake.size}px`, lineHeight: 1 }}
              >
                ❄
              </span>
            ) : flake.type === 'sparkle' ? (
              <span
                className="block text-sky-100 select-none drop-shadow-[0_0_4px_rgba(255,255,255,0.95)]"
                style={{ fontSize: `${flake.size}px`, lineHeight: 1 }}
              >
                ✦
              </span>
            ) : (
              <span
                className="block rounded-full bg-white shadow-[0_0_5px_rgba(186,224,253,0.85)]"
                style={{
                  width: `${flake.size}px`,
                  height: `${flake.size}px`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
