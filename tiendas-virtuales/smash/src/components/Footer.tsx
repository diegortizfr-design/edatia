import React from 'react';
import { MessageCircle, ShieldCheck, MapPin, Clock, Phone, Award } from 'lucide-react';
import { WHATSAPP_PHONE } from '../lib/utils';

interface FooterProps {
  onOpenEncordado: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEncordado }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center font-heading font-black text-slate-950 text-sm">
                S
              </div>
              <span className="font-heading font-black text-lg text-white tracking-wider">
                SMASH
              </span>
              <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest bg-lime-400/10 px-2 py-0.5 rounded border border-lime-400/20">
                2026
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Tienda especializada en equipamiento para Tenis y Pádel en Colombia. Distribuidores oficiales de Wilson, Babolat, Head, Yonex, Asics y Luxilon.
            </p>

            <div className="text-xs space-y-1 text-slate-500">
              <p>NIT: <strong className="text-slate-400">1234567-1</strong></p>
              <p>Razón Social: <strong className="text-slate-400">Smash Tenis y Pádel S.A.S.</strong></p>
            </div>
          </div>

          {/* Col 2: Services & Highlights */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-heading">
              Taller & Servicios
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenEncordado}
                  className="hover:text-lime-400 transition-colors text-left flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-lime-400" />
                  <span>Calculadora de Encordado Computarizado</span>
                </button>
              </li>
              <li className="text-slate-400">Encordado Express en 2 horas</li>
              <li className="text-slate-400">Calibración de balance y swingweight</li>
              <li className="text-slate-400">Cambio de grips, overgrips y canutillos</li>
              <li className="text-slate-400">Asesoría técnica para jugadores competitivos</li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Showrooms */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-heading">
              Sedes & Atención
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                <span>Medellín: Club El Campestre / Envigado Showroom</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                <span>Bogotá: Zona Chicó / Calle 94</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Lunes a Sábado: 8:00 AM – 7:00 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Línea Directa: +57 310 555 9876</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & WhatsApp Direct */}
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-heading">
              Atención Inmediata
            </h4>
            <p className="text-xs text-slate-400">
              ¿Dudas sobre aro, patrón o tensión adecuada para tu estilo de juego? Chatea con nuestros encordadores certificados.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                'Hola Smash Tenis & Pádel, requiero asesoría sobre equipamiento y encordados.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chatear con un Especialista</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Smash Tenis & Pádel Colombia. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span>Tecnología e Inventario sincronizado por</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Edatia ERP SaaS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
