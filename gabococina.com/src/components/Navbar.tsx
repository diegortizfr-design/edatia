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
      setIsScrolled(window.scrollY > 30);
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
          ? 'bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-3.5'
          : 'bg-warm-50/80 backdrop-blur-xs py-5 border-b border-stone-200/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-wider block leading-none">
                GABO <span className="text-amber-700 font-normal italic">COCINA</span>
              </span>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest block font-medium mt-0.5">
                Chef de Autor • Cenas Privadas
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-stone-600">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-amber-700 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-amber-600 hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Cotizar Experiencia</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-700 hover:text-stone-900"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-6 py-5 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <nav className="flex flex-col space-y-3 text-sm font-semibold uppercase tracking-wider text-stone-700">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-amber-700 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-stone-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm text-center"
            >
              Cotizar Experiencia en Casa
            </button>

            <a
              href={`https://wa.me/${CHEF_INFO.phone}?text=${encodeURIComponent(
                'Hola Chef Gabo, me gustaría consultar disponibilidad para una cena privada.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Hablar por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
