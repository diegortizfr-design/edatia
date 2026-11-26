import React from 'react';
import { Sparkles, Check, ArrowRight, Calendar, Users } from 'lucide-react';
import { SERVICES } from '../data/chef-creations';

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  return (
    <section id="servicios" className="py-20 md:py-28 bg-[#f9f7f2] border-t border-b border-stone-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Servicios & Formatos Exclusivos</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-950 leading-tight mb-4">
            Experiencias Gastronómicas <br />
            <span className="italic font-normal text-amber-700">a tu Medida</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
            Desde una cena íntima de aniversario de 4 comensales hasta eventos boutique de hasta 80 invitados. Tú pones el espacio y los invitados; yo llevo la cocina de autor y la magia.
          </p>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-stone-200 hover:border-amber-400 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-xl card-hover-effect group"
            >
              <div className="space-y-6">
                {/* Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent"></div>
                </div>

                <div>
                  <span className="text-xs uppercase font-serif italic text-amber-700 block mb-1">
                    {srv.tagline}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 group-hover:text-amber-800 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-stone-500 text-xs sm:text-sm font-light leading-relaxed mt-2.5">
                    {srv.description}
                  </p>
                </div>

                {/* Details Pills */}
                <div className="p-3.5 rounded-xl bg-warm-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Menú:</strong> {srv.courses}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    <Users className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Ideal para:</strong> {srv.idealFor}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                    Qué incluye:
                  </span>
                  {srv.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Note & Action */}
              <div className="pt-6 mt-6 border-t border-stone-100 space-y-3">
                <span className="text-xs text-amber-800 font-semibold block">
                  {srv.priceNote}
                </span>

                <button
                  onClick={() => onSelectService(srv.title)}
                  className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md"
                >
                  <span>Cotizar este Formato</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
