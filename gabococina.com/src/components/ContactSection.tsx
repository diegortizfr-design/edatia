import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, MapPin, Instagram, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { CHEF_INFO } from '../data/chef-creations';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    guests: '6',
    occasion: 'Cena Privada en Casa',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = encodeURIComponent(
      `👨‍🍳 *SOLICITUD DE FECHA - GABOCOCINA.COM*\n` +
        `======================================\n` +
        `*Nombre:* ${formData.name}\n` +
        `*WhatsApp:* ${formData.phone}\n` +
        `*Email:* ${formData.email || 'No indicado'}\n` +
        `*Fecha Deseada:* ${formData.date}\n` +
        `*Comensales:* ${formData.guests} personas\n` +
        `*Tipo de Ocasión:* ${formData.occasion}\n` +
        (formData.notes ? `*Detalles / Alergias:* ${formData.notes}\n` : '') +
        `======================================\n` +
        `Hola Chef Gabo, me gustaría coordinar una fecha y conocer tu propuesta gastronómica.`
    );

    window.open(`https://wa.me/${CHEF_INFO.phone}?text=${text}`, '_blank');
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="py-20 md:py-28 bg-noir-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Direct Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-gold-400 block mb-2">
                Reserva de Fechas
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Comencemos a <br />
                <span className="italic font-normal text-gold-400">crear tu velada</span>
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed font-light">
                Para garantizar la máxima dedicación y frescura de los ingredientes, atiendo un número limitado de eventos por semana. Te recomiendo consultar disponibilidad con al menos 5 días de anticipación.
              </p>
            </div>

            {/* Contact cards */}
            <div className="space-y-4">
              <a
                href={`https://wa.me/${CHEF_INFO.phone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-noir-900 border border-noir-800 hover:border-gold-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                    WhatsApp Directo
                  </span>
                  <span className="font-semibold text-white text-sm">
                    +57 (310) 555-9876
                  </span>
                </div>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-noir-900 border border-noir-800 hover:border-gold-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                    Instagram Oficial
                  </span>
                  <span className="font-semibold text-white text-sm">
                    {CHEF_INFO.instagram}
                  </span>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-noir-900 border border-noir-800">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                    Zona de Cobertura
                  </span>
                  <span className="font-semibold text-white text-sm">
                    Medellín, El Poblado, Llanogrande & Bogotá D.C.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation Form */}
          <div className="lg:col-span-7">
            <div className="bg-noir-900 rounded-3xl border border-noir-800 p-8 sm:p-10 shadow-2xl">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    ¡Solicitud Enviada a Gabo!
                  </h3>
                  <p className="text-stone-300 text-sm max-w-sm mx-auto font-light">
                    Hemos abierto la conversación en WhatsApp con los datos de tu velada. Gabo te responderá personalmente en breve.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-full bg-noir-800 text-stone-300 text-xs hover:text-white"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-serif text-2xl font-bold text-white mb-2">
                    Reserva tu Fecha Tentativa
                  </h3>
                  <p className="text-xs text-stone-400 mb-6 font-light">
                    Completa estos datos para estructurar una propuesta gastronómica a la medida.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Juliana Morales"
                        className="w-full px-4 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        WhatsApp de Contacto *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ej: 3105559876"
                        className="w-full px-4 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Fecha Tentativa *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Comensales *
                      </label>
                      <select
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden"
                      >
                        <option value="2">2 personas (Romántica)</option>
                        <option value="4-6">4 a 6 personas</option>
                        <option value="7-12">7 a 12 personas</option>
                        <option value="13-25">13 a 25 personas</option>
                        <option value="25+">Más de 25 personas</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Ocasión
                      </label>
                      <select
                        value={formData.occasion}
                        onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden"
                      >
                        <option value="Cena Privada en Casa">Cena Privada en Casa</option>
                        <option value="Aniversario / Pareja">Aniversario / Pareja</option>
                        <option value="Celebración Cumpleaños">Celebración Cumpleaños</option>
                        <option value="Cena Corporativa VIP">Cena Corporativa VIP</option>
                        <option value="Boda Boutique / Compromiso">Boda Boutique</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-1">
                      Detalles especiales, preferencias o alergias:
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej: Nos encantan los mariscos, un invitado es celíaco y quisiéramos maridaje de vinos tintos..."
                      className="w-full px-4 py-2.5 rounded-xl bg-noir-950 border border-noir-700 text-sm text-white focus:border-gold-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Consulta Directa a Gabo</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
