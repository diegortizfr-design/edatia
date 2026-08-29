import React, { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, ShieldCheck, Truck, HeartHandshake, PackageCheck, PartyPopper, Calculator } from 'lucide-react'

interface HeroBannerProps {
  onExploreClick: () => void
  onGenderRevealClick: () => void
  onOpenCalculator: () => void
}

export function HeroBanner({ onExploreClick, onGenderRevealClick, onOpenCalculator }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      badge: "🎉 Especialistas en Celebraciones",
      title: "Kits de Revelación & Baby Shower",
      highlight: "Momentos Mágicos",
      description: "Cañones de humo de colores ultra vívidos, globos gigantes sorpresa, polvos holi y tortas de pañales temáticas para la llegada más esperada.",
      ctaText: "Ver Colección Revelación",
      action: onGenderRevealClick,
      bgGradient: "from-pink-50 via-sky-50 to-purple-50",
      accentBadge: "bg-pink-100 text-pink-700 border-pink-200",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80"
    },
    {
      badge: "🍼 Pañalera al Por Mayor y Detal",
      title: "Ahorra en Grande con Bultos",
      highlight: "Precios de Distribuidora",
      description: "Todas las marcas líderes en pañales, toallitas 99% agua pura, fórmulas y cremas medicadas para el cuidado diario de tu bebé.",
      ctaText: "Calcular mis Pañales",
      action: onOpenCalculator,
      bgGradient: "from-sky-50 via-blue-50 to-amber-50",
      accentBadge: "bg-sky-100 text-sky-700 border-sky-200",
      image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80"
    },
    {
      badge: "🧸 Estimulación & Confort",
      title: "Juguetería & Ropa Algodón Pima",
      highlight: "100% Amor y Suavidad",
      description: "Gimnasios musicales interactivos, mordedores de silicona alimentaria, ajuares de clínica y mamelucos térmicos para abrigar a tu pequeño.",
      ctaText: "Explorar Todo el Catálogo",
      action: onExploreClick,
      bgGradient: "from-emerald-50 via-teal-50 to-sky-50",
      accentBadge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6500)
    return () => clearInterval(timer)
  }, [slides.length])

  const slide = slides[currentSlide]

  return (
    <div className="relative overflow-hidden border-b border-slate-100 bg-white">
      {/* Background Soft Floating Spheres */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Animated Category Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm transition-all duration-300"
                 key={slide.badge}
            >
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${slide.accentBadge}`}>
                {slide.badge}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] font-display">
                {slide.title} <br />
                <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-pink-500 bg-clip-text text-transparent">
                  {slide.highlight}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {slide.description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={slide.action}
                className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl flex items-center gap-2.5 group active:scale-95"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenCalculator}
                className="px-5 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
              >
                <Calculator size={16} className="text-amber-600" />
                <span>Calculadora de Pañales</span>
              </button>
            </div>

            {/* Slide Pagination Dots */}
            <div className="flex items-center gap-2 pt-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-8 bg-sky-500' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* Decorative Frame */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-sky-300 via-pink-300 to-amber-200 rounded-3xl blur-lg opacity-40 animate-pulse" />
              
              <div className="relative bg-white p-3 rounded-3xl shadow-xl border border-slate-100 overflow-hidden group">
                <div className="relative aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Floating badge */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                        🎁
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Garantía Baby World</p>
                        <p className="text-xs font-black text-slate-800">100% Calidad Hipoalergénica</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      En Stock
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100/60">
            <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Envíos a Todo el País</p>
              <p className="text-[10px] text-slate-500">Despacho seguro en 24-48h</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100/60">
            <div className="h-10 w-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
              <HeartHandshake size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Pago Contra Entrega</p>
              <p className="text-[10px] text-slate-500">Paga al recibir en tu casa</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">100% Seguros para Bebé</p>
              <p className="text-[10px] text-slate-500">Libres de BPA y parabenos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-100/60">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <PackageCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Precios de Mayorista</p>
              <p className="text-[10px] text-slate-500">Ahorro en bultos y cajas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
