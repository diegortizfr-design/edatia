import React from 'react';
import { X, Wine, Flame, Sparkles, MessageCircle, Utensils } from 'lucide-react';
import { Dish } from '../types';
import { CHEF_INFO } from '../data/chef-creations';

interface DishModalProps {
  dish: Dish | null;
  onClose: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish, onClose }) => {
  if (!dish) return null;

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hola Chef Gabo, estuve viendo tu plato *${dish.name}* en gabococina.com y me gustaría incluirlo en una experiencia privada. ¿Cómo podemos coordinarlo?`
    );
    window.open(`https://wa.me/${CHEF_INFO.phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-noir-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative bg-noir-900 w-full max-w-3xl rounded-2xl border border-noir-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-noir-950/70 hover:bg-noir-950 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Dish Image */}
          <div className="relative aspect-square md:aspect-auto overflow-hidden bg-noir-850">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-transparent to-transparent"></div>
            {dish.tag && (
              <span className="absolute bottom-4 left-4 px-3 py-1 rounded-md bg-noir-950/90 border border-gold-500/40 text-gold-400 text-xs font-bold uppercase tracking-wider">
                {dish.tag}
              </span>
            )}
          </div>

          {/* Dish Narrative & Technical Spec */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-400 font-bold block mb-1">
                {dish.category}
              </span>
              <h2 className="font-serif font-bold text-2xl text-white leading-tight mb-1">
                {dish.name}
              </h2>
              <p className="font-serif italic text-xs text-stone-400 mb-4">
                {dish.subtitle}
              </p>

              {/* Story / Inspiration */}
              <div className="mb-4 p-3.5 rounded-xl bg-noir-850 border border-noir-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                  Inspiración del Plato:
                </span>
                <p className="text-xs text-stone-300 italic leading-relaxed">
                  "{dish.story}"
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4">
                {dish.description}
              </p>

              {/* Technique & Pairing */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-stone-300">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Técnica:</strong> {dish.prepTechnique}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-stone-300">
                  <Wine className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Maridaje Sugerido:</strong> {dish.pairing}
                  </span>
                </div>
              </div>

              {/* Key Ingredients */}
              <div className="mt-4 pt-3 border-t border-noir-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                  Ingredientes Destacados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-2 py-0.5 rounded bg-noir-800 border border-noir-700 text-[11px] text-stone-300"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-noir-800">
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Quiero este plato en mi Cena Privada</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
