import React from 'react'
import { ExternalLink } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

/**
 * FloatingSocialDock: Muelle flotante ultra-compacto anclado al margen derecho de la pantalla.
 * Totalmente responsivo (Móvil y Escritorio):
 * - En móvil: Pestañas compactas (34px) que abren directamente la app/perfil con un toque sin estorbar el scroll.
 * - En escritorio: Se expanden suavemente hacia la izquierda al pasar el cursor (hover) revelando usuario y enlace.
 */
export function FloatingSocialDock() {
  return (
    <aside
      aria-label="Redes sociales oficiales de Baby World"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 sm:gap-2 select-none items-end"
    >
      {/* 1. Pestaña Instagram */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end h-8.5 sm:h-10 rounded-l-xl bg-white/95 hover:bg-gradient-to-r hover:from-amber-50 hover:via-pink-50 hover:to-purple-50 border-y border-l border-pink-200/90 hover:border-pink-300 shadow-[-3px_4px_12px_rgba(220,39,67,0.2)] hover:shadow-[-5px_6px_18px_rgba(220,39,67,0.3)] transition-all duration-300 ease-out overflow-hidden cursor-pointer active:scale-95"
        title="Síguenos en Instagram @distribuidorababyworld"
        aria-label="Instagram @distribuidorababyworld"
      >
        {/* Texto expandible hacia la izquierda (en pantallas medianas y grandes con soporte de hover) */}
        <div className="hidden md:flex max-w-0 opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap items-center gap-1.5 pl-3 pr-1">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-slate-800 leading-tight">Instagram</span>
            <span className="text-[10px] font-bold text-pink-600">@distribuidorababyworld</span>
          </div>
          <ExternalLink size={12} className="text-pink-400 shrink-0" />
        </div>

        {/* Logo oficial de Instagram siempre visible */}
        <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
          <InstagramIcon size={17} className="sm:hidden" />
          <InstagramIcon size={20} className="hidden sm:inline-block group-hover:scale-110 transition-transform" />
        </div>
      </a>

      {/* 2. Pestaña TikTok con Colores Oficiales Cian & Magenta */}
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end h-8.5 sm:h-10 rounded-l-xl bg-[#010101] hover:bg-black border-y border-l border-slate-800 hover:border-slate-700 shadow-[-3px_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[-5px_6px_18px_rgba(0,242,254,0.25)] transition-all duration-300 ease-out overflow-hidden cursor-pointer active:scale-95"
        title="Síguenos en TikTok @baby.world426"
        aria-label="TikTok @baby.world426"
      >
        {/* Texto expandible hacia la izquierda (en pantallas medianas y grandes con soporte de hover) */}
        <div className="hidden md:flex max-w-0 opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap items-center gap-1.5 pl-3 pr-1">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-white leading-tight">TikTok</span>
            <span className="text-[10px] font-bold text-cyan-300">@baby.world426</span>
          </div>
          <ExternalLink size={12} className="text-cyan-300 shrink-0" />
        </div>

        {/* Logo oficial cromático de TikTok (Cian + Magenta + Blanco) siempre visible */}
        <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
          <TikTokIcon size={16} chromatic={true} className="sm:hidden" />
          <TikTokIcon size={19} chromatic={true} className="hidden sm:inline-block group-hover:scale-110 transition-transform" />
        </div>
      </a>
    </aside>
  )
}
