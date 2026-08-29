import React from 'react'
import { Package, Truck, MessageCircle, Percent, Sparkles, Building2 } from 'lucide-react'

export function WholesaleBanner() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl text-white">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full text-xs font-black uppercase tracking-wider">
                <Building2 size={14} />
                <span>Canal Mayorista & Distribuidores</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
                ¿Tienes una Pañalera, Guardería o Tienda de Bebés?
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Accede a nuestras listas de precios por bultos y cajas cerradas con márgenes competitivos. Despachamos a nivel nacional con fletes económicos y atención prioritaria para revendedores y emprendedores.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <Percent size={18} className="text-pink-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Descuentos por Escala</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <Package size={18} className="text-sky-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Bultos Sellados</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
                  <Truck size={18} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Despacho Inmediato</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center space-y-4 w-full max-w-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
                  Solicita el Catálogo Mayorista
                </p>
                <p className="text-[11px] text-slate-300">
                  Te enviamos el archivo PDF con precios por volumen y condiciones comerciales.
                </p>
                <a
                  href="https://wa.me/573001234567?text=Hola%20Distribuidora%20Baby%20World,%20quiero%20solicitar%20el%20cat%C3%A1logo%20de%20precios%20al%20por%20mayor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle size={18} />
                  <span>Hablar con Asesor Mayorista</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
