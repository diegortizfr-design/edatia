import React from 'react';
import { UtensilsCrossed, Instagram, MessageCircle, Heart } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1c1917] text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-serif font-bold text-2xl text-white tracking-wider">
                GABO <span className="text-amber-400 font-light italic">COCINA</span>
              </span>
            </div>

            <p className="text-stone-400 text-xs max-w-md leading-relaxed font-light">
              Gastronomía de autor, fuegos vivos y cenas privadas a domicilio en Colombia. Diseñando momentos memorables donde el producto local y el comensal son los protagonistas.
            </p>

            <p className="text-[11px] text-stone-400 font-mono">
              Dominio Oficial: <strong className="text-amber-400">gabococina.com</strong>
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white text-sm tracking-wider uppercase">
              Explorar
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><a href="#sobre-gabo" className="hover:text-amber-400 transition-colors">Filosofía del Chef</a></li>
              <li><a href="#creaciones" className="hover:text-amber-400 transition-colors">Menú de Creaciones</a></li>
              <li><a href="#servicios" className="hover:text-amber-400 transition-colors">Cenas Privadas en Casa</a></li>
              <li><a href="#cotizador" className="hover:text-amber-400 transition-colors">Cotizador de Eventos</a></li>
              <li><a href="#testimonios" className="hover:text-amber-400 transition-colors">Testimonios de Clientes</a></li>
            </ul>
          </div>

          {/* Direct Connect */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white text-sm tracking-wider uppercase">
              Contacto Directo
            </h4>
            <div className="space-y-2 text-stone-400">
              <p>WhatsApp: <strong className="text-white">+57 (310) 555-9876</strong></p>
              <p>Email: <strong className="text-white">contacto@gabococina.com</strong></p>
              <p>Instagram: <strong className="text-amber-400">@gabococina</strong></p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://wa.me/${CHEF_INFO.phone}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center hover:text-emerald-400 hover:border-emerald-500 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center hover:text-pink-400 hover:border-pink-500 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px]">
          <p>© 2026 Gabo Cocina (gabococina.com). Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>para amantes del buen comer</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
