import React from 'react'

export function GlowxirLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Thin circle with lavender gradient */}
        <circle cx="50" cy="50" r="44" stroke="url(#paint0_linear_logo)" strokeWidth="2.5" />
        
        {/* Lipstick outline */}
        <rect x="33" y="44" width="10" height="22" rx="1" stroke="url(#paint0_linear_logo)" strokeWidth="2.5" />
        <path d="M33 44H43L40 33H36L33 44Z" stroke="url(#paint0_linear_logo)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M34 33H39L39 27H34V33Z" fill="url(#paint0_linear_logo)" />
        
        {/* Brush outline */}
        <path d="M60 48L61.5 66H56.5L58 48" stroke="url(#paint0_linear_logo)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M54.5 48C54.5 48 53 38 58 31C63 38 61.5 48 61.5 48H54.5Z" fill="url(#paint0_linear_logo)" opacity="0.8" />
        
        {/* Sparkles */}
        <path d="M48 38L49 41L52 42L49 43L48 46L47 43L44 42L47 41L48 38Z" fill="url(#paint0_linear_logo)" />
        <path d="M51 47L51.5 49L53.5 49.5L51.5 50L51 52L50.5 50L48.5 49.5L50.5 49L51 47Z" fill="url(#paint0_linear_logo)" />
        
        <defs>
          <linearGradient id="paint0_linear_logo" x1="6" y1="6" x2="94" y2="94" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b494eb" />
            <stop offset="1" stopColor="#7d45d0" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-serif font-black text-xl tracking-[0.16em] text-slate-800 uppercase">
        Glowxir
      </span>
    </div>
  )
}
