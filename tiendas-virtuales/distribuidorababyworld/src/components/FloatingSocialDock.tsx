import React from 'react'
import { ExternalLink } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

/**
 * FloatingSocialDock: Muelle interactivo de redes sociales en el margen derecho.
 * En reposo muestra de forma limpia y directa los logos oficiales de Instagram y TikTok.
 * Al pasar el cursor sobre cada red, se expande fluidamente hacia la izquierda revelando
 * el nombre de usuario y el enlace oficial.
 */
export function FloatingSocialDock() {
  return (
    <aside
      aria-label="Redes sociales oficiales de Baby World"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2 p-1.5 rounded-l-2xl bg-white/95 backdrop-blur-md border-y border-l border-slate-200/90 shadow-[-6px_8px_25px_rgba(0,0,0,0.12)] select-none items-end"
    >
      {/* Botón Instagram: Logo siempre visible, se expande al pasar el cursor */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end rounded-xl p-1.5 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-amber-50/80 hover:via-pink-50/90 hover:to-purple-50/80 border border-transparent hover:border-pink-200 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md hover:shadow-pink-500/15"
        title="Síguenos en Instagram @distribuidorababyworld"
        aria-label="Instagram @distribuidorababyworld"
      >
        {/* Contenido textual que se expande hacia la izquierda */}
        <div className="max-w-0 opacity-0 group-hover:max-w-[190px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap flex items-center gap-2 pl-2 pr-2.5">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-slate-800 tracking-tight leading-none">
              Instagram
            </span>
            <span className="text-[10px] font-bold text-pink-600 mt-0.5">
              @distribuidorababyworld
            </span>
          </div>
          <ExternalLink size={12} className="text-pink-400 shrink-0" />
        </div>

        {/* Logo oficial de Instagram siempre visible */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433]/15 via-[#dc2743]/15 to-[#bc1888]/20 group-hover:from-[#f09433]/25 group-hover:via-[#dc2743]/25 group-hover:to-[#bc1888]/30 border border-pink-200/90 group-hover:border-pink-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all">
          <InstagramIcon size={20} className="group-hover:scale-110 transition-transform" />
        </div>
      </a>

      {/* Botón TikTok: Logo siempre visible, se expande al pasar el cursor */}
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-end rounded-xl p-1.5 transition-all duration-300 ease-out hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md hover:shadow-cyan-500/20"
        title="Síguenos en TikTok @baby.world426"
        aria-label="TikTok @baby.world426"
      >
        {/* Contenido textual que se expande hacia la izquierda */}
        <div className="max-w-0 opacity-0 group-hover:max-w-[190px] group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap flex items-center gap-2 pl-2 pr-2.5">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-slate-800 group-hover:text-white tracking-tight leading-none">
              TikTok
            </span>
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-cyan-300 mt-0.5">
              @baby.world426
            </span>
          </div>
          <ExternalLink size={12} className="text-slate-400 group-hover:text-cyan-300 shrink-0" />
        </div>

        {/* Logo oficial de TikTok siempre visible */}
        <div className="w-9 h-9 rounded-xl bg-slate-900 group-hover:bg-black border border-slate-800 group-hover:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all">
          <TikTokIcon size={18} className="text-white group-hover:scale-110 transition-transform" />
        </div>
      </a>
    </aside>
  )
}
