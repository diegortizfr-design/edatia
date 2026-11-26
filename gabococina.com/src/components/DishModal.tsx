import React from 'react';
import { X, Wine, Flame, MessageCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white w-full max-w-3xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Dish Image */}
          <div className="relative aspect-square md:aspect-auto overflow-hidden bg-stone-100">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent"></div>
            {dish.tag && (
              <span className="absolute bottom-4 left-4 px-3 py-1 rounded-md bg-white/95 border border-stone-200 text-amber-800 text-xs font-bold uppercase tracking-wider shadow-sm">
                {dish.tag}
              </span>
            )}
          </div>

          {/* Dish Narrative & Technical Spec */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-700 font-bold block mb-1">
                {dish.category}
              </span>
              <h2 className="font-serif font-bold text-2xl text-stone-950 leading-tight mb-1">
                {dish.name}
              </h2>
              <p className="font-serif italic text-xs text-stone-500 mb-4">
                {dish.subtitle}
              </p>

              {/* Story / Inspiration */}
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block mb-1">
                  Inspiración del Plato:
                </span>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "{dish.story}"
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4 font-light">
                {dish.description}
              </p>

              {/* Technique & Pairing */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-stone-700">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Técnica:</strong> {dish.prepTechnique}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-stone-700">
                  <Wine className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900">Maridaje Sugerido:</strong> {dish.pairing}
                  </span>
                </div>
              </div>

              {/* Key Ingredients */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                  Ingredientes Destacados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-[11px] text-stone-700 font-medium"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
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
