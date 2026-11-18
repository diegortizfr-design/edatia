import React, { useState } from 'react'
import { ChevronLeft, Sparkles, ExternalLink } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { TikTokIcon } from './TikTokIcon'
import { INSTAGRAM_URL, TIKTOK_URL } from '../constants/social'

/**
 * FloatingSocialDock: Pestaña lateral flotante en el borde derecho de la pantalla.
 * En reposo permanece recogida mostrando una pestaña viva y colorida con "REDES".
 * Al pasar el cursor (hover) se desliza suavemente hacia afuera mostrando los accesos directos
 * a Instagram y TikTok con sus colores oficiales y perfiles.
 */
export function FloatingSocialDock() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <aside
      aria-label="Redes sociales oficiales de Baby World"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center transition-transform duration-300 ease-out select-none ${
        isHovered ? 'translate-x-0' : 'translate-x-[calc(100%-38px)]'
      }`}
    >
      {/* Pestaña disparadora que sobresale en el borde derecho en reposo */}
      <button
        type="button"
        onClick={() => setIsHovered(prev => !prev)}
        className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-l-2xl bg-gradient-to-b from-[#f09433] via-[#dc2743] to-[#0f172a] text-white shadow-[-5px_4px_20px_rgba(220,39,67,0.45)] border-y border-l border-white/30 cursor-pointer transition-all hover:brightness-110 active:scale-95 shrink-0"
        title="Pasa el cursor para ver nuestras redes sociales"
        aria-label="Abrir panel de redes sociales"
      >
        <ChevronLeft
          size={15}
          className={`transition-transform duration-300 text-white stroke-[2.5] ${
            isHovered ? 'rotate-180' : 'animate-pulse'
          }`}
        />
        {/* Letras alineadas verticalmente para máxima compatibilidad visual */}
        <div className="flex flex-col items-center text-[9px] font-black tracking-widest text-white uppercase drop-shadow-sm leading-tight py-0.5">
          <span>R</span>
          <span>E</span>
          <span>D</span>
          <span>E</span>
          <span>S</span>
        </div>
        <div className="flex flex-col gap-1 pt-1 opacity-90">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
        </div>
      </button>

      {/* Panel Desplegable Colorido */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-l-2xl border-y border-l border-slate-200/90 shadow-[-10px_12px_35px_rgba(0,0,0,0.18)] flex flex-col gap-2.5 min-w-[220px]">
        {/* Cabecera del panel */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-pink-500 fill-pink-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Síguenos en Redes
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-600 border border-pink-100">
            Oficial
          </span>
        </div>

        {/* Tarjeta / Botón Instagram con Degradado Oficial */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group/ig relative flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#f09433]/10 via-[#dc2743]/15 to-[#bc1888]/20 hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] border border-pink-200/80 hover:border-transparent text-slate-800 hover:text-white transition-all duration-300 shadow-2xs hover:shadow-md hover:shadow-pink-500/30 active:scale-95 overflow-hidden"
          title="Visita nuestro perfil de Instagram @distribuidorababyworld"
        >
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white group-hover/ig:bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs transition-colors shrink-0">
              <InstagramIcon size={18} className="group-hover/ig:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-tight leading-none group-hover/ig:text-white">
                Instagram
              </span>
              <span className="text-[10px] font-bold text-pink-600 group-hover/ig:text-pink-100 transition-colors mt-0.5">
                @distribuidorababyworld
              </span>
            </div>
          </div>
          <ExternalLink size={13} className="relative z-10 text-slate-400 group-hover/ig:text-white/90 transition-colors mr-0.5 shrink-0" />
        </a>

        {/* Tarjeta / Botón TikTok con Efecto Neón de Marca */}
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group/tt relative flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-2xs hover:shadow-md hover:shadow-cyan-500/25 active:scale-95 overflow-hidden"
          title="Síguenos en TikTok @baby.world426"
        >
          {/* Acentos cian y magenta de TikTok */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00f2fe]/10 via-transparent to-[#fe0979]/15 group-hover/tt:opacity-100 opacity-60 transition-opacity" />

          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/10 group-hover/tt:bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs transition-colors shrink-0">
              <TikTokIcon size={16} className="text-white group-hover/tt:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-tight leading-none text-white">
                TikTok
              </span>
              <span className="text-[10px] font-bold text-cyan-300 group-hover/tt:text-cyan-200 transition-colors mt-0.5">
                @baby.world426
              </span>
            </div>
          </div>
          <ExternalLink size={13} className="relative z-10 text-slate-400 group-hover/tt:text-white/90 transition-colors mr-0.5 shrink-0" />
        </a>

        {/* Nota amigable */}
        <p className="text-[9px] text-slate-400 text-center font-medium pt-0.5">
          ¡Videos, novedades y ofertas exclusivas! ✨
        </p>
      </div>
    </aside>
  )
}
