import React from 'react'
import { Truck } from 'lucide-react'
import { LocationPinIcon } from './LocationPinIcon'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'

interface QuickTrustBarProps {
  onOpenLocation?: () => void
  onOpenBnplInfo?: () => void
}

export const INSTAGRAM_URL = 'https://www.instagram.com/distribuidorababyworld'
export const TIKTOK_URL = 'https://www.tiktok.com/@baby.world426'

/**
 * Barra interactiva de distintivos de confianza (Trust & Social Bar) ubicada justo debajo del HeroBanner.
 * Integra:
 * - Acceso directo al modal de Tienda Física (Poblado Campestre).
 * - Enlaces directos a perfiles oficiales de Instagram y TikTok.
 * - Información de crédito Addi & Sistecrédito.
 * - Indicador de Pago Contra Entrega y Envíos.
 */
export function QuickTrustBar({ onOpenLocation, onOpenBnplInfo }: QuickTrustBarProps) {
  return (
    <section className="relative z-20 mt-1 mb-2.5 sm:mb-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center sm:justify-center gap-2 sm:gap-2.5 overflow-x-auto sm:flex-wrap no-scrollbar py-1 text-[11px] sm:text-xs">
        {/* 1. Tienda Física Poblado Campestre */}
        {onOpenLocation && (
          <button
            type="button"
            onClick={onOpenLocation}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-rose-50/60 border border-slate-200/90 hover:border-rose-300 text-slate-800 hover:text-rose-700 transition-all shadow-2xs group active:scale-95 font-extrabold cursor-pointer select-none"
            title="Toca para ver la ubicación de la tienda física en Poblado Campestre y horarios"
          >
            <LocationPinIcon size={14} className="group-hover:scale-110 transition-transform" />
            <span>Tienda Física Poblado Campestre</span>
            <span className="text-[10px] text-rose-500 font-bold ml-0.5 group-hover:translate-x-0.5 transition-transform">↗</span>
          </button>
        )}

        {/* 2. Instagram Oficial */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-amber-50 border border-slate-200/90 hover:border-pink-300 text-slate-800 hover:text-pink-600 transition-all shadow-2xs group active:scale-95 font-extrabold select-none"
          title="Visita nuestro perfil de Instagram @distribuidorababyworld"
        >
          <InstagramIcon size={15} className="group-hover:scale-110 transition-transform" />
          <span>Instagram</span>
          <span className="hidden md:inline text-slate-400 font-normal">@distribuidorababyworld</span>
        </a>

        {/* 3. TikTok Oficial */}
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-400 text-slate-800 hover:text-slate-950 transition-all shadow-2xs group active:scale-95 font-extrabold select-none"
          title="Síguenos en TikTok @baby.world426"
        >
          <TikTokIcon size={15} className="text-slate-900 group-hover:scale-110 transition-transform" />
          <span>TikTok</span>
          <span className="hidden md:inline text-slate-400 font-normal">@baby.world426</span>
        </a>

        {/* 4. Crédito Addi & Sistecrédito */}
        {onOpenBnplInfo && (
          <button
            type="button"
            onClick={onOpenBnplInfo}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-sky-50/60 border border-slate-200/90 hover:border-sky-300 text-slate-800 transition-all shadow-2xs group active:scale-95 font-extrabold cursor-pointer select-none"
            title="Conoce cómo pagar a cuotas con Addi y Sistecrédito"
          >
            <div className="flex items-center gap-1">
              <img src="/logo-addi.png" alt="Addi" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-contain" />
              <img src="/logo-sistecredito.png" alt="Sistecrédito" className="h-2.5 sm:h-3 max-w-[42px] sm:max-w-[48px] object-contain" />
            </div>
            <span>Crédito a Cuotas</span>
          </button>
        )}

        {/* 5. Pago Contra Entrega & Envíos */}
        <div className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white border border-slate-200/90 text-slate-700 shadow-2xs font-bold select-none">
          <Truck size={14} className="text-sky-500" />
          <span>Contra Entrega</span>
        </div>
      </div>
    </section>
  )
}

