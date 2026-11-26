import React, { useState } from 'react';
import { Sparkles, Wine, ArrowUpRight } from 'lucide-react';
import { Dish } from '../types';
import { CATEGORIES, CREATIONS } from '../data/chef-creations';

interface CreationsGalleryProps {
  onSelectDish: (dish: Dish) => void;
}

export const CreationsGallery: React.FC<CreationsGalleryProps> = ({ onSelectDish }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const filteredDishes =
    activeCategory === 'Todas'
      ? CREATIONS
      : CREATIONS.filter((d) => d.category === activeCategory);

  return (
    <section id="creaciones" className="py-20 md:py-28 bg-white text-stone-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Colección Gastronómica 2026</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-950 leading-tight mb-4">
            Creaciones de <span className="italic font-normal text-amber-700">Autor</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
            Una selección viva de platos diseñados para despertar el asombro. Cada propuesta combina ingredientes autóctonos, cocciones de precisión y maridajes armónicos.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-10">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'bg-warm-100 hover:bg-warm-200 text-stone-600 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Creations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => onSelectDish(dish)}
              className="group bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 overflow-hidden shadow-xs hover:shadow-xl card-hover-effect flex flex-col justify-between cursor-pointer"
            >
              {/* Image Container with Badges */}
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent"></div>

                {dish.tag && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md border border-stone-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {dish.tag}
                  </span>
                )}

                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-medium uppercase tracking-wider">
                  {dish.category}
                </span>

                <div className="absolute bottom-3 right-3 p-2 rounded-full bg-white text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <ArrowUpRight className="w-4 h-4 text-amber-700" />
                </div>
              </div>

              {/* Text Info */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-serif italic text-amber-700 block mb-1">
                    {dish.subtitle}
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 group-hover:text-amber-800 transition-colors leading-snug">
                    {dish.name}
                  </h3>
                  <p className="text-stone-500 text-xs leading-relaxed line-clamp-3 mt-2 font-light">
                    {dish.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1.5 line-clamp-1 text-[11px]">
                    <Wine className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{dish.pairing}</span>
                  </span>
                  <span className="text-amber-700 font-bold group-hover:underline text-[11px] shrink-0 ml-2">
                    Ver más →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
