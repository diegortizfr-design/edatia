import React, { useState } from 'react';
import { X, Zap, CheckCircle2, MessageCircle, ShoppingBag, Info } from 'lucide-react';
import { Product } from '../types';
import { formatCOP, WHATSAPP_PHONE } from '../lib/utils';

interface EncordadoCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customProduct: Product) => void;
}

interface StringOption {
  id: string;
  name: string;
  brand: string;
  price: number; // Includes string + standard labor
  description: string;
}

const STRING_OPTIONS: StringOption[] = [
  {
    id: 'labor-only',
    name: 'Traigo mi propia cuerda (Solo Mano de Obra)',
    brand: 'Smash',
    price: 35000,
    description: 'Instalación profesional en máquina electrónica de 6 puntos.',
  },
  {
    id: 'luxilon-alu',
    name: 'Luxilon ALU Power 1.25mm Silver',
    brand: 'Luxilon',
    price: 95000,
    description: 'La cuerda #1 del circuito ATP. Máxima potencia y respuesta elástica.',
  },
  {
    id: 'babolat-rpm',
    name: 'Babolat RPM Blast 1.25mm Black',
    brand: 'Babolat',
    price: 85000,
    description: 'Octogonal con recubrimiento de silicona para máximo spin.',
  },
  {
    id: 'yonex-poly-tour',
    name: 'Yonex Poly Tour Pro 1.25mm Yellow',
    brand: 'Yonex',
    price: 75000,
    description: 'Polyester suave y confortable con retención de tensión superior.',
  },
  {
    id: 'head-lynx',
    name: 'Head Lynx Touch 1.25mm',
    brand: 'Head',
    price: 65000,
    description: 'Sensación suave y gran control en golpes lentos y rápidos.',
  },
  {
    id: 'wilson-sensation',
    name: 'Wilson Sensation 1.30mm Multifilamento',
    brand: 'Wilson',
    price: 60000,
    description: 'Máximo confort y amortiguación para prevenir codo de tenista.',
  },
];

export const EncordadoCalculatorModal: React.FC<EncordadoCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const [racketModel, setRacketModel] = useState('');
  const [selectedStringId, setSelectedStringId] = useState('luxilon-alu');
  const [tension, setTension] = useState(53);
  const [isExpress, setIsExpress] = useState(false);

  const selectedString =
    STRING_OPTIONS.find((s) => s.id === selectedStringId) || STRING_OPTIONS[0];

  const expressCost = isExpress ? 20000 : 0;
  const totalPrice = selectedString.price + expressCost;

  const getTensionAdvice = (t: number) => {
    if (t < 50) return { label: 'Máxima Potencia & Confort', color: 'text-amber-500' };
    if (t <= 55) return { label: 'Balance Óptimo Control / Potencia', color: 'text-lime-500' };
    return { label: 'Máximo Control & Precisión Quirúrgica', color: 'text-cyan-400' };
  };

  const advice = getTensionAdvice(tension);

  const handleAddToCart = () => {
    const customProduct: Product = {
      id: `ENC-${Date.now()}`,
      code: `ENC-2026`,
      sku: `ENC-2026`,
      referencia: `ENC-2026`,
      name: `Servicio de Encordado: ${selectedString.name}`,
      category: 'Servicios',
      brand: selectedString.brand,
      price: totalPrice,
      description: `Encordado para raqueta: ${racketModel || 'No especificada'} a ${tension} lbs.${
        isExpress ? ' Incluye entrega express 2 horas.' : ''
      }`,
      badge: isExpress ? 'Express 2h' : 'Electrónico',
      stock: 99,
    };

    onAddToCart(customProduct);
    onClose();
  };

  const handleWhatsAppBooking = () => {
    const msg = encodeURIComponent(
      `Hola Smash Tenis & Pádel, quiero agendar un servicio de encordado:\n- Raqueta: *${
        racketModel || 'Por confirmar'
      }*\n- Cuerda: *${selectedString.name}*\n- Tensión: *${tension} lbs*\n- Servicio Express 2h: *${
        isExpress ? 'Sí (+ $20.000)' : 'No'
      }*\n- Total cotizado: *${formatCOP(totalPrice)}*`
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400/20 border border-lime-400/30 flex items-center justify-center text-lime-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-lime-400 uppercase tracking-widest block">
                Taller Especializado Smash
              </span>
              <h2 className="text-xl font-extrabold font-heading text-white">
                Calculadora de Encordado Computarizado
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* 1. Racket Model Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              1. Modelo de tu raqueta (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ej: Babolat Pure Drive, Wilson Blade 98, Head Speed..."
              value={racketModel}
              onChange={(e) => setRacketModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-slate-900 focus:outline-hidden"
            />
          </div>

          {/* 2. String Selector */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              2. Selecciona la cuerda y mano de obra:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STRING_OPTIONS.map((opt) => {
                const isSelected = selectedStringId === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedStringId(opt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-lime-400' : 'text-slate-900'
                          }`}
                        >
                          {opt.name}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] leading-snug line-clamp-2 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/40 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {opt.brand}
                      </span>
                      <span
                        className={`font-extrabold text-xs ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {formatCOP(opt.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Tension Slider */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Tensión del encordado:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-900 text-lime-400 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                <span>{tension}</span>
                <span className="text-xs">LBS</span>
              </div>
            </div>

            <input
              type="range"
              min="45"
              max="62"
              step="1"
              value={tension}
              onChange={(e) => setTension(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>45 lbs (Poco control, mucha potencia)</span>
              <span>53 lbs (Estándar)</span>
              <span>62 lbs (Máximo control)</span>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-xs">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600">
                Efecto a {tension} lbs:{' '}
                <strong className={advice.color}>{advice.label}</strong>
              </span>
            </div>
          </div>

          {/* 4. Express 2h Option */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
            <input
              type="checkbox"
              checked={isExpress}
              onChange={(e) => setIsExpress(e.target.checked)}
              className="mt-0.5 accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                ⚡ Servicio Express en 2 Horas (+ $20.000 COP)
              </span>
              <span className="text-slate-600">
                Prioridad máxima de calibración electrónica y entrega garantizada el mismo día.
              </span>
            </div>
          </label>

          {/* Total & Summary */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Estimado</span>
              <span className="text-2xl font-extrabold text-slate-950 font-heading">
                {formatCOP(totalPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar al Carrito</span>
              </button>

              <button
                onClick={handleWhatsAppBooking}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Agendar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
