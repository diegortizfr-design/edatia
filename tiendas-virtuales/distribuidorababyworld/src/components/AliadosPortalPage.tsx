import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft, Sparkles, Search, Copy, Check, Download,
  Wallet, ShoppingBag, TrendingUp, LogOut, RefreshCw, Plus, Minus,
  CheckCircle2, Clock, X, KeyRound,
  UserPlus, PackageCheck, AlertCircle, Loader2, ExternalLink, Share2, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getOptimizedImageUrl, FALLBACK_IMAGE } from '../lib/imageOptimizer'
import { WhatsAppIcon } from './WhatsAppIcon'

interface AliadosPortalPageProps {
  onBack: () => void
  API_BASE: string
  storeSlug: string
}

interface AliadoProfile {
  id: number
  nombre: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  email?: string | null
  ciudad?: string | null
  medioPago: string
  cuentaPago: string
  codigoReferido: string
  porcentajeUtilidad: number
  estado: 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO'
  urlTiendaReferido: string
}

interface ResumenAliado {
  pendiente: number
  aprobada: number
  pagada: number
  totalHistorico: number
  ventasValidas: number
  montoMinimoRetiro: number
  puedeSolicitarPago: boolean
}

interface ComisionItem {
  id: number
  pedidoNumero?: string | null
  origen: string
  clienteNombre: string
  montoVenta: number
  valorComision: number
  estado: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'
  detalleItems?: Array<{ nombre: string; cantidad: number; gananciaUnitaria: number; comisionTotal: number }>
  comprobantePago?: string | null
  createdAt: string
}

interface ProductoAliado {
  id: number
  sku: string
  nombre: string
  slug: string
  descripcion: string
  categoria: string
  subcategoria?: string | null
  marca?: string | null
  imagen: string | null
  imagenes: string[]
  precioPublico: number
  precioAnterior?: number | null
  stockDisponible: number
  gananciaAliado: number
  urlReferido: string
  variantes?: Array<{ id: number; nombre: string; stockDisponible: number; precioPublico: number; gananciaAliado?: number }>
}

interface OrderLineDraft {
  uid: string
  productoId: number
  varianteId: number
  cantidad: number
}

const TOKEN_STORAGE_KEY = 'bw_aliado_token_v1'
const BABY_WORLD_WHATSAPP = '573136546975'

const CIUDADES_LOCALES = ['Candelaria', 'Cali', 'Poblado Campestre', 'Ciudad del Campo', 'Palmira', 'Jamundí', 'Yumbo']
const CIUDADES_NACIONALES = ['Bogotá D.C.', 'Medellín', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Ibagué', 'Cúcuta', 'Santa Marta', 'Villavicencio', 'Pasto', 'Popayán', 'Buga', 'Tuluá', 'Otra ciudad']

export function AliadosPortalPage({ onBack, API_BASE, storeSlug }: AliadosPortalPageProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [configPublica, setConfigPublica] = useState<{
    activo: boolean
    porcentajeUtilidad?: number
    requiereCodigoInvitacion: boolean
    montoMinimoRetiro: number
    nombreTienda: string
  } | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // Auth tabs
  const [authTab, setAuthTab] = useState<'login' | 'registro'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [loginData, setLoginData] = useState({ identificador: '', pin: '' })
  const [regData, setRegData] = useState({
    nombre: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    telefono: '',
    ciudad: 'Cali',
    medioPago: 'NEQUI',
    cuentaPago: '',
    pin: '',
    codigoInvitacion: '',
    aceptaTerminos: true,
  })

  // Portal autenticado
  const [activeTab, setActiveTab] = useState<'catalogo' | 'pedido' | 'ganancias'>('catalogo')
  const [aliado, setAliado] = useState<AliadoProfile | null>(null)
  const [resumen, setResumen] = useState<ResumenAliado | null>(null)
  const [comisiones, setComisiones] = useState<ComisionItem[]>([])
  const [productos, setProductos] = useState<ProductoAliado[]>([])
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogCategoria, setCatalogCategoria] = useState<string>('TODAS')
  const [catalogSoloAddi, setCatalogSoloAddi] = useState<boolean>(false)
  const [catalogSort, setCatalogSort] = useState<'default' | 'ganancia_desc' | 'precio_asc' | 'precio_desc'>('default')

  // Modal Kit de Venta IA
  const [kitProduct, setKitProduct] = useState<ProductoAliado | null>(null)
  const [kitEstilo, setKitEstilo] = useState<'whatsapp' | 'marketplace' | 'instagram'>('whatsapp')
  const [kitLoading, setKitLoading] = useState(false)
  const [kitCopy, setKitCopy] = useState<{ titulo: string; texto: string; hashtags: string[]; urlReferido: string; esIa: boolean } | null>(null)
  const [iaCopyCache, setIaCopyCache] = useState<Record<string, { titulo: string; texto: string; hashtags: string[]; urlReferido: string; esIa: boolean }>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formatoImg, setFormatoImg] = useState<'vertical' | 'cuadrado'>('vertical')
  const [sharingKit, setSharingKit] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})

  const markStepDone = (stepKey: string) => {
    setCompletedSteps((prev) => (prev[stepKey] ? prev : { ...prev, [stepKey]: true }))
  }

  // Pedido directo para cliente (soporta múltiples productos)
  const [orderItems, setOrderItems] = useState<OrderLineDraft[]>([])
  const [orderItemsTouched, setOrderItemsTouched] = useState<boolean>(false)
  const [orderTipoCiudad, setOrderTipoCiudad] = useState<'local' | 'nacional'>('local')
  const [orderCiudadLocal, setOrderCiudadLocal] = useState('Cali')
  const [orderCiudadNac, setOrderCiudadNac] = useState('Bogotá D.C.')
  const [orderCiudadCustom, setOrderCiudadCustom] = useState('')
  const [orderMetodoPago, setOrderMetodoPago] = useState<'contra_entrega' | 'transferencia' | 'addi' | 'sistecredito'>('contra_entrega')
  const [orderCliente, setOrderCliente] = useState({ nombre: '', telefono: '', direccion: '', barrio: '', notas: '' })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{
    numero: string
    total: number
    envio: number
    whatsappUrl: string
    metodoPagoLabel: string
  } | null>(null)

  const fmtPrice = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

  // Cargar configuración pública del programa
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/config-publica`)
      .then((r) => r.json())
      .then((d) => setConfigPublica(d))
      .catch(() => { })
      .finally(() => setLoadingInit(false))
  }, [API_BASE, storeSlug])

  // Cargar perfil + catálogo si hay token
  const cargarPortal = async (activeToken: string) => {
    if (!activeToken) return
    setLoadingPortal(true)
    try {
      const headers = { Authorization: `Bearer ${activeToken}` }
      const [resPerfil, resCat] = await Promise.all([
        fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/perfil`, { headers }),
        fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/catalogo`, { headers }),
      ])

      if (resPerfil.status === 401 || resPerfil.status === 403) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken('')
        setAliado(null)
        return
      }

      const dataPerfil = await resPerfil.json()
      const dataCat = await resCat.json()

      if (dataPerfil?.aliado) {
        setAliado(dataPerfil.aliado)
        setResumen(dataPerfil.resumen)
        setComisiones(Array.isArray(dataPerfil.comisiones) ? dataPerfil.comisiones : [])
      }
      if (Array.isArray(dataCat?.productos)) {
        setProductos(dataCat.productos)
        if (dataCat.productos.length > 0) {
          setOrderItems((prev) => {
            if (prev.length > 0) return prev
            const first = dataCat.productos[0]
            return [{ uid: `line-${first.id}-init`, productoId: first.id, varianteId: first.variantes?.[0]?.id || 0, cantidad: 1 }]
          })
        }
      }
    } catch {
      toast.error('No se pudo conectar con tu panel de aliado')
    } finally {
      setLoadingPortal(false)
    }
  }

  useEffect(() => {
    if (token) {
      cargarPortal(token)
    }
  }, [token])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'No pudimos validar tus credenciales')
        return
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      setToken(data.token)
      toast.success(`¡Bienvenido/a ${data.aliado?.nombre?.split(' ')[0] || 'Aliado'}!`)
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regData,
          cuentaPago: regData.cuentaPago.trim() || regData.telefono.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Revisa los datos ingresados')
        return
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      setToken(data.token)
      toast.success('¡Registro exitoso! Ya puedes empezar a vender y ganar.')
    } catch {
      toast.error('Error de conexión al registrarte')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setAliado(null)
    setResumen(null)
    setProductos([])
  }

  const copiarTexto = async (texto: string, id: string, msg = '¡Copiado al portapapeles!', silent = false): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = texto
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedId(id)
      if (!silent) toast.success(msg)
      setTimeout(() => setCopiedId(null), 2200)
      return true
    } catch {
      if (!silent) toast.error('No se pudo copiar automáticamente')
      return false
    }
  }

  const generarCopyBaseLocal = (
    prod: ProductoAliado,
    estilo: 'whatsapp' | 'marketplace' | 'instagram',
  ) => {
    const precioNum = Math.round(Number(prod.precioPublico || 0))
    const precioFmt = fmtPrice(precioNum)
    const cuotaAddiFmt = fmtPrice(Math.round(precioNum / 3))
    const descRaw = (prod.descripcion || 'Juguete nuevo de excelente calidad, ideal para regalar y sorprender.')
      .replace(/\s+/g, ' ')
      .trim()
    const descLimpia =
      descRaw.length > 240
        ? `${descRaw.slice(0, 240).replace(/\s+\S*$/, '')}...`
        : descRaw

    const facilidades =
      precioNum >= 50000
        ? `Nequi/transferencia, pago contra entrega en Cali y alrededores (envíos a toda Colombia) o a cuotas sin tarjeta con Addi (3 cuotas de ${cuotaAddiFmt} sin interés) y Sistecrédito.`
        : 'Nequi/transferencia, pago contra entrega en Cali y alrededores (envíos a toda Colombia), Sistecrédito o Addi (en compras desde $50.000).'

    const hashtags =
      estilo === 'instagram'
        ? ['#JuguetesColombia', '#BabyWorld', '#RegalosInfantiles', '#MamasColombia']
        : ['#BabyWorld', '#JuguetesColombia']

    let texto = ''
    if (estilo === 'marketplace') {
      texto = `🎁 ${prod.nombre} — ${precioFmt} COP\n👉 Míralo y pídelo aquí: ${prod.urlReferido}\n\n✨ ${descLimpia}\n\n✅ Producto nuevo y garantizado.\n💳 ${facilidades}`
    } else if (estilo === 'instagram') {
      texto = `✨ *${prod.nombre}* — Solo ${precioFmt} COP 🧸\n👉 Pídelo aquí: ${prod.urlReferido}\n\n${descLimpia}\n\n💳 ${facilidades}\n\n${hashtags.join(' ')}`
    } else {
      texto = `🧸 *${prod.nombre}* — *${precioFmt} COP*\n👉 Míralo o pídelo aquí: ${prod.urlReferido}\n\n✨ ${descLimpia}\n💳 ${facilidades}`
    }

    return {
      titulo: `${prod.nombre.slice(0, 62)} - ${precioFmt}`,
      texto,
      hashtags,
      urlReferido: prod.urlReferido,
      esIa: false,
    }
  }

  const cargarCopyParaEstilo = (prod: ProductoAliado, estilo: 'whatsapp' | 'marketplace' | 'instagram') => {
    setKitEstilo(estilo)
    setFormatoImg(estilo === 'marketplace' ? 'cuadrado' : 'vertical')
    setCompletedSteps({})
    const cached = iaCopyCache[`${prod.id}:${estilo}`]
    setKitCopy(cached || generarCopyBaseLocal(prod, estilo))
  }

  const abrirKitVenta = (prod: ProductoAliado) => {
    setKitProduct(prod)
    cargarCopyParaEstilo(prod, 'whatsapp')
  }

  const seleccionarCanalKit = (estilo: 'whatsapp' | 'marketplace' | 'instagram') => {
    if (!kitProduct) return
    cargarCopyParaEstilo(kitProduct, estilo)
  }

  const solicitarCopyIa = async (prod: ProductoAliado, estilo: 'whatsapp' | 'marketplace' | 'instagram', regenerar = false) => {
    setKitProduct(prod)
    setKitEstilo(estilo)
    setKitLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/public/tiendas/${storeSlug}/aliados/productos/${prod.id}/copy-ia${regenerar ? '?regenerar=true' : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estilo, regenerar }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'No se pudo generar el texto con IA')
        return
      }
      const hashtags = Array.isArray(data.hashtags) ? data.hashtags : []
      let textoBase = String(data.texto || '').trim()
      if (estilo === 'instagram' && hashtags.length > 0 && !textoBase.includes(hashtags[0])) {
        textoBase = `${textoBase}\n\n${hashtags.join(' ')}`
      }
      const nextCopy = {
        titulo: data.titulo || prod.nombre,
        texto: textoBase,
        hashtags,
        urlReferido: data.urlReferido || prod.urlReferido,
        esIa: true,
      }
      setKitCopy(nextCopy)
      setIaCopyCache((prev) => ({ ...prev, [`${prod.id}:${estilo}`]: nextCopy }))
      toast.success(regenerar ? '¡Nueva variación IA lista!' : '¡Texto optimizado con IA listo!')
    } catch {
      toast.error('Error conectando con el asistente IA')
    } finally {
      setKitLoading(false)
    }
  }

  const prepararImagenCloudinary = (urlOriginal: string | null, formato: 'vertical' | 'cuadrado') => {
    if (!urlOriginal) return ''
    let url = getOptimizedImageUrl(urlOriginal, 1200)
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      const transf = formato === 'vertical' ? 'b_white,c_pad,w_1080,h_1920' : 'b_white,c_pad,w_1200,h_1200'
      url = url.replace(/\.(png|webp|avif|jpeg|gif)$/i, '.jpg')
      if (!url.includes(transf)) {
        url = url.replace('/upload/', `/upload/${transf},f_jpg/`)
      }
    }
    return url
  }

  const obtenerBlobFotoProducto = async (prod: ProductoAliado): Promise<{ blob: Blob; url: string } | null> => {
    const url = prepararImagenCloudinary(prod.imagen, formatoImg)
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) throw new Error('No se pudo obtener la imagen')
    const rawBlob = await res.blob()
    return { blob: new Blob([rawBlob], { type: 'image/jpeg' }), url }
  }

  const descargarFotoProducto = async (prod: ProductoAliado) => {
    const url = prepararImagenCloudinary(prod.imagen, formatoImg)
    if (!url) {
      toast.error('Este producto no tiene imagen disponible')
      return
    }
    try {
      toast.loading('Preparando foto JPG...', { id: 'dl-aliado' })
      const imgData = await obtenerBlobFotoProducto(prod)
      if (!imgData) throw new Error('Sin imagen')
      const blobUrl = URL.createObjectURL(imgData.blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${prod.sku || 'juguete'}-${formatoImg}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3500)
      markStepDone('foto')
      toast.success('Foto descargada lista para publicar', { id: 'dl-aliado' })
    } catch {
      toast.error('Abriendo imagen en nueva pestaña...', { id: 'dl-aliado' })
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const abrirEnRedSocial = async (
    canal: 'whatsapp' | 'marketplace' | 'facebook' | 'instagram' | 'telegram' | 'tiktok',
    soloAbrir = false,
  ) => {
    if (!kitCopy) return
    const texto = kitCopy.texto
    const urlRef = kitCopy.urlReferido

    if (soloAbrir) {
      markStepDone('abrir')
      if (canal === 'marketplace') {
        toast.success('Marketplace abierto — ahora descarga la foto y pega cada campo', { duration: 3500 })
        window.open('https://www.facebook.com/marketplace/create/item', '_blank', 'noopener,noreferrer')
        return
      }
      if (canal === 'instagram') {
        toast.success('Instagram abierto — ahora descarga la foto y copia tu caption', { duration: 3500 })
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
        return
      }
    }

    markStepDone('publicar')

    if (canal === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
      return
    }

    if (canal === 'telegram') {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(urlRef)}&text=${encodeURIComponent(texto)}`,
        '_blank',
        'noopener,noreferrer',
      )
      return
    }

    if (canal === 'marketplace') {
      if (!completedSteps.texto) {
        await copiarTexto(texto, 'kit-mp', '¡Descripción + link copiados! Pega todo en Marketplace')
        markStepDone('texto')
      } else {
        toast.success('Abriendo FB Marketplace...')
      }
      window.open('https://www.facebook.com/marketplace/create/item', '_blank', 'noopener,noreferrer')
      return
    }

    if (canal === 'facebook') {
      await copiarTexto(texto, 'kit-fb', '¡Texto copiado! Comparte el enlace en tu muro o grupos')
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlRef)}&quote=${encodeURIComponent(texto)}`,
        '_blank',
        'noopener,noreferrer',
      )
      return
    }

    if (canal === 'instagram') {
      if (!completedSteps.texto) {
        await copiarTexto(texto, 'kit-ig', '¡Caption + hashtags copiados! Pégalos al publicar en Instagram')
        markStepDone('texto')
      } else {
        toast.success('Abriendo Instagram...')
      }
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
      return
    }

    if (canal === 'tiktok') {
      await copiarTexto(texto, 'kit-tt', '¡Texto + hashtags copiados! Pégalos en tu publicación de TikTok')
      window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer')
    }
  }

  const compartirFotoYTextoNativo = async () => {
    if (!kitCopy || !kitProduct) return
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return

    setSharingKit(true)
    try {
      await copiarTexto(kitCopy.texto, 'kit-native', '', true)

      let sharedWithFile = false
      if (kitProduct.imagen) {
        try {
          const imgData = await obtenerBlobFotoProducto(kitProduct)
          if (imgData) {
            const file = new File([imgData.blob], `${kitProduct.sku || 'producto'}-${formatoImg}.jpg`, {
              type: 'image/jpeg',
            })
            const canShareFiles = typeof (navigator as any).canShare === 'function' && (navigator as any).canShare({ files: [file] })
            if (canShareFiles) {
              await navigator.share({
                files: [file],
                title: kitCopy.titulo,
                text: kitCopy.texto,
              })
              sharedWithFile = true
            }
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') return
        }
      }

      if (!sharedWithFile) {
        await navigator.share({
          title: kitCopy.titulo,
          text: kitCopy.texto,
          url: kitCopy.urlReferido,
        })
      }
      toast.success('Texto también copiado al portapapeles por si necesitas pegarlo', { duration: 3000 })
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('No se pudo abrir el menú de compartir del dispositivo')
      }
    } finally {
      setSharingKit(false)
    }
  }

  const catalogCategorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [productos],
  )

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = productos.filter((p) => {
      if (catalogCategoria !== 'TODAS' && p.categoria !== catalogCategoria) return false
      if (catalogSoloAddi && p.precioPublico < 50000) return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q)
      )
    })

    if (catalogSort === 'ganancia_desc') {
      return [...filtered].sort((a, b) => b.gananciaAliado - a.gananciaAliado)
    }
    if (catalogSort === 'precio_asc') {
      return [...filtered].sort((a, b) => a.precioPublico - b.precioPublico)
    }
    if (catalogSort === 'precio_desc') {
      return [...filtered].sort((a, b) => b.precioPublico - a.precioPublico)
    }
    return filtered
  }, [productos, searchQuery, catalogCategoria, catalogSoloAddi, catalogSort])

  const resolvedOrderItems = useMemo(() => {
    return orderItems
      .map((item) => {
        const producto = productos.find((p) => p.id === item.productoId)
        if (!producto) return null
        const vars = producto.variantes || []
        const variante = vars.length > 0
          ? vars.find((v) => v.id === item.varianteId) || vars[0]
          : null
        const unitPrice = variante?.precioPublico ?? producto.precioPublico
        const unitProfit = variante?.gananciaAliado ?? producto.gananciaAliado
        const maxStock = Math.max(1, variante?.stockDisponible ?? producto.stockDisponible ?? 10)
        const cantidad = Math.max(1, Math.min(item.cantidad, maxStock))
        return {
          uid: item.uid,
          producto,
          variante,
          unitPrice,
          unitProfit,
          maxStock,
          cantidad,
          subtotal: unitPrice * cantidad,
          ganancia: unitProfit * cantidad,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [orderItems, productos])

  const orderTotalUnits = useMemo(
    () => resolvedOrderItems.reduce((s, it) => s + it.cantidad, 0),
    [resolvedOrderItems],
  )
  const orderSubtotalProducto = useMemo(
    () => resolvedOrderItems.reduce((s, it) => s + it.subtotal, 0),
    [resolvedOrderItems],
  )
  const orderGananciaTotal = useMemo(
    () => resolvedOrderItems.reduce((s, it) => s + it.ganancia, 0),
    [resolvedOrderItems],
  )
  const orderEnvioEstimado = orderTipoCiudad === 'local' ? (orderSubtotalProducto >= 150000 ? 0 : 8000) : 0
  const orderTotalCliente = orderSubtotalProducto + orderEnvioEstimado
  const orderAddiElegible = orderTotalCliente >= 50000

  const handleQuickAddProductToOrder = (p: ProductoAliado) => {
    const firstVar = p.variantes?.[0]
    const firstVarId = firstVar?.id || 0
    const maxStock = Math.max(1, firstVar?.stockDisponible ?? p.stockDisponible ?? 10)
    if (!orderItemsTouched) {
      setOrderItems([{ uid: `line-${p.id}-${Date.now()}`, productoId: p.id, varianteId: firstVarId, cantidad: 1 }])
      setOrderItemsTouched(true)
    } else {
      const existing = orderItems.find((it) => it.productoId === p.id && it.varianteId === firstVarId)
      if (existing) {
        setOrderItems((prev) =>
          prev.map((it) => (it.uid === existing.uid ? { ...it, cantidad: Math.min(maxStock, it.cantidad + 1) } : it)),
        )
        toast.success(`Sumamos +1 unidad de "${p.nombre}" al pedido`)
      } else {
        setOrderItems((prev) => [...prev, { uid: `line-${p.id}-${Date.now()}`, productoId: p.id, varianteId: firstVarId, cantidad: 1 }])
        toast.success(`"${p.nombre}" agregado al pedido`)
      }
    }
    setOrderSuccess(null)
    setActiveTab('pedido')
  }

  const handleAddOrderItem = () => {
    if (productos.length === 0) return
    const nextProd = productos.find((p) => !orderItems.some((it) => it.productoId === p.id)) || productos[0]
    setOrderItems((prev) => [
      ...prev,
      {
        uid: `line-${nextProd.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productoId: nextProd.id,
        varianteId: nextProd.variantes?.[0]?.id || 0,
        cantidad: 1,
      },
    ])
    setOrderItemsTouched(true)
  }

  const handleUpdateOrderItemProduct = (uid: string, nextProdId: number) => {
    const nextP = productos.find((pr) => pr.id === nextProdId)
    const nextVar = nextP?.variantes?.[0]
    const nextMax = Math.max(1, nextVar?.stockDisponible ?? nextP?.stockDisponible ?? 10)
    setOrderItems((prev) =>
      prev.map((it) =>
        it.uid === uid
          ? {
              ...it,
              productoId: nextProdId,
              varianteId: nextVar?.id || 0,
              cantidad: Math.max(1, Math.min(it.cantidad, nextMax)),
            }
          : it,
      ),
    )
    setOrderItemsTouched(true)
  }

  const handleUpdateOrderItemVariant = (uid: string, nextVarId: number) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.uid !== uid) return it
        const p = productos.find((pr) => pr.id === it.productoId)
        const v = p?.variantes?.find((vr) => vr.id === nextVarId)
        const nextMax = Math.max(1, v?.stockDisponible ?? p?.stockDisponible ?? 10)
        return {
          ...it,
          varianteId: nextVarId,
          cantidad: Math.max(1, Math.min(it.cantidad, nextMax)),
        }
      }),
    )
    setOrderItemsTouched(true)
  }

  const handleUpdateOrderItemQty = (uid: string, nextQty: number) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.uid !== uid) return it
        const p = productos.find((pr) => pr.id === it.productoId)
        const v = p?.variantes?.find((vr) => vr.id === it.varianteId) ?? p?.variantes?.[0]
        const nextMax = Math.max(1, v?.stockDisponible ?? p?.stockDisponible ?? 10)
        return { ...it, cantidad: Math.max(1, Math.min(nextQty, nextMax)) }
      }),
    )
    setOrderItemsTouched(true)
  }

  const handleRemoveOrderItem = (uid: string) => {
    setOrderItems((prev) => (prev.length > 1 ? prev.filter((it) => it.uid !== uid) : prev))
    setOrderItemsTouched(true)
  }

  const handleCrearPedidoCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (resolvedOrderItems.length === 0) return
    const ciudadFinal =
      orderTipoCiudad === 'local'
        ? orderCiudadLocal
        : orderCiudadNac === 'Otra ciudad'
          ? orderCiudadCustom.trim() || 'Colombia'
          : orderCiudadNac

    const metodoMap: Record<typeof orderMetodoPago, { metodoPagoCodigo: string; medioPagoLabel: string }> = {
      contra_entrega: { metodoPagoCodigo: 'contra_entrega', medioPagoLabel: 'Pago Contra Entrega (Efectivo)' },
      transferencia: { metodoPagoCodigo: 'transferencia', medioPagoLabel: 'Transferencia Bre-B / Nequi' },
      addi: { metodoPagoCodigo: 'credito', medioPagoLabel: 'Crédito Addi (3 cuotas 0%)' },
      sistecredito: { metodoPagoCodigo: 'credito', medioPagoLabel: 'Crédito Sistecrédito' },
    }
    const { metodoPagoCodigo, medioPagoLabel } = metodoMap[orderMetodoPago]

    const clienteNombre = orderCliente.nombre.trim()
    const clienteTelefono = orderCliente.telefono.trim()
    const direccionCompleta = `${orderCliente.direccion.trim()}${orderCliente.barrio ? `, Barrio ${orderCliente.barrio.trim()}` : ''}${orderCliente.notas ? `. Nota aliado: ${orderCliente.notas.trim()}` : ''}`
    const itemsSnapshot = resolvedOrderItems
    const tipoCiudadSnapshot = orderTipoCiudad
    const metodoSnapshot = orderMetodoPago

    setOrderSubmitting(true)
    setOrderSuccess(null)
    try {
      const payload = {
        nombre: clienteNombre,
        telefono: clienteTelefono,
        ciudad: ciudadFinal,
        direccion: direccionCompleta,
        medioPago: medioPagoLabel,
        metodoPagoCodigo,
        items: itemsSnapshot.map((it) => ({
          productoId: it.producto.id,
          varianteId: it.variante ? it.variante.id : undefined,
          cantidad: it.cantidad,
        })),
      }

      const res = await fetch(`${API_BASE}/public/tiendas/${storeSlug}/aliados/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'No se pudo registrar el pedido')
        return
      }

      const envioFinal = Number(data.envio ?? orderEnvioEstimado)
      const totalFinal = Number(data.total ?? orderTotalCliente)

      let waMsg = `*PEDIDO ALIADO BABY-WORLD - ORDEN #${data.numero}*\n\n`
      if (aliado) waMsg += `*Aliado:* ${aliado.nombre} (${aliado.codigoReferido})\n`
      waMsg += `*Cliente:* ${clienteNombre}\n`
      waMsg += `*WhatsApp Cliente:* ${clienteTelefono}\n`
      waMsg += `*Ciudad:* ${ciudadFinal} (${tipoCiudadSnapshot === 'local' ? 'Domicilio Local' : 'Envío Nacional'})\n`
      waMsg += `*Dirección:* ${direccionCompleta}\n`
      waMsg += `*Método de Pago:* ${medioPagoLabel}\n\n`
      waMsg += `*Productos:*\n`
      itemsSnapshot.forEach((it) => {
        waMsg += `• ${it.cantidad}x ${it.producto.nombre}${it.variante ? ` [${it.variante.nombre}]` : ''} (${fmtPrice(it.subtotal)})\n`
      })
      if (tipoCiudadSnapshot === 'local') {
        waMsg += `\n*Envío:* ${envioFinal === 0 ? 'Gratis (Domicilio Local)' : `${fmtPrice(envioFinal)} (Domicilio Local)`}`
      } else {
        waMsg += `\n*Envío:* Flete al Cobro por Transportadora (lo paga el cliente al recibir)`
      }
      waMsg += `\n*Total a cobrar al cliente:* ${fmtPrice(totalFinal)}`
      if (metodoSnapshot === 'addi' || metodoSnapshot === 'sistecredito') {
        const prov = metodoSnapshot === 'addi' ? 'Addi' : 'Sistecrédito'
        waMsg += `\n\n*Financiación ${prov}:* Por favor envíenme el enlace oficial de ${prov} para compartírselo al cliente y autorizar el despacho de la orden #${data.numero}.`
      } else if (metodoSnapshot === 'transferencia') {
        waMsg += `\n\n*Nota:* El cliente pagará por transferencia Bre-B / Nequi antes del despacho. Compartiré el comprobante por aquí.`
      } else {
        waMsg += `\n\n*Nota:* Recaudar en efectivo contra entrega al cliente.`
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${BABY_WORLD_WHATSAPP}&text=${encodeURIComponent(waMsg)}`

      setOrderSuccess({
        numero: data.numero,
        total: totalFinal,
        envio: envioFinal,
        whatsappUrl: waUrl,
        metodoPagoLabel: medioPagoLabel,
      })
      setOrderCliente({ nombre: '', telefono: '', direccion: '', barrio: '', notas: '' })
      setOrderItemsTouched(false)
      if (productos.length > 0) {
        const first = productos[0]
        setOrderItems([{ uid: `line-${first.id}-reset`, productoId: first.id, varianteId: first.variantes?.[0]?.id || 0, cantidad: 1 }])
      }
      toast.success(`¡Pedido #${data.numero} registrado para despacho!`)
      cargarPortal(token)

      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer')
      } catch {
        // Si el navegador bloquea el popup, queda el botón visible en orderSuccess
      }
    } catch {
      toast.error('Error de conexión al crear el pedido')
    } finally {
      setOrderSubmitting(false)
    }
  }

  const estadoBadge = (estado: string) => {
    if (estado === 'APROBADA') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (estado === 'PAGADA') return 'bg-sky-100 text-sky-800 border-sky-200'
    if (estado === 'ANULADA') return 'bg-rose-100 text-rose-700 border-rose-200'
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }

  if (loadingInit) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-14 sm:top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Tienda</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] sm:text-xs font-extrabold">
              <Sparkles size={13} />
              <span>Programa Aliados Piloto</span>
            </span>
            {aliado && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SIN SESIÓN: Login / Registro */}
      {!token || !aliado ? (
        <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Propuesta de valor */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                💰 Gana el {configPublica?.porcentajeUtilidad ?? 30}% de utilidad
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                Vende nuestros juguetes en tus redes sin invertir un peso
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Publica en tus Estados de WhatsApp, Facebook Marketplace o Instagram con textos creados por nuestra IA. Nosotros nos encargamos del inventario y los domicilios.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <Sparkles size={16} className="text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Kit de Venta con IA en 1 clic</p>
                    <p className="text-slate-300 text-[11px]">Copia el texto optimizado con tu enlace personal y descarga fotos limpias.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <PackageCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Nosotros hacemos el domicilio</p>
                    <p className="text-slate-300 text-[11px]">Contra entrega en Cali y alrededores o envíos a todo Colombia.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <Wallet size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Pagos a tu Nequi / Daviplata</p>
                    <p className="text-slate-300 text-[11px]">
                      Ves tu ganancia exacta en pesos por cada juguete. Retiros desde {fmtPrice(configPublica?.montoMinimoRetiro ?? 30000)}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario Login / Registro */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              {configPublica && !configPublica.activo ? (
                <div className="p-6 text-center space-y-2 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertCircle className="mx-auto text-amber-600" size={28} />
                  <h2 className="font-bold text-slate-900">Programa pausado temporalmente</h2>
                  <p className="text-xs text-slate-600">Estamos ajustando cupos del piloto. Escríbenos por WhatsApp si tienes invitación.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${authTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <KeyRound size={15} />
                      <span>Ya tengo cuenta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('registro')}
                      className={`py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${authTab === 'registro' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <UserPlus size={15} />
                      <span>Quiero registrarme</span>
                    </button>
                  </div>

                  {authTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">WhatsApp o Cédula *</label>
                        <input
                          type="text"
                          required
                          value={loginData.identificador}
                          onChange={(e) => setLoginData({ ...loginData, identificador: e.target.value })}
                          placeholder="Ej: 3001234567"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">PIN de acceso (4-6 dígitos) *</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          required
                          maxLength={6}
                          value={loginData.pin}
                          onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                          placeholder="••••"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm tracking-widest"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={17} />}
                        <span>Ingresar a mi Panel de Aliado</span>
                      </button>

                      <div className="text-center pt-1">
                        <a
                          href={`https://api.whatsapp.com/send?phone=${BABY_WORLD_WHATSAPP}&text=${encodeURIComponent(
                            `Hola Baby World! Olvidé mi PIN de acceso al Portal de Aliados.${loginData.identificador.trim() ? ` Mi WhatsApp o cédula es: ${loginData.identificador.trim()}.` : ''} ¿Me ayudas a restablecerlo?`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                          <span>¿Olvidaste tu PIN? Solicitar restablecimiento por WhatsApp</span>
                        </a>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegistro} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Nombre completo *</label>
                          <input
                            type="text"
                            required
                            value={regData.nombre}
                            onChange={(e) => setRegData({ ...regData, nombre: e.target.value })}
                            placeholder="Tu nombre y apellido"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Cédula *</label>
                          <input
                            type="text"
                            required
                            value={regData.numeroDocumento}
                            onChange={(e) => setRegData({ ...regData, numeroDocumento: e.target.value })}
                            placeholder="Número de documento"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp (10 dígitos) *</label>
                          <input
                            type="tel"
                            required
                            value={regData.telefono}
                            onChange={(e) => setRegData({ ...regData, telefono: e.target.value })}
                            placeholder="3001234567"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Medio para recibir pagos *</label>
                          <select
                            value={regData.medioPago}
                            onChange={(e) => setRegData({ ...regData, medioPago: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          >
                            <option value="NEQUI">Nequi</option>
                            <option value="DAVIPLATA">Daviplata</option>
                            <option value="BANCOLOMBIA">Bancolombia / Ahorro a la Mano</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Número de cuenta / Nequi *</label>
                          <input
                            type="text"
                            required
                            value={regData.cuentaPago}
                            onChange={(e) => setRegData({ ...regData, cuentaPago: e.target.value })}
                            placeholder="Ej: 3001234567"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad *</label>
                          <input
                            type="text"
                            required
                            value={regData.ciudad}
                            onChange={(e) => setRegData({ ...regData, ciudad: e.target.value })}
                            placeholder="Cali, Bogotá..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Crea tu PIN (4 a 6 números) *</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            required
                            minLength={4}
                            maxLength={6}
                            value={regData.pin}
                            onChange={(e) => setRegData({ ...regData, pin: e.target.value.replace(/\D/g, '') })}
                            placeholder="Ej: 1234"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                          />
                        </div>
                        {configPublica?.requiereCodigoInvitacion && (
                          <div className="sm:col-span-2">
                            <label className="text-xs font-bold text-amber-800 block mb-1">Código de Invitación del Piloto *</label>
                            <input
                              type="text"
                              required
                              value={regData.codigoInvitacion}
                              onChange={(e) => setRegData({ ...regData, codigoInvitacion: e.target.value.toUpperCase() })}
                              placeholder="Ingresa el código enviado por Baby World"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm uppercase font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <label className="flex items-start gap-2 text-[11px] text-slate-600 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regData.aceptaTerminos}
                          onChange={(e) => setRegData({ ...regData, aceptaTerminos: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-sky-600"
                        />
                        <span>
                          Acepto las reglas del programa: las comisiones se calculan por ventas entregadas y pagadas a <b>terceros</b> (no aplica para compras propias) y se liquidan desde {fmtPrice(configPublica?.montoMinimoRetiro ?? 30000)} a mi {regData.medioPago}.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={17} />}
                        <span>Crear mi Cuenta de Aliado y Empezar</span>
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CON SESIÓN: PANEL COMPLETO */
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Header de bienvenida + link rápido */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  Hola, {aliado.nombre}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${aliado.estado === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                  {aliado.estado}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Tu código: <span className="text-emerald-400 font-mono">{aliado.codigoReferido}</span>
              </h2>
              <p className="text-xs text-slate-300">
                Pagos a {aliado.medioPago} ({aliado.cuentaPago}) • Ganas el {aliado.porcentajeUtilidad}% de utilidad por cada juguete entregado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => copiarTexto(aliado.urlTiendaReferido, 'main-link', '¡Link general de tu tienda copiado!')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedId === 'main-link' ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} className="text-sky-300" />}
                <span>Copiar link de toda la tienda</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ganancias')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Wallet size={15} />
                <span>Disponible: {fmtPrice(resumen?.aprobada || 0)}</span>
              </button>
            </div>
          </div>

          {aliado.estado === 'PENDIENTE' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-amber-900">
              <Clock size={18} className="text-amber-600 shrink-0" />
              <span>Tu cuenta está pendiente de aprobación por Baby World. Apenas sea activada podrás generar copies IA y cargar pedidos.</span>
            </div>
          )}

          {/* Tabs del Portal */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${activeTab === 'catalogo'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                }`}
            >
              <Sparkles size={16} />
              <span>Catálogo para Vender ({productos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pedido')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${activeTab === 'pedido'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                }`}
            >
              <ShoppingBag size={16} />
              <span>
                Cargar Pedido de Cliente
                {orderItemsTouched && orderTotalUnits > 0 ? ` (${orderTotalUnits})` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ganancias')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${activeTab === 'ganancias'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                }`}
            >
              <TrendingUp size={16} />
              <span>Mis Ganancias ({comisiones.length})</span>
            </button>
          </div>

          {loadingPortal ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-sky-500" size={30} />
            </div>
          ) : activeTab === 'catalogo' ? (
            /* TAB 1: CATÁLOGO PARA VENDER */
            <div className="space-y-4">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar juguete por nombre o referencia..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-xs sm:text-sm"
                    />
                  </div>
                  <select
                    value={catalogSort}
                    onChange={(e) => setCatalogSort(e.target.value as 'default' | 'ganancia_desc' | 'precio_asc' | 'precio_desc')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="default">Ordenar: Destacados</option>
                    <option value="ganancia_desc">Mayor ganancia para ti</option>
                    <option value="precio_asc">Menor precio</option>
                    <option value="precio_desc">Mayor precio</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {catalogCategorias.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCatalogCategoria('TODAS')}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                            catalogCategoria === 'TODAS'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Todas
                        </button>
                        {catalogCategorias.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCatalogCategoria(cat)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                              catalogCategoria === cat
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setCatalogSoloAddi((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                        catalogSoloAddi
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-blue-50/70 text-blue-700 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      Aplica Addi (≥ $50.000)
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>
                      Mostrando <b>{filteredProducts.length}</b> de {productos.length}
                    </span>
                    {(searchQuery || catalogCategoria !== 'TODAS' || catalogSoloAddi || catalogSort !== 'default') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setCatalogCategoria('TODAS')
                          setCatalogSoloAddi(false)
                          setCatalogSort('default')
                        }}
                        className="text-sky-600 hover:underline font-bold cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 space-y-2">
                  <PackageCheck className="mx-auto text-slate-300" size={36} />
                  <p className="font-bold text-slate-700 text-sm">No hay juguetes disponibles con ese filtro</p>
                  <p className="text-xs text-slate-500">Asegúrate de que los juguetes tengan stock positivo y costo cargado en el ERP.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <div className="relative aspect-square bg-white p-3 border-b border-slate-100 flex items-center justify-center">
                        <img
                          src={getOptimizedImageUrl(p.imagen, 600)}
                          alt={p.nombre}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE
                          }}
                        />
                        <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                          💰 Ganas {fmtPrice(p.gananciaAliado)}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {p.stockDisponible} disp.
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                            {p.subcategoria ? `${p.categoria} • ${p.subcategoria}` : p.categoria}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm line-clamp-2 mt-0.5 leading-snug">
                            {p.nombre}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-black text-slate-900">{fmtPrice(p.precioPublico)}</span>
                            {p.precioAnterior && p.precioAnterior > p.precioPublico && (
                              <span className="text-xs text-slate-400 line-through">{fmtPrice(p.precioAnterior)}</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => abrirKitVenta(p)}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            <Sparkles size={14} />
                            <span>Kit de Venta IA (Copiar y Publicar)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickAddProductToOrder(p)}
                              className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShoppingBag size={12} />
                              <span>Cargar Pedido</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => copiarTexto(p.urlReferido, `url-${p.id}`, '¡Link con tu código copiado!')}
                              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {copiedId === `url-${p.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              <span>Solo Link</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'pedido' ? (
            /* TAB 2: CARGAR PEDIDO DE CLIENTE */
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-900">Registrar pedido de tu cliente</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Si cerraste la venta por Facebook Marketplace o WhatsApp, ingresa los datos del comprador. Nosotros despachamos y tu comisión queda registrada automáticamente.
                </p>
              </div>

              {orderSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div className="text-xs text-emerald-900 space-y-2.5 flex-1">
                    <div className="space-y-1">
                      <p className="font-extrabold">¡Pedido #{orderSuccess.numero} creado por {fmtPrice(orderSuccess.total)} ({orderSuccess.metodoPagoLabel})!</p>
                      <p>Tu comisión ya aparece como <b>Pendiente</b> en "Mis Ganancias". Apenas entreguemos y recaudemos el pedido será aprobada.</p>
                    </div>
                    <div className="pt-0.5 space-y-1.5">
                      <a
                        href={orderSuccess.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#1fb855] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Notificar despacho por WhatsApp a Baby World</span>
                      </a>
                      <p className="text-[11px] text-emerald-700">
                        Si no se abrió WhatsApp automáticamente, toca este botón para avisar al equipo de despacho.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleCrearPedidoCliente} className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Juguetes del pedido *</label>
                    <span className="text-[11px] text-slate-500">Puedes incluir varios juguetes en el mismo envío</span>
                  </div>

                  {resolvedOrderItems.map((item, idx) => (
                    <div key={item.uid} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                          Juguete #{idx + 1}
                        </span>
                        {resolvedOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItem(item.uid)}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Quitar</span>
                          </button>
                        )}
                      </div>

                      <select
                        value={item.producto.id}
                        onChange={(e) => handleUpdateOrderItemProduct(item.uid, Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
                      >
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} — {fmtPrice(p.precioPublico)} (Ganas {fmtPrice(p.gananciaAliado)})
                          </option>
                        ))}
                      </select>

                      {item.producto.variantes && item.producto.variantes.length > 0 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Variante / Color / Talla *</label>
                          <select
                            value={item.variante?.id || 0}
                            onChange={(e) => handleUpdateOrderItemVariant(item.uid, Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm"
                          >
                            {item.producto.variantes.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.nombre} ({v.stockDisponible} disp.) — {fmtPrice(v.precioPublico)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderItemQty(item.uid, item.cantidad - 1)}
                              className="p-1.5 cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="px-2.5 text-sm font-black">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderItemQty(item.uid, item.cantidad + 1)}
                              className="p-1.5 cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">({item.maxStock} disp.)</span>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-slate-500 mr-2">Subtotal: <b className="text-slate-800">{fmtPrice(item.subtotal)}</b></span>
                          <span className="text-emerald-700 font-extrabold">Ganas {fmtPrice(item.ganancia)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    disabled={productos.length === 0}
                    className="w-full py-2.5 px-3 border border-dashed border-sky-300 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50 text-sky-700 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>Agregar otro juguete al mismo pedido</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Resumen de unidades</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {orderTotalUnits} {orderTotalUnits === 1 ? 'juguete' : 'juguetes'} en este pedido
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Tu ganancia estimada total</span>
                    <span className="text-base font-black text-emerald-700">
                      {fmtPrice(orderGananciaTotal)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del comprador *</label>
                    <input
                      type="text"
                      required
                      value={orderCliente.nombre}
                      onChange={(e) => setOrderCliente({ ...orderCliente, nombre: e.target.value })}
                      placeholder="Nombre completo del cliente"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp del comprador *</label>
                    <input
                      type="tel"
                      required
                      value={orderCliente.telefono}
                      onChange={(e) => setOrderCliente({ ...orderCliente, telefono: e.target.value })}
                      placeholder="3001234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderTipoCiudad('local')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${orderTipoCiudad === 'local' ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    🛵 Cali y Alrededores (Contra entrega)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderTipoCiudad('nacional')
                      if (orderMetodoPago === 'contra_entrega') {
                        setOrderMetodoPago('transferencia')
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${orderTipoCiudad === 'nacional' ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    🚚 Otra Ciudad de Colombia
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad de entrega *</label>
                    {orderTipoCiudad === 'local' ? (
                      <select
                        value={orderCiudadLocal}
                        onChange={(e) => setOrderCiudadLocal(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                      >
                        {CIUDADES_LOCALES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <select
                        value={orderCiudadNac}
                        onChange={(e) => setOrderCiudadNac(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                      >
                        {CIUDADES_NACIONALES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Barrio *</label>
                    <input
                      type="text"
                      required
                      value={orderCliente.barrio}
                      onChange={(e) => setOrderCliente({ ...orderCliente, barrio: e.target.value })}
                      placeholder="Nombre del barrio"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                    />
                  </div>
                </div>

                {orderTipoCiudad === 'nacional' && orderCiudadNac === 'Otra ciudad' && (
                  <input
                    type="text"
                    required
                    value={orderCiudadCustom}
                    onChange={(e) => setOrderCiudadCustom(e.target.value)}
                    placeholder="Escribe el municipio / ciudad de destino"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dirección exacta de entrega *</label>
                  <input
                    type="text"
                    required
                    value={orderCliente.direccion}
                    onChange={(e) => setOrderCliente({ ...orderCliente, direccion: e.target.value })}
                    placeholder="Calle / Carrera / Casa / Apto / Torre"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notas de entrega (opcional)</label>
                  <input
                    type="text"
                    value={orderCliente.notas}
                    onChange={(e) => setOrderCliente({ ...orderCliente, notas: e.target.value })}
                    placeholder="Ej: Dejar en portería, llamar al llegar, entregar en la tarde..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Método de pago del cliente</label>
                  <select
                    value={orderMetodoPago}
                    onChange={(e) => setOrderMetodoPago(e.target.value as 'contra_entrega' | 'transferencia' | 'addi' | 'sistecredito')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  >
                    {orderTipoCiudad === 'local' && <option value="contra_entrega">Pago Contra Entrega en Efectivo</option>}
                    <option value="transferencia">Transferencia Bre-B / Nequi antes del despacho</option>
                    <option value="addi">Crédito Addi (3 cuotas 0% interés — desde $50.000)</option>
                    <option value="sistecredito">Crédito Sistecrédito (cuotas quincenales)</option>
                  </select>

                  {orderMetodoPago === 'addi' && !orderAddiElegible && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      Addi aplica para compras desde $50.000. Este pedido suma {fmtPrice(orderTotalCliente)}; puedes agregar otro juguete o más unidades, o elegir Sistecrédito / Transferencia / Contra entrega.
                    </div>
                  )}

                  {((orderMetodoPago === 'addi' && orderAddiElegible) || orderMetodoPago === 'sistecredito') && (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-800">
                      Al enviar el pedido te abriremos WhatsApp para que Baby World genere el enlace oficial de {orderMetodoPago === 'addi' ? 'Addi' : 'Sistecrédito'} para tu cliente.
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Productos ({orderTotalUnits} {orderTotalUnits === 1 ? 'ud.' : 'uds.'})</span>
                    <span className="font-semibold text-slate-800">{fmtPrice(orderSubtotalProducto)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Envío ({orderTipoCiudad === 'local' ? 'Domicilio local' : 'Nacional'})</span>
                    {orderTipoCiudad === 'local' ? (
                      <span className="font-semibold text-slate-800">
                        {orderEnvioEstimado === 0 ? (
                          <span className="text-emerald-700 font-bold">¡Gratis!</span>
                        ) : (
                          <>
                            {fmtPrice(orderEnvioEstimado)}{' '}
                            <span className="text-[10px] font-normal text-slate-500">(Gratis desde $150.000)</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-800">Flete al cobro (transportadora)</span>
                    )}
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-900 font-black text-sm">
                    <span>Total a cobrar al cliente</span>
                    <span>
                      {fmtPrice(orderTotalCliente)}
                      {orderTipoCiudad === 'nacional' ? ' + flete' : ''}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting || resolvedOrderItems.length === 0}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {orderSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PackageCheck size={17} />}
                  <span>Enviar Pedido a Baby World para Despacho</span>
                </button>
              </form>
            </div>
          ) : (
            /* TAB 3: MIS GANANCIAS */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-bold text-amber-600 uppercase">En camino (Pendiente)</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{fmtPrice(resumen?.pendiente || 0)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Se aprueba cuando el cliente recibe y paga.</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-xs">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Disponible para Pago</span>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{fmtPrice(resumen?.aprobada || 0)}</p>
                  <div className="mt-2">
                    <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{
                          width: `${Math.min(100, Math.round(((resumen?.aprobada || 0) / Math.max(1, resumen?.montoMinimoRetiro || 30000)) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                      {resumen?.puedeSolicitarPago
                        ? `¡Superaste el mínimo de ${fmtPrice(resumen.montoMinimoRetiro)}! Listo para liquidar.`
                        : `Mínimo de retiro: ${fmtPrice(resumen?.montoMinimoRetiro || 30000)}`}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-bold text-sky-600 uppercase">Total Pagado</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{fmtPrice(resumen?.pagada || 0)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{resumen?.ventasValidas || 0} ventas registradas</p>
                </div>
              </div>

              {resumen?.puedeSolicitarPago && (
                <div className="bg-emerald-600 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm">
                    <p className="font-black">¡Tienes {fmtPrice(resumen.aprobada)} listos para transferir a tu {aliado.medioPago}!</p>
                    <p className="text-emerald-100 text-xs">Cuenta registrada: {aliado.cuentaPago}</p>
                  </div>
                  <a
                    href={`https://wa.me/573136546975?text=${encodeURIComponent(`Hola Baby World! Soy ${aliado.nombre} (Código ${aliado.codigoReferido}). Ya superé el mínimo de retiro con ${fmtPrice(resumen.aprobada)} aprobados para pago a mi ${aliado.medioPago} (${aliado.cuentaPago}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-white text-emerald-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Solicitar Liquidación</span>
                  </a>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">Historial de Ventas y Comisiones</h3>
                  <button type="button" onClick={() => cargarPortal(token)} className="text-xs text-sky-600 font-bold flex items-center gap-1 cursor-pointer">
                    <RefreshCw size={13} /> Actualizar
                  </button>
                </div>
                {comisiones.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500">Aún no tienes ventas registradas. ¡Comparte tu primer juguete con el Kit IA!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Fecha / Pedido</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Venta</th>
                          <th className="px-4 py-3">Tu Ganancia</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comisiones.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 block">{c.pedidoNumero || `#${c.id}`}</span>
                              <span className="text-[10px] text-slate-400 block">{new Date(c.createdAt).toLocaleDateString('es-CO')}</span>
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                                {c.origen === 'PEDIDO_ALIADO' ? 'Pedido cargado' : 'Link referido'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <span className="font-semibold text-slate-800 block">{c.clienteNombre}</span>
                              {Array.isArray(c.detalleItems) && c.detalleItems.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                                  {c.detalleItems.map((d, i) => (
                                    <div key={i} className="truncate max-w-[220px]">
                                      • {d.cantidad}x {d.nombre}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold">{fmtPrice(c.montoVenta)}</td>
                            <td className="px-4 py-3 font-black text-emerald-700">{fmtPrice(c.valorComision)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${estadoBadge(c.estado)}`}>
                                {c.estado}
                              </span>
                              {c.comprobantePago && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">Ref: {c.comprobantePago}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL KIT DE VENTA IA */}
      {kitProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => {
              setKitProduct(null)
              setCompletedSteps({})
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <div className="relative bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-4 sm:p-6 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 flex items-center gap-1">
                  <Sparkles size={12} /> Kit de Venta Paso a Paso (IA)
                </span>
                <h3 className="font-black text-slate-900 text-base leading-snug mt-0.5">{kitProduct.nombre}</h3>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  Precio público: {fmtPrice(kitProduct.precioPublico)} • Tu ganancia: {fmtPrice(kitProduct.gananciaAliado)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setKitProduct(null)
                  setCompletedSteps({})
                }}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Facilidades de pago que puedes ofrecerle al cliente */}
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[10px] sm:text-[11px]">
              <span className="font-extrabold text-emerald-900 mr-0.5">Opciones de pago para tu cliente:</span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700 font-bold">
                {kitProduct.precioPublico >= 50000
                  ? `Addi 3 cuotas ${fmtPrice(Math.round(kitProduct.precioPublico / 3))} (0% int.)`
                  : 'Addi (desde $50.000)'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700 font-bold">
                Sistecrédito
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                Nequi / Bre-B
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                Contra entrega (Cali y alred.)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                Envíos Colombia
              </span>
            </div>

            {/* Selector de canal */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {([
                { id: 'whatsapp', label: 'WhatsApp / Estados' },
                { id: 'marketplace', label: 'FB Marketplace' },
                { id: 'instagram', label: 'Instagram / Reels' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => seleccionarCanalKit(tab.id)}
                  className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${kitEstilo === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {kitCopy ? (
              <div className="space-y-2.5">
                {/* Atajo móvil 1-clic en WhatsApp / Instagram */}
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && kitEstilo !== 'marketplace' && (
                  <button
                    type="button"
                    disabled={sharingKit}
                    onClick={compartirFotoYTextoNativo}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-sky-900 border border-sky-200 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
                  >
                    {sharingKit ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} className="text-sky-600" />}
                    <span>{sharingKit ? 'Preparando foto y texto...' : 'Modo rápido celular: Compartir Foto + Texto en 1 clic'}</span>
                  </button>
                )}

                {/* PASO 1: Abrir Red Social (cuando aplica) + Descargar Foto Limpia */}
                <div className={`p-3 rounded-2xl border transition-colors ${completedSteps.foto && (kitEstilo === 'whatsapp' || completedSteps.abrir) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${completedSteps.foto ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white'}`}>
                      {completedSteps.foto ? <Check size={13} /> : '1'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {kitEstilo === 'marketplace'
                              ? 'Abre Marketplace y descarga la foto (1:1)'
                              : kitEstilo === 'instagram'
                                ? 'Abre Instagram y descarga la foto (9:16)'
                                : 'Descarga la foto limpia (recomendada 9:16)'}
                          </p>
                          {kitEstilo !== 'whatsapp' && (
                            <p className="text-[11px] text-slate-500">
                              {kitEstilo === 'marketplace'
                                ? 'Abre primero Marketplace en otra pestaña para ir subiendo la foto y pegando cada campo.'
                                : 'Abre Instagram y ten la foto lista; pon el link en el sticker de Historias o en tu bio.'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFormatoImg('cuadrado')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${formatoImg === 'cuadrado' ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                          >
                            Cuadrada 1:1
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormatoImg('vertical')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${formatoImg === 'vertical' ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                          >
                            Estado 9:16
                          </button>
                        </div>
                      </div>

                      <div className={`grid gap-2 ${kitEstilo === 'whatsapp' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {kitEstilo === 'marketplace' && (
                          <button
                            type="button"
                            onClick={() => abrirEnRedSocial('marketplace', true)}
                            className="py-2 px-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ExternalLink size={14} />
                            <span>{completedSteps.abrir ? 'Marketplace abierto' : 'Abrir FB Marketplace'}</span>
                          </button>
                        )}
                        {kitEstilo === 'instagram' && (
                          <button
                            type="button"
                            onClick={() => abrirEnRedSocial('instagram', true)}
                            className="py-2 px-3 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:opacity-95 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ExternalLink size={14} />
                            <span>{completedSteps.abrir ? 'Instagram abierto' : 'Abrir Instagram'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => descargarFotoProducto(kitProduct)}
                          className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            completedSteps.foto
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                          }`}
                        >
                          {completedSteps.foto ? <Check size={14} /> : <Download size={14} />}
                          <span>{completedSteps.foto ? 'Foto descargada' : 'Descargar Foto JPG'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PASO 2 (solo Marketplace): Copiar Título y Precio */}
                {kitEstilo === 'marketplace' && (
                  <div className={`p-3 rounded-2xl border space-y-2 transition-colors ${completedSteps.titulo && completedSteps.precio ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${completedSteps.titulo && completedSteps.precio ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white'}`}>
                        {completedSteps.titulo && completedSteps.precio ? <Check size={13} /> : '2'}
                      </span>
                      <p className="text-xs font-extrabold text-slate-900">
                        Copia el Título y el Precio para tu publicación
                      </p>
                    </div>

                    <div className="pl-8 space-y-1.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Título sugerido</span>
                          <p className="text-xs font-bold text-slate-800 truncate">{kitCopy.titulo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            copiarTexto(kitCopy.titulo, 'kit-title', 'Título copiado')
                            markStepDone('titulo')
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1 ${
                            completedSteps.titulo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {completedSteps.titulo ? <Check size={12} /> : <Copy size={12} />}
                          <span>{completedSteps.titulo ? 'Copiado' : 'Copiar Título'}</span>
                        </button>
                      </div>

                      <div className="bg-white px-2.5 py-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Campo Precio:</span>
                          <span className="font-black text-slate-900">{Math.round(kitProduct.precioPublico)}</span>
                          <span className="text-[11px] text-slate-500 ml-1">({fmtPrice(kitProduct.precioPublico)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            copiarTexto(String(Math.round(kitProduct.precioPublico)), 'kit-price', 'Precio copiado sin puntos')
                            markStepDone('precio')
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1 ${
                            completedSteps.precio
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {completedSteps.precio ? <Check size={12} /> : <Copy size={12} />}
                          <span>{completedSteps.precio ? 'Copiado' : 'Copiar Precio'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2 (WA/IG) o PASO 3 (Marketplace): Texto / Caption + Link */}
                <div className={`p-3 rounded-2xl border space-y-2 transition-colors ${completedSteps.texto || (kitEstilo === 'whatsapp' && completedSteps.publicar) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${completedSteps.texto || (kitEstilo === 'whatsapp' && completedSteps.publicar) ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white'}`}>
                        {completedSteps.texto || (kitEstilo === 'whatsapp' && completedSteps.publicar) ? <Check size={13} /> : kitEstilo === 'marketplace' ? '3' : '2'}
                      </span>
                      <p className="text-xs font-extrabold text-slate-900">
                        {kitEstilo === 'marketplace'
                          ? 'Copia la Descripción + tu Link'
                          : kitEstilo === 'instagram'
                            ? 'Copia el Caption + Hashtags + tu Link'
                            : 'Envía por WhatsApp o copia para tu Estado'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={kitLoading}
                      onClick={() => {
                        copiarTexto(
                          kitCopy.texto,
                          'kit-full',
                          kitEstilo === 'instagram'
                            ? '¡Caption + hashtags + link copiados!'
                            : kitEstilo === 'whatsapp'
                              ? '¡Texto + link copiados para tu Estado!'
                              : '¡Descripción + tu link copiados!',
                        )
                        markStepDone('texto')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-60 ${
                        copiedId === 'kit-full' || completedSteps.texto
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {copiedId === 'kit-full' || completedSteps.texto ? <Check size={12} /> : <Copy size={12} />}
                      <span>{completedSteps.texto ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="pl-8 space-y-2">
                    <textarea
                      rows={5}
                      value={kitCopy.texto}
                      disabled={kitLoading}
                      onChange={(e) => setKitCopy({ ...kitCopy, texto: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-60"
                    />

                    {kitEstilo === 'whatsapp' && (
                      <button
                        type="button"
                        onClick={() => abrirEnRedSocial('whatsapp')}
                        className="w-full py-2.5 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span>Enviar por WhatsApp</span>
                      </button>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={kitLoading}
                        onClick={() => solicitarCopyIa(kitProduct, kitEstilo, kitCopy.esIa)}
                        className="text-[11px] font-medium text-slate-400 hover:text-sky-600 inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                      >
                        {kitLoading ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : kitCopy.esIa ? (
                          <RefreshCw size={11} />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        <span>
                          {kitLoading
                            ? 'Generando variación con IA...'
                            : kitCopy.esIa
                              ? '¿Otra opción? Generar nueva variación con IA'
                              : '¿Prefieres otra redacción? Probar variación con IA'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barra discreta para otras redes */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500">¿Publicas en otra red?</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {kitEstilo !== 'whatsapp' && (
                      <button
                        type="button"
                        onClick={() => abrirEnRedSocial('whatsapp')}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-bold text-slate-700 cursor-pointer transition-colors"
                      >
                        WhatsApp
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirEnRedSocial('facebook')}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-bold text-slate-700 cursor-pointer transition-colors"
                    >
                      Facebook (Muro/Grupos)
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEnRedSocial('telegram')}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 text-[10px] font-bold text-slate-700 cursor-pointer transition-colors"
                    >
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEnRedSocial('tiktok')}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 text-[10px] font-bold text-slate-700 cursor-pointer transition-colors"
                    >
                      TikTok
                    </button>
                    {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && kitEstilo === 'marketplace' && (
                      <button
                        type="button"
                        disabled={sharingKit}
                        onClick={compartirFotoYTextoNativo}
                        className="px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-[10px] font-bold text-sky-800 cursor-pointer transition-colors disabled:opacity-60"
                      >
                        Compartir Foto + Texto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

