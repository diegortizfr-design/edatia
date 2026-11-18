import React from 'react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

/**
 * FloatingSocialDock: Muelle flotante lateral de redes sociales oficiales.
 * Diseñado para mantenerse visible en todo momento en pantallas medianas y grandes,
 * permitiendo conectar con Instagram y TikTok con un solo clic y previsualizar sus perfiles.
 */
export function FloatingSocialDock() {
  return (
    <aside
      aria-label="Redes sociales oficiales de Baby World"
      className="fixed left-3 lg:left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] transition-all select-none animate-in fade-in slide-in-from-left-4 duration-300"
    >
      {/* Etiqueta vertical discreta */}
      <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase py-1 select-none pointer-events-none">
        REDES
      </span>

      {/* Botón Instagram */}
      <div className="relative group flex items-center">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-gradient-to-tr hover:from-amber-500/10 hover:via-pink-500/10 hover:to-purple-500/10 border border-slate-200/80 hover:border-pink-300 text-slate-700 hover:text-pink-600 transition-all duration-200 active:scale-95 shadow-2xs"
          title="Síguenos en Instagram @distribuidorababyworld"
          aria-label="Instagram @distribuidorababyworld"
        >
          <InstagramIcon size={20} className="group-hover:scale-110 transition-transform duration-200" />
        </a>

        {/* Tooltip expansible hacia la derecha */}
        <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 -translate-x-1 group-hover:translate-x-0 z-50 flex items-center gap-2">
          <InstagramIcon size={14} className="shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold leading-tight">Instagram</span>
            <span className="text-[10px] text-pink-300 font-medium">@distribuidorababyworld</span>
          </div>
          <span className="text-xs text-slate-400 font-bold ml-1">↗</span>
        </div>
      </div>

      {/* Botón TikTok */}
      <div className="relative group flex items-center">
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-400 text-slate-800 hover:text-black transition-all duration-200 active:scale-95 shadow-2xs"
          title="Síguenos en TikTok @baby.world426"
          aria-label="TikTok @baby.world426"
        >
          <TikTokIcon size={18} className="group-hover:scale-110 transition-transform duration-200" />
        </a>

        {/* Tooltip expansible hacia la derecha */}
        <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 -translate-x-1 group-hover:translate-x-0 z-50 flex items-center gap-2">
          <TikTokIcon size={14} className="text-white shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold leading-tight">TikTok</span>
            <span className="text-[10px] text-sky-300 font-medium">@baby.world426</span>
          </div>
          <span className="text-xs text-slate-400 font-bold ml-1">↗</span>
        </div>
      </div>
    </aside>
  )
}

