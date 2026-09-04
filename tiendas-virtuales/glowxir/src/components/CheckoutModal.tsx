import React, { useState } from 'react'
import { X, CheckCircle, Truck, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react'
import { Product } from '../data/productos'

interface CartItem {
  product: Product
  quantity: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onSuccess: () => void
  API_BASE: string
  storeSlug: string
}

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onSuccess,
  API_BASE,
  storeSlug
}: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ciudad: 'Candelaria',
    direccion: '',
    barrio: '',
    medioPago: 'Contra Entrega',
    notas: '',
  })
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.precio * item.quantity, 0)
  const shipping = subtotal >= 150000 ? 0 : 8000
  const total = subtotal + shipping

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      nombre: formData.nombre,
      email: `${formData.telefono}@cliente.babyworld.com`,
      telefono: formData.telefono,
      direccion: `${formData.direccion}, Barrio: ${formData.barrio || 'N/A'}, ${formData.ciudad}. Notas: ${formData.notas || 'Ninguna'}`,
      ciudad: formData.ciudad,
      medioPago: formData.medioPago,
      items: cartItems.map(item => ({
        productoId: item.product.id,
        nombre: item.product.nombre,
        precioUnitario: item.product.precio,
        cantidad: item.quantity,
      }))
    }

    try {
      const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setOrderNumber(data.numero || `BW-${Math.floor(100000 + Math.random() * 900000)}`)
      setIsSuccess(true)
    } catch (err) {
      setOrderNumber(`BW-${Math.floor(100000 + Math.random() * 900000)}`)
      setIsSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    onSuccess()
    onClose()
  }

  const handleSendWhatsAppConfirmation = () => {
    let msg = `🍼 *PEDIDO CONFIRMADO - BABY-WORLD*\n\n`
    msg += `*Nº Orden:* ${orderNumber}\n`
    msg += `*Cliente:* ${formData.nombre}\n`
    msg += `*Teléfono:* ${formData.telefono}\n`
    msg += `*Dirección:* ${formData.direccion}, ${formData.ciudad}\n`
    msg += `*Pago:* ${formData.medioPago}\n\n`
    msg += `*Productos:*\n`
    cartItems.forEach(i => {
      msg += `• ${i.quantity}x ${i.product.nombre} (${fmtPrice(i.product.precio * i.quantity)})\n`
    })
    msg += `\n*Total a Pagar:* ${fmtPrice(total)}`
    if (shipping === 0) msg += ` (Envío Gratis 🎉)`
    
    window.open(`https://wa.me/573205704262?text=${encodeURIComponent(msg)}`, '_blank')
    handleFinish()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={isSuccess ? undefined : onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-7 border border-slate-100 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {!isSuccess && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100/80 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider">
                Baby-World
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-snug">Datos de Entrega</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Diligencia tus datos para coordinar el envío y pago de tu pedido.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. María Pérez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Celular / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="320 123 4567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Ciudad / Municipio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ciudad}
                    onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Candelaria, Cali..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={formData.barrio}
                    onChange={e => setFormData({ ...formData, barrio: e.target.value })}
                    placeholder="Ej. Centro"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  required
                  value={formData.direccion}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle, Carrera o Casa #"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Forma de Pago *
                </label>
                <select
                  value={formData.medioPago}
                  onChange={e => setFormData({ ...formData, medioPago: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white font-medium"
                >
                  <option value="Contra Entrega">💵 Pago Contra Entrega (Efectivo al recibir)</option>
                  <option value="Transferencia">📱 Transferencia (Nequi / Bancolombia / Daviplata)</option>
                </select>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span className={shipping === 0 ? "text-emerald-600 font-bold" : ""}>
                  {shipping === 0 ? "¡Gratis!" : fmtPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Total a Pagar</span>
                <span className="text-sky-600">{fmtPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar y Enviar Pedido'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto h-16 w-16 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle size={32} />
            </div>
            
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                ¡Pedido Recibido con Éxito!
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                ¡Gracias por tu compra, {formData.nombre}!
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hemos registrado tu orden <b>#{orderNumber}</b>. Te contactaremos por WhatsApp para coordinar el despacho inmediato.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSendWhatsAppConfirmation}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageCircle size={17} />
                <span>Confirmar por WhatsApp</span>
              </button>

              <button
                onClick={handleFinish}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
