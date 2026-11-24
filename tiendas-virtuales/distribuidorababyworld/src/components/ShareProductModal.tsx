import React, { useState, useEffect } from 'react'
import { X, Check, Copy, Share2, Smartphone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Product } from '../data/productos'
import { WhatsAppIcon } from './WhatsAppIcon'
import { getOptimizedImageUrl } from '../lib/imageOptimizer'

interface ShareProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ShareProductModal({ product, isOpen, onClose }: ShareProductModalProps) {
  const [copied, setCopied] = useState(false)

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const getProductUrl = (p: Product) => {
    if (typeof window === 'undefined') return ''
    const slug = p.slug || p.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || p.id
    return `${window.location.origin}/producto/${slug}`
  }

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const productUrl = getProductUrl(product)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  // 1. WhatsApp
  const handleWhatsApp = () => {
    const text = `🧸 ¡Hola! Mira lo que encontré en Distribuidora Baby World:\n\n*${product.nombre}*\n💰 Precio: ${fmtPrice(product.precio)}\n\n👉 ${productUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  // 2. Facebook
  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      '_blank',
      'width=600,height=500,toolbar=0,menubar=0,location=0'
    )
  }

  // 3. Telegram
  const handleTelegram = () => {
    const text = `🧸 ${product.nombre} - ${fmtPrice(product.precio)} en Baby World`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  // 4. X (Twitter)
  const handleTwitter = () => {
    const text = `Mira ${product.nombre} en Distribuidora Baby World 🧸`
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  // 5. Copiar enlace al portapapeles
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(productUrl)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = productUrl
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success('¡Enlace del producto copiado!', {
        duration: 3000,
        icon: '🔗',
        style: { borderRadius: '1rem', background: '#0284c7', color: '#fff' }
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('No se pudo copiar automáticamente')
    }
  }

  // 6. Compartir nativo del dispositivo (Android/iOS)
  const handleNativeShare = async () => {
    if (!canNativeShare) return
    try {
      await navigator.share({
        title: `${product.nombre} | Baby World`,
        text: `¡Mira ${product.nombre} en Baby World! (${fmtPrice(product.precio)})`,
        url: productUrl,
      })
    } catch {
      // Ignorar si el usuario canceló el diálogo nativo
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop con desenfoque suave */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-100 z-10 animate-in zoom-in-95 duration-200 select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar ventana de compartir"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2 text-sky-600 mb-1.5">
          <Share2 size={18} />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Compartir en Redes Sociales
          </span>
        </div>

        <h3 id="share-modal-title" className="text-lg font-black text-slate-900 leading-snug">
          Comparte este producto
        </h3>

        {/* Tarjeta de previsualización del producto */}
        <div className="mt-3.5 flex items-center gap-3 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-2xl">
          <img
            src={getOptimizedImageUrl(product.imagen, 160)}
            alt={product.nombre}
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl bg-white p-1 border border-slate-200/60 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 inline-block">
              {product.categoria}
            </span>
            <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5" title={product.nombre}>
              {product.nombre}
            </h4>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {fmtPrice(product.precio)}
            </p>
          </div>
        </div>

        {/* Canales de Redes Sociales */}
        <div className="mt-4 space-y-2.5">
          {/* Botón Principal: WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-extrabold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <WhatsAppIcon size={20} className="text-white" />
              <span>Compartir por WhatsApp</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
              Chat & Estados
            </span>
          </button>

          {/* Grilla Secundaria: Facebook, Telegram y X */}
          <div className="grid grid-cols-3 gap-2">
            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebook}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border border-slate-200/90 hover:border-[#1877F2]/40 bg-slate-50/70 hover:bg-blue-50/50 text-slate-700 hover:text-[#1877F2] transition-all text-xs font-bold active:scale-95 cursor-pointer"
              title="Compartir en Facebook"
            >
              <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-[11px]">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleTelegram}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border border-slate-200/90 hover:border-[#229ED9]/40 bg-slate-50/70 hover:bg-sky-50/50 text-slate-700 hover:text-[#229ED9] transition-all text-xs font-bold active:scale-95 cursor-pointer"
              title="Compartir en Telegram"
            >
              <svg className="w-5 h-5 fill-current text-[#229ED9]" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.942z"/>
              </svg>
              <span className="text-[11px]">Telegram</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={handleTwitter}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border border-slate-200/90 hover:border-slate-800/40 bg-slate-50/70 hover:bg-slate-100 text-slate-700 hover:text-black transition-all text-xs font-bold active:scale-95 cursor-pointer"
              title="Compartir en X (Twitter)"
            >
              <svg className="w-5 h-5 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-[11px]">X (Twitter)</span>
            </button>
          </div>

          {/* Menú Nativo del Teléfono (si está soportado) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Smartphone size={14} className="text-slate-500" />
              <span>Más opciones (Instagram, SMS, otras apps)</span>
            </button>
          )}

          {/* Caja para Copiar URL Directa */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
              O copia el enlace directo del producto:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={productUrl}
                className="flex-1 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono select-all focus:outline-none focus:ring-1 focus:ring-sky-400 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
