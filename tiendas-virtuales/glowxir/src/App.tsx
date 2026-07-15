import React, { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Sparkles, ArrowRight, Instagram, HelpCircle, Shield } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { ProductCard } from './components/ProductCard'
import { CartDrawer } from './components/CartDrawer'
import { ProductDetailModal } from './components/ProductDetailModal'
import { CheckoutModal } from './components/CheckoutModal'
import { PRODUCTOS, Product } from './data/productos'

interface CartItem {
  product: Product
  quantity: number
}

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://api.edatia.com'

export function App() {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    fetch(`${API_BASE}/public/tiendas/glowxir/productos`)
      .then(r => r.json())
      .then(data => {
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion || 'Sin descripción',
          descripcionLarga: p.descripcionWeb || p.descripcion || 'Sin descripción detallada',
          precio: Number(p.precioWeb || p.precioBase || 0),
          categoria: (p.sku.startsWith('LIP') ? 'Labios' :
                      p.sku.startsWith('BASE') ? 'Rostro' :
                      p.sku.startsWith('BLUSH') ? 'Rostro' :
                      p.sku.startsWith('PAL') ? 'Ojos' :
                      p.sku.startsWith('MASC') ? 'Ojos' :
                      p.sku.startsWith('KIT') ? 'Accesorios' : 'Rostro') as any,
          imagen: p.imagen || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
          rating: p.esDestacado ? 4.9 : 4.6,
          stock: p.stock || 20,
          detalles: p.esDestacado ? ["Acabado premium", "Fórmula exclusiva"] : ["Acabado impecable", "Cruelty-free"]
        }))
        setProducts(mapped)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error cargando catálogo:', err)
        setIsLoading(false)
      })
  }, [])

  // Filter products by category
  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.categoria === activeCategory)

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        toast.success(`Se aumentó la cantidad de: ${product.nombre}`)
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      toast.success(`Agregado a la bolsa: ${product.nombre}`)
      return [...prev, { product, quantity: 1 }]
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
      toast.error(`Eliminado de la bolsa: ${item.product.nombre}`)
    }
  }

  const handleCheckoutSuccess = () => {
    setCart([]) // Clear cart
    toast.success('¡Pedido procesado con éxito!', { duration: 5000 })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-glowxir-200">
      {/* Toast notifications */}
      <Toaster position="bottom-right" toastOptions={{ className: 'text-xs font-bold' }} />

      {/* Navigation */}
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Hero Banner Section */}
      {activeCategory === 'Todos' && (
        <header className="relative bg-gradient-to-tr from-glowxir-50 via-white to-glowxir-100/40 border-b border-slate-100 overflow-hidden py-16 sm:py-24">
          {/* Subtle blurred background gradients */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-glowxir-200/30 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-xl text-left space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-glowxir-100 text-glowxir-750 font-extrabold text-[10px] uppercase tracking-wider rounded-full border border-glowxir-200/50">
                <Sparkles size={12} />
                Colección Lujo 2026
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight leading-[1.1] font-serif">
                Despierta tu <br />
                <span className="bg-gradient-to-r from-glowxir-600 to-glowxir-500 bg-clip-text text-transparent">
                  Brillo Natural
                </span>
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Descubre cosméticos de alta gama formulados con ingredientes botánicos y pigmentos puros para realzar la belleza auténtica de tu piel.
              </p>
              
              <div className="pt-2">
                <button 
                  onClick={() => {
                    const el = document.getElementById('productos-grid')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 group shadow-md hover:shadow-lg active:scale-95"
                >
                  Explorar catálogo
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Grid Catalog */}
      <main id="productos-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-serif">
              {activeCategory === 'Todos' ? 'Nuestros Destacados' : activeCategory}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Nuestra curaduría exclusiva de cosméticos.</p>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="aspect-[4/5] bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                  <div className="h-8 w-8 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="font-serif font-black text-lg tracking-[0.16em] text-slate-800 uppercase">GLOWXIR</p>
          
          <div className="flex justify-center gap-8 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-glowxir-600 transition-colors">Nosotros</a>
            <a href="#" className="hover:text-glowxir-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-glowxir-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-glowxir-600 transition-colors">Soporte</a>
          </div>

          <div className="flex justify-center gap-4 text-slate-450">
            <button className="p-2.5 bg-slate-50 hover:bg-glowxir-50 hover:text-glowxir-600 border border-slate-100 rounded-full transition-all">
              <Instagram size={18} />
            </button>
            <button className="p-2.5 bg-slate-50 hover:bg-glowxir-50 hover:text-glowxir-600 border border-slate-100 rounded-full transition-all">
              <HelpCircle size={18} />
            </button>
            <button className="p-2.5 bg-slate-50 hover:bg-glowxir-50 hover:text-glowxir-600 border border-slate-100 rounded-full transition-all">
              <Shield size={18} />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-50">
            © {new Date().getFullYear()} Glowxir. Todos los derechos reservados. Edatia Tiendas Virtuales.
          </p>
        </div>
      </footer>

      {/* Slide drawers & modals */}
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
        onAddToCart={(p) => {
          handleAddToCart(p)
          setSelectedProduct(null)
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onSuccess={handleCheckoutSuccess}
        API_BASE={API_BASE}
      />
    </div>
  )
}
