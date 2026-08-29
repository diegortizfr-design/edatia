import React from 'react'

interface BabyWorldLogoProps {
  className?: string
  variant?: 'full' | 'compact'
  inverted?: boolean
}

export function BabyWorldLogo({ className = "", variant = 'full', inverted = false }: BabyWorldLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Charming Baby Icon */}
      <div className="relative flex-shrink-0">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-md ${
          inverted ? 'bg-white/10 text-white' : 'bg-gradient-to-tr from-sky-400 via-sky-300 to-pink-300 text-white'
        } transform transition-transform hover:scale-105 duration-300`}>
          <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cute cloud base */}
            <path d="M14 34C11.7909 34 10 32.2091 10 30C10 28.0583 11.383 26.4389 13.2188 26.0857C13.0766 25.4144 13 24.7171 13 24C13 18.4772 17.4772 14 23 14C27.7946 14 31.8105 17.3758 32.7719 21.8996C33.1706 21.8344 33.5813 21.8 34 21.8C37.3137 21.8 40 24.4863 40 27.8C40 31.1137 37.3137 33.8 34 33.8L14 34Z" fill="white" fillOpacity="0.95" />
            
            {/* Pacifier / Baby pin charm in center */}
            <circle cx="24" cy="25" r="4.5" fill="#38BDF8" />
            <path d="M24 20.5V17" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M21 17C21 15.3431 22.3431 14 24 14C25.6569 14 27 15.3431 27 17H21Z" fill="#F472B6" />
            <circle cx="24" cy="25" r="2" fill="white" />
            
            {/* Tiny stars */}
            <path d="M37 13L38 15L40 16L38 17L37 19L36 17L34 16L36 15L37 13Z" fill="#FDE047" />
            <path d="M9 19L9.7 20.3L11 21L9.7 21.7L9 23L8.3 21.7L7 21L8.3 20.3L9 19Z" fill="#FDE047" />
          </svg>
        </div>
        {/* Little decorative floating dot */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-400 border border-white"></span>
        </span>
      </div>

      {/* Typography */}
      {variant === 'full' ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-600 font-sans">
              Distribuidora
            </span>
            <span className="h-1 w-1 rounded-full bg-pink-400"></span>
            <span className="text-[9px] font-bold text-pink-500 uppercase tracking-wider hidden sm:inline-block">
              Mayor y Detal
            </span>
          </div>
          <div className="flex items-center">
            <span className={`text-xl sm:text-2xl font-black tracking-tight font-display ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}>
              Baby <span className="bg-gradient-to-r from-sky-500 via-sky-400 to-pink-500 bg-clip-text text-transparent">World</span>
            </span>
          </div>
        </div>
      ) : (
        <span className={`text-lg font-black tracking-tight font-display ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}>
          Baby<span className="text-sky-500">World</span>
        </span>
      )}
    </div>
  )
}
