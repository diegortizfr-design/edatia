import React, { useState } from 'react'
import { Sparkles, Heart, PartyPopper, Check, Flame, MessageCircle } from 'lucide-react'
import { Product } from '../data/productos'

interface GenderRevealSectionProps {
  products: Product[]
  onAddToCart: (p: Product) => void
  onViewDetails: (p: Product) => void
}

export function GenderRevealSection({ products, onAddToCart, onViewDetails }: GenderRevealSectionProps) {
  const [teamVote, setTeamVote] = useState<'boy' | 'girl' | null>(null)
  const [boyVotes, setBoyVotes] = useState(142)
  const [girlVotes, setGirlVotes] = useState(158)
  const [hasVoted, setHasVoted] = useState(false)

  const genderProducts = products.filter(
    p => p.categoria === 'Revelación de Género' || p.categoria === 'Baby Shower'
  )

  const handleVote = (team: 'boy' | 'girl') => {
    if (hasVoted) return
    setTeamVote(team)
    setHasVoted(true)
    if (team === 'boy') setBoyVotes(prev => prev + 1)
    if (team === 'girl') setGirlVotes(prev => prev + 1)
  }

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <section className="py-14 bg-gradient-to-b from-pink-50/70 via-purple-50/40 to-sky-50/70 border-y border-pink-100/60 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-pink-100 to-sky-100 text-slate-800 rounded-full text-xs font-black uppercase tracking-wider border border-pink-200/50 shadow-sm">
            <PartyPopper size={14} className="text-pink-500" />
            <span>Gender Reveal & Baby Shower</span>
          </div>
          
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            ¡Haz de la Revelación de Género un <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 bg-clip-text text-transparent">
              Momento Inolvidable!
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600">
            Descubre nuestros kits de humo de máxima densidad, confeti metálico, globos sorpresa gigantes y centros de mesa útiles para tu fiesta.
          </p>
        </div>

        {/* Interactive Voting Widget */}
        <div className="max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-pink-100/80 mb-12 text-center space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            ✨ ¿Qué crees que será? ¡Vota en nuestra encuesta en vivo!
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleVote('boy')}
              disabled={hasVoted}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                teamVote === 'boy'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-lg scale-105'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-sky-900 border-sky-200 hover:border-sky-300'
              }`}
            >
              <span className="text-2xl">👦 💙</span>
              <span className="font-black text-sm uppercase tracking-wide">Team Niño</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 text-sky-700 shadow-sm">
                {boyVotes} votos ({Math.round((boyVotes / (boyVotes + girlVotes)) * 100)}%)
              </span>
            </button>

            <button
              onClick={() => handleVote('girl')}
              disabled={hasVoted}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                teamVote === 'girl'
                  ? 'bg-pink-500 text-white border-pink-600 shadow-lg scale-105'
                  : 'bg-pink-50/80 hover:bg-pink-100 text-pink-900 border-pink-200 hover:border-pink-300'
              }`}
            >
              <span className="text-2xl">👧 💖</span>
              <span className="font-black text-sm uppercase tracking-wide">Team Niña</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 text-pink-700 shadow-sm">
                {girlVotes} votos ({Math.round((girlVotes / (boyVotes + girlVotes)) * 100)}%)
              </span>
            </button>
          </div>

          {hasVoted && (
            <p className="text-xs font-bold text-emerald-600 animate-fade-in flex items-center justify-center gap-1">
              <Check size={14} /> ¡Gracias por votar! Que comience la fiesta.
            </p>
          )}
        </div>

        {/* Product Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {genderProducts.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-4 border border-pink-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div 
                  onClick={() => onViewDetails(product)}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 cursor-pointer"
                >
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-sky-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                    Top Revelación
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">
                    {product.categoria}
                  </span>
                  <h3
                    onClick={() => onViewDetails(product)}
                    className="font-bold text-slate-800 text-sm hover:text-pink-600 transition-colors line-clamp-1 cursor-pointer"
                  >
                    {product.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Precio Especial</span>
                  <span className="text-base font-black text-slate-900">
                    {fmtPrice(product.precio)}
                  </span>
                </div>
                <button
                  onClick={() => onAddToCart(product)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-sky-500 hover:from-pink-600 hover:to-sky-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Agregar +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Wholesale / Event Advice Box */}
        <div className="mt-10 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-black text-base sm:text-lg font-display">
              ¿Organizas un evento grande o compras al por mayor?
            </h4>
            <p className="text-xs text-slate-300 max-w-xl">
              Ofrecemos combos por caja para decoradores, organizadores de baby showers y tiendas de fiestas con despacho prioritario.
            </p>
          </div>
          <a
            href="https://wa.me/573001234567?text=Hola%20deseo%20cotizar%20un%20combo%20de%20revelaci%C3%B3n%20de%20g%C3%A9nero%20o%20baby%20shower"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <MessageCircle size={16} />
            <span>Cotizar por WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
