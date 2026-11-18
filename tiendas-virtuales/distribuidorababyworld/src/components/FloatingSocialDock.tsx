import React from 'react'
import { ExternalLink } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

/**
 * FloatingSocialDock: Muelle flotante ultra-compacto anclado al margen derecho de la pantalla.
 * Sin marcos blancos voluminosos: cada red social es una pestaña independiente y estilizada
 * que en reposo solo ocupa su icono (40px) y al pasar el cursor (hover) se expande suavemente
 * hacia la izquierda revelando su usuario y enlace.
 */
export function FloatingSocialDock() {
  return (
    <aside
      aria-label="Redes sociales oficiales de Baby World"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2 select-none items-end"
    >
      {/* 1. Pestaña Instagram */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end h-10 rounded-l-xl bg-white/95 hover:bg-gradient-to-r hover:from-amber-50 hover:via-pink-50 hover:to-purple-50 border-y border-l border-pink-200/90 hover:border-pink-300 shadow-[-3px_4px_12px_rgba(220,39,67,0.2)] hover:shadow-[-5px_6px_18px_rgba(220,39,67,0.3)] transition-all duration-300 ease-out overflow-hidden cursor-pointer active:scale-95"
        title="Síguenos en Instagram @distribuidorababyworld"
        aria-label="Instagram @distribuidorababyworld"
      >
        {/* Texto que se expande hacia la izquierda */}
        <div className="max-w-0 opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap flex items-center gap-1.5 pl-3 pr-1">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-slate-800 leading-tight">Instagram</span>
            <span className="text-[10px] font-bold text-pink-600">@distribuidorababyworld</span>
          </div>
          <ExternalLink size={12} className="text-pink-400 shrink-0" />
        </div>

        {/* Logo oficial de Instagram siempre visible */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <InstagramIcon size={20} className="group-hover:scale-110 transition-transform" />
        </div>
      </a>

      {/* 2. Pestaña TikTok con Colores Oficiales Cian & Magenta */}
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end h-10 rounded-l-xl bg-[#010101] hover:bg-black border-y border-l border-slate-800 hover:border-slate-700 shadow-[-3px_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[-5px_6px_18px_rgba(0,242,254,0.25)] transition-all duration-300 ease-out overflow-hidden cursor-pointer active:scale-95"
        title="Síguenos en TikTok @baby.world426"
        aria-label="TikTok @baby.world426"
      >
        {/* Texto que se expande hacia la izquierda */}
        <div className="max-w-0 opacity-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap flex items-center gap-1.5 pl-3 pr-1">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black text-white leading-tight">TikTok</span>
            <span className="text-[10px] font-bold text-cyan-300">@baby.world426</span>
          </div>
          <ExternalLink size={12} className="text-cyan-300 shrink-0" />
        </div>

        {/* Logo oficial cromático de TikTok (Cian + Magenta + Blanco) siempre visible */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <TikTokIcon size={19} chromatic={true} className="group-hover:scale-110 transition-transform" />
        </div>
      </a>
    </aside>
  )
}
