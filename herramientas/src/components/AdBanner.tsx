import React from 'react';

interface AdBannerProps {
  className?: string;
  size?: 'horizontal' | 'rectangle';
}

export default function AdBanner({ className = '', size = 'horizontal' }: AdBannerProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 dark:bg-navy-900 border border-dashed border-gray-300 dark:border-navy-700 rounded-lg flex items-center justify-center ${
        size === 'horizontal' ? 'w-full h-24 md:h-32' : 'w-full max-w-[300px] aspect-square mx-auto'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTI4LCAxMjgsIDEyOCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50"></div>
      
      <div className="text-center relative z-10 px-4">
        <span className="inline-block text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">
          Advertisement
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Espacio publicitario reservado
        </p>
      </div>
    </div>
  );
}
