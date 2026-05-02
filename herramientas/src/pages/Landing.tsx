import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, LayoutDashboard, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import AdBanner from '../components/AdBanner';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-gray-200 dark:border-navy-800">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* LOGOS: Asegúrate de guardar los archivos en herramientas/public/ */}
            <img src="/logo-light.png" alt="Edatia" className="h-10 hidden dark:block" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <img src="/logo-dark.png" alt="Edatia" className="h-10 block dark:hidden" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white ml-2">Herramientas</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue transition-colors">Todas</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue transition-colors">Populares</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue transition-colors">Edatia ERP</a>
          </nav>
        </div>
      </header>

      {/* TOP AD BANNER */}
      <div className="max-w-[1200px] mx-auto w-full px-6 mt-8">
        <AdBanner size="horizontal" />
      </div>

      {/* HERO SECTION */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
            </span>
            Nuevas herramientas agregadas
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            Potencia tu negocio con <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-indigo">
              herramientas gratuitas
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Explora nuestra colección de calculadoras, gestores y plantillas diseñadas específicamente para optimizar el día a día de tu empresa. Sin descargas, seguras y rápidas.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500"/> 100% Seguras</span>
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-blue"/> Uso Gratuito</span>
          </div>
        </div>

        {/* TOOLS GRID */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-purple" />
            Catálogo de Herramientas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CARD: GESTIÓN DE CARTERA */}
            <Link to="/cartera" className="group relative bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-200 dark:border-navy-800 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-indigo rounded-xl flex items-center justify-center text-white mb-6 shadow-glow-blue">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestión de Cartera</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Controla tus cuentas por cobrar, automatiza el cálculo de edades de mora y mantén un registro seguro de tus facturas.
                </p>
                <div className="flex items-center text-brand-blue font-semibold text-sm">
                  Probar herramienta
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* CARD: PRÓXIMAMENTE */}
            <div className="relative bg-gray-50 dark:bg-navy-900/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-navy-700 flex flex-col items-center justify-center text-center opacity-70">
               <div className="w-12 h-12 bg-gray-200 dark:bg-navy-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
                  <Plus className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Próximamente</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Nuevas herramientas en desarrollo.</p>
            </div>
          </div>
        </div>

        {/* MIDDLE AD BANNER */}
        <div className="mt-20 mb-10">
          <AdBanner size="horizontal" />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-950 py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-80">
            <img src="/logo-light.png" alt="Edatia" className="h-6 hidden dark:block" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <img src="/logo-dark.png" alt="Edatia" className="h-6 block dark:hidden" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-sm font-semibold text-gray-500">| Tools</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Edatia ERP. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
