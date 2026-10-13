// Analítica de la tienda: Google Analytics 4 (opcional) + contador propio en el backend de Edatia.
// Solo datos anónimos: no se envía nombre, teléfono, dirección ni ningún dato personal.

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type TipoEvento = 'VISITA' | 'VER_PRODUCTO' | 'AGREGAR_CARRITO' | 'INICIO_CHECKOUT'

// El ID de GA4 (G-XXXXXXXXXX) se define en el build: VITE_GA_MEASUREMENT_ID. Si no existe, GA4 queda desactivado.
const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || ''
const GA_ID_VALIDO = /^G-[A-Z0-9]{6,12}$/.test(GA_ID)

const VISITOR_KEY = 'bw_visitor_id'

// ID anónimo aleatorio (no es un token de autenticación, no da acceso a nada).
const getVisitorId = (): string => {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const getDispositivo = (): 'MOVIL' | 'TABLET' | 'ESCRITORIO' => {
  const w = window.innerWidth
  if (w < 768) return 'MOVIL'
  if (w < 1024) return 'TABLET'
  return 'ESCRITORIO'
}

// Origen del tráfico: ?utm_source=instagram > dominio del referrer > directo
const getOrigen = (): string => {
  const utm = new URLSearchParams(window.location.search).get('utm_source')
  if (utm) return utm.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60) || 'directo'
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host && host !== window.location.hostname.replace(/^www\./, '')) return host
    }
  } catch {
    /* referrer inválido: se trata como directo */
  }
  return 'directo'
}

let apiBase = ''
let storeSlug = ''

const enviarEventoPropio = (tipo: TipoEvento, productoId?: number) => {
  if (!apiBase || !storeSlug) return
  fetch(`${apiBase}/public/tiendas/${encodeURIComponent(storeSlug)}/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo,
      visitorId: getVisitorId(),
      productoId,
      origen: getOrigen(),
      dispositivo: getDispositivo(),
    }),
    keepalive: true,
  }).catch(() => {
    /* la analítica nunca debe afectar la experiencia de compra */
  })
}

const cargarGA4 = () => {
  if (!GA_ID_VALIDO || window.gtag) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { anonymize_ip: true })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
}

const enviarGA = (evento: string, params?: Record<string, unknown>) => {
  if (window.gtag) window.gtag('event', evento, params)
}

export const analytics = {
  init(base: string, slug: string) {
    apiBase = base
    storeSlug = slug
    cargarGA4()
    // Una sola visita por sesión de navegador (evita inflar el contador al recargar)
    try {
      if (sessionStorage.getItem('bw_visita_registrada')) return
      sessionStorage.setItem('bw_visita_registrada', '1')
    } catch {
      /* sin sessionStorage: se registra igualmente */
    }
    enviarEventoPropio('VISITA')
  },
  verProducto(id: number, nombre: string, precio: number) {
    enviarEventoPropio('VER_PRODUCTO', id)
    enviarGA('view_item', { currency: 'COP', value: precio, items: [{ item_id: String(id), item_name: nombre, price: precio }] })
  },
  agregarCarrito(id: number, nombre: string, precio: number, cantidad: number) {
    enviarEventoPropio('AGREGAR_CARRITO', id)
    enviarGA('add_to_cart', { currency: 'COP', value: precio * cantidad, items: [{ item_id: String(id), item_name: nombre, price: precio, quantity: cantidad }] })
  },
  iniciarCheckout(valor: number) {
    enviarEventoPropio('INICIO_CHECKOUT')
    enviarGA('begin_checkout', { currency: 'COP', value: valor })
  },
  compra(valor: number) {
    enviarGA('purchase', { currency: 'COP', value: valor, transaction_id: `bw-${Date.now()}` })
  },
}
