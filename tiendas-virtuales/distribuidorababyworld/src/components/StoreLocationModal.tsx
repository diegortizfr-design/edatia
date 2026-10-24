import React, { useState } from 'react'
import {
  MapPin,
  Clock,
  Store,
  X,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  CreditCard,
  Truck
} from 'lucide-react'
import { WhatsAppIcon } from './WhatsAppIcon'
import { GoogleMapsIcon } from './GoogleMapsIcon'
import { WazeIcon } from './WazeIcon'
import { LocationPinIcon } from './LocationPinIcon'
import toast from 'react-hot-toast'

interface StoreLocationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StoreLocationModal({ isOpen, onClose }: StoreLocationModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const address = 'Manzana 4 # Casa 26, Barrio Manuela Beltrán, Cali - Candelaria, Valle del Cauca'
  const googleMapsUrl = 'https://maps.app.goo.gl/yY63rsTFhMYcwv3k6'
  const wazeUrl = 'https://waze.com/ul?ll=3.4116568,-76.4553798&navigate=yes'
  const whatsappUrl = 'https://wa.me/573023863380?text=Hola%20Baby%20World%20%F0%9F%91%8B,%20deseo%20saber%20c%C3%B3mo%20llegar%20a%20su%20tienda%20f%C3%ADsica%20en%20Manuela%20Beltr%C3%A1n'

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('¡Dirección copiada en el portapapeles!', {
      icon: '📋',
      style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Compacto con Gradiente Suave */}
        <div className="relative bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white px-5 py-3.5 sm:px-6 sm:py-4">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
            aria-label="Cerrar modal"
          >
            <X size={17} />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Store size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight">
                  Nuestra Tienda Física
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Atención Presencial
                </span>
              </div>
              <p className="text-[11px] text-sky-100 leading-tight mt-0.5">
                Barrio Manuela Beltrán • Asesoría personalizada en pañales y juguetes
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Ultra-Compacto Sin Scroll */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Tarjeta 1: Dirección y Accesos GPS */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100/80 shrink-0 flex items-center justify-center">
                  <LocationPinIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-snug">
                    Manzana 4 # Casa 26
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Barrio Manuela Beltrán • Cali / Candelaria
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyAddress}
                className="shrink-0 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                title="Copiar dirección completa"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-700">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Botones GPS de 1 solo toque */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs active:scale-95 group"
                title="Abrir ubicación en Google Maps"
              >
                <GoogleMapsIcon size={14} className="group-hover:scale-110 transition-transform" />
                <span>Maps</span>
                <ExternalLink size={10} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs active:scale-95 group"
                title="Abrir ubicación en Waze"
              >
                <WazeIcon size={16} className="group-hover:scale-110 transition-transform" />
                <span>Waze</span>
                <ExternalLink size={10} className="text-slate-400 group-hover:text-sky-600 shrink-0" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 group"
                title="Preguntar cómo llegar por WhatsApp"
              >
                <WhatsAppIcon size={14} className="group-hover:scale-110 transition-transform" />
                <span className="truncate">Llegar</span>
              </a>
            </div>
          </div>

          {/* Tarjeta 2: Horarios Reales de Atención */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Clock size={14} className="text-sky-600" />
                <span>Horarios de Atención en Tienda</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Jornada continua domingos</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] sm:text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-700 block mb-0.5">Lun - Vie</span>
                <span className="text-slate-500 leading-tight block text-[10px]">9:00 am - 1:00 pm</span>
                <span className="text-slate-500 leading-tight block text-[10px]">4:00 pm - 8:30 pm</span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-700 block mb-0.5">Sábados</span>
                <span className="text-slate-500 leading-tight block text-[10px]">9:00 am - 1:00 pm</span>
                <span className="text-slate-500 leading-tight block text-[10px]">4:00 pm - 9:00 pm</span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200/70 bg-gradient-to-b from-white to-sky-50/40">
                <span className="font-bold text-sky-800 block mb-0.5">Domingos</span>
                <span className="text-sky-700 font-extrabold leading-tight block text-[10px]">9:00 am - 5:00 pm</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">(Continuo)</span>
              </div>
            </div>
          </div>

          {/* Métodos de Pago en Tienda con Logos Oficiales */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} className="text-sky-600" />
                Métodos de Pago en Tienda
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Financiación inmediata
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 items-center">
              {/* Addi */}
              <div className="flex items-center justify-center gap-1 bg-white py-1.5 px-2 rounded-xl border border-slate-200/80 shadow-2xs" title="Paga a cuotas con Addi">
                <img src="/logo-addi.png" alt="Addi" className="w-3.5 h-3.5 rounded-full object-contain shrink-0" />
                <span className="text-[11px] font-extrabold text-slate-800">Addi</span>
              </div>

              {/* Sistecrédito */}
              <div className="flex items-center justify-center bg-white py-1.5 px-2 rounded-xl border border-slate-200/80 shadow-2xs" title="Crédito por quincenas con Sistecrédito">
                <img src="/logo-sistecredito.png" alt="Sistecrédito" className="h-3 max-w-[55px] object-contain" />
              </div>

              {/* Bre-B */}
              <div className="flex items-center justify-center gap-1 bg-white py-1.5 px-2 rounded-xl border border-slate-200/80 shadow-2xs" title="Transferencias inmediatas Bre-B">
                <span className="text-[11px] font-extrabold text-sky-700">Bre-B</span>
              </div>

              {/* Tarjetas */}
              <div className="flex items-center justify-center gap-1 bg-white py-1.5 px-2 rounded-xl border border-slate-200/80 shadow-2xs" title="Tarjetas Débito y Crédito">
                <CreditCard size={12} className="text-indigo-600 shrink-0" />
                <span className="text-[11px] font-extrabold text-slate-800">Tarjetas</span>
              </div>
            </div>
          </div>

          {/* Botón de cierre compacto */}
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
