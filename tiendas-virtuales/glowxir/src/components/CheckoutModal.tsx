import React, { useState } from 'react'
import { X, CheckCircle, Truck, ShieldCheck, CreditCard } from 'lucide-react'
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
}

export function CheckoutModal({ isOpen, onClose, cartItems, onSuccess, API_BASE }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    medioPago: 'Contra Entrega',
  })
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.precio * item.quantity, 0)
  const shipping = subtotal > 150000 ? 0 : 9500
  const total = subtotal + shipping

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      medioPago: formData.medioPago,
      items: cartItems.map(item => ({
        productoId: item.product.id,
        nombre: item.product.nombre,
        precioUnitario: item.product.precio,
        cantidad: item.quantity,
      }))
    }

    fetch(`${API_BASE}/public/tiendas/glowxir/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setOrderNumber(res.numero)
          setIsSuccess(true)
        } else {
          alert('Hubo un error al procesar el pedido')
        }
        setIsSubmitting(false)
      })
      .catch(err => {
        console.error('Error checkout:', err)
        alert('Error de conexión al procesar el pedido')
        setIsSubmitting(false)
      })
  }

  const handleFinish = () => {
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={isSuccess ? undefined : onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {!isSuccess && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-50 transition-all z-10"
          >
            <X size={20} />
          </button>
        )}

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-serif">Finalizar Compra</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Por favor ingresa tus datos de entrega para procesar el pedido.</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. María Camila Pérez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="camila@correo.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Celular / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="300 123 4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dirección de Entrega *</label>
                  <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle 10 # 5 - 20"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={formData.ciudad}
                    onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Bogotá"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Método de Pago *</label>
                <select
                  value={formData.medioPago}
                  onChange={e => setFormData({ ...formData, medioPago: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-glowxir-200 focus:bg-white transition-all"
                >
                  <option value="Contra Entrega">Pago contra entrega en efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria (Nequi / Bancolombia)</option>
                </select>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal productos</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Envío</span>
                <span>{shipping === 0 ? "Gratis" : fmtPrice(shipping)}</span>
              </div>
              <hr className="border-slate-200/80" />
              <div className="flex justify-between font-black text-slate-800 text-sm">
                <span>Total a Pagar</span>
                <span className="text-glowxir-700">{fmtPrice(total)}</span>
              </div>
            </div>

            {/* Certifications footer */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1"><Truck size={12} /> Envío Rápido 24-48h</div>
              <div className="flex items-center gap-1"><ShieldCheck size={12} /> Compra 100% Segura</div>
              <div className="flex items-center gap-1"><CreditCard size={12} /> Datos Encriptados</div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-glowxir-600 hover:bg-glowxir-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:bg-slate-350 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Procesando pedido...' : 'Confirmar Pedido'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8 space-y-5">
            <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 font-serif">¡Pedido Recibido con Éxito!</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Gracias por tu compra, <span className="font-bold text-slate-700">{formData.nombre}</span>. Hemos registrado tu orden y nos pondremos en contacto contigo de inmediato por WhatsApp o llamada.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-sm mx-auto text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Número de Pedido</span>
                <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Dirección de Entrega</span>
                <span className="font-medium text-slate-750 text-right">{formData.direccion}, {formData.ciudad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Medio de Pago</span>
                <span className="font-semibold text-slate-750">{formData.medioPago}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200/80 pt-2 text-sm">
                <span>Valor Cobrado</span>
                <span className="text-glowxir-700">{fmtPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-glowxir-600 hover:bg-glowxir-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Regresar a la Tienda
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
