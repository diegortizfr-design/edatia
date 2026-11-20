import React, { useState, useEffect } from 'react'
import { Flame, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { WhatsAppIcon } from './WhatsAppIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

interface BlackDaysTopBarProps {
  onPromoClick?: () => void
  targetDate?: string // Formato ISO o fecha futura
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

const PROMO_MESSAGES = [
  {
    icon: '🔥',
    badge: 'BLACK DAYS',
    badgeColor: 'bg-amber-400 text-slate-950',
    title: '¡Hasta 60% DTO en Juguetería!',
    subtitle: 'Referencias seleccionadas',
    ctaText: 'Ver Juguetes',
    category: 'Juguetería',
  },
  {
    icon: '🚀',
    badge: 'ENVÍO GRATIS',
    badgeColor: 'bg-sky-400 text-slate-950',
    title: 'En compras superiores a $150.000 COP',
    subtitle: 'A todo el país',
    ctaText: 'Aprovechar',
    category: 'Todos',
  },
  {
    icon: '💳',
    badge: 'CRÉDITO INMEDIATO',
    badgeColor: 'bg-emerald-400 text-slate-950',
    title: 'Compra a cuotas con Addi y Sistecrédito',
    subtitle: 'En 5 minutos sin tarjeta',
    ctaText: 'Cómo pagar',
    category: 'Todos',
  },
  {
    icon: '🧸',
    badge: 'NAVIDAD BABY WORLD',
    badgeColor: 'bg-pink-400 text-slate-950',
    title: 'Adelanta tus regalos con descuento Black Days',
    subtitle: 'Hasta agotar existencias',
    ctaText: 'Comprar',
    category: 'Juguetería',
  },
]

export function BlackDaysTopBar({ onPromoClick }: BlackDaysTopBarProps) {
  // Cuenta regresiva calculada dinámicamente para la campaña Black Days
  // Fijamos una fecha objetivo atractiva (ej: fin de mes / fin de semana festivo)
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeLeft())
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  function calculateTimeLeft(): TimeRemaining {
    // Calculamos una fecha límite de campaña: domingo próximo a las 23:59:59 o 3 días a partir de ahora
    const now = new Date()
    const target = new Date(now)
    // Fijamos cierre a 3 días y 8 horas para dar dinamismo de urgencia real
    target.setDate(now.getDate() + 3)
    target.setHours(23, 59, 59, 999)

    // Si ya existe un target guardado en sessionStorage, usarlo para que sea consistente en la sesión
    const storedTarget = sessionStorage.getItem('babyworld_black_days_target_date')
    let finalTargetTime: number

    if (storedTarget && !isNaN(Number(storedTarget))) {
      finalTargetTime = Number(storedTarget)
    } else {
      finalTargetTime = target.getTime()
      sessionStorage.setItem('babyworld_black_days_target_date', finalTargetTime.toString())
    }

    const difference = finalTargetTime - now.getTime()

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    }
  }

  // Actualizador de reloj cada 1 segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Carrusel rotativo de mensajes cada 4.5 segundos (se pausa al pasar el cursor)
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentMsgIndex((prev) => (prev + 1) % PROMO_MESSAGES.length)
        setIsAnimating(false)
      }, 300) // Duración de salida de la animación
    }, 4500)
    return () => clearInterval(interval)
  }, [isPaused])

  const currentMsg = PROMO_MESSAGES[currentMsgIndex]

  const formatDigits = (n: number) => n.toString().padStart(2, '0')

  return (
    <div
      className="relative z-50 bg-gradient-to-r from-slate-950 via-[#0d1b46] to-slate-950 text-white border-b border-amber-500/30 shadow-md select-none transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Alerta de promociones Black Days"
    >
      {/* Resplandor sutil dorado superior */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
        
        {/* BLOQUE IZQUIERDO / CENTRAL: Alerta con Ticker Rotativo en Movimiento */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          
          {/* Badge Pulsante de Campaña */}
          <button
            type="button"
            onClick={onPromoClick}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] tracking-wider uppercase shadow-xs hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
            title="Ver catálogo de Black Days"
          >
            <Flame size={12} className="text-rose-600 fill-rose-600 animate-pulse" />
            <span className="truncate">BLACK DAYS</span>
          </button>

          {/* Temporizador de Cuenta Regresiva (Urgency Countdown) */}
          <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold bg-white/10 backdrop-blur-xs border border-white/15 px-2 py-0.5 rounded-full shrink-0">
            <Clock size={12} className="text-amber-300" />
            <span className="text-slate-300 text-[10px] uppercase font-bold tracking-tight">Termina en:</span>
            <div className="flex items-center gap-0.5 font-mono font-bold text-amber-300 text-[11px]">
              <span>{formatDigits(timeLeft.days)}d</span>
              <span className="text-amber-400/60 animate-pulse">:</span>
              <span>{formatDigits(timeLeft.hours)}h</span>
              <span className="text-amber-400/60 animate-pulse">:</span>
              <span>{formatDigits(timeLeft.minutes)}m</span>
              <span className="text-amber-400/60 animate-pulse">:</span>
              <span className="w-5 text-center text-amber-200">{formatDigits(timeLeft.seconds)}s</span>
            </div>
          </div>

          {/* Separador vertical en desktop */}
          <span className="text-slate-700 hidden lg:inline select-none">|</span>

          {/* Mensaje Dinámico con Transición Suave (Fade & Slide) */}
          <div
            onClick={onPromoClick}
            className={`cursor-pointer flex items-center gap-1.5 truncate group transition-all duration-300 ${
              isAnimating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
            }`}
            title="Haz clic para aprovechar esta promoción"
          >
            <span className="text-xs shrink-0">{currentMsg.icon}</span>
            <span className="font-bold text-white group-hover:text-amber-300 transition-colors truncate">
              {currentMsg.title}
            </span>
            <span className="text-slate-400 hidden xl:inline text-[11px]">
              • {currentMsg.subtitle}
            </span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-amber-300 group-hover:text-amber-200 font-extrabold text-[10px] underline decoration-amber-400/50 underline-offset-2 shrink-0 ml-1">
              {currentMsg.ctaText}
              <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

        </div>

        {/* BLOQUE DERECHO: Temporizador móvil + Redes Sociales Oficiales + WhatsApp */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Reloj compacto para pantallas pequeñas (< 768px) */}
          <div className="flex md:hidden items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-full shrink-0">
            <Clock size={11} className="text-amber-300" />
            <span>{formatDigits(timeLeft.days)}d</span>
            <span>{formatDigits(timeLeft.hours)}h</span>
            <span>{formatDigits(timeLeft.minutes)}m</span>
          </div>

          {/* Separador */}
          <span className="text-slate-700 hidden sm:inline select-none">|</span>

          {/* Redes Sociales Oficiales */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-pink-400 transition-all px-1.5 py-0.5 rounded-full hover:bg-white/10 active:scale-95 text-[10px] sm:text-[11px] font-semibold group"
              title="Síguenos en Instagram @distribuidorababyworld"
              aria-label="Instagram @distribuidorababyworld"
            >
              <InstagramIcon size={13} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Instagram</span>
            </a>

            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-all px-1.5 py-0.5 rounded-full hover:bg-white/10 active:scale-95 text-[10px] sm:text-[11px] font-semibold group"
              title="Síguenos en TikTok @baby.world426"
              aria-label="TikTok @baby.world426"
            >
              <TikTokIcon size={13} chromatic={true} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">TikTok</span>
            </a>
          </div>

          {/* Botón WhatsApp Asesoría */}
          <a
            href="https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido%20de%20Black%20Days"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 hover:border-[#25D366] px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] transition-all shadow-2xs hover:shadow-emerald-500/20 active:scale-95 shrink-0"
            title="Asesoría directa por WhatsApp"
          >
            <WhatsAppIcon size={13} />
            <span className="hidden sm:inline text-emerald-300">WhatsApp</span>
          </a>

        </div>

      </div>
    </div>
  )
}
