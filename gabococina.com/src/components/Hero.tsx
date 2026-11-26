import React from 'react';
import { Sparkles, ArrowRight, Flame, Wine, ShieldCheck } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

interface HeroProps {
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-warm-100 via-warm-50 to-white pt-24 pb-16">
      {/* Delicate background pattern and ambient gastronomy photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&auto=format&fit=crop&q=80"
          alt="Alta Gastronomía Gabo Cocina"
          className="w-full h-full object-cover object-center opacity-10 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-50 via-warm-50/90 to-warm-100/90"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-12">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-600/20 text-amber-900 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom duration-500">
          <Flame className="w-4 h-4 text-amber-600" />
          <span>Gastronomía Sensorial & Cenas Privadas a Domicilio</span>
        </div>

        {/* Grand Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-stone-950 font-bold tracking-tight leading-[1.1] mb-6">
          Cocina con <span className="italic font-normal text-amber-700">Alma</span>, <br className="hidden sm:inline" />
          Fuego & <span className="italic font-normal text-amber-700">Memoria</span>
        </h1>

        {/* Narrative Subtitle */}
        <p className="text-stone-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Transformo ingredientes de origen colombiano y técnicas de vanguardia en veladas irrepetibles. El restaurante de alta cocina ahora en la intimidad de tu hogar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#cotizador"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current text-amber-200" />
            <span>Diseñar mi Cena Privada</span>
          </a>

          <a
            href="#creaciones"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Ver Menú de Creaciones</span>
            <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Stats Ribbon in Crisp White Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/95 border border-stone-200/90 shadow-lg editorial-shadow max-w-4xl mx-auto">
          {CHEF_INFO.stats.map((st) => (
            <div key={st.label} className="text-center p-2">
              <span className="font-serif font-bold text-2xl sm:text-3xl text-amber-700 block">
                {st.value}
              </span>
              <span className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-wide">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
