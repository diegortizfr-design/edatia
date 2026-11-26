import React, { useState } from 'react';
import { Calculator, MessageCircle, Sparkles } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

export const PrivateDiningCalculator: React.FC = () => {
  const [serviceType, setServiceType] = useState<'cena' | 'evento' | 'masterclass'>('cena');
  const [guests, setGuests] = useState<number>(6);
  const [courses, setCourses] = useState<number>(4);
  const [includeWine, setIncludeWine] = useState<boolean>(true);
  const [includeTableware, setIncludeTableware] = useState<boolean>(true);
  const [includeFireShow, setIncludeFireShow] = useState<boolean>(false);

  // Price modeling in COP
  const basePricePerPerson = {
    3: 135000,
    4: 165000,
    6: 220000,
  }[courses] || 165000;

  const winePerPerson = includeWine ? 45000 : 0;
  const tablewarePerPerson = includeTableware ? 20000 : 0;
  const fireShowFixed = includeFireShow ? 150000 : 0;

  const totalPerPerson = basePricePerPerson + winePerPerson + tablewarePerPerson;
  const estimatedTotal = totalPerPerson * guests + fireShowFixed;

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSendWhatsApp = () => {
    const serviceName = {
      cena: 'Cena Privada a Domicilio (Chef at Home)',
      evento: 'Evento Boutique / Celebración',
      masterclass: 'Masterclass Culinaria Privada',
    }[serviceType];

    const message = encodeURIComponent(
      `👨‍🍳 *COTIZACIÓN DESDE GABOCOCINA.COM*\n` +
        `==================================\n` +
        `*Experiencia:* ${serviceName}\n` +
        `*Número de Invitados:* ${guests} personas\n` +
        `*Formato de Menú:* ${courses} Tiempos de Autor\n` +
        `*Maridaje de Vinos:* ${includeWine ? 'Sí incluido' : 'No'}\n` +
        `*Vajilla & Montaje de Lujo:* ${includeTableware ? 'Sí incluido' : 'No'}\n` +
        `*Showcooking de Fuego:* ${includeFireShow ? 'Sí incluido' : 'No'}\n` +
        `==================================\n` +
        `*Inversión Estimada:* ${formatCOP(estimatedTotal)} COP\n` +
        `==================================\n` +
        `Hola Chef Gabo, me gustaría verificar disponibilidad de fecha y afinar los detalles de este menú. ¡Gracias!`
    );

    window.open(`https://wa.me/${CHEF_INFO.phone}?text=${message}`, '_blank');
  };

  return (
    <section id="cotizador" className="py-20 md:py-28 bg-white text-stone-900 relative overflow-hidden">
      {/* Subtle warm decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulador Interactivo de Eventos</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-950 leading-tight mb-4">
            Diseña tu <span className="italic font-normal text-amber-700">Presupuesto</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-light max-w-xl mx-auto">
            Configura el número de comensales, tiempos del menú y extras para calcular una estimación transparente en tiempo real.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-warm-50 rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xl">
          
          {/* 1. Type of Service */}
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-3">
              1. Selecciona el Tipo de Experiencia:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'cena', label: 'Cena Privada en Casa', sub: 'Chef at Home íntimo' },
                { id: 'evento', label: 'Evento Boutique', sub: 'Hasta 40 personas' },
                { id: 'masterclass', label: 'Masterclass & Taller', sub: 'Clase interactiva' },
              ].map((t) => {
                const isSelected = serviceType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setServiceType(t.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 text-stone-900 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span className="font-serif font-bold text-sm text-stone-900 block">
                      {t.label}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      {t.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Number of Guests (Slider) */}
          <div className="mb-8 p-5 rounded-2xl bg-white border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                2. Número de Comensales:
              </label>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1 rounded-lg border border-amber-300 text-amber-900 font-serif font-bold text-lg">
                <span>{guests}</span>
                <span className="text-xs font-sans font-medium text-stone-600">personas</span>
              </div>
            </div>

            <input
              type="range"
              min="2"
              max="35"
              step="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-stone-500 font-mono mt-1.5">
              <span>2 pax (Cena íntima)</span>
              <span>10 pax (Reunión)</span>
              <span>35 pax (Celebración)</span>
            </div>
          </div>

          {/* 3. Number of Courses */}
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-3">
              3. Tiempos del Menú Degustación:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { courses: 3, label: '3 Tiempos de Autor', sub: 'Entrada, Fuerte, Postre' },
                { courses: 4, label: '4 Tiempos (Recomendado)', sub: 'Amuse, Entrada, Fuerte, Postre' },
                { courses: 6, label: '6 Tiempos Gran Degustación', sub: 'Recorrido sensorial completo' },
              ].map((c) => {
                const isSelected = courses === c.courses;
                return (
                  <button
                    key={c.courses}
                    onClick={() => setCourses(c.courses)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 text-stone-900 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span className="font-serif font-bold text-sm text-stone-900 block">
                      {c.label}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      {c.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional Extras */}
          <div className="mb-10 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
              4. Opciones & Experiencias Complementarias:
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeWine}
                onChange={(e) => setIncludeWine(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-stone-900 block">
                  🍷 Maridaje de Vinos & Destilados de Autor (+ $45.000 / persona)
                </span>
                <span className="text-stone-500 font-light">
                  Selección de etiquetas sommelier maridadas armoniosamente para cada tiempo del menú.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeTableware}
                onChange={(e) => setIncludeTableware(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-stone-900 block">
                  🍽️ Vajilla Artesanal, Cristalería Fina & Montaje de Mesa (+ $20.000 / persona)
                </span>
                <span className="text-stone-500 font-light">
                  Llevamos toda la vajilla de cerámica artesanal, copas de cristal y cubertería de lujo.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeFireShow}
                onChange={(e) => setIncludeFireShow(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-stone-900 block">
                  🔥 Showcooking de Fuego en Vivo (+ $150.000 tarifa fija)
                </span>
                <span className="text-stone-500 font-light">
                  Flameado y ahumado interactivo con campanas de humo frente a los comensales.
                </span>
              </div>
            </label>
          </div>

          {/* Investment Summary & Action */}
          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <span className="text-xs text-stone-500 uppercase tracking-wider block">
                Presupuesto Estimado ({guests} comensales):
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-3xl sm:text-4xl font-extrabold text-amber-700">
                  {formatCOP(estimatedTotal)}
                </span>
                <span className="text-xs text-stone-500">COP aprox.</span>
              </div>
              <span className="text-[11px] text-stone-500">
                (Aprox. {formatCOP(Math.round(estimatedTotal / guests))} por persona)
              </span>
            </div>

            <button
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar Menú a Gabo por WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
