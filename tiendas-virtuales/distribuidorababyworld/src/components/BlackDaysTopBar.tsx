import React, { useState, useEffect } from 'react'
import { Flame, Clock, ArrowRight } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { WhatsAppIcon } from './WhatsAppIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

interface BlackDaysTopBarProps {
  onPromoClick?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

const MARQUEE_ITEMS = [
  {
    icon: '🔥',
    highlight: 'BLACK DAYS:',
    text: '¡Hasta 60% DTO en Juguetería seleccionada!',
    action: 'Ver Ofertas →',
  },
  {
    icon: '🚀',
    highlight: 'ENVÍO GRATIS:',
    text: 'En compras superiores a $150.000 COP a todo el país',
    action: 'Aprovechar →',
  },
  {
    icon: '💳',
    highlight: 'CRÉDITO INMEDIATO:',
    text: 'Paga a cuotas con Addi y Sistecrédito sin tarjeta',
    action: 'Comprar a cuotas →',
  },
  {
    icon: '🧸',
    highlight: 'NAVIDAD BABY WORLD:',
    text: 'Adelanta tus regalos infantiles con descuento de temporada',
    action: 'Explorar regalos →',
  },
  {
    icon: '⚡',
    highlight: 'TIEMPO LIMITADO:',
    text: 'Precios especiales por Black Days hasta agotar existencias',
    action: 'No te lo pierdas →',
  },
]

export function BlackDaysTopBar({ onPromoClick }: BlackDaysTopBarProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeLeft())

  function calculateTimeLeft(): TimeRemaining {
    const now = new Date()
    const target = new Date(now)
    target.setDate(now.getDate() + 11)
    target.setHours(23, 59, 59, 999)

    const storedTarget = sessionStorage.getItem('babyworld_black_days_target_11d')
    let finalTargetTime: number

    if (storedTarget && !isNaN(Number(storedTarget))) {
      finalTargetTime = Number(storedTarget)
    } else {
      finalTargetTime = target.getTime()
      sessionStorage.setItem('babyworld_black_days_target_11d', finalTargetTime.toString())
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDigits = (n: number) => n.toString().padStart(2, '0')

  // Renderizador de un grupo de ítems del marquee para duplicarlo y crear un bucle perfecto
  const renderMarqueeSequence = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center gap-8 shrink-0 py-0.5">
      {MARQUEE_ITEMS.map((item, idx) => (
        <div
          key={`${keyPrefix}-${idx}`}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={onPromoClick}
        >
          <span className="text-base select-none">{item.icon}</span>
          <span className="font-black text-amber-300 uppercase tracking-wider text-xs md:text-[13px] drop-shadow-xs">
            {item.highlight}
          </span>
          <span className="font-extrabold text-white text-xs md:text-[13px] tracking-tight group-hover:text-amber-200 transition-colors">
            {item.text}
          </span>
          <span className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] md:text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform ml-1">
            {item.action}
          </span>
          <span className="text-amber-400/40 text-xs ml-4 select-none">✦</span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* Estilos CSS nativos para el marquee continuo y fluido */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-smooth {
          display: flex;
          width: max-content;
          animation: marquee-scroll 32s linear infinite;
        }
        .marquee-container:hover .animate-marquee-smooth {
          animation-play-state: paused;
        }
        @keyframes gold-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-badge {
          background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%);
          background-size: 200% 100%;
          animation: gold-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <div
        className="relative z-50 bg-gradient-to-r from-slate-950 via-[#0a1842] to-slate-950 text-white border-b-2 border-amber-400/40 shadow-lg select-none"
        role="region"
        aria-label="Campaña promocional Black Days Baby World"
      >
        {/* Línea de resplandor dorado superior */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80" />

        {/* ============================================================== */}
        {/* VISTA DESKTOP / TABLET (≥ 768px): Estructura Híbrida 42px      */}
        {/* Ancla fija izquierda + Marquee dinámico central + Utilidades   */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center justify-between h-11 px-3 sm:px-4 max-w-7xl mx-auto gap-3">
          
          {/* 1. Ancla Izquierda: Badge de Campaña + Reloj Digital con Casillas */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onPromoClick}
              className="shimmer-badge text-slate-950 font-black px-2.5 py-1 rounded-full text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Ir al catálogo Black Days"
            >
              <Flame size={14} className="text-rose-600 fill-rose-600 animate-bounce" />
              <span>BLACK DAYS</span>
            </button>

            {/* Marcador Digital con Casillas con Relieve */}
            <div
              onClick={onPromoClick}
              className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-amber-400/40 px-2 py-0.5 rounded-lg shadow-inner cursor-pointer hover:border-amber-300 transition-colors"
              title="Cuenta regresiva de la promoción"
            >
              <Clock size={13} className="text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-amber-200 tracking-wider mr-1">Termina en:</span>
              <div className="flex items-center gap-1 font-mono text-xs font-black text-amber-300">
                <span className="bg-slate-900 border border-slate-700/80 min-w-[34px] px-1.5 py-0.5 rounded text-amber-300 shadow-2xs inline-flex items-center justify-center">
                  {formatDigits(timeLeft.days)}d
                </span>
                <span className="text-amber-400 font-bold">:</span>
                <span className="bg-slate-900 border border-slate-700/80 min-w-[34px] px-1.5 py-0.5 rounded text-amber-300 shadow-2xs inline-flex items-center justify-center">
                  {formatDigits(timeLeft.hours)}h
                </span>
                <span className="text-amber-400 font-bold">:</span>
                <span className="bg-slate-900 border border-slate-700/80 min-w-[34px] px-1.5 py-0.5 rounded text-amber-300 shadow-2xs inline-flex items-center justify-center">
                  {formatDigits(timeLeft.minutes)}m
                </span>
                <span className="text-amber-400 font-bold">:</span>
                <span className="bg-amber-400/20 border border-amber-400/60 min-w-[34px] px-1.5 py-0.5 rounded text-amber-200 shadow-2xs inline-flex items-center justify-center">
                  {formatDigits(timeLeft.seconds)}s
                </span>
              </div>
            </div>
          </div>

          {/* 2. Centro: Cinta Continua Marquee en Movimiento Fluido */}
          <div className="flex-1 overflow-hidden relative marquee-container cursor-pointer">
            {/* Gradientes laterales para difuminar la entrada y salida del texto */}
            <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-[#0a1842] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#0a1842] to-transparent z-10 pointer-events-none" />

            {/* Track infinito en movimiento */}
            <div className="animate-marquee-smooth flex items-center">
              {renderMarqueeSequence('seq-1')}
              {renderMarqueeSequence('seq-2')}
            </div>
          </div>

          {/* 3. Ancla Derecha: Redes Sociales Oficiales + WhatsApp Fijo */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-300 hover:text-pink-400 transition-all px-1.5 py-0.5 rounded-full hover:bg-white/10 active:scale-95 text-xs font-semibold group"
                title="Instagram @distribuidorababyworld"
              >
                <InstagramIcon size={14} className="group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Instagram</span>
              </a>

              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-all px-1.5 py-0.5 rounded-full hover:bg-white/10 active:scale-95 text-xs font-semibold group"
                title="TikTok @baby.world426"
              >
                <TikTokIcon size={14} chromatic={true} className="group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">TikTok</span>
              </a>
            </div>

            <span className="text-slate-700 select-none">|</span>

            {/* Asesoría WhatsApp */}
            <a
              href="https://wa.me/573136546975?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido%20de%20Black%20Days"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 hover:border-[#25D366] px-2.5 py-1 rounded-full font-extrabold text-xs transition-all shadow-xs hover:shadow-emerald-500/30 active:scale-95 shrink-0"
              title="Asesoría por WhatsApp"
            >
              <WhatsAppIcon size={14} />
              <span className="text-emerald-300">WhatsApp</span>
            </a>
          </div>

        </div>

        {/* ============================================================== */}
        {/* VISTA MÓVIL (< 768px): Cinta Marquee Panorámica de Alto Impacto*/}
        {/* Movimiento continuo de extremo a extremo + Reloj flotante mini */}
        {/* ============================================================== */}
        <div className="flex md:hidden flex-col">
          {/* Fila Principal: Cinta Marquee Infinita a todo lo ancho */}
          <div
            className="h-10 overflow-hidden relative marquee-container flex items-center bg-slate-950/90 cursor-pointer"
            onClick={onPromoClick}
          >
            <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee-smooth flex items-center">
              {renderMarqueeSequence('mob-1')}
              {renderMarqueeSequence('mob-2')}
            </div>
          </div>

          {/* Micro-franja inferior con Temporizador Compacto y WhatsApp Rápido */}
          <div className="bg-black/90 px-2.5 sm:px-3 py-1 flex items-center justify-between border-t border-white/10 text-[10px] flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar">
            {/* Reloj mini */}
            <div className="flex items-center gap-1 font-mono font-bold text-amber-300 shrink-0">
              <Clock size={11} className="text-amber-400 shrink-0" />
              <span className="uppercase text-[9px] text-slate-400 font-extrabold hidden sm:inline">Termina en:</span>
              <span className="bg-slate-800 min-w-[26px] px-1.5 py-0.5 rounded text-center inline-flex items-center justify-center">{formatDigits(timeLeft.days)}d</span>
              <span>:</span>
              <span className="bg-slate-800 min-w-[26px] px-1.5 py-0.5 rounded text-center inline-flex items-center justify-center">{formatDigits(timeLeft.hours)}h</span>
              <span>:</span>
              <span className="bg-slate-800 min-w-[26px] px-1.5 py-0.5 rounded text-center inline-flex items-center justify-center">{formatDigits(timeLeft.minutes)}m</span>
              <span>:</span>
              <span className="bg-amber-400/20 text-amber-300 min-w-[26px] px-1.5 py-0.5 rounded font-black text-center inline-flex items-center justify-center">{formatDigits(timeLeft.seconds)}s</span>
            </div>

            {/* Accesos rápidos móvil */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-pink-400 p-0.5"
                title="Instagram"
              >
                <InstagramIcon size={12} />
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white p-0.5"
                title="TikTok"
              >
                <TikTokIcon size={12} chromatic={true} />
              </a>
              <a
                href="https://wa.me/573136546975?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20para%20un%20pedido%20de%20Black%20Days"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-[10px]"
              >
                <WhatsAppIcon size={11} />
                <span>Asesoría</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
