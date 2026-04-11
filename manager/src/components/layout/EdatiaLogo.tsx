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
      <svg width={d} height={d} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F8EF7" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="logo-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F8EF7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Outer triangle */}
        <polygon points="20,3 37,35 3,35" fill="url(#logo-gradient)" />
        {/* Inner triangle (cutout effect) */}
        <polygon points="20,10 31,32 9,32" fill="url(#logo-inner)" />
        {/* Data nodes */}
        <circle cx="20" cy="3" r="1.5" fill="#4F8EF7" />
        <circle cx="37" cy="35" r="1.5" fill="#8B5CF6" />
        <circle cx="3" cy="35" r="1.5" fill="#6366F1" />
        <circle cx="20" cy="20" r="1" fill="white" fillOpacity="0.6" />
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
