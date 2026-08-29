import React, { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Sparkles, ArrowRight, Instagram, HelpCircle, Shield, MessageCircle, Heart, Phone, MapPin, Mail, PartyPopper, Calculator, Filter, CheckCircle2 } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { GenderRevealSection } from './components/GenderRevealSection'
import { DiaperCalculatorModal } from './components/DiaperCalculatorModal'
import { WholesaleBanner } from './components/WholesaleBanner'
import { ProductCard } from './components/ProductCard'
import { CartDrawer, CartItem } from './components/CartDrawer'
import { ProductDetailModal } from './components/ProductDetailModal'
import { CheckoutModal } from './components/CheckoutModal'
import { BabyWorldLogo } from './components/BabyWorldLogo'
import { PRODUCTOS_BABY_WORLD, Product } from './data/productos'

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://api.edatia.com'

const getStoreSlug = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (isLocal) return 'distribuidorababyworld'
  const host = window.location.hostname.replace('www.', '')
  if (host.endsWith('.edatia.com')) {
    return host.replace('.edatia.com', '')
  }
  return 'distribuidorababyworld'
}

const STORE_SLUG = getStoreSlug()

export function App() {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [selectedGender, setSelectedGender] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  
  const [products, setProducts] = useState<Product[]>(PRODUCTOS_BABY_WORLD)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch backend catalog if available, fallback to rich local catalog
  useEffect(() => {
    fetch(`${API_BASE}/public/tiendas/${STORE_SLUG}/productos`)
      .then(r => {
        if (!r.ok) throw new Error('Falló al consultar backend')
        return r.json()
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion || 'Sin descripción',
            descripcionLarga: p.descripcionWeb || p.descripcion || '',
            precio: Number(p.precioWeb || p.precioBase || 0),
            categoria: (
              p.sku?.startsWith('PAN') ? 'Pañalera & Cuidado' :
              p.sku?.startsWith('JUG') ? 'Juguetería' :
              p.sku?.startsWith('ROP') ? 'Ropa & Ajuares' :
              p.sku?.startsWith('GEND') ? 'Revelación de Género' :
              p.sku?.startsWith('SHOW') ? 'Baby Shower' :
              p.sku?.startsWith('PAS') ? 'Paseo & Habitación' : 'Pañalera & Cuidado'
            ) as any,
            genero: 'Unisex' as any,
            imagen: p.imagen
              ? (p.imagen.startsWith('http') ? p.imagen : `${API_BASE}${p.imagen}`)
              : 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700',
            rating: p.esDestacado ? 5.0 : 4.8,
            reviewsCount: 30 + (p.id * 5),
            stock: p.stock || 40,
            esDestacado: !!p.esDestacado,
            esMayorista: p.sku?.includes('BULTO') || false,
            detalles: p.esDestacado 
              ? ["100% Calidad Garantizada", "Hipoalergénico y seguro", "Envío inmediato"]
              : ["Materiales de alta durabilidad", "Recomendado para bebés"]
          }))
          setProducts(mapped)
        }
      })
      .catch(err => {
        // Use default high quality baby catalog
        console.log('Usando catálogo nativo de Distribuidora Baby World:', err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Filter products by category, gender and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.categoria === activeCategory
    const matchesGender = selectedGender === 'Todos' || !p.genero || p.genero === 'Unisex' || p.genero === selectedGender
    const matchesSearch = searchQuery.trim() === '' || 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesGender && matchesSearch
  })

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        toast.success(`Aumentaste ${quantity}x "${product.nombre}"`, {
          icon: '🍼',
          style: { borderRadius: '1rem', background: '#0c4a6e', color: '#fff' }
        })
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      toast.success(`Agregado a la bolsa: ${product.nombre}`, {
        icon: '🛍️',
        style: { borderRadius: '1rem', background: '#0c4a6e', color: '#fff' }
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
    toast.success('¡Pedido procesado con éxito en Baby World!', {
      duration: 5000,
      icon: '🎉',
      style: { borderRadius: '1rem', background: '#047857', color: '#fff' }
    })
  }

  const diaperProduct = products.find(p => p.categoria === 'Pañalera & Cuidado' && p.nombre.toLowerCase().includes('huggies')) || products[5]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-sky-200">
      {/* Toast notifications */}
      <Toaster position="bottom-right" toastOptions={{ className: 'text-xs font-bold' }} />

      {/* Navigation */}
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
      />

      {/* Hero Banner Section (Shown when on Home / All and no search) */}
      {activeCategory === 'Todos' && !searchQuery && (
        <>
          <HeroBanner
            onExploreClick={() => {
              const el = document.getElementById('productos-grid')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            onGenderRevealClick={() => {
              setActiveCategory('Revelación de Género')
              const el = document.getElementById('productos-grid')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
          />

          {/* Interactive Gender Reveal & Baby Shower Spotlight */}
          <GenderRevealSection
            products={products}
            onAddToCart={handleAddToCart}
            onViewDetails={p => setSelectedProduct(p)}
          />
        </>
      )}

      {/* Main Grid Catalog */}
      <main id="productos-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">
                Catálogo Oficial
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              <span className="text-xs font-bold text-slate-400">
                {activeCategory}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-1">
              {searchQuery
                ? `Resultados para "${searchQuery}"`
                : activeCategory === 'Todos' ? 'Todos los Productos para Bebé' : activeCategory}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Precios directos de distribuidora con garantía de calidad y envíos a toda Colombia.
            </p>
          </div>

          {/* Gender Filter Chips */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-400 pl-2 hidden sm:inline">Filtrar:</span>
            {['Todos', 'Niño', 'Niña', 'Unisex'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedGender === g
                    ? g === 'Niño' ? 'bg-sky-500 text-white shadow-sm'
                    : g === 'Niña' ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g === 'Niño' ? '👦 Niño' : g === 'Niña' ? '👧 Niña' : g === 'Unisex' ? '💛 Neutro' : '✨ Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4 max-w-lg mx-auto my-8">
            <div className="text-4xl">🍼</div>
            <div>
              <h3 className="text-base font-black text-slate-800 font-display">No encontramos productos</h3>
              <p className="text-xs text-slate-400 mt-1">
                Prueba ajustando tu búsqueda o cambiando de categoría.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveCategory('Todos')
                setSelectedGender('Todos')
                setSearchQuery('')
              }}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Ver Todo el Catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

      {/* Wholesale Banner Section */}
      <WholesaleBanner />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <BabyWorldLogo />
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                <b>Distribuidora Baby World</b> es tu aliado de confianza en productos para bebés. Especialistas en pañalera al por mayor y detal, juguetes de estimulación temprana, ajuares de primera puesta, y kits mágicos para fiestas de revelación de género y baby shower.
              </p>
              <div className="flex items-center gap-3 text-slate-500 pt-1">
                <a 
                  href="https://wa.me/573001234567" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-all border border-emerald-100"
                  title="WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-2xl transition-all border border-pink-100"
                  title="Instagram"
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>

            {/* Col 2: Categories */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                Categorías
              </p>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li><button onClick={() => setActiveCategory('Pañalera & Cuidado')} className="hover:text-sky-600 transition-colors">🍼 Pañalera & Cuidado</button></li>
                <li><button onClick={() => setActiveCategory('Juguetería')} className="hover:text-sky-600 transition-colors">🧸 Juguetería Sensorial</button></li>
                <li><button onClick={() => setActiveCategory('Ropa & Ajuares')} className="hover:text-sky-600 transition-colors">👶 Ropa Algodón Pima</button></li>
                <li><button onClick={() => setActiveCategory('Baby Shower')} className="hover:text-sky-600 transition-colors">🎉 Baby Shower & Regalos</button></li>
                <li><button onClick={() => setActiveCategory('Revelación de Género')} className="hover:text-sky-600 transition-colors">🎀 Revelación de Género</button></li>
              </ul>
            </div>

            {/* Col 3: Tools & Services */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                Servicios & Ayuda
              </p>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li><button onClick={() => setIsCalculatorOpen(true)} className="hover:text-sky-600 transition-colors flex items-center gap-1.5"><Calculator size={13} /> Calculadora de Pañales</button></li>
                <li><a href="https://wa.me/573001234567?text=Quiero%20solicitar%20precios%20mayoristas" target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 transition-colors">📦 Catálogo Mayorista</a></li>
                <li><a href="#" className="hover:text-sky-600 transition-colors">🚚 Envíos y Tiempos de Entrega</a></li>
                <li><a href="#" className="hover:text-sky-600 transition-colors">💵 Política de Pago Contra Entrega</a></li>
              </ul>
            </div>

            {/* Col 4: Contact info */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                Atención al Cliente
              </p>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-sky-500 flex-shrink-0" />
                  <span>+57 (300) 123-4567</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-pink-500 flex-shrink-0" />
                  <span>contacto@babyworld.edatia.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-500 flex-shrink-0" />
                  <span>Bogotá, Colombia (Envíos Nacionales)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} <b>Distribuidora Baby World</b>. Todos los derechos reservados. Tienda Virtual por <b>Edatia</b>.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Sitio Seguro SSL</span>
              <span className="flex items-center gap-1">🇨🇴 Envíos a toda Colombia</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Slide Drawer & Modals */}
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

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, q) => {
          handleAddToCart(p, q)
          setSelectedProduct(null)
        }}
      />

      <DiaperCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onAddDiaperPack={(p, q) => handleAddToCart(p, q)}
        diaperProduct={diaperProduct}
      />

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
