import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, ShieldCheck, Truck, CreditCard, Banknote } from 'lucide-react';
import { CartItem } from '../types';
import {
  formatCOP,
  FREE_SHIPPING_THRESHOLD,
  getProductCode,
  getProductName,
  getProductPrice,
  WHATSAPP_PHONE,
} from '../lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: 'Medellín',
    notes: '',
    paymentMethod: 'PSE / Transferencia Bancaria',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0
  );
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : 15000;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Try to post order to ERP public API
      const apiBase = import.meta.env.VITE_API_BASE || 'https://api.edatia.com/api/v1';
      const storeSlug = import.meta.env.VITE_STORE_SLUG || 'smash';

      try {
        await fetch(`${apiBase}/public/tiendas/${storeSlug}/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNombre: formData.name,
            clienteDocumento: formData.document,
            clienteTelefono: formData.phone,
            clienteEmail: formData.email,
            direccionEnvio: `${formData.address}, ${formData.city}`,
            metodoPago: formData.paymentMethod,
            observaciones: formData.notes,
            items: items.map((it) => ({
              productoId: it.product.id,
              cantidad: it.quantity,
              precioUnitario: getProductPrice(it.product),
              variante: it.selectedSize,
            })),
            total,
            envio: shippingCost,
          }),
        });
      } catch (err) {
        console.warn('ERP order sync fallback:', err);
      }

      // 2. Open WhatsApp confirmation
      const itemsList = items
        .map(
          (it) =>
            `• ${it.quantity}x ${getProductName(it.product)} (Ref: ${getProductCode(
              it.product
            )}${it.selectedSize ? ` | ${it.selectedSize}` : ''}) - ${formatCOP(
              getProductPrice(it.product) * it.quantity
            )}`
        )
        .join('\n');

      const whatsappMessage = encodeURIComponent(
        `🎾 *NUEVO PEDIDO SMASH TENIS & PÁDEL*\n` +
          `==========================\n` +
          `*Cliente:* ${formData.name}\n` +
          `*Cédula/NIT:* ${formData.document}\n` +
          `*Teléfono:* ${formData.phone}\n` +
          `*Email:* ${formData.email}\n` +
          `*Dirección:* ${formData.address}, ${formData.city}\n` +
          `*Método de Pago:* ${formData.paymentMethod}\n` +
          (formData.notes ? `*Notas:* ${formData.notes}\n` : '') +
          `==========================\n` +
          `*PRODUCTOS:*\n${itemsList}\n` +
          `==========================\n` +
          `*Subtotal:* ${formatCOP(subtotal)}\n` +
          `*Envío:* ${isFreeShipping ? 'GRATIS' : formatCOP(shippingCost)}\n` +
          `*TOTAL:* ${formatCOP(total)}\n` +
          `==========================\n` +
          `Quedo atento a la confirmación de despacho y datos para transferencia. ¡Muchas gracias!`
      );

      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${whatsappMessage}`, '_blank');

      setIsSuccess(true);
      onClearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
              ¡Pedido Generado Exitosamente!
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Hemos abierto una ventana de WhatsApp para coordinar el pago y despacho directo con uno de nuestros especialistas de Smash.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-slate-900 text-lime-400 font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h2 className="font-heading font-bold text-lg text-white">Finalizar Pedido</h2>
                <p className="text-xs text-slate-400">Despacho asegurado a toda Colombia</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="Ej: Carlos Gómez"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cédula / NIT *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="Ej: 1020304050"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="Ej: 3105559876"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="carlos@ejemplo.com"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dirección de Entrega *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="Calle, Carrera, Número, Apto o Conjunto"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-slate-900 focus:outline-hidden"
                    placeholder="Medellín / Bogotá"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Método de Pago Preferido:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'PSE / Transferencia', icon: CreditCard },
                    { label: 'Nequi / Daviplata', icon: Banknote },
                    { label: 'Contra Entrega', icon: Truck },
                  ].map((m) => {
                    const isSelected = formData.paymentMethod === m.label;
                    return (
                      <button
                        type="button"
                        key={m.label}
                        onClick={() => setFormData({ ...formData, paymentMethod: m.label })}
                        className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-lime-400'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Productos ({items.length})</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Costo de Envío</span>
                  <span>
                    {isFreeShipping ? (
                      <strong className="text-emerald-600">¡GRATIS!</strong>
                    ) : (
                      formatCOP(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                  <span>Total a Pagar</span>
                  <span className="font-heading text-base font-extrabold text-slate-950">
                    {formatCOP(total)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar y Enviar por WhatsApp</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
