import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, MapPin, CreditCard } from 'lucide-react'

interface HeroBannerProps {
  onOpenFamiliaRegistro: () => void
  onOpenLocation?: () => void
  onOpenBnplInfo?: () => void
}

export function HeroBanner({ onOpenFamiliaRegistro, onOpenLocation, onOpenBnplInfo }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef<number>(0)

  const slides = [
    {
      id: 'familia',
      src: '/banner-familia.jpg?v=2',
      alt: '¡Sé parte de la Familia Baby World! Registra tus datos para acceder a muchos beneficios. Regístrate aquí.',
      ariaLabel: 'Sé parte de la Familia Baby World. Registra tus datos para acceder a muchos beneficios.',
      mobileText: 'Toca aquí para registrarte y recibir beneficios',
      mobileCta: 'Ir',
      mobileGradient: 'from-baby-500 via-lavender-400 to-blush-500',
      mobileIcon: 'sparkles' as const,
      onClick: onOpenFamiliaRegistro,
    },
    {
      id: 'mega-promociones',
      src: '/banner-promociones.jpg?v=1',
      alt: 'Este sábado 14 de noviembre Mega Promociones en Baby World Poblado Campestre. Muchas sorpresas y rifas.',
      ariaLabel: 'Este sábado 14 de noviembre Mega Promociones. Ver ubicación de nuestra tienda en Poblado Campestre.',
      mobileText: 'Este sábado 14 de nov • Poblado Campestre',
      mobileCta: 'Ver mapa',
      mobileGradient: 'from-blush-500 via-pink-400 to-baby-500',
      mobileIcon: 'location' as const,
      onClick: () => {
        if (onOpenLocation) {
          onOpenLocation()
        } else {
          const el = document.getElementById('catalogo-section')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }
      },
    },
    {
      id: 'medios-pago',
      src: '/banner-medios-pago.jpg?v=1',
      alt: '¡Todos los medios de pago! Tarjetas de crédito y débito, efectivo, transferencias y compra a cuotas con Addi y Sistecrédito en 5 minutos.',
      ariaLabel: 'Todos los medios de pago y crédito en 5 minutos con Addi y Sistecrédito. Descubre cómo funciona.',
      mobileText: 'Todos los medios de pago • Addi y Sistecrédito',
      mobileCta: 'Cómo pagar',
      mobileGradient: 'from-indigo-500 via-baby-500 to-emerald-500',
      mobileIcon: 'credit' as const,
      onClick: () => {
        if (onOpenBnplInfo) {
          onOpenBnplInfo()
        } else {
          const el = document.getElementById('catalogo-section')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }
      },
    },
  ]

  // Cambio automático cada 5 segundos (pausado si el usuario interactúa)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [current, isPaused, slides.length])

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      if (touchDeltaX.current < -40) {
        goNext()
      } else if (touchDeltaX.current > 40) {
        goPrev()
      }
    }
    touchStartX.current = null
    setIsPaused(false)
  }

  const handleSlideClick = (action: () => void) => {
    // Evitar abrir modal/ruta si el usuario acaba de deslizar en pantalla táctil
    if (Math.abs(touchDeltaX.current) > 25) {
      touchDeltaX.current = 0
      return
    }
    action()
  }

  return (
    <section className="relative bg-gradient-to-b from-baby-50/50 via-blush-50/25 to-white border-b border-slate-100 pt-3 pb-4 sm:pt-6 sm:pb-7">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Slider Frame */}
        <div
          className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white shadow-[0_10px_30px_-8px_rgba(14,165,233,0.22)] hover:shadow-[0_18px_42px_-10px_rgba(236,72,153,0.3)] transition-shadow duration-300 bg-white"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Track */}
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide) => (
              <div key={slide.id} className="w-full flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSlideClick(slide.onClick)}
                  className="block w-full text-left focus:outline-none cursor-pointer active:scale-[0.995] transition-transform"
                  aria-label={slide.ariaLabel}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-auto block select-none"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />

                  {/* Barra táctil optimizada para smartphones (< 640px) */}
                  <div className={`sm:hidden bg-gradient-to-r ${slide.mobileGradient} text-white px-3.5 py-2 flex items-center justify-between gap-2`}>
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight truncate">
                      {slide.mobileIcon === 'location' ? (
                        <MapPin size={13} className="text-white shrink-0" />
                      ) : slide.mobileIcon === 'credit' ? (
                        <CreditCard size={13} className="text-white shrink-0" />
                      ) : (
                        <Sparkles size={13} className="text-butter-200 shrink-0" />
                      )}
                      <span className="truncate">{slide.mobileText}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/25 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0">
                      <span>{slide.mobileCta}</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Flechas laterales (Desktop / Tablet) */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Banner anterior"
            className="hidden sm:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-blush-500 shadow-md border border-white/80 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer z-10"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Siguiente banner"
            className="hidden sm:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-baby-500 shadow-md border border-white/80 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90 cursor-pointer z-10"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Indicadores (Dots) debajo del banner para no tapar textos legales */}
        <div className="flex items-center justify-center gap-2 mt-2.5 sm:mt-3" role="tablist" aria-label="Selector de banners">
          {slides.map((slide, idx) => {
            const active = idx === current
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Ver banner ${idx + 1}`}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  active
                    ? 'w-7 bg-gradient-to-r from-blush-400 to-baby-500 shadow-sm'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
