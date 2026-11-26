import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

interface NavbarProps {
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Filosofía', href: '#sobre-gabo' },
    { label: 'Creaciones', href: '#creaciones' },
    { label: 'Experiencias', href: '#servicios' },
    { label: 'Cotizador', href: '#cotizador' },
    { label: 'Testimonios', href: '#testimonios' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-noir-950/90 backdrop-blur-md border-b border-noir-800 shadow-xl py-3.5'
          : 'bg-gradient-to-b from-noir-950/80 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-amber-700 flex items-center justify-center text-noir-950 shadow-md group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-white tracking-wider block leading-none">
                GABO <span className="text-gold-400 font-light italic">COCINA</span>
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium mt-0.5">
                Chef de Autor • Cenas Privadas
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-stone-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-gold-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gold-400 hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Cotizar Experiencia</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-300 hover:text-white"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-noir-900 border-b border-noir-800 px-6 py-5 space-y-4 animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold uppercase tracking-wider text-stone-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-gold-400 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-noir-800 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-xl bg-gold-500 text-noir-950 font-bold text-xs uppercase tracking-wider shadow-md text-center"
            >
              Cotizar Experiencia en Casa
            </button>

            <a
              href={`https://wa.me/${CHEF_INFO.phone}?text=${encodeURIComponent(
                'Hola Chef Gabo, me gustaría consultar disponibilidad para una cena privada.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-noir-800 border border-noir-700 text-stone-300 font-semibold text-xs flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Hablar por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
