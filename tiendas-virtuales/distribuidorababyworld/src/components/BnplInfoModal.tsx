import React from 'react'
import { ShieldCheck, X } from 'lucide-react'

interface BnplInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BnplInfoModal({ isOpen, onClose }: BnplInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
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
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs leading-tight flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-slate-800">Elige Addi o Sistecrédito</p>
                <div className="flex items-center gap-1.5 ml-auto bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  <img src="/logo-addi.png" alt="Addi" className="w-4 h-4 rounded-full object-contain" />
                  <img src="/logo-sistecredito.png" alt="Sistecrédito" className="h-3 object-contain" />
                </div>
              </div>
              <p className="text-slate-500 text-[11px] leading-snug">
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
          onClick={onClose}
          className="mt-5 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-md"
        >
          ¡Entendido, continuar comprando!
        </button>
      </div>
    </div>
  )
}
