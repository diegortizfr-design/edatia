import React, { useState } from 'react'
import { 
  X, CheckCircle, Truck, ShieldCheck, MessageCircle, 
  ArrowRight, CreditCard, Smartphone, Banknote, Copy, Check, Info, Clock,
  RefreshCw, Edit3, QrCode, Download, KeyRound
} from 'lucide-react'
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

type PaymentMethodType = 'contra_entrega' | 'transferencia' | 'mercadopago'
type WalletType = 'Nequi' | 'Daviplata' | 'Bancolombia'

const isLocalCoverage = (ciudad: string): boolean => {
  if (!ciudad) return false
  const clean = ciudad
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  const LOCAL_KEYS = [
    'cali',
    'candelaria',
    'palmira',
    'jamundi',
    'yumbo',
    'ciudad del campo',
    'poblado campestre',
  ]
  return LOCAL_KEYS.some((k) => clean.includes(k))
}

interface CityGroup {
  region: string
  cities: string[]
}

const CIUDADES_NACIONALES: CityGroup[] = [
  {
    region: 'Bogotá y Cundinamarca',
    cities: ['Bogotá D.C.', 'Soacha', 'Chía', 'Zipaquirá', 'Mosquera', 'Madrid', 'Funza', 'Facatativá', 'Fusagasugá', 'Girardot'],
  },
  {
    region: 'Antioquia',
    cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Sabaneta', 'Apartadó', 'Copacabana', 'La Estrella'],
  },
  {
    region: 'Valle del Cauca (Otras ciudades)',
    cities: ['Buga (Guadalajara de Buga)', 'Tuluá', 'Cartago', 'Buenaventura', 'Zarzal', 'Roldanillo', 'Sevilla', 'Caicedonia', 'Pradera', 'Florida', 'Guacarí', 'Ginebra'],
  },
  {
    region: 'Eje Cafetero',
    cities: ['Pereira', 'Manizales', 'Armenia', 'Dosquebradas', 'Santa Rosa de Cabal', 'Calarcá', 'Chinchiná', 'La Virginia'],
  },
  {
    region: 'Santander y Norte de Santander',
    cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Cúcuta', 'Barrancabermeja', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios'],
  },
  {
    region: 'Costa Caribe',
    cities: ['Barranquilla', 'Soledad', 'Cartagena', 'Santa Marta', 'Valledupar', 'Montería', 'Sincelejo', 'Riohacha', 'Malambo', 'Turbaco', 'Magangué', 'Aguachica'],
  },
  {
    region: 'Suroccidente (Cauca y Nariño)',
    cities: ['Pasto', 'Popayán', 'Ipiales', 'Santander de Quilichao', 'Tumaco', 'Piendamó', 'Puerto Asís'],
  },
  {
    region: 'Tolima y Huila',
    cities: ['Ibagué', 'Neiva', 'Espinal', 'Pitalito', 'Melgar', 'Garzón', 'Mariquita', 'Honda'],
  },
  {
    region: 'Boyacá',
    cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'],
  },
  {
    region: 'Llanos y Orinoquía / Amazonía',
    cities: ['Villavicencio', 'Yopal', 'Florencia', 'Acacías', 'Granada', 'Arauca', 'San José del Guaviare', 'Mocoa'],
  },
]

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onSuccess,
  API_BASE,
  storeSlug
}: CheckoutModalProps) {
  const [selectedCityZone, setSelectedCityZone] = useState('Candelaria')
  const [nationalCity, setNationalCity] = useState('Bogotá D.C.')
  const [customCity, setCustomCity] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    barrio: '',
    notas: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('contra_entrega')
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('Nequi')
  const [transferView, setTransferView] = useState<'qr' | 'llave'>('qr')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [savedCartItems, setSavedCartItems] = useState<CartItem[]>([])
  const [savedItemsCount, setSavedItemsCount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSwitchingMethod, setIsSwitchingMethod] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [serverSubtotal, setServerSubtotal] = useState<number | null>(null)
  const [serverEnvio, setServerEnvio] = useState<number | null>(null)
  const [serverTotal, setServerTotal] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState('')

  if (!isOpen) return null

  const effectiveCity = selectedCityZone === 'OTRA'
    ? (nationalCity === 'OTRO_MUNICIPIO' ? (customCity.trim() || 'Colombia') : nationalCity)
    : selectedCityZone
  const isLocal = isLocalCoverage(effectiveCity)

  const handleCityZoneChange = (zone: string) => {
    setSelectedCityZone(zone)
    const nextIsLocal = zone === 'OTRA' ? false : isLocalCoverage(zone)
    if (!nextIsLocal && paymentMethod === 'contra_entrega') {
      setPaymentMethod('transferencia')
    }
  }

  const handleNationalCityChange = (val: string) => {
    setNationalCity(val)
    if (paymentMethod === 'contra_entrega') {
      setPaymentMethod('transferencia')
    }
  }

  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.precio * item.quantity, 0)
  const shipping = isLocal ? (subtotal >= 150000 ? 0 : 8000) : 0
  const total = subtotal + shipping

  // Congelamos datos para la vista de éxito
  const activeCartItems = savedCartItems.length > 0 ? savedCartItems : cartItems
  const displayItemsCount = savedItemsCount > 0 ? savedItemsCount : itemsCount
  const finalSubtotal = serverSubtotal ?? subtotal
  const finalEnvio = serverEnvio ?? shipping
  const finalTotal = serverTotal ?? total

  // Solo se permite redirigir a dominios oficiales de Mercado Pago
  const isSafeMpUrl = (url: string) => {
    try {
      const u = new URL(url)
      return u.protocol === 'https:' && /(^|\.)mercadopago\.com(\.co)?$/.test(u.hostname)
    } catch {
      return false
    }
  }

  const handlePayWithMercadoPago = () => {
    if (!checkoutUrl || !isSafeMpUrl(checkoutUrl)) return
    onSuccess() // vacía el carrito: el pedido ya quedó registrado
    window.location.href = checkoutUrl
  }

  const fmtPrice = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(val)
  }

  const handleCopy = (text: string, keyId: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2500)
    }
  }

  const getPaymentMethodLabel = (method = paymentMethod, _wallet?: WalletType) => {
    if (method === 'contra_entrega') return 'Contra Entrega (Efectivo)'
    if (method === 'transferencia') return 'Transferencia (Bre-B / QR / Llave @eip656)'
    return 'Mercado Pago (PSE / Tarjeta / Efecty)'
  }

  const handleSwitchPaymentMethod = async (newMethod: PaymentMethodType) => {
    if (newMethod === paymentMethod) return
    setPaymentMethod(newMethod)

    if (orderId) {
      try {
        setIsSwitchingMethod(true)
        const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/pedidos/${orderId}/metodo-pago`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metodoCodigo: newMethod,
            medioPago: getPaymentMethodLabel(newMethod, selectedWallet),
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (data?.checkoutUrl && isSafeMpUrl(data.checkoutUrl)) {
          setCheckoutUrl(data.checkoutUrl)
        }
      } catch (err) {
        console.warn('No se pudo sincronizar el cambio de método de pago con el servidor', err)
      } finally {
        setIsSwitchingMethod(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    if (selectedCityZone === 'OTRA' && nationalCity === 'OTRO_MUNICIPIO' && !customCity.trim()) {
      setSubmitError('Por favor escribe tu municipio o población de entrega.')
      setIsSubmitting(false)
      return
    }

    if (paymentMethod === 'contra_entrega' && !isLocal) {
      setSubmitError('El pago contra entrega en efectivo solo está disponible para Cali, Candelaria, Ciudad del Campo, Poblado Campestre, Palmira, Jamundí y Yumbo. Para tu ciudad, selecciona Bre-B o Mercado Pago.')
      setIsSubmitting(false)
      return
    }

    const readableMethod = getPaymentMethodLabel()

    const payload = {
      orderId: orderId || undefined,
      nombre: formData.nombre,
      email: `${formData.telefono}@cliente.babyworld.com`,
      telefono: formData.telefono,
      direccion: `${formData.direccion}, Barrio: ${formData.barrio || 'N/A'}, ${effectiveCity}. Notas: ${formData.notas || 'Ninguna'}`,
      ciudad: effectiveCity,
      medioPago: readableMethod,
      metodoPagoCodigo: paymentMethod,
      items: (activeCartItems.length > 0 ? activeCartItems : cartItems).map(item => ({
        productoId: item.product.id,
        nombre: item.product.nombre,
        precioUnitario: item.product.precio,
        cantidad: item.quantity,
      }))
    }

    setSubmitError('')
    try {
      const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(
          typeof data?.message === 'string'
            ? data.message
            : 'No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.'
        )
        return
      }
      const orderNum = data.numero
      setOrderNumber(orderNum)
      if (typeof data.orderId === 'number') setOrderId(data.orderId)
      setSavedItemsCount(itemsCount)
      setSavedCartItems([...cartItems])
      const appliedSubtotal = typeof data.subtotal === 'number' ? data.subtotal : subtotal
      const appliedEnvio = typeof data.envio === 'number' ? data.envio : shipping
      const appliedTotal = typeof data.total === 'number' ? data.total : total
      if (typeof data.subtotal === 'number') setServerSubtotal(data.subtotal)
      if (typeof data.envio === 'number') setServerEnvio(data.envio)
      if (typeof data.total === 'number') setServerTotal(data.total)
      if (paymentMethod === 'mercadopago' && typeof data.checkoutUrl === 'string' && isSafeMpUrl(data.checkoutUrl)) {
        setCheckoutUrl(data.checkoutUrl)
      }
      setIsSuccess(true)
      onSuccess() // Vacía el carrito de compras

      // Si es Contra Entrega, abrimos WhatsApp automáticamente de una vez
      if (paymentMethod === 'contra_entrega') {
        const waUrl = buildWhatsAppUrl(
          orderNum,
          appliedSubtotal,
          appliedEnvio,
          appliedTotal,
          'contra_entrega',
          cartItems
        )
        try {
          window.open(waUrl, '_blank')
        } catch {
          window.location.href = waUrl
        }
      }
    } catch (err) {
      setSubmitError('Error de conexión. Revisa tu internet o escríbenos por WhatsApp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildWhatsAppUrl = (
    ordNum: string,
    subTot: number,
    shipVal: number,
    totVal: number,
    method = paymentMethod,
    items = (activeCartItems.length > 0 ? activeCartItems : cartItems)
  ) => {
    let msg = `🍼 *PEDIDO BABY-WORLD - ORDEN #${ordNum}*\n\n`
    msg += `*Cliente:* ${formData.nombre}\n`
    msg += `*Teléfono:* ${formData.telefono}\n`
    msg += `*Dirección:* ${formData.direccion}, ${effectiveCity}\n`
    msg += `*Método de Pago:* ${getPaymentMethodLabel(method)}\n\n`
    msg += `*Productos:*\n`
    items.forEach(i => {
      msg += `• ${i.quantity}x ${i.product.nombre} (${fmtPrice(i.product.precio * i.quantity)})\n`
    })
    msg += `\n*Subtotal:* ${fmtPrice(subTot)}`
    if (isLocal) {
      msg += `\n*Envío:* ${shipVal === 0 ? 'Gratis 🎉 (Domicilio Local)' : `${fmtPrice(shipVal)} (Domicilio Local)`}`
    } else {
      msg += `\n*Envío:* Flete al Cobro por Transportadora (lo pagas al recibir)`
    }
    msg += `\n*Total:* ${fmtPrice(totVal)}`

    if (method === 'transferencia') {
      if (isLocal) {
        msg += `\n\n📌 *Nota:* Voy a transferir mediante *Bre-B (Llave: @eip656 / QR)*. Adjunto comprobante a continuación.`
      } else {
        msg += `\n\n📦 *Despacho Nacional:* Voy a transferir mediante *Bre-B (Llave: @eip656 / QR)*. Por favor compártanme la guía de la transportadora cuando el pedido sea despachado.`
      }
    } else if (method === 'mercadopago') {
      msg += `\n\n💳 *Nota:* Seleccioné pago online con Mercado Pago para la orden #${ordNum}.`
    } else {
      msg += `\n\n💵 *Nota:* Pagaré contra entrega en efectivo al recibir en mi dirección.`
    }

    return `https://wa.me/573023863380?text=${encodeURIComponent(msg)}`
  }

  const handleFinish = () => {
    setOrderId(null)
    setOrderNumber('')
    setSavedCartItems([])
    setSavedItemsCount(0)
    setIsSuccess(false)
    onSuccess()
    onClose()
  }

  const handleClose = () => {
    setOrderId(null)
    setOrderNumber('')
    setSavedCartItems([])
    setSavedItemsCount(0)
    setIsSuccess(false)
    onClose()
  }

  const handleSendWhatsAppConfirmation = () => {
    const waUrl = buildWhatsAppUrl(
      orderNumber,
      finalSubtotal,
      finalEnvio,
      finalTotal,
      paymentMethod,
      activeCartItems
    )
    window.open(waUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={isSuccess ? undefined : handleClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7 border border-slate-100 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {!isSuccess && (
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100/80 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider">
                Baby-World Candelaria
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-snug">Finalizar Pedido</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa tus datos de entrega y selecciona el medio de pago más cómodo para ti.
              </p>
            </div>

            {/* Form Fields: Datos de Entrega */}
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
                  placeholder="Ej. 320 123 4567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Ciudad / Cobertura *
                    </label>
                    <select
                      value={selectedCityZone}
                      onChange={e => handleCityZoneChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all cursor-pointer"
                    >
                      <optgroup label="📍 Domicilio Local ($8.000 / Gratis ≥ $150k)">
                        <option value="Candelaria">Candelaria</option>
                        <option value="Cali">Cali</option>
                        <option value="Ciudad del Campo">Ciudad del Campo</option>
                        <option value="Poblado Campestre">Poblado Campestre</option>
                        <option value="Palmira">Palmira</option>
                        <option value="Jamundí">Jamundí</option>
                        <option value="Yumbo">Yumbo</option>
                      </optgroup>
                      <optgroup label="🇨🇴 Envíos Nacionales (Transportadora)">
                        <option value="OTRA">Otra Ciudad (Envío Nacional)</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Barrio
                    </label>
                    <input
                      type="text"
                      value={formData.barrio}
                      onChange={e => setFormData({ ...formData, barrio: e.target.value })}
                      placeholder="Ej. El Poblado, Centro"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {selectedCityZone === 'OTRA' && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10.5px] font-bold text-amber-900 mb-1">
                        Selecciona tu Ciudad o Capital en Colombia *
                      </label>
                      <select
                        value={nationalCity}
                        onChange={e => handleNationalCityChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                      >
                        {CIUDADES_NACIONALES.map(group => (
                          <optgroup key={group.region} label={group.region}>
                            {group.cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </optgroup>
                        ))}
                        <optgroup label="✍️ Municipio no listado">
                          <option value="OTRO_MUNICIPIO">Otro municipio o población (escribir)...</option>
                        </optgroup>
                      </select>
                    </div>

                    {nationalCity === 'OTRO_MUNICIPIO' && (
                      <div className="animate-in fade-in duration-150">
                        <label className="block text-[10px] font-bold text-amber-900 mb-1">
                          Escribe tu Municipio y Departamento *
                        </label>
                        <input
                          type="text"
                          required
                          value={customCity}
                          onChange={e => setCustomCity(e.target.value)}
                          placeholder="Ej. Garzón (Huila), San Gil (Santander), La Ceja..."
                          className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-400 font-semibold text-slate-800"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-amber-800 leading-tight">
                      📦 <b>Envío por Transportadora:</b> El flete es <b>al cobro</b> (lo pagas a la transportadora al recibir en {effectiveCity}, aprox. $12.000 - $18.000 según destino). Los productos se cancelan por anticipado con Bre-B o Mercado Pago.
                    </p>
                  </div>
                )}
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
                  placeholder="Calle, Carrera, Manzana o Casa #"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
              </div>

              {/* Selector de Medios de Pago Moderno */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Selecciona la Forma de Pago *
                </label>
                
                <div className="space-y-2">
                  {/* Opción 1: Contra Entrega */}
                  <div
                    onClick={() => {
                      if (!isLocal) {
                        setSubmitError('El pago contra entrega en efectivo solo está disponible para Cali, Candelaria, Ciudad del Campo, Poblado Campestre, Palmira, Jamundí y Yumbo. Para envíos nacionales, por favor selecciona Bre-B o Mercado Pago.')
                        return
                      }
                      setSubmitError('')
                      setPaymentMethod('contra_entrega')
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      !isLocal
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : paymentMethod === 'contra_entrega'
                        ? 'cursor-pointer border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-400'
                        : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl ${
                      !isLocal ? 'bg-slate-200 text-slate-400' : paymentMethod === 'contra_entrega' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Banknote size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Pago Contra Entrega</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          !isLocal
                            ? 'text-slate-500 bg-slate-100 border-slate-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        }`}>
                          {!isLocal ? 'Solo Cali y alrededores' : 'Efectivo'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {!isLocal
                          ? 'No disponible para envíos nacionales por transportadora. Selecciona Bre-B o Mercado Pago.'
                          : 'Pagas en efectivo al momento de recibir el pedido en tu puerta con domiciliario local.'}
                      </p>
                    </div>
                  </div>

                  {/* Opción 2: Transferencia Directa */}
                  <div
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                      paymentMethod === 'transferencia'
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-xl ${
                        paymentMethod === 'transferencia' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Smartphone size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Transferencia Bancaria / Bre-B</span>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                            Sin Comisiones
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          QR oficial o Llave Bre-B <b>@eip656</b>. Paga desde Nequi, Daviplata, Bancolombia y cualquier banco del país.
                        </p>
                      </div>
                    </div>

                    {paymentMethod === 'transferencia' && (
                      <div className="pt-1.5 pl-10 border-t border-sky-100/80 flex items-center justify-between">
                        <span className="text-[10.5px] font-medium text-slate-600">
                          Llave Bre-B: <b className="font-mono text-sky-800 font-black">@eip656</b>
                        </span>
                        <span className="text-[10px] text-sky-700 bg-sky-100/80 font-bold px-2 py-0.5 rounded-full">
                          Interoperable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Opción 3: Mercado Pago / Pago en Línea */}
                  <div
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      paymentMethod === 'mercadopago'
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl ${
                      paymentMethod === 'mercadopago' ? 'bg-[#009EE3] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Mercado Pago (Online)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            PSE
                          </span>
                          <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            Tarjetas
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Paga seguro con Tarjeta Débito/Crédito, PSE o Efecty a través de la pasarela oficial de Mercado Pago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price breakdown transparente ANTES de confirmar */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 mt-3 shadow-2xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({itemsCount} {itemsCount === 1 ? 'producto' : 'productos'})</span>
                <span className="font-semibold text-slate-800">{fmtPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck size={13} className="text-sky-600" />
                  <span>{isLocal ? 'Costo de Envío a Domicilio' : 'Envío por Transportadora'}</span>
                </span>
                <span className={isLocal ? (shipping === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-800") : "text-amber-800 font-bold bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-[10.5px]"}>
                  {isLocal 
                    ? (shipping === 0 ? "¡Gratis! 🎉" : fmtPrice(shipping))
                    : "Al Cobro al recibir 📦"}
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-1.5 border-t border-slate-200">
                <span>Total a Pagar {isLocal ? '' : '(Productos)'}</span>
                <span className="text-sky-600 font-black">{fmtPrice(total)}</span>
              </div>
              {isLocal && shipping > 0 && (
                <p className="text-[10px] text-slate-400 pt-0.5 text-right font-medium">
                  * Agrega {fmtPrice(150000 - subtotal)} más para calificar a envío gratis
                </p>
              )}
              {!isLocal && (
                <p className="text-[10.5px] text-amber-800 pt-1 text-right font-medium leading-tight">
                  * El flete nacional lo pagas a la transportadora al recibir en tu puerta (aprox. $12.000 - $18.000).
                </p>
              )}
            </div>

            {submitError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>
                {isSubmitting 
                  ? 'Procesando...' 
                  : paymentMethod === 'transferencia'
                  ? 'Confirmar Pedido y Ver Cuentas'
                  : paymentMethod === 'mercadopago'
                  ? 'Continuar al Pago con Mercado Pago'
                  : 'Confirmar y Enviar Pedido'}
              </span>
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          /* ==============================================================
             PANTALLA DE CONFIRMACIÓN CONTEXTUAL Y TRANSPARENTE
             ============================================================== */
          <div className="py-2 space-y-4">
            
            {/* Encabezado contextual según el método de pago */}
            {paymentMethod === 'mercadopago' ? (
              <div className="text-center">
                <div className="mx-auto h-14 w-14 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center text-[#009EE3] shadow-sm mb-3">
                  <CreditCard size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#009EE3] bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  Paso Final: Pago Pendiente
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  ¡Tu pedido está listo para pagar!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Hola <b>{formData.nombre}</b>, hemos apartado tu orden <b className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-xs">#{orderNumber}</b>. Para autorizar el despacho inmediato, completa tu pago seguro a continuación:
                </p>
              </div>
            ) : paymentMethod === 'transferencia' ? (
              <div className="text-center">
                <div className="mx-auto h-14 w-14 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center text-sky-600 shadow-sm mb-3">
                  <Smartphone size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200/80 inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  Orden Guardada: Pendiente de Transferencia
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  ¡Pedido Apartado, {formData.nombre}!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Tu orden <b className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-xs">#{orderNumber}</b> fue reservada. Realiza la transferencia y envíanos el comprobante por WhatsApp para despachar:
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto h-14 w-14 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-3">
                  <CheckCircle size={30} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 inline-flex items-center gap-1.5">
                  <Check size={12} />
                  ¡Pedido Confirmado con Éxito!
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  ¡Gracias por tu compra, {formData.nombre}!
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Hemos registrado tu orden <b className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-xs">#{orderNumber}</b>. Abrimos WhatsApp para coordinar el despacho de tu paquete; pagarás en efectivo al recibir en tu dirección.
                </p>
              </div>
            )}

            {/* Selector interactivo para cambiar método de pago si el cliente lo desea */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw size={13} className={`text-sky-600 ${isSwitchingMethod ? 'animate-spin' : ''}`} />
                  ¿Deseas pagar con otro medio?
                </span>
                {isSwitchingMethod ? (
                  <span className="text-[10px] text-sky-600 font-bold animate-pulse">
                    Actualizando...
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Toca para cambiar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchPaymentMethod('contra_entrega')}
                  disabled={isSwitchingMethod}
                  className={`py-2 px-1.5 rounded-xl text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer active:scale-95 ${
                    paymentMethod === 'contra_entrega'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <Banknote size={15} />
                  <span className="leading-tight text-center">Contra Entrega</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchPaymentMethod('transferencia')}
                  disabled={isSwitchingMethod}
                  className={`py-2 px-1.5 rounded-xl text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer active:scale-95 ${
                    paymentMethod === 'transferencia'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <Smartphone size={15} />
                  <span className="leading-tight text-center">Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchPaymentMethod('mercadopago')}
                  disabled={isSwitchingMethod}
                  className={`py-2 px-1.5 rounded-xl text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer active:scale-95 ${
                    paymentMethod === 'mercadopago'
                      ? 'bg-[#009EE3] text-white border-[#009EE3] shadow-xs ring-2 ring-blue-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <CreditCard size={15} />
                  <span className="leading-tight text-center">Mercado Pago</span>
                </button>
              </div>
            </div>

            {/* Tarjeta de MERCADO PAGO con DESGLOSE TRANSPARENTE */}
            {paymentMethod === 'mercadopago' && (
              <div className="bg-gradient-to-br from-blue-50/90 to-sky-50/50 p-4 rounded-2xl border border-blue-200/80 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                  <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <CreditCard size={15} className="text-[#009EE3]" />
                    Pago Seguro en Línea (Mercado Pago)
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    PSE / Tarjetas / Efecty
                  </span>
                </div>

                {/* Desglose transparente */}
                <div className="bg-white/95 rounded-xl p-3 border border-blue-100 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Productos ({displayItemsCount} {displayItemsCount === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold text-slate-800">{fmtPrice(finalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      Costo de Envío a Domicilio:
                    </span>
                    <span className={finalEnvio === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-800"}>
                      {finalEnvio === 0 ? "¡Gratis! 🎉" : fmtPrice(finalEnvio)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-xs">
                    <span>Total a Pagar en Mercado Pago:</span>
                    <span className="text-[#009EE3] text-sm font-black">{fmtPrice(finalTotal)}</span>
                  </div>
                </div>

                {checkoutUrl ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                      Presiona el botón para ir a la plataforma oficial de <b>Mercado Pago</b> y pagar con PSE, Tarjeta o Efecty:
                    </p>
                    <button
                      type="button"
                      onClick={handlePayWithMercadoPago}
                      className="w-full py-3.5 bg-[#009EE3] hover:bg-[#0089c7] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_6px_20px_rgba(0,158,227,0.35)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <ShieldCheck size={18} />
                      <span>Pagar ahora {fmtPrice(finalTotal)} con Mercado Pago</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      Transacción 100% protegida y cifrada por Mercado Pago
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Tu orden ya está registrada. Escríbenos por WhatsApp y te enviaremos el enlace oficial de pago de Mercado Pago.
                  </p>
                )}
              </div>
            )}

            {/* Tarjeta de TRANSFERENCIA con QR BRE-B y DESGLOSE TRANSPARENTE */}
            {paymentMethod === 'transferencia' && (
              <div className="bg-gradient-to-br from-sky-50 to-indigo-50/40 p-4 rounded-2xl border border-sky-100 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-sky-200/50">
                  <span className="font-extrabold text-sky-900 text-xs flex items-center gap-1.5">
                    <QrCode size={15} className="text-sky-600" />
                    Paga con Bre-B o Transferencia
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                    Sin comisiones
                  </span>
                </div>

                {/* Desglose transparente */}
                <div className="bg-white/95 rounded-xl p-3 border border-sky-100 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Productos ({displayItemsCount} {displayItemsCount === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold text-slate-800">{fmtPrice(finalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      {isLocal ? 'Costo de Envío a Domicilio:' : 'Envío por Transportadora:'}
                    </span>
                    <span className={isLocal ? (finalEnvio === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-800") : "text-amber-800 font-bold"}>
                      {isLocal 
                        ? (finalEnvio === 0 ? "¡Gratis! 🎉" : fmtPrice(finalEnvio))
                        : "Al Cobro al recibir 📦"}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-xs">
                    <span>Total a Transferir {isLocal ? '' : '(Productos)'}:</span>
                    <span className="text-sky-600 text-sm font-black">{fmtPrice(finalTotal)}</span>
                  </div>
                  {!isLocal && (
                    <p className="text-[10px] text-amber-800 pt-0.5 text-right font-medium">
                      Pagas el flete a la transportadora al recibir en tu ciudad
                    </p>
                  )}
                </div>

                {/* Selector entre QR Bre-B y Llave Bre-B */}
                <div className="flex items-center justify-center p-1 bg-sky-100/60 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setTransferView('qr')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      transferView === 'qr'
                        ? 'bg-white text-sky-900 shadow-xs ring-1 ring-sky-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode size={13} />
                    <span>Código QR Bre-B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferView('llave')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      transferView === 'llave'
                        ? 'bg-white text-sky-900 shadow-xs ring-1 ring-sky-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound size={13} />
                    <span>Llave Bre-B (@eip656)</span>
                  </button>
                </div>

                {/* Vista 1: Código QR de Bre-B */}
                {transferView === 'qr' && (
                  <div className="bg-white rounded-2xl p-3 border border-sky-100 text-center space-y-2.5 shadow-2xs">
                    <div className="relative inline-block mx-auto bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
                      <img
                        src="/qr-bre-b.png"
                        alt="QR Bre-B Distribuidora Baby-World"
                        className="w-48 h-auto max-h-56 mx-auto rounded-lg object-contain"
                      />
                    </div>

                    {/* Llave Bre-B accesible directamente bajo el QR */}
                    <div className="flex items-center justify-between bg-sky-50/70 border border-sky-100 rounded-xl px-3 py-1.5 text-left">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Llave Bre-B para transferir:</span>
                        <span className="text-sm font-black text-sky-950 font-mono tracking-wide">@eip656</span>
                      </div>
                      <button
                        onClick={() => handleCopy('@eip656', 'qr-key')}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10.5px] transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        {copiedKey === 'qr-key' ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                        <span>{copiedKey === 'qr-key' ? '¡Copiada!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p className="font-extrabold text-slate-800">
                        Escanea y paga con la entidad financiera que prefieras
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Compatible con <b>Nequi</b>, <b>Daviplata</b>, <b>Bancolombia</b>, <b>Dale</b> y cualquier banco en Colombia.
                      </p>
                    </div>
                    <div>
                      <a
                        href="/qr-bre-b.png"
                        download="QR-Bre-B-BabyWorld.png"
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Descargar QR para pagar desde tu galería</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Vista 2: Llave Bre-B (@eip656) para copiar en vez del número */}
                {transferView === 'llave' && (
                  <div className="space-y-2.5">
                    {/* Tarjeta principal con la Llave Bre-B */}
                    <div className="bg-white rounded-2xl p-3.5 border border-sky-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <KeyRound size={11} /> Llave Bre-B Oficial
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          ● Activa y Verificada
                        </span>
                      </div>

                      <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            Llave Interoperable
                          </span>
                          <span className="text-xl font-black text-sky-950 font-mono tracking-wider">
                            @eip656
                          </span>
                          <span className="text-[10.5px] text-slate-500 block font-medium">
                            Titular: Distribuidora Baby-World
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy('@eip656', 'main-key')}
                          type="button"
                          className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] transition-all active:scale-95 shadow-xs cursor-pointer"
                        >
                          {copiedKey === 'main-key' ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                          <span>{copiedKey === 'main-key' ? '¡Copiada!' : 'Copiar Llave'}</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Entra a tu banco o billetera (<b>Nequi</b>, <b>Daviplata</b>, <b>Bancolombia</b>, etc.), selecciona <b>Bre-B / Transferencias Inmediatas</b> e introduce la llave <b>@eip656</b>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Info size={12} className="text-sky-600" /> Pasos para completar tu despacho:
                  </p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 text-[10.5px]">
                    <li>Transfiere el valor exacto (<b>{fmtPrice(finalTotal)}</b>) con el código QR o la llave <b>@eip656</b>.</li>
                    <li>Toma una captura o comprobante de la transacción.</li>
                    <li>Presiona el botón de abajo para enviarnos el comprobante por WhatsApp.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tarjeta de CONTRA ENTREGA con DESGLOSE TRANSPARENTE */}
            {paymentMethod === 'contra_entrega' && (
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Banknote size={16} className="text-emerald-600" />
                    Pago en Efectivo Contra Entrega
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Pagas al recibir
                  </span>
                </div>

                {/* Desglose transparente */}
                <div className="bg-white/95 rounded-xl p-3 border border-emerald-100 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Productos ({displayItemsCount} {displayItemsCount === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold text-slate-800">{fmtPrice(finalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      Costo de Envío a Domicilio:
                    </span>
                    <span className={finalEnvio === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-800"}>
                      {finalEnvio === 0 ? "¡Gratis! 🎉" : fmtPrice(finalEnvio)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-xs">
                    <span>Total en Efectivo a Pagar:</span>
                    <span className="text-emerald-700 text-sm font-black">{fmtPrice(finalTotal)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Por favor ten a mano la cantidad exacta en efectivo (<b>{fmtPrice(finalTotal)}</b>) para cuando el domiciliario llegue a tu dirección: <b>{formData.direccion}, {effectiveCity}</b>.
                </p>
              </div>
            )}

            {/* Botones de acción contextuales */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSendWhatsAppConfirmation}
                className={`w-full rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer ${
                  paymentMethod === 'mercadopago' && checkoutUrl
                    ? 'py-2.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={17} />
                  <span>
                    {paymentMethod === 'transferencia'
                      ? 'Enviar Comprobante por WhatsApp'
                      : paymentMethod === 'mercadopago'
                      ? (checkoutUrl ? '¿Dudas con tu pago? Escríbenos' : 'Solicitar Enlace de Pago por WhatsApp')
                      : 'Abrir WhatsApp para Coordinar Entrega'}
                  </span>
                </div>
                {paymentMethod === 'contra_entrega' && (
                  <span className="text-[10px] text-emerald-100 font-normal lowercase tracking-normal">
                    (Toca aquí si WhatsApp no se abrió automáticamente)
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 size={13} className="text-slate-400" />
                <span>¿Te equivocaste en tus datos? Modificar pedido</span>
              </button>

              <button
                onClick={handleFinish}
                className="w-full py-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
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
