import React from 'react';
import { Sparkles, Zap, ShieldCheck, Truck, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onOpenEncordado: () => void;
  onExploreProducts: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenEncordado,
  onExploreProducts,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-slate-800">
      {/* Decorative tennis court lines / glow background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-lime-400 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Colección Oficial 2026 Tenis & Pádel</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
              Lleva tu juego al <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-200">
                Siguiente Nivel
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Equipamiento profesional de alto rendimiento. Raquetas Wilson, Babolat, Head y Yonex con servicio de encordado electrónico computarizado en 2 horas.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 active:scale-95 transition-all shadow-lg shadow-lime-400/20 flex items-center gap-2"
              >
                <span>Ver Catálogo 2026</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenEncordado}
                className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold active:scale-95 transition-all flex items-center gap-2 group"
              >
                <Zap className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                <span>Calculadora de Encordado</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-lime-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Envío Gratis</p>
                  <p className="text-slate-400">Desde $200.000</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-lime-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Encordado Express</p>
                  <p className="text-slate-400">En solo 2 horas</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-lime-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Garantía Directa</p>
                  <p className="text-slate-400">100% Original</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Highlight Box */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/60 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
                <div>
                  <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">Taller Oficial Smash</span>
                  <h3 className="text-lg font-bold text-white">Servicio de Encordado</h3>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  Máquinas Electrónicas
                </span>
              </div>

              <div className="space-y-3.5 text-sm text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <span className="font-medium">Mano de Obra Certificada</span>
                  <span className="font-bold text-white">$35.000 COP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <span className="font-medium">Cuerdas Luxilon ALU Power / RPM</span>
                  <span className="font-bold text-white">Desde $65.000 COP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <span className="font-medium">Tensión Personalizada (45-62 lbs)</span>
                  <span className="font-bold text-lime-400">Incluido</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={onOpenEncordado}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Configurar mi Encordado</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
