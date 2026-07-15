import React from 'react'
import { ShoppingBag, Search, Heart } from 'lucide-react'
import { GlowxirLogo } from './GlowxirLogo'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  activeCategory: string
  setActiveCategory: (cat: string) => void
}

export function Navbar({ cartCount, onCartClick, activeCategory, setActiveCategory }: NavbarProps) {
  const categories = ['Todos', 'Labios', 'Rostro', 'Ojos', 'Accesorios']

  return (
    <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => setActiveCategory('Todos')}>
            <GlowxirLogo />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${
                  (cat === 'Todos' && activeCategory === 'Todos') || activeCategory === cat
                    ? 'text-glowxir-600 border-b-2 border-glowxir-500 pb-1'
                    : 'text-slate-500 hover:text-slate-800 pb-1'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icons Bar */}
          <div className="flex items-center gap-4 text-slate-650">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-all">
              <Search size={20} />
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-all relative">
              <Heart size={20} />
            </button>
            <button
              onClick={onCartClick}
              className="p-2 hover:bg-slate-50 rounded-full transition-all relative flex items-center justify-center text-slate-800"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-glowxir-600 text-white font-black text-[9px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
