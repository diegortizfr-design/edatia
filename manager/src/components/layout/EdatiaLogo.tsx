interface EdatiaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function EdatiaLogo({ size = 'md', showTagline = false }: EdatiaLogoProps) {
  const dims = { sm: 28, md: 38, lg: 52 };
  const d = dims[size];
  const textSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className="flex items-center gap-2.5">
      {/* Triangle logo */}
      <svg width={d} height={d} viewBox="0 0 100 100" className="drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#logoGradient)" />
        {/* Barras del gráfico */}
        <rect x="25" y="60" width="8" height="15" rx="2" fill="white" />
        <rect x="40" y="45" width="8" height="30" rx="2" fill="white" />
        <rect x="55" y="52" width="8" height="23" rx="2" fill="white" />
        <rect x="70" y="35" width="8" height="40" rx="2" fill="white" />
        {/* Línea de tendencia */}
        <path d="M29 60 L44 45 L59 52 L74 35" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="60" r="3" fill="#60A5FA" />
        <circle cx="44" cy="45" r="3" fill="#60A5FA" />
        <circle cx="59" cy="52" r="3" fill="#60A5FA" />
        <circle cx="74" cy="35" r="3" fill="#60A5FA" />
      </svg>

      <div>
        <h1
          className={`font-bold tracking-tight bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent ${textSize[size]}`}
        >
          Edatia
        </h1>
        {showTagline && (
          <p className="text-xs text-slate-500 -mt-0.5 font-light">
            Convierte tus datos en decisiones
          </p>
        )}
      </div>
    </div>
  );
}
