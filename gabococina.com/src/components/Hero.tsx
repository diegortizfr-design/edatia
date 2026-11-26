import React from 'react';
import { Sparkles, ArrowRight, Flame, Wine, ShieldCheck } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

interface HeroProps {
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-noir-950 pt-24 pb-16">
      {/* Background with gastronomic ambience & dark vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&auto=format&fit=crop&q=80"
          alt="Alta Gastronomía Gabo Cocina"
          className="w-full h-full object-cover object-center opacity-25 filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/70 to-noir-950/90"></div>
        <div className="absolute inset-0 grain-overlay opacity-30"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-12">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom duration-500">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Gastronomía Sensorial & Cenas Privadas a Domicilio</span>
        </div>

        {/* Grand Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-tight leading-[1.1] mb-6">
          Cocina con <span className="italic font-normal text-gold-400">Alma</span>, <br className="hidden sm:inline" />
          Fuego & <span className="italic font-normal text-gold-400">Memoria</span>
        </h1>

        {/* Narrative Subtitle */}
        <p className="text-stone-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Transformo ingredientes de origen colombiano y técnicas de vanguardia en veladas irrepetibles. El restaurante de alta cocina ahora en la intimidad de tu hogar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#cotizador"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-noir-950 font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-gold-500/15 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Diseñar mi Cena Privada</span>
          </a>

          <a
            href="#creaciones"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-noir-850 hover:bg-noir-800 text-stone-200 hover:text-white border border-noir-700 font-semibold text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Ver Menú de Creaciones</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-noir-900/80 border border-noir-800/80 backdrop-blur-md max-w-4xl mx-auto">
          {CHEF_INFO.stats.map((st) => (
            <div key={st.label} className="text-center p-2">
              <span className="font-serif font-bold text-2xl sm:text-3xl text-gold-400 block gold-glow">
                {st.value}
              </span>
              <span className="text-[11px] sm:text-xs text-stone-400 font-medium tracking-wide">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
