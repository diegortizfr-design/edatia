import React from 'react';
import { Flame, Compass, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

export const AboutSection: React.FC = () => {
  return (
    <section id="sobre-gabo" className="py-20 md:py-28 bg-[#f9f7f2] border-t border-b border-stone-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Visual Composition with Chef/Gastronomy */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-2xl bg-white p-2">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80"
                  alt="Chef Gabo en acción culinaria"
                  className="w-full h-[450px] sm:h-[500px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating quote card */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-xl bg-white/95 border border-stone-200/90 shadow-xl backdrop-blur-md">
                <p className="font-serif italic text-sm text-stone-800 leading-snug">
                  "No cocino para alimentar el cuerpo, cocino para despertar memorias y tocar el alma alrededor del fuego."
                </p>
                <span className="text-xs font-bold text-amber-700 mt-2 block tracking-wider uppercase">
                  — Gabriel Martínez (Chef Gabo)
                </span>
              </div>
            </div>

            {/* Decorative warm accent frame */}
            <div className="absolute -top-3 -left-3 w-24 h-24 border-t-2 border-l-2 border-amber-600/40 rounded-tl-xl pointer-events-none"></div>
          </div>

          {/* Right Column: Story & Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <span>Filosofía & Manifiesto</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-950 leading-tight">
              Una mesa donde cada plato <br />
              <span className="italic font-normal text-amber-700">cuenta una historia</span>
            </h2>

            <p className="text-stone-700 text-base sm:text-lg leading-relaxed font-light">
              {CHEF_INFO.bio}
            </p>

            <p className="text-stone-600 text-sm leading-relaxed">
              Tras más de una década liderando cocinas y diseñando banquetes de autor, descubrí que la verdadera magia ocurre cuando se elimina la distancia entre el chef y el comensal. Por eso me especializo en llevar la alta cocina a espacios privados: casas campestres, terrazas urbanas y celebraciones donde la exclusividad y la calidez son los ingredientes principales.
            </p>

            {/* Three Pillar Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs hover:border-amber-400/60 transition-all space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Fuego & Carbón</h4>
                <p className="text-xs text-stone-500 leading-snug">
                  Cocciones vivas a la brasa y braseados lentos que exaltan aromas ahumados irrepetibles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs hover:border-amber-400/60 transition-all space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Origen Local</h4>
                <p className="text-xs text-stone-500 leading-snug">
                  Ingredientes seleccionados directamente de campesinos andinos y pescadores artesanales.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs hover:border-amber-400/60 transition-all space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">100% Privado</h4>
                <p className="text-xs text-stone-500 leading-snug">
                  Atención exclusiva sin prisas, diseñada para que los anfitriones disfruten con sus invitados.
                </p>
              </div>
            </div>

            {/* Bullet features */}
            <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Menús adaptados a alergias y preferencias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Servicio disponible en Medellín, Bogotá y alrededores</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
