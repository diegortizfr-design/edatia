import React, { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { MessageCircle, Shield, Phone, MapPin, Mail, Instagram, Sparkles, Truck, CheckCircle2, Filter } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { MobileBottomNav } from './components/MobileBottomNav'
import { ProductCard } from './components/ProductCard'
import { ProductDetailPage } from './components/ProductDetailPage'
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton'
import { CartDrawer, CartItem } from './components/CartDrawer'
import { CheckoutModal } from './components/CheckoutModal'
import { BabyWorldLogo } from './components/BabyWorldLogo'
import { PRODUCTOS_BABY_WORLD, Product, CATEGORIAS_PRODUCTOS, SUBCATEGORIAS_CUIDADO } from './data/productos'

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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>(PRODUCTOS_BABY_WORLD)
  const [isLoading, setIsLoading] = useState(false)

  // Reset subcategory when switching main category
  useEffect(() => {
    setActiveSubcategory('Todos')
  }, [activeCategory])

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
            let cat: 'Pañales y Cuidado' | 'Juguetería' | 'Variedades' = 'Pañales y Cuidado'
            const sku = (p.sku || '').toUpperCase()
            const nombre = (p.nombre || '').toLowerCase()

            if (sku.startsWith('JUG') || nombre.includes('juguete') || nombre.includes('gimnasio') || nombre.includes('peluche') || nombre.includes('sonajero')) {
              cat = 'Juguetería'
            } else if (sku.startsWith('VAR') || sku.startsWith('ROP') || nombre.includes('ajuar') || nombre.includes('cobija') || nombre.includes('babero') || nombre.includes('kit')) {
              cat = 'Variedades'
            } else {
              cat = 'Pañales y Cuidado'
            }

            // Derive subcategory
            let subcat = p.categoria || ''
            if (!subcat) {
              if (nombre.includes('pañal') || sku.startsWith('PAN')) subcat = 'Pañales'
              else if (nombre.includes('crema') || nombre.includes('desitin') || nombre.includes('natusan') || nombre.includes('pomada')) subcat = 'Cremas & Pomadas'
              else if (nombre.includes('toall') || nombre.includes('pañito')) subcat = 'Toallitas & Pañitos'
              else if (nombre.includes('shampoo') || nombre.includes('jabon') || nombre.includes('baño') || nombre.includes('locion')) subcat = 'Aseo & Baño'
              else if (nombre.includes('biberon') || nombre.includes('chupo') || nombre.includes('tetero')) subcat = 'Alimentación & Chupos'
              else subcat = cat
            }

            return {
              id: p.id,
              nombre: p.nombre,
              descripcion: p.descripcion || 'Producto de alta calidad para bebés.',
              descripcionLarga: p.descripcionWeb || p.descripcion || '',
              precio: Number(p.precioWeb || p.precioBase || 0),
              precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : undefined,
              categoria: cat,
              subcategoria: subcat,
              genero: 'Unisex',
              imagen: p.imagen
                ? (p.imagen.startsWith('http') || p.imagen.startsWith('/productos') ? p.imagen : `${API_BASE.replace('/api/v1', '')}${p.imagen}`)
                : 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700',
              rating: p.esDestacado ? 5.0 : 4.8,
              reviewsCount: 25 + (p.id * 3),
              stock: p.stock || 30,
              esDestacado: !!p.esDestacado,
              detalles: [
                "100% Calidad y seguridad comprobada",
                "Hipoalergénico y recomendado para bebés",
                "Despacho y entrega rápida garantizada"
              ]
            }
          })
          setProducts(mapped)
        }
      })
      .catch(err => {
        console.log('Usando catálogo nativo optimizado de Baby-World:', err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Filter products by category, subcategory and search query
  const filteredProducts = products.filter(p => {
    const isCare = activeCategory === 'Pañales y Cuidado' || activeCategory === 'Pañalera'
    const productIsCare = p.categoria === 'Pañales y Cuidado' || (p.categoria as any) === 'Pañalera'

    const matchesCategory = activeCategory === 'Todos' ||
      (isCare ? productIsCare : p.categoria === activeCategory)

    const matchesSubcategory = activeSubcategory === 'Todos' ||
      (p.subcategoria && p.subcategoria.toLowerCase() === activeSubcategory.toLowerCase())

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = q === '' ||
      p.nombre.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.subcategoria && p.subcategoria.toLowerCase().includes(q))
    return matchesCategory && matchesSubcategory && matchesSearch
  })

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        toast.success(`Aumentaste ${quantity}x "${product.nombre}"`, {
          icon: '🍼',
          style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
        })
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      toast.success(`Agregado a la bolsa: ${product.nombre}`, {
        icon: '🛍️',
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      })
      return [...prev, { product, quantity }]
    })
  }

  const handleUpdateQuantity = (productId: number, q: number) => {
    if (q <= 0) {
      handleRemoveItem(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: q }
          : item
      )
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
    setCart([])
    toast.success('¡Pedido procesado con éxito en Baby-World!', {
      duration: 5000,
      icon: '🎉',
      style: { borderRadius: '1rem', background: '#047857', color: '#fff' }
    })
  }

  const handleCategorySelect = (category: string) => {
    setSelectedProduct(null)
    setActiveCategory(category)
    setActiveSubcategory('Todos')
    const el = document.getElementById('catalogo-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isCareSection = activeCategory === 'Pañales y Cuidado' || activeCategory === 'Pañalera'

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-sky-200 pb-20 md:pb-0">
      {/* Toast notifications */}
      <Toaster position="bottom-right" toastOptions={{ className: 'text-xs font-bold' }} />

      {/* Navigation Bar */}
      <Navbar
        cartCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        setActiveCategory={handleCategorySelect}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* If a product is selected, display the full Dedicated Product View Page */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onBack={() => setSelectedProduct(null)}
          onSelectProduct={(p) => {
            setSelectedProduct(p)
          }}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
        />
      ) : (
        <>
          {/* Hero Banner Section (Clean, Compact, Mobile-First) */}
          {activeCategory === 'Todos' && !searchQuery && (
            <HeroBanner onSelectCategory={handleCategorySelect} />
          )}

          {/* Main Catalog Section */}
          <div className="bg-white rounded-t-[3rem] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.05)] border-t border-slate-100 flex-1 relative z-30">
            <main id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full relative z-20">
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
                        : isCareSection
                          ? '🍼 Pañales y Cuidado para Bebés'
                          : activeCategory === 'Juguetería'
                            ? '🧸 Juguetería & Estimulación Temprana'
                            : '🎀 Variedades, Ropa & Accesorios'}
                  </h2>
                </div>

              </div>

              {/* Subcategories Filter Pills (Visible when in Pañales y Cuidado) */}
              {isCareSection && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 mb-4 no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Filtrar:
                  </span>
                  {SUBCATEGORIAS_CUIDADO.map((sub) => {
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
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm space-y-4 max-w-md mx-auto my-8">
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
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={p => setSelectedProduct(p)}
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

            {/* Quick Categories */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Categorías Principales
              </p>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li>
                  <button onClick={() => handleCategorySelect('Pañales y Cuidado')} className="hover:text-sky-600 transition-colors">
                    🍼 Pañales & Cuidado (Huggies, Winny, Desitin, Cremas)
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCategorySelect('Juguetería')} className="hover:text-sky-600 transition-colors">
                    🧸 Juguetería Sensorial & Gimnasios
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCategorySelect('Variedades')} className="hover:text-sky-600 transition-colors">
                    🎀 Variedades, Ajuares & Accesorios
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact & WhatsApp */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Atención & Asesoría
              </p>
              <div className="space-y-2 text-xs text-slate-500">
                <a
                  href="https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20hacer%20un%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                >
                  <MessageCircle size={15} />
                  <span>+57 302 386 3380 (WhatsApp Directo)</span>
                </a>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>Candelaria / Cali - Envíos Nacionales</span>
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={14} className="text-slate-400" />
                  <span>Pago Contra Entrega disponible</span>
                </p>
              </div>
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

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton phone="573023863380" />

      {/* Sticky Mobile Bottom Navigation (Only visible on smartphones) */}
      <MobileBottomNav
        activeCategory={activeCategory}
        onSelectCategory={handleCategorySelect}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWhatsApp={() => window.open('https://wa.me/573023863380?text=Hola%20Baby-World,%20deseo%20asesor%C3%ADa%20sobre%20un%20producto', '_blank')}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
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
    </div>
  )
}

