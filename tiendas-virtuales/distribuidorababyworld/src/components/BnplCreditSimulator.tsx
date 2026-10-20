import React, { useState } from 'react'
import { Info, Sparkles } from 'lucide-react'
import { BnplInfoModal } from './BnplInfoModal'

interface BnplCreditSimulatorProps {
  price: number
  compact?: boolean
  className?: string
}

export function BnplCreditSimulator({ price, compact = false, className = '' }: BnplCreditSimulatorProps) {
  const [showModal, setShowModal] = useState(false)

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const minAddi = 50000
  const cuotaAddi = Math.round(price / 3)
  const cuotaQuincenalAprox = Math.round(price / 6) // Estimado referencial a 6 quincenas

  // Versión compacta para tarjetas de producto
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] text-slate-500 font-medium ${className}`}>
        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
          <img src="/logo-addi.png" alt="Addi" className="w-3.5 h-3.5 rounded-full object-contain" />
          <span className="font-extrabold text-[#4766fc]">Addi</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
          <img src="/logo-sistecredito.png" alt="Sistecrédito" className="h-2.5 max-w-[48px] object-contain" />
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Caja Principal del Simulador */}
      <div className={`p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/50 via-white to-emerald-50/50 rounded-2xl border border-slate-200/80 shadow-sm transition-all hover:border-slate-300 ${className}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white shadow-xs">
              <Sparkles size={11} />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              Paga a Cuotas sin Tarjeta
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
          >
            <Info size={13} />
            <span>¿Cómo funciona?</span>
          </button>
        </div>

        {/* Opciones de financiación */}
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Opción Addi */}
          <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5 shadow-2xs">
            <img 
              src="/logo-addi.png" 
              alt="Addi" 
              className="w-9 h-9 rounded-full object-contain shrink-0 shadow-2xs" 
            />
            <div className="min-w-0 flex-1 leading-tight">
              {price >= minAddi ? (
                <>
                  <p className="text-[11px] text-slate-600">
                    Hasta <span className="font-extrabold text-slate-900">3 cuotas de {fmtPrice(cuotaAddi)}</span>
                  </p>
                  <p className="text-[10px] text-[#4766fc] font-extrabold">
                    0% de interés*
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-slate-600">
                    Fináncialo desde <span className="font-bold text-slate-900">$50.000</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    en 3 cuotas 0% interés
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Opción Sistecrédito */}
          <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5 shadow-2xs">
            <div className="h-9 w-20 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-1 shrink-0 shadow-2xs">
              <img 
                src="/logo-sistecredito.png" 
                alt="Sistecrédito" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] text-slate-600">
                Paga a <span className="font-extrabold text-slate-900">quincenas cómodas</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-extrabold">
                {price >= 30000 ? `Desde aprox. ${fmtPrice(cuotaQuincenalAprox)}/quincena` : 'Aprobación inmediata'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer pequeño dentro de la caja */}
        <p className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>*Disponible en tienda virtual y local en Candelaria</span>
          <span className="font-medium text-emerald-600">Aprobación en 3 minutos</span>
        </p>
      </div>

      {/* Modal Informativo: Cómo Funciona el Crédito */}
      <BnplInfoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
