import React, { useState, useEffect, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Shield, Truck, Store, Clock, Navigation, ArrowLeft, Layers } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { CategoriesSection } from './components/CategoriesSection'
import { MobileBottomNav } from './components/MobileBottomNav'
import { ProductCard } from './components/ProductCard'
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton'
import { FloatingSocialDock } from './components/FloatingSocialDock'
import { CartDrawer, type CartItem } from './components/CartDrawer'
import { BabyWorldLogo } from './components/BabyWorldLogo'
import { FeaturedCarousel } from './components/FeaturedCarousel'
import { QuickTrustBar } from './components/QuickTrustBar'
import { INSTAGRAM_URL, TIKTOK_URL } from './constants/social'
import { InstagramIcon } from './components/InstagramIcon'
import { TikTokIcon } from './components/TikTokIcon'
import { ProductSkeleton } from './components/ProductSkeleton'
import { WhatsAppIcon } from './components/WhatsAppIcon'
import { GoogleMapsIcon } from './components/GoogleMapsIcon'
import { LocationPinIcon } from './components/LocationPinIcon'
import { Product, ProductVariant, PRODUCTOS_BABY_WORLD } from './data/productos'
import { normalizarVideos } from './lib/videoEmbed'
import { analytics } from './lib/analytics'
import { toCategoryTitleCase, matchesCategoryName } from './lib/categoriaFormat'
import { ACTIVE_CAMPAIGN } from './constants/seasonalCampaign'
import { captureReferralFromUrl } from './lib/referral'

// Lazy-loaded heavy screens & modals to minimize initial bundle size and speed up first paint
const ProductDetailPage = React.lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const FamiliaRegistroPage = React.lazy(() => import('./components/FamiliaRegistroPage').then(m => ({ default: m.FamiliaRegistroPage })))
const AliadosPortalPage = React.lazy(() => import('./components/AliadosPortalPage').then(m => ({ default: m.AliadosPortalPage })))
const CheckoutModal = React.lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })))
const BnplInfoModal = React.lazy(() => import('./components/BnplInfoModal').then(m => ({ default: m.BnplInfoModal })))
const StoreLocationModal = React.lazy(() => import('./components/StoreLocationModal').then(m => ({ default: m.StoreLocationModal })))
const PromoAnnouncementModal = React.lazy(() => import('./components/PromoAnnouncementModal').then(m => ({ default: m.PromoAnnouncementModal })))
const CategoriesDrawerModal = React.lazy(() => import('./components/CategoriesDrawerModal').then(m => ({ default: m.CategoriesDrawerModal })))
const ShareProductModal = React.lazy(() => import('./components/ShareProductModal').then(m => ({ default: m.ShareProductModal })))

interface ErpCategory {
  id: number
  nombre: string
  slug: string
  parentId: number | null
  parent?: { id: number; nombre: string; slug: string } | null
  hijos?: { id: number; nombre: string; slug: string }[]
  _count?: { productos: number }
}

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api/v1'
    : 'https://api.edatia.com/api/v1'
)

const getStoreSlug = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (isLocal) return 'distribuidorababyworld'
  const host = window.location.hostname.replace('www.', '')
  if (host.endsWith('.edatia.com')) {
    return host.replace('.edatia.com', '')
  }
  if (host.includes('distribuidorababyworld')) {
    return 'distribuidorababyworld'
  }
  return 'distribuidorababyworld'
}

const STORE_SLUG = getStoreSlug()

export function App() {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [activeSubcategory, setActiveSubcategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullCatalogMode, setIsFullCatalogMode] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showFamiliaForm, setShowFamiliaForm] = useState<boolean>(() => {
    const p = window.location.pathname.replace(/\/+$/, '')
    return p === '/familia' || p === '/registro'
  })
  const [showAliadosPortal, setShowAliadosPortal] = useState<boolean>(() => {
    const p = window.location.pathname.replace(/\/+$/, '')
    return p === '/aliados' || p === '/vendedores'
  })
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isBnplModalOpen, setIsBnplModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false)
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false)
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null)

  // Mostrar modal de anuncio Black Friday al abrir la tienda (1 vez por sesión)
  useEffect(() => {
    captureReferralFromUrl()
    const cleanPath = window.location.pathname.replace(/\/+$/, '')
    const isDirectRoute = cleanPath === '/familia' || cleanPath === '/registro' || cleanPath === '/aliados' || cleanPath === '/vendedores' || window.location.search.includes('pago=')
    if (isDirectRoute) return

    const hasShown = sessionStorage.getItem('babyworld_promo_black_friday_shown')
    const forcePromo = new URLSearchParams(window.location.search).get('promo') === 'true'

    if (!hasShown || forcePromo) {
      const timer = setTimeout(() => {
        setIsPromoModalOpen(true)
        sessionStorage.setItem('babyworld_promo_black_friday_shown', 'true')
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [])

  const [products, setProducts] = useState<Product[]>([])
  const [erpCategories, setErpCategories] = useState<ErpCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Reset subcategory when switching main category
  useEffect(() => {
    setActiveSubcategory('Todos')
  }, [activeCategory])

  // Analítica: registra la visita (GA4 + contador propio)
  useEffect(() => {
    analytics.init(API_BASE, STORE_SLUG)
  }, [])

  // Analítica: producto visto al abrir su detalle
  useEffect(() => {
    if (selectedProduct) analytics.verProducto(selectedProduct.id, selectedProduct.nombre, selectedProduct.precio)
  }, [selectedProduct?.id])

  // Retorno desde Mercado Pago (?pago=exito|pendiente|fallido&pedido=PED-xxxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const estado = params.get('pago')
    if (!estado) return
    const pedido = (params.get('pedido') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 20)
    const ref = pedido ? ` #${pedido}` : ''
    if (estado === 'exito') {
      toast.success(`¡Pago recibido! Tu pedido${ref} está confirmado. Te contactaremos por WhatsApp para el envío.`, {
        duration: 8000, icon: '💳', style: { borderRadius: '1rem', background: '#047857', color: '#fff' }
      })
    } else if (estado === 'pendiente') {
      toast(`Tu pago del pedido${ref} está en proceso. Te avisaremos apenas Mercado Pago lo confirme.`, {
        duration: 8000, icon: '⏳'
      })
    } else if (estado === 'fallido') {
      toast.error(`El pago del pedido${ref} no se completó. Puedes intentarlo de nuevo o escribirnos por WhatsApp.`, {
        duration: 8000
      })
    }
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  // Deep linking: sincroniza ruta (/familia, /registro, /aliados, /producto/:slug) con la vista activa
  useEffect(() => {
    const syncFromUrl = () => {
      const cleanPath = window.location.pathname.replace(/\/+$/, '')
      if (cleanPath === '/aliados' || cleanPath === '/vendedores') {
        setShowAliadosPortal(true)
        setShowFamiliaForm(false)
        setSelectedProduct(null)
        document.title = 'Portal de Aliados | Distribuidora Baby World'
        return
      }
      setShowAliadosPortal(false)

      if (cleanPath === '/familia' || cleanPath === '/registro') {
        setShowFamiliaForm(true)
        setSelectedProduct(null)
        document.title = 'Familia Baby World | Regístrate y accede a beneficios'
        return
      }
      setShowFamiliaForm(false)

      if (!products.length) return

      const pathname = window.location.pathname
      const params = new URLSearchParams(window.location.search)
      const querySlug = params.get('producto') || params.get('p')

      let targetSlug = ''
      if (pathname.includes('/producto/')) {
        const parts = pathname.split('/producto/')
        if (parts[1]) {
          targetSlug = decodeURIComponent(parts[1].split('/')[0].split('?')[0].trim())
        }
      } else if (querySlug) {
        targetSlug = decodeURIComponent(querySlug.trim())
      }

      if (targetSlug) {
        const targetClean = targetSlug.toLowerCase()
        const found = products.find(p => {
          const pSlug = (p.slug || '').toLowerCase()
          const pNameSlug = (p.nombre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const pErpSlug = ((p as any).nombreErp || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const pId = p.id.toString()
          const pSku = (p.sku || '').toLowerCase()
          return pSlug === targetClean || pNameSlug === targetClean || pErpSlug === targetClean || pId === targetClean || pSku === targetClean
        })

        if (found) {
          setSelectedProduct(found)
          document.title = `${found.nombre} | Distribuidora Baby World`
        }
      } else {
        setSelectedProduct(null)
        document.title = 'Distribuidora Baby World | Tienda Virtual'
      }
    }

    syncFromUrl()

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [products])

  // Fetch backend catalog & categories from ERP
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/public/tiendas/${STORE_SLUG}/productos`, { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error('Falló al consultar backend de productos')
          return r.json()
        })
        .catch(() => []),
      fetch(`${API_BASE}/public/tiendas/${STORE_SLUG}/categorias`, { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error('Falló al consultar backend de categorías')
          return r.json()
        })
        .catch(() => [])
    ])
      .then(([data, categoriasData]) => {
        if (Array.isArray(categoriasData) && categoriasData.length > 0) {
          setErpCategories(categoriasData)
        }
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => {
            let rawCat = 'Otros'
            let rawSubcat = ''

            if (p.categoria) {
              if (p.categoria.parent) {
                rawCat = p.categoria.parent.nombre
                rawSubcat = p.categoria.nombre
              } else {
                rawCat = p.categoria.nombre
                rawSubcat = ''
              }
            }

            const cat = toCategoryTitleCase(rawCat)
            const subcat = rawSubcat ? toCategoryTitleCase(rawSubcat) : ''

            const precioSubtotal = p.precioSubtotal !== undefined
              ? Number(p.precioSubtotal)
              : Math.round(Number(p.precioWeb || 0) > 0 ? Number(p.precioWeb) : Number(p.precioBase || 0))
            const ivaPct = p.ivaPct !== undefined ? Number(p.ivaPct) : 0
            const impuesto = p.impuesto !== undefined
              ? Number(p.impuesto)
              : Math.round(precioSubtotal * (ivaPct / 100))
            const precioTotal = p.precioTotal !== undefined
              ? Number(p.precioTotal)
              : precioSubtotal + impuesto

            const stockReal = p.stockDisponible !== undefined
              ? Number(p.stockDisponible)
              : Array.isArray(p.stock)
                ? p.stock.reduce((sum: number, s: any) => sum + Math.max(0, Number(s?.cantidad || 0) - Number(s?.cantidadReservada || 0)), 0)
                : Number(p.stock || 0)

            const imagenesMapeadas = Array.isArray(p.metadataWeb?.imagenes) && p.metadataWeb.imagenes.length > 0
              ? p.metadataWeb.imagenes
              : p.imagen ? [p.imagen] : ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700']

            const marcaNombre = typeof p.marca === 'object' ? p.marca?.nombre : (p.marca || p.metadataWeb?.marca)

            const nombreFinal = p.metadataWeb?.nombreWeb || p.nombreWeb || p.nombre

            return {
              id: p.id,
              sku: p.sku,
              referencia: p.referencia || undefined,
              marca: marcaNombre || undefined,
              slug: p.slug,
              nombre: nombreFinal,
              nombreErp: p.nombre,
              descripcion: p.descripcion || 'Producto de alta calidad para bebés.',
              descripcionLarga: p.descripcionWeb || p.descripcion || '',
              precio: precioTotal,
              precioSubtotal,
              impuesto,
              ivaPct,
              tipoIva: p.tipoIvaEfectivo || p.tipoIva,
              precioBase: Number(p.precioBase || 0),
              recargoPct: p.recargoPct !== undefined ? Number(p.recargoPct) : undefined,
              descuentoPct: p.descuentoPct !== undefined ? Number(p.descuentoPct) : undefined,
              precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : undefined,
              categoria: cat,
              subcategoria: subcat,
              genero: p.metadataWeb?.genero || 'Unisex',
              imagen: imagenesMapeadas[0],
              imagenes: imagenesMapeadas,
              videos: (() => {
                const raw = p.metadataWeb?.videos || p.videos || []
                return normalizarVideos(raw)
              })(),
              rating: p.esDestacado ? 5.0 : 4.8,
              reviewsCount: 25 + (p.id * 3),
              stock: stockReal,
              tieneVariantes: Boolean(p.tieneVariantes || (p.variantes && p.variantes.length > 0)),
              variantes: Array.isArray(p.variantes) ? p.variantes : [],
              esDestacado: !!p.esDestacado,
              detalles: Array.isArray(p.metadataWeb?.detalles) && p.metadataWeb.detalles.length > 0
                ? p.metadataWeb.detalles
                : [
                  "100% Calidad y seguridad comprobada",
                  "Hipoalergénico y recomendado para bebés",
                  "Despacho y entrega rápida garantizada"
                ],
              especificaciones: {
                ...(marcaNombre ? { 'Marca': marcaNombre } : {}),
                ...(p.metadataWeb?.tallas ? { 'Tallas': Array.isArray(p.metadataWeb.tallas) ? p.metadataWeb.tallas.join(', ') : p.metadataWeb.tallas } : {}),
                ...(p.metadataWeb?.tipoCierre ? { 'Tipo de Cierre': p.metadataWeb.tipoCierre } : {}),
                ...(p.metadataWeb?.material ? { 'Material': p.metadataWeb.material } : {}),
                ...(p.referencia ? { 'Referencia': p.referencia } : {}),
                ...(p.sku ? { 'SKU': p.sku } : {})
              }
            }
          }).sort((a: Product, b: Product) => {
            if (a.stock > 0 && b.stock <= 0) return -1
            if (a.stock <= 0 && b.stock > 0) return 1
            return 0
          })
          setProducts(mapped)
        } else {
          setProducts([])
        }
      })
      .catch(err => {
        console.error('Error cargando catálogo desde el backend:', err.message)
        if (PRODUCTOS_BABY_WORLD.length > 0) {
          setProducts(PRODUCTOS_BABY_WORLD)
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Filter products by category, subcategory and search query (conectado 100% al ERP)
  const filteredProducts = products.filter(p => {
    const isCampaignFilter = ACTIVE_CAMPAIGN.active && (
      matchesCategoryName(activeCategory, ACTIVE_CAMPAIGN.categoryName) ||
      activeCategory.toLowerCase().includes(ACTIVE_CAMPAIGN.id) ||
      activeCategory.toLowerCase().includes('black')
    )
    const matchesCategory = isCampaignFilter
      ? ACTIVE_CAMPAIGN.isCampaignProduct(p)
      : activeCategory === 'Todos' || matchesCategoryName(p.categoria, activeCategory)

    const matchesSubcategory = activeSubcategory === 'Todos' ||
      (p.subcategoria && matchesCategoryName(p.subcategoria, activeSubcategory))

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = q === '' ||
      p.nombre.toLowerCase().includes(q) ||
      Boolean((p as any).nombreErp && (p as any).nombreErp.toLowerCase().includes(q)) ||
      p.descripcion.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.subcategoria && p.subcategoria.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.referencia && p.referencia.toLowerCase().includes(q)) ||
      (p.marca && p.marca.toLowerCase().includes(q))
    return matchesCategory && matchesSubcategory && matchesSearch
  })

  const handleAddToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    // Si el producto maneja variantes y se llamó sin variante (ej: click directo en card del catálogo),
    // abrir el detalle para que el cliente seleccione su color / talla preferida:
    if (!selectedVariant && product.tieneVariantes && Array.isArray(product.variantes) && product.variantes.length > 0) {
      handleOpenProduct(product)
      return
    }

    const effectiveStock = selectedVariant ? selectedVariant.stockDisponible : product.stock
    const varLabel = selectedVariant ? ` [${selectedVariant.nombre}]` : ''

    if (effectiveStock <= 0) {
      toast.error(`"${product.nombre}${varLabel}" se encuentra agotado en inventario.`)
      return
    }

    const existingItem = cart.find(item => item.product.id === product.id && item.variante?.id === selectedVariant?.id)
    const currentQty = existingItem ? existingItem.quantity : 0
    if (currentQty >= effectiveStock) {
      toast.error(`Solo hay ${effectiveStock} unidad(es) disponible(s) de "${product.nombre}${varLabel}".`)
      return
    }
    const allowedAdd = Math.min(quantity, effectiveStock - currentQty)

    analytics.agregarCarrito(product.id, `${product.nombre}${varLabel}`, product.precio, allowedAdd)
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variante?.id === selectedVariant?.id)
      if (existing) {
        const nextQty = Math.min(effectiveStock, existing.quantity + allowedAdd)
        if (nextQty < existing.quantity + quantity) {
          toast(`Ajustado al stock disponible (${effectiveStock} und)`, { icon: '📦' })
        } else {
          toast.success(`Aumentaste ${allowedAdd}x "${product.nombre}${varLabel}"`, {
            icon: '🍼',
            style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
          })
        }
        return prev.map(item =>
          (item.product.id === product.id && item.variante?.id === selectedVariant?.id)
            ? { ...item, product, quantity: nextQty }
            : item
        )
      }
      toast.success(`Agregado a la bolsa: ${product.nombre}${varLabel}`, {
        icon: '🛍️',
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      })
      return [...prev, { product, quantity: allowedAdd, variante: selectedVariant }]
    })
  }

  const handleBuyNow = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    handleAddToCart(product, quantity, selectedVariant)
    setIsCheckoutOpen(true)
  }

  const handleUpdateQuantity = (productId: number, q: number, varianteId?: number) => {
    if (q <= 0) {
      handleRemoveItem(productId, varianteId)
      return
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== productId || item.variante?.id !== varianteId) return item
        const maxStock = item.variante ? item.variante.stockDisponible : item.product.stock
        if (q > maxStock) {
          toast.error(`Solo hay ${maxStock} unidad(es) disponible(s) en inventario.`)
          return { ...item, quantity: maxStock }
        }
        return { ...item, quantity: q }
      })
    )
  }

  const handleRemoveItem = (productId: number, varianteId?: number) => {
    const item = cart.find(i => i.product.id === productId && i.variante?.id === varianteId)
    setCart(prev => prev.filter(i => !(i.product.id === productId && i.variante?.id === varianteId)))
    if (item) {
      const varSuffix = item.variante ? ` [${item.variante.nombre}]` : ''
      toast.error(`Eliminado: ${item.product.nombre}${varSuffix}`, {
        style: { borderRadius: '1rem' }
      })
    }
  }

  const handleCheckoutSuccess = () => {
    analytics.compra(cart.reduce((sum, item) => sum + item.product.precio * item.quantity, 0))
    setCart([])
    toast.success('¡Pedido procesado con éxito en Baby-World!', {
      duration: 5000,
      icon: '🎉',
      style: { borderRadius: '1rem', background: '#047857', color: '#fff' }
    })
  }

  const handleOpenProduct = (product: Product) => {
    setShowFamiliaForm(false)
    setShowAliadosPortal(false)
    setSelectedProduct(product)
    const productSlug = product.slug || product.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || product.id
    if (window.location.pathname !== `/producto/${productSlug}`) {
      window.history.pushState({ productId: product.id }, '', `/producto/${productSlug}`)
    }
    document.title = `${product.nombre} | Distribuidora Baby World`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseProduct = () => {
    setSelectedProduct(null)
    if (window.location.pathname.includes('/producto/')) {
      window.history.pushState({}, '', '/')
    }
    document.title = 'Distribuidora Baby World | Tienda Virtual'
  }

  const handleCloseAliadosPortal = () => {
    setShowAliadosPortal(false)
    if (window.location.pathname === '/aliados' || window.location.pathname === '/vendedores') {
      window.history.pushState({}, '', '/')
    }
    document.title = 'Distribuidora Baby World | Tienda Virtual'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenFamiliaRegistro = () => {
    setSelectedProduct(null)
    setShowAliadosPortal(false)
    setShowFamiliaForm(true)
    if (window.location.pathname !== '/familia') {
      window.history.pushState({ view: 'familia' }, '', '/familia')
    }
    document.title = 'Familia Baby World | Regístrate y accede a beneficios'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseFamiliaRegistro = () => {
    setShowFamiliaForm(false)
    if (window.location.pathname === '/familia' || window.location.pathname === '/registro') {
      window.history.pushState({}, '', '/')
    }
    document.title = 'Distribuidora Baby World | Tienda Virtual'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (qVal: string) => {
    setSearchQuery(qVal)
    if (qVal && (showFamiliaForm || showAliadosPortal || selectedProduct)) {
      setShowFamiliaForm(false)
      setShowAliadosPortal(false)
      setSelectedProduct(null)
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/')
      }
      document.title = 'Distribuidora Baby World | Tienda Virtual'
    }
  }

  const handleCategorySelect = (category: string) => {
    handleCloseProduct()
    if (showFamiliaForm || showAliadosPortal) {
      setShowFamiliaForm(false)
      setShowAliadosPortal(false)
      if (['/familia', '/registro', '/aliados', '/vendedores'].includes(window.location.pathname)) {
        window.history.pushState({}, '', '/')
      }
      document.title = 'Distribuidora Baby World | Tienda Virtual'
    }
    setIsFullCatalogMode(false)
    const matched = availableCategories.find(c => matchesCategoryName(c, category)) || category
    setActiveCategory(matched)
    setActiveSubcategory('Todos')
    const el = document.getElementById('catalogo-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectAllCatalog = () => {
    handleCloseProduct()
    if (showFamiliaForm || showAliadosPortal) {
      setShowFamiliaForm(false)
      setShowAliadosPortal(false)
      if (['/familia', '/registro', '/aliados', '/vendedores'].includes(window.location.pathname)) {
        window.history.pushState({}, '', '/')
      }
      document.title = 'Distribuidora Baby World | Tienda Virtual'
    }
    setActiveCategory('Todos')
    setActiveSubcategory('Todos')
    setSearchQuery('')
    setIsFullCatalogMode(true)
    const el = document.getElementById('catalogo-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePromoAction = () => {
    setIsPromoModalOpen(false)
    handleCategorySelect(ACTIVE_CAMPAIGN.categoryName)
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>()

    // 1. Cargar las categorías principales directamente del ERP
    if (erpCategories.length > 0) {
      erpCategories
        .filter(c => !c.parentId)
        .forEach(c => {
          categorySet.add(toCategoryTitleCase(c.nombre))
        })
    }

    // 2. Agregar las categorías de los productos reales para garantizar que ningún producto quede huérfano
    for (const p of products) {
      if (p.categoria) {
        categorySet.add(p.categoria)
      }
    }

    // Ordenar alfabéticamente en español, dejando 'Otros' siempre al final si existe
    const sorted = Array.from(categorySet).sort((a, b) => {
      if (a === 'Otros') return 1
      if (b === 'Otros') return -1
      return a.localeCompare(b, 'es')
    })
    const campaignPill = ACTIVE_CAMPAIGN.active ? [ACTIVE_CAMPAIGN.categoryName] : []
    return ['Todos', ...campaignPill, ...sorted]
  }, [erpCategories, products])

  const availableSubcategories = useMemo(() => {
    if (activeCategory === 'Todos') return []
    const subs = new Set<string>()

    // Subcategorías desde el ERP para la categoría activa
    if (erpCategories.length > 0) {
      const activeParent = erpCategories.find(c =>
        !c.parentId && matchesCategoryName(toCategoryTitleCase(c.nombre), activeCategory)
      )
      if (activeParent && Array.isArray(activeParent.hijos)) {
        activeParent.hijos.forEach(h => {
          subs.add(toCategoryTitleCase(h.nombre))
        })
      }
    }

    // Subcategorías de los productos que pertenecen a la categoría activa
    for (const p of products) {
      if (matchesCategoryName(p.categoria, activeCategory) && p.subcategoria && p.subcategoria.trim()) {
        subs.add(p.subcategoria.trim())
      }
    }

    if (subs.size === 0) return []
    return ['Todos', ...Array.from(subs).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [erpCategories, products, activeCategory])

  useEffect(() => {
    if (activeCategory !== 'Todos' && availableCategories.length > 1 && !availableCategories.includes(activeCategory)) {
      setActiveCategory('Todos')
    }
  }, [availableCategories, activeCategory])

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-sky-200 ${!selectedProduct && !showFamiliaForm ? 'pb-20 md:pb-0' : ''}`}>
      {/* Toast notifications */}
      <Toaster position="bottom-right" toastOptions={{ className: 'text-xs font-bold' }} />

      {/* Navigation Bar */}
      <Navbar
        cartCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        setActiveCategory={handleCategorySelect}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        categories={availableCategories}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onPromoClick={handlePromoAction}
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
      />

      {/* Dedicated screens: Aliados Portal / Familia Baby World Form / Product Detail / Catalog */}
      <React.Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>}>
        {showAliadosPortal ? (
          <AliadosPortalPage
            onBack={handleCloseAliadosPortal}
            API_BASE={API_BASE}
            storeSlug={STORE_SLUG}
          />
        ) : showFamiliaForm ? (
          <FamiliaRegistroPage
            onBack={handleCloseFamiliaRegistro}
            API_BASE={API_BASE}
            storeSlug={STORE_SLUG}
          />
        ) : selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            onBack={handleCloseProduct}
            onSelectProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenLocation={() => setIsLocationModalOpen(true)}
            onBuyNow={handleBuyNow}
          />
        ) : (
        <>
          {/* VISTA DE INICIO (Home): Banners + Lo Más Recomendado + Sección de Categorías */}
          {activeCategory === 'Todos' && !searchQuery && !isFullCatalogMode ? (
            <>
              {/* 1. Banners Principales */}
              <HeroBanner
                onOpenFamiliaRegistro={handleOpenFamiliaRegistro}
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onOpenBnplInfo={() => setIsBnplModalOpen(true)}
                onSelectCategory={handleCategorySelect}
              />
              <QuickTrustBar
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onOpenBnplInfo={() => setIsBnplModalOpen(true)}
              />

              {/* 2. Sección "Lo Más Recomendado" (Exclusivamente productos destacados del ERP) */}
              <FeaturedCarousel 
                products={products} 
                onAddToCart={handleAddToCart} 
                onViewDetails={handleOpenProduct} 
                onShare={setSharingProduct}
              />

              {/* 3. Sección "Explora por Categorías" (Vitrina para que el usuario navegue a lo que necesita) */}
              <CategoriesSection
                categories={availableCategories}
                erpCategories={erpCategories}
                products={products}
                onSelectCategory={(category, subcategory) => {
                  setIsFullCatalogMode(false)
                  handleCategorySelect(category)
                  if (subcategory) {
                    setActiveSubcategory(subcategory)
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onSelectAllCatalog={handleSelectAllCatalog}
              />
            </>
          ) : (
            /* VISTA DE CATÁLOGO POR CATEGORÍA O RESULTADOS DE BÚSQUEDA */
            <div className="bg-white min-h-[60vh] flex-1 relative z-30 animate-fade-in-up">
              <main id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full relative z-20">
                {/* Header de navegación y título de categoría */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    {/* Botón Volver a Categorías */}
                    <button
                      onClick={() => {
                        setIsFullCatalogMode(false)
                        setActiveCategory('Todos')
                        setSearchQuery('')
                        setActiveSubcategory('Todos')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-xs font-bold transition-all group active:scale-95"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                      <span>Volver al Inicio / Categorías</span>
                    </button>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-600">
                        {searchQuery ? 'Búsqueda' : 'Categoría'}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {searchQuery
                        ? `Resultados para "${searchQuery}"`
                        : isFullCatalogMode || activeCategory === 'Todos'
                          ? '✨ Todo el Catálogo de Baby World'
                          : ACTIVE_CAMPAIGN.active && (activeCategory.toLowerCase().includes('black') || activeCategory.toLowerCase().includes(ACTIVE_CAMPAIGN.id))
                            ? ACTIVE_CAMPAIGN.title
                            : activeCategory}
                    </h2>
                  </div>

                  {/* Selector rápido para saltar a otra categoría */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold hidden md:inline">Cambiar sección:</span>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 transition-all active:scale-95 shadow-2xs group cursor-pointer"
                      title="Abrir menú de todas las categorías"
                    >
                      <Layers size={14} className="text-sky-600 group-hover:scale-110 transition-transform" />
                      <span className="max-w-[140px] sm:max-w-none truncate">
                        {isFullCatalogMode || activeCategory === 'Todos'
                          ? '✨ Todo el Catálogo'
                          : activeCategory}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-sky-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md ml-0.5 font-semibold">
                        Cambiar
                      </span>
                    </button>
                  </div>
                </div>

                {/* Subcategories Filter Pills (Dinámico desde las subcategorías reales del ERP) */}
                {availableSubcategories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 mb-6 no-scrollbar">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                      Subcategorías:
                    </span>
                    {availableSubcategories.map((sub) => {
                      const isSelected = activeSubcategory === sub
                      return (
                        <button
                          key={sub}
                          onClick={() => setActiveSubcategory(sub)}
                          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-bold'
                              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {sub}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Product Grid (2 cols mobile, 3 tablet, 4-5 laptop, 5-6 desktop) */}
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                    {[...Array(10)].map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-4 max-w-md mx-auto my-8 animate-fade-in-up">
                    <div className="text-4xl">🍼</div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">No encontramos productos en esta sección</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Prueba seleccionando otra subcategoría o regresa a explorar nuestras categorías.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCategory('Todos')
                        setSearchQuery('')
                        setActiveSubcategory('Todos')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Volver a Categorías
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                    {filteredProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onViewDetails={handleOpenProduct}
                        onShare={setSharingProduct}
                        priority={idx < 6}
                      />
                    ))}
                  </div>
                )}
              </main>
            </div>
          )}
        </>
      )}
      </React.Suspense>

      {/* Clean Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100">
            {/* Brand */}
            <div className="space-y-3">
              <BabyWorldLogo />
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                <b>Baby-World</b>: Distribuidora líder de pañales, juguetes de estimulación y variedades para consentir y cuidar el crecimiento de tu bebé.
              </p>
              {/* Redes Sociales Oficiales */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-300 text-slate-700 hover:text-pink-600 rounded-xl text-xs font-bold transition-all shadow-2xs group active:scale-95"
                  title="Visita nuestro perfil de Instagram @distribuidorababyworld"
                >
                  <InstagramIcon size={14} className="group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-2xs group active:scale-95"
                  title="Síguenos en TikTok @baby.world426"
                >
                  <TikTokIcon size={14} className="text-slate-900 group-hover:scale-110 transition-transform" />
                  <span>TikTok</span>
                </a>
              </div>
            </div>

            {/* Quick Categories (Dinámico desde el ERP) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Categorías Principales
                </p>
                <button
                  type="button"
                  onClick={() => setIsCategoriesModalOpen(true)}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Ver todas →
                </button>
              </div>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                {availableCategories.filter(c => c !== 'Todos').slice(0, 6).map(cat => (
                  <li key={cat}>
                    <button onClick={() => handleCategorySelect(cat)} className="hover:text-sky-600 transition-colors text-left">
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & WhatsApp & Physical Store */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Store size={14} className="text-sky-600" />
                <span>Tienda Física & Atención</span>
              </p>
              
              {/* Tarjeta interactiva de tienda física */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-xl bg-rose-50 border border-rose-100/80 shrink-0 mt-0.5 flex items-center justify-center">
                    <LocationPinIcon size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Atención Presencial</span>
                    </div>
                    <p className="font-extrabold text-slate-900 leading-snug">Calle 21 # Cra 35 Oeste • Mz 4 Casa 26</p>
                    <p className="text-slate-500 text-[11px]">Poblado Campestre • Cali / Candelaria</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                  <Clock size={12} className="text-slate-400 shrink-0" />
                  <span>Lun-Sáb: 9am-1pm / 4-8:30pm • Dom: 9am-5pm</span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex-1 py-2 px-2.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <Navigation size={13} className="text-sky-600" />
                    <span>Ver Mapa y Horarios</span>
                  </button>
                  <a
                    href="https://maps.app.goo.gl/yY63rsTFhMYcwv3k6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 shrink-0"
                    title="Abrir directamente en Google Maps"
                  >
                    <GoogleMapsIcon size={14} />
                    <span>Maps</span>
                  </a>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-500 pt-1">
                <a
                  href="https://wa.me/573136546975?text=Hola%20Baby-World,%20deseo%20hacer%20un%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <WhatsAppIcon size={16} />
                  <span>+57 313 654 6975 (WhatsApp Directo)</span>
                </a>
                <p className="flex items-center gap-2">
                  <Truck size={14} className="text-slate-400" />
                  <span>Pago Contra Entrega disponible</span>
                </p>
              </div>
            </div>
          </div>

          {/* Medios de Pago y Financiación */}
          <div className="py-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Medios de Pago y Financiación:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 font-extrabold px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <img src="/logo-addi.webp" alt="Addi" className="w-4 h-4 rounded-full object-contain" />
                <span>Addi (3 cuotas 0% interés)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 font-extrabold px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <img src="/logo-sistecredito.webp" alt="Sistecrédito" className="h-3 max-w-[65px] object-contain" />
                <span>(Quincenas)</span>
              </span>
              <span className="bg-sky-50 text-sky-700 font-bold px-2 py-1 rounded-lg border border-sky-100">
                Bre-B / Transferencia
              </span>
              <span className="bg-white text-slate-800 font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                💳 Tarjetas Débito & Crédito
              </span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg">
                Contra Entrega
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} <b>Baby-World</b>. Todos los derechos reservados. Tienda Virtual por <b>Edatia</b>.
            </p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Compra Segura</span>
              <span>🇨🇴 Envíos a toda Colombia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Social Media Dock (Visible todo el tiempo en Desktop/Tablet) */}
      <FloatingSocialDock />

      {/* Floating WhatsApp Button (Oculto en la vista de formulario o portal aliados para no estorbar en móvil) */}
      {!showFamiliaForm && !showAliadosPortal && <FloatingWhatsAppButton phone="573136546975" />}

      {/* Sticky Mobile Bottom Navigation (Only visible on smartphones in catalog view) */}
      {!selectedProduct && !showFamiliaForm && !showAliadosPortal && (
        <MobileBottomNav
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
          onOpenCategoriesModal={() => setIsCategoriesModalOpen(true)}
          quickCategories={availableCategories.filter(c => c !== 'Todos')}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWhatsApp={() => window.open('https://wa.me/573136546975?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20sobre%20un%20producto', '_blank')}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          analytics.iniciarCheckout(cart.reduce((sum, item) => sum + item.product.precio * item.quantity, 0))
          setIsCartOpen(false)
          setIsCheckoutOpen(true)
        }}
      />

      <React.Suspense fallback={null}>
        {/* Checkout Modal (Carga bajo demanda al abrir checkout) */}
        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cart}
            onSuccess={handleCheckoutSuccess}
            API_BASE={API_BASE}
            storeSlug={STORE_SLUG}
          />
        )}

        {/* Modal Informativo BNPL (Addi & Sistecrédito) */}
        {isBnplModalOpen && (
          <BnplInfoModal
            isOpen={isBnplModalOpen}
            onClose={() => setIsBnplModalOpen(false)}
          />
        )}

        {/* Modal de Ubicación de Tienda Física */}
        {isLocationModalOpen && (
          <StoreLocationModal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
          />
        )}

        {/* Modal Anuncio Promocional (Black Friday Juguetería) */}
        {isPromoModalOpen && (
          <PromoAnnouncementModal
            isOpen={isPromoModalOpen}
            onClose={() => setIsPromoModalOpen(false)}
            onAction={handlePromoAction}
          />
        )}

        {/* Modal / Drawer Maestro de Categorías & Departamentos */}
        {isCategoriesModalOpen && (
          <CategoriesDrawerModal
            isOpen={isCategoriesModalOpen}
            onClose={() => setIsCategoriesModalOpen(false)}
            categories={availableCategories}
            erpCategories={erpCategories}
            products={products}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            onSelectCategory={(category, subcategory) => {
              setIsFullCatalogMode(false)
              handleCategorySelect(category)
              if (subcategory) {
                setActiveSubcategory(subcategory)
              }
            }}
            onSelectAllCatalog={handleSelectAllCatalog}
          />
        )}

        {/* Modal para Compartir Producto en Redes Sociales */}
        {sharingProduct && (
          <ShareProductModal
            product={sharingProduct}
            isOpen={Boolean(sharingProduct)}
            onClose={() => setSharingProduct(null)}
          />
        )}
      </React.Suspense>
    </div>
  )
}

