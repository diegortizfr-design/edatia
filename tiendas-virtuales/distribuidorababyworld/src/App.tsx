import React, { useState, useEffect, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Shield, Truck, Store, Clock, Navigation } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { MobileBottomNav } from './components/MobileBottomNav'
import { ProductCard } from './components/ProductCard'
import { ProductDetailPage } from './components/ProductDetailPage'
import { FamiliaRegistroPage } from './components/FamiliaRegistroPage'
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton'
import { CartDrawer, CartItem } from './components/CartDrawer'
import { CheckoutModal } from './components/CheckoutModal'
import { BabyWorldLogo } from './components/BabyWorldLogo'
import { FeaturedCarousel } from './components/FeaturedCarousel'
import { ProductSkeleton } from './components/ProductSkeleton'
import { BnplInfoModal } from './components/BnplInfoModal'
import { StoreLocationModal } from './components/StoreLocationModal'
import { WhatsAppIcon } from './components/WhatsAppIcon'
import { GoogleMapsIcon } from './components/GoogleMapsIcon'
import { LocationPinIcon } from './components/LocationPinIcon'
import { Product, PRODUCTOS_BABY_WORLD } from './data/productos'
import { analytics } from './lib/analytics'

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api/v1'
  : 'https://api.edatia.com/api/v1'

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
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showFamiliaForm, setShowFamiliaForm] = useState<boolean>(() => {
    const p = window.location.pathname.replace(/\/+$/, '')
    return p === '/familia' || p === '/registro'
  })
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isBnplModalOpen, setIsBnplModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
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

  // Deep linking: sincroniza ruta (/familia, /registro, /producto/:slug) con la vista activa
  useEffect(() => {
    const syncFromUrl = () => {
      const cleanPath = window.location.pathname.replace(/\/+$/, '')
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
          const pNameSlug = p.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const pId = p.id.toString()
          const pSku = (p.sku || '').toLowerCase()
          return pSlug === targetClean || pNameSlug === targetClean || pId === targetClean || pSku === targetClean
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

  // Fetch backend catalog if available, fallback to rich local Baby-World catalog
  useEffect(() => {
    fetch(`${API_BASE}/public/tiendas/${STORE_SLUG}/productos`)
      .then(r => {
        if (!r.ok) throw new Error('Falló al consultar backend')
        return r.json()
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => {
            let cat = 'Otros'
            let subcat = ''

            if (p.categoria) {
              if (p.categoria.parent) {
                cat = p.categoria.parent.nombre
                subcat = p.categoria.nombre
              } else {
                cat = p.categoria.nombre
                subcat = ''
              }
            }

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

            return {
              id: p.id,
              sku: p.sku,
              referencia: p.referencia || undefined,
              marca: marcaNombre || undefined,
              slug: p.slug,
              nombre: p.nombre,
              descripcion: p.descripcion || 'Producto de alta calidad para bebés.',
              descripcionLarga: p.descripcionWeb || p.descripcion || '',
              precio: precioTotal,
              precioSubtotal,
              impuesto,
              ivaPct,
              tipoIva: p.tipoIvaEfectivo || p.tipoIva,
              precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : undefined,
              categoria: cat,
              subcategoria: subcat,
              genero: p.metadataWeb?.genero || 'Unisex',
              imagen: imagenesMapeadas[0],
              imagenes: imagenesMapeadas,
              rating: p.esDestacado ? 5.0 : 4.8,
              reviewsCount: 25 + (p.id * 3),
              stock: stockReal,
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
          }).filter((p: Product) => p.stock > 0)
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
    const matchesCategory = activeCategory === 'Todos' || p.categoria === activeCategory

    const matchesSubcategory = activeSubcategory === 'Todos' ||
      (p.subcategoria && p.subcategoria.toLowerCase() === activeSubcategory.toLowerCase())

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = q === '' ||
      p.nombre.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.subcategoria && p.subcategoria.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.referencia && p.referencia.toLowerCase().includes(q)) ||
      (p.marca && p.marca.toLowerCase().includes(q))
    return matchesCategory && matchesSubcategory && matchesSearch
  })

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error(`"${product.nombre}" se encuentra agotado en inventario.`)
      return
    }
    const existingItem = cart.find(item => item.product.id === product.id)
    const currentQty = existingItem ? existingItem.quantity : 0
    if (currentQty >= product.stock) {
      toast.error(`Solo hay ${product.stock} unidad(es) disponible(s) de "${product.nombre}".`)
      return
    }
    const allowedAdd = Math.min(quantity, product.stock - currentQty)

    analytics.agregarCarrito(product.id, product.nombre, product.precio, allowedAdd)
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + allowedAdd)
        if (nextQty < existing.quantity + quantity) {
          toast(`Ajustado al stock disponible (${product.stock} und)`, { icon: '📦' })
        } else {
          toast.success(`Aumentaste ${allowedAdd}x "${product.nombre}"`, {
            icon: '🍼',
            style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
          })
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, product, quantity: nextQty }
            : item
        )
      }
      toast.success(`Agregado a la bolsa: ${product.nombre}`, {
        icon: '🛍️',
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      })
      return [...prev, { product, quantity: allowedAdd }]
    })
  }

  const handleUpdateQuantity = (productId: number, q: number) => {
    if (q <= 0) {
      handleRemoveItem(productId)
      return
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item
        const maxStock = item.product.stock
        if (q > maxStock) {
          toast.error(`Solo hay ${maxStock} unidad(es) disponible(s) en inventario.`)
          return { ...item, quantity: maxStock }
        }
        return { ...item, quantity: q }
      })
    )
  }

  const handleRemoveItem = (productId: number) => {
    const item = cart.find(i => i.product.id === productId)
    setCart(prev => prev.filter(i => i.product.id !== productId))
    if (item) {
      toast.error(`Eliminado: ${item.product.nombre}`, {
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

  const handleOpenFamiliaRegistro = () => {
    setSelectedProduct(null)
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
    if (qVal && (showFamiliaForm || selectedProduct)) {
      setShowFamiliaForm(false)
      setSelectedProduct(null)
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/')
      }
      document.title = 'Distribuidora Baby World | Tienda Virtual'
    }
  }

  const handleCategorySelect = (category: string) => {
    handleCloseProduct()
    if (showFamiliaForm) {
      setShowFamiliaForm(false)
      if (window.location.pathname === '/familia' || window.location.pathname === '/registro') {
        window.history.pushState({}, '', '/')
      }
      document.title = 'Distribuidora Baby World | Tienda Virtual'
    }
    setActiveCategory(category)
    setActiveSubcategory('Todos')
    const el = document.getElementById('catalogo-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      if (!p.categoria) continue
      counts.set(p.categoria, (counts.get(p.categoria) || 0) + 1)
    }
    const sorted = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'es'))
    return ['Todos', ...sorted]
  }, [products])

  const availableSubcategories = useMemo(() => {
    if (activeCategory === 'Todos') return []
    const subs = new Set<string>()
    for (const p of products) {
      if (p.categoria === activeCategory && p.subcategoria && p.subcategoria.trim()) {
        subs.add(p.subcategoria.trim())
      }
    }
    if (subs.size === 0) return []
    return ['Todos', ...Array.from(subs).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [products, activeCategory])

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
      />

      {/* Dedicated screens: Familia Baby World Form / Product Detail / Catalog */}
      {showFamiliaForm ? (
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
        />
      ) : (
        <>
          {/* Hero Banner Section (Banner Familia Baby World) */}
          {activeCategory === 'Todos' && !searchQuery && (
            <>
              <HeroBanner
                onOpenFamiliaRegistro={handleOpenFamiliaRegistro}
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onOpenBnplInfo={() => setIsBnplModalOpen(true)}
              />
              <FeaturedCarousel 
                products={products} 
                onAddToCart={handleAddToCart} 
                onViewDetails={handleOpenProduct} 
              />
            </>
          )}

          {/* Main Catalog Section */}
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-t-[3rem] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.05)] border-t border-slate-100 flex-1 relative z-30 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <main id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 w-full relative z-20">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-600">
                      Catálogo Baby-World
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                      {activeCategory} ({filteredProducts.length})
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    {searchQuery
                      ? `Resultados para "${searchQuery}"`
                      : activeCategory === 'Todos'
                        ? 'Lo mejor para tu bebé'
                        : activeCategory}
                  </h2>
                </div>

              </div>

              {/* Subcategories Filter Pills (Dinámico desde las subcategorías reales del ERP) */}
              {availableSubcategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 mb-4 no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Filtrar:
                  </span>
                  {availableSubcategories.map((sub) => {
                    const isSelected = activeSubcategory === sub
                    return (
                      <button
                        key={sub}
                        onClick={() => setActiveSubcategory(sub)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isSelected
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

              {/* Product Grid (2 columns on mobile, 3-4 on desktop) */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-4 max-w-md mx-auto my-8 animate-fade-in-up">
                  <div className="text-4xl">🍼</div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">No encontramos productos</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Prueba ajustando tu búsqueda o seleccionando otra sección.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCategory('Todos')
                      setSearchQuery('')
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Ver Todo el Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {filteredProducts.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleOpenProduct}
                      priority={idx < 4}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </>
      )}

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
            </div>

            {/* Quick Categories (Dinámico desde el ERP) */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Categorías Principales
              </p>
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
                  href="https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20hacer%20un%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <WhatsAppIcon size={16} />
                  <span>+57 302 386 3380 (WhatsApp Directo)</span>
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
                <img src="/logo-addi.png" alt="Addi" className="w-4 h-4 rounded-full object-contain" />
                <span>Addi (3 cuotas 0% interés)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 font-extrabold px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <img src="/logo-sistecredito.png" alt="Sistecrédito" className="h-3 max-w-[65px] object-contain" />
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

      {/* Floating WhatsApp Button (Oculto en la vista de formulario para no estorbar en móvil) */}
      {!showFamiliaForm && <FloatingWhatsAppButton phone="573023863380" />}

      {/* Sticky Mobile Bottom Navigation (Only visible on smartphones in catalog view) */}
      {!selectedProduct && !showFamiliaForm && (
        <MobileBottomNav
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
          quickCategories={availableCategories.filter(c => c !== 'Todos')}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWhatsApp={() => window.open('https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20sobre%20un%20producto', '_blank')}
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onSuccess={handleCheckoutSuccess}
        API_BASE={API_BASE}
        storeSlug={STORE_SLUG}
      />

      {/* Modal Informativo BNPL (Addi & Sistecrédito) */}
      <BnplInfoModal
        isOpen={isBnplModalOpen}
        onClose={() => setIsBnplModalOpen(false)}
      />

      {/* Modal de Ubicación de Tienda Física */}
      <StoreLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  )
}

