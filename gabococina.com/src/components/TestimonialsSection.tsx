import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';
import { TESTIMONIALS } from '../data/chef-creations';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonios" className="py-20 md:py-28 bg-[#f9f7f2] border-t border-b border-stone-200/80 text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Voces de Nuestros Comensales</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-950 leading-tight mb-4">
            Memorias Alrededor <br />
            <span className="italic font-normal text-amber-700">de la Mesa</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
            Historias reales de anfitriones que confiaron sus momentos más especiales en las manos y el fuego de Chef Gabo.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col justify-between shadow-xs hover:shadow-xl card-hover-effect relative group hover:border-amber-400"
            >
              <Quote className="w-8 h-8 text-amber-600/20 mb-4" />

              <div className="space-y-4">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <p className="font-serif italic text-stone-700 text-sm sm:text-base leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100">
                <h4 className="font-serif font-bold text-stone-950 text-base">
                  {t.author}
                </h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  {t.role}
                </p>
                <span className="text-[11px] text-stone-500 block mt-1">
                  {t.occasion}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
