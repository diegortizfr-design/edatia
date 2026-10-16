import React, { useState } from 'react'
import { Info, X, CheckCircle2, ShieldCheck, Sparkles, CreditCard, ArrowRight } from 'lucide-react'

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
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Addi
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100">
          Sistecrédito
        </span>
        <span className="hidden sm:inline text-slate-400">a cuotas</span>
      </div>
    )
  }

  return (
    <>
      {/* Caja Principal del Simulador */}
      <div className={`p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50/60 via-white to-sky-50/60 rounded-2xl border border-emerald-100/80 shadow-sm transition-all hover:border-emerald-200 ${className}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shadow-xs">
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
          <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              addi
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              {price >= minAddi ? (
                <>
                  <p className="text-[11px] text-slate-600">
                    Hasta <span className="font-extrabold text-slate-900">3 cuotas de {fmtPrice(cuotaAddi)}</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">
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
          <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] tracking-tight shrink-0 shadow-xs">
              SISTE
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] text-slate-600">
                Paga a <span className="font-extrabold text-slate-900">quincenas cómodas</span>
              </p>
              <p className="text-[10px] text-blue-600 font-bold">
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <ShieldCheck size={20} />
              <span className="text-xs font-black uppercase tracking-wider">
                Compra a Crédito en Baby World
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 leading-snug">
              ¿Cómo comprar a cuotas con Addi y Sistecrédito?
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              No necesitas tarjetas de crédito ni trámites demorados. Solo tu número de cédula y tu WhatsApp.
            </p>

            <div className="mt-4 space-y-3">
              {/* Paso 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-bold text-slate-800">Selecciona tus productos</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Agrega al carrito todo lo que necesites para tu bebé y ve al checkout.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-bold text-slate-800">Elige Addi o Sistecrédito</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    En la forma de pago escoge <b>Crédito Addi / Sistecrédito</b>. Te enviaremos el enlace oficial a tu WhatsApp o lo validamos en 2 minutos.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-bold text-slate-800">¡Listo! Despacho inmediato</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Apenas se confirme la aprobación, preparamos tu pedido y te enviamos la guía o lo entregamos en tu puerta.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner tienda física */}
            <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 flex items-center gap-2.5">
              <span className="text-base">📍</span>
              <p className="text-[11px] leading-tight font-medium">
                <b>¿Estás cerca de Candelaria?</b> También puedes visitarnos en nuestro local físico y pagar directamente en caja con Addi o Sistecrédito.
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-md"
            >
              ¡Entendido, continuar comprando!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
