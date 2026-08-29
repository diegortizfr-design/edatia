import React, { useState } from 'react'
import { X, Calculator, Check, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react'
import { Product } from '../data/productos'

interface DiaperCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  onAddDiaperPack: (product: Product, quantity: number) => void
  diaperProduct: Product | undefined
}

export function DiaperCalculatorModal({
  isOpen,
  onClose,
  onAddDiaperPack,
  diaperProduct
}: DiaperCalculatorModalProps) {
  const [selectedAge, setSelectedAge] = useState('0-1')
  const [weightKg, setWeightKg] = useState('3.5')

  if (!isOpen) return null

  const getCalculation = () => {
    switch (selectedAge) {
      case '0-1':
        return {
          stage: 'Recién Nacido / Etapa 1',
          dailyCount: 8,
          monthlyCount: 240,
          packsNeeded: 2,
          recommendation: 'Tu bebé necesitará cambios frecuentes cada 2 a 3 horas para proteger su piel extrasensible.',
          brandAdvice: 'Recomendamos pañales con corte umbilical e indicador de humedad.'
        }
      case '1-3':
        return {
          stage: 'Etapa 1 o Etapa 2',
          dailyCount: 7,
          monthlyCount: 210,
          packsNeeded: 2,
          recommendation: 'El bebé empieza a ganar peso rápidamente. Si ves marcas rojas en muslitos, pasa a Etapa 2.',
          brandAdvice: 'Excelente etapa para paquetes bulto x120 unidades con cintura elástica suave.'
        }
      case '3-6':
        return {
          stage: 'Etapa 2 o Etapa 3',
          dailyCount: 6,
          monthlyCount: 180,
          packsNeeded: 2,
          recommendation: 'Mayor movilidad y sueño nocturno más prolongado. Busca barreras antifugas reforzadas.',
          brandAdvice: 'Absorción nocturna de 12 horas recomendada.'
        }
      case '6-12':
        return {
          stage: 'Etapa 3 o Etapa 4',
          dailyCount: 5,
          monthlyCount: 150,
          packsNeeded: 1,
          recommendation: 'El bebé gatea y explora. Pañales tipo Pants o con ajuste anatómico son ideales.',
          brandAdvice: 'Gran absorción para digestión de alimentos sólidos.'
        }
      case '12-24':
        return {
          stage: 'Etapa 4 o Etapa 5',
          dailyCount: 4,
          monthlyCount: 120,
          packsNeeded: 1,
          recommendation: 'Máxima actividad física y pasos activos. Pañales ultradelgados de alta tecnología.',
          brandAdvice: 'Packs jumbo de distribuidora ofrecen el mayor ahorro por unidad.'
        }
      default:
        return {
          stage: 'Etapa 5 o Etapa 6 / Calzoncitos Entrenadores',
          dailyCount: 3,
          monthlyCount: 90,
          packsNeeded: 1,
          recommendation: 'Etapa de control de esfínteres (potty training).',
          brandAdvice: 'Calzoncitos de fácil subida y bajada.'
        }
    }
  }

  const result = getCalculation()

  const handleAddBundle = () => {
    if (diaperProduct) {
      onAddDiaperPack(diaperProduct, result.packsNeeded)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            <Calculator size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 font-display">
              Calculadora de Pañales
            </h3>
            <p className="text-xs text-slate-500">
              Calcula la etapa y cantidad exacta de pañales que necesita tu bebé al mejor precio.
            </p>
          </div>
        </div>

        {/* Step 1: Select Age */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Selecciona la edad del bebé:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '0-1', label: '0 a 1 mes', sub: 'Recién Nacido' },
                { id: '1-3', label: '1 a 3 meses', sub: '4 a 6 kg' },
                { id: '3-6', label: '3 a 6 meses', sub: '6 a 8 kg' },
                { id: '6-12', label: '6 a 12 meses', sub: '8 a 10 kg' },
                { id: '12-24', label: '1 a 2 años', sub: '10 a 13 kg' },
                { id: '+24', label: '+ 2 años', sub: '+ 13 kg' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedAge(item.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedAge === item.id
                      ? 'bg-sky-500 text-white border-sky-600 shadow-md font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-xs'
                  }`}
                >
                  <p className="font-bold text-xs">{item.label}</p>
                  <p className={`text-[10px] ${selectedAge === item.id ? 'text-sky-100' : 'text-slate-400'}`}>
                    {item.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-gradient-to-tr from-sky-50 via-white to-amber-50 rounded-2xl p-5 border border-sky-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
                  Etapa Recomendada
                </span>
                <p className="text-lg font-black text-slate-900 font-display">
                  {result.stage}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Uso Estimado Diario
                </span>
                <span className="text-sm font-black text-sky-600 bg-sky-100/80 px-2.5 py-0.5 rounded-full">
                  ~ {result.dailyCount} pañales / día
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Consumo Mensual</p>
                <p className="text-base font-black text-slate-800 mt-0.5">{result.monthlyCount} pañales</p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Bultos Ahorro</p>
                <p className="text-base font-black text-emerald-600 mt-0.5">{result.packsNeeded} Bulto(s) x120</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-start gap-1.5">
                <span className="text-sky-500 font-bold">💡</span>
                <span>{result.recommendation}</span>
              </p>
              <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <span className="text-amber-500 font-bold">⭐</span>
                <span>{result.brandAdvice}</span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          {diaperProduct && (
            <button
              onClick={handleAddBundle}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <ShoppingBag size={16} />
              <span>Agregar {result.packsNeeded} Bulto(s) al Pedido ({result.stage})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
