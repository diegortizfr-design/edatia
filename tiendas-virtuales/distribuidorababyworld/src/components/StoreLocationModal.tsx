import React, { useState } from 'react'
import {
  MapPin,
  Navigation,
  Clock,
  Store,
  X,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  CreditCard,
  MessageCircle,
  Truck
} from 'lucide-react'
import { WhatsAppIcon } from './WhatsAppIcon'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header con gradiente suave */}
        <div className="relative bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white p-5 sm:p-6 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Atención Presencial en Tienda
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Store className="shrink-0" size={24} />
            <span>Nuestra Tienda Física</span>
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-md">
            ¡Ven a visitarnos! Recibe asesoría personalizada en pañales, estimulación, juguetes y ajuar para tu bebé.
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Tarjeta de Dirección con Copiado Rápido */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Dirección Principal
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    Manzana 4 # Casa 26
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Barrio Manuela Beltrán • Cali / Candelaria
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Valle del Cauca, Colombia
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyAddress}
                className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                title="Copiar dirección completa"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">¡Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Botones de Navegación Rápida (Maps / Waze / WhatsApp) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs group active:scale-95"
              >
                <Navigation size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Google Maps</span>
                <ExternalLink size={12} className="text-slate-400 ml-auto" />
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs group active:scale-95"
              >
                <span className="text-xs">🚗</span>
                <span>Waze</span>
                <ExternalLink size={12} className="text-slate-400 ml-auto" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-900 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
              >
                <WhatsAppIcon size={14} />
                <span>¿Cómo llegar?</span>
              </a>
            </div>
          </div>

          {/* Mapa Incrustado Responsivo con Pin Exacto */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative h-48 sm:h-56 bg-slate-100 group">
            <iframe
              title="Ubicación Distribuidora Baby World"
              src="https://maps.google.com/maps?q=3.4116568,-76.4553798&hl=es&z=17&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
            {/* Botón flotante para abrir en pantalla completa en Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2.5 right-2.5 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 backdrop-blur-xs transition-all active:scale-95"
            >
              <span>Abrir en Maps</span>
              <ExternalLink size={12} className="text-sky-600" />
            </a>
          </div>

          {/* Ventajas y Servicios en Tienda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-900">
                <ShoppingBag size={15} className="text-sky-600" />
                <span>Recogida Inmediata</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Haz tu pedido en línea o por WhatsApp y retíralo directamente en nuestra tienda sin costos de envío.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CreditCard size={15} className="text-emerald-600" />
                <span>Medios de Pago en Local</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Recibimos efectivo, transferencias (Nequi, Daviplata, Bancolombia), Addi, Sistecrédito y tarjetas.
              </p>
            </div>
          </div>

          {/* Horarios de Atención Reales */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-sky-600" />
                <span className="font-extrabold text-slate-900">Horarios de Atención en Tienda</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Atención Presencial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-800 block">Lunes a Viernes</span>
                <div className="text-slate-500 leading-tight space-y-0.5">
                  <p>☀️ 9:00 a.m. – 1:00 p.m.</p>
                  <p>🌙 4:00 p.m. – 8:30 p.m.</p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-800 block">Sábados</span>
                <div className="text-slate-500 leading-tight space-y-0.5">
                  <p>☀️ 9:00 a.m. – 1:00 p.m.</p>
                  <p>🌙 4:00 p.m. – 9:00 p.m.</p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-800 block">Domingos</span>
                <div className="text-slate-500 leading-tight space-y-0.5">
                  <p>✨ 9:00 a.m. – 5:00 p.m.</p>
                  <span className="text-[10px] text-sky-600 font-semibold">(Jornada continua)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Truck size={14} className="text-slate-400" />
            <span className="text-[11px]">¿No puedes visitarnos? ¡Enviamos a tu domicilio!</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
