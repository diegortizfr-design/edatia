import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, Wrench, Menu, X, Phone } from 'lucide-react';
import { formatCOP, FREE_SHIPPING_THRESHOLD, WHATSAPP_PHONE } from '../lib/utils';
import { CATEGORIES } from '../data/products';

interface NavbarProps {
  cartCount: number;
  wishlistCount?: number;
  cartTotal?: number;
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  onCategorySelect?: (cat: string) => void;
  onOpenCart: () => void;
  onOpenStringing?: () => void;
  onOpenEncordado?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount = 0,
  cartTotal = 0,
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'Todos',
  onSelectCategory,
  onCategorySelect,
  onOpenCart,
  onOpenStringing,
  onOpenEncordado,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleOpenEncordado = onOpenEncordado || onOpenStringing || (() => {});
  const handleSelectCategory = (cat: string) => {
    if (onCategorySelect) onCategorySelect(cat);
    if (onSelectCategory) onSelectCategory(cat);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* 1. Announcement Bar */}
      <div className="bg-neutral-950 text-neutral-300 text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
            <span>
              Envíos a toda Colombia • Gratis por compras superiores a <strong>{formatCOP(FREE_SHIPPING_THRESHOLD)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
            <span>Pagos PSE, Nequi, Daviplata y Tarjetas</span>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hola Smash, deseo asesoría sobre productos de tenis/pádel')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone size={12} className="text-lime-400" />
              <span>WhatsApp: <strong>+57 (310) 555-9876</strong></span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelectCategory('Todos')}>
            <img
              src="/logo.jpeg"
              alt="Smash Tenis y Pádel"
              className="h-12 w-auto object-contain rounded-md"
              onError={(e) => {
                // Fallback to svg or text if jpeg fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="hidden sm:block">
              <span className="font-heading font-black text-2xl tracking-tight text-neutral-950 uppercase block leading-none">
                SMASH
              </span>
              <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold">
                Tenis & Pádel
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Buscar raquetas, calzado, cuerdas o ref (ej: 793-2TV)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Taller / Cotizador Encordado */}
            <button
              onClick={handleOpenEncordado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-semibold transition-colors"
              title="Cotizador y servicio de encordado computarizado"
            >
              <Wrench size={15} className="text-lime-600" />
              <span className="hidden lg:inline">Cotizar Encordado</span>
              <span className="lg:hidden text-[11px]">Taller</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 bg-lime-400 text-neutral-950 font-bold text-[10px] rounded-full">
                  {cartCount}
                </span>
              )}
              {cartTotal > 0 && (
                <span className="hidden xl:inline text-neutral-300 font-normal">
                  ({formatCOP(cartTotal)})
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-950"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
            <input
              type="text"
              placeholder="Buscar raquetas, calzado, cuerdas o ref..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-2.5 border-t border-neutral-100 text-xs no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 space-y-2">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Categorías</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  handleSelectCategory(cat);
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2 text-left rounded-lg text-xs font-medium ${
                  selectedCategory === cat ? 'bg-neutral-900 text-white' : 'text-neutral-700 bg-neutral-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
