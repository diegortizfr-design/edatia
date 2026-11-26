import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoriesSection } from './components/CategoriesSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { EncordadoCalculatorModal } from './components/EncordadoCalculatorModal';
import { CheckoutModal } from './components/CheckoutModal';
import { Footer } from './components/Footer';

import { Product, CartItem, FilterState } from './types';
import { INITIAL_PRODUCTS } from './data/products';
import {
  getProductCode,
  getProductName,
  getProductPrice,
  getProductCategory,
  getProductBrand,
} from './lib/utils';
import { Zap, Sparkles, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.edatia.com/api/v1';
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG || 'smash';

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('smash_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('smash_cart', JSON.stringify(cart));
  }, [cart]);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'Todos',
    brand: 'Todas',
    gender: 'Todos',
    maxPrice: 5000000,
    sortBy: 'recommended',
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isEncordadoOpen, setIsEncordadoOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch real ERP products with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch(`${API_BASE}/public/tiendas/${STORE_SLUG}/productos`);
        if (res.ok) {
          const data = await res.json();
          const remoteProducts: Product[] = Array.isArray(data)
            ? data
            : data.items || data.productos || [];

          if (isMounted && remoteProducts.length > 0) {
            // Map remote products
            const mapped = remoteProducts.map((p: any) => ({
              ...p,
              id: p.id || p.sku || p.referencia,
              code: p.referencia || p.sku || p.codigo || String(p.id),
              name: p.nombre || p.name,
              category:
                typeof p.categoria === 'object'
                  ? p.categoria?.nombre
                  : p.categoria || 'General',
              brand:
                typeof p.marca === 'object' ? p.marca?.nombre : p.marca || 'Smash',
              price: p.precioWeb || p.precioBase || p.precio || 0,
              description: p.descripcionWeb || p.descripcion || '',
              image: p.imagen || p.image || null,
              stock: p.stock ?? 10,
              badge: p.esDestacado ? 'Destacado 2026' : undefined,
            }));
            setProducts(mapped);
          }
        }
      } catch (err) {
        console.warn('Usando catálogo inicial precargado de Smash:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (filters.category !== 'Todos') {
          const pCat = getProductCategory(p).toLowerCase();
          const targetCat = filters.category.toLowerCase();
          if (!pCat.includes(targetCat) && !targetCat.includes(pCat)) {
            return false;
          }
        }

        // Brand filter
        if (filters.brand !== 'Todas') {
          const pBrand = getProductBrand(p).toLowerCase();
          if (pBrand !== filters.brand.toLowerCase()) {
            return false;
          }
        }

        // Search text
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const name = getProductName(p).toLowerCase();
          const code = getProductCode(p).toLowerCase();
          const brand = getProductBrand(p).toLowerCase();
          const cat = getProductCategory(p).toLowerCase();
          if (
            !name.includes(q) &&
            !code.includes(q) &&
            !brand.includes(q) &&
            !cat.includes(q)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getProductPrice(a);
        const priceB = getProductPrice(b);
        const nameA = getProductName(a).toLowerCase();
        const nameB = getProductName(b).toLowerCase();

        switch (filters.sortBy) {
          case 'price-asc':
            return priceA - priceB;
          case 'price-desc':
            return priceB - priceA;
          case 'name-asc':
            return nameA.localeCompare(nameB);
          case 'recommended':
          default:
            return (b.badge ? 1 : 0) - (a.badge ? 1 : 0);
        }
      });
  }, [products, filters]);

  // Cart operations
  const handleAddToCart = (product: Product, size?: string, quantity = 1) => {
    setCart((prev) => {
      const code = getProductCode(product);
      const existingIdx = prev.findIndex(
        (it) => getProductCode(it.product) === code && it.selectedSize === size
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedSize: size }];
    });

    toast.success(`¡${getProductName(product)} agregado al carrito!`, {
      icon: '🎾',
      style: {
        borderRadius: '12px',
        background: '#0f172a',
        color: '#a3e635',
        fontWeight: 'bold',
        fontSize: '13px',
      },
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    toast('Producto eliminado del carrito', { icon: '🗑️' });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Toaster position="top-right" />

      {/* Main Navbar */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenEncordado={() => setIsEncordadoOpen(true)}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onCategorySelect={(category) => setFilters((prev) => ({ ...prev, category }))}
      />

      {/* Hero Banner */}
      <HeroBanner
        onOpenEncordado={() => setIsEncordadoOpen(true)}
        onExploreProducts={() => {
          const el = document.getElementById('catalogo-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Sticky Categories & Filter Bar */}
      <div id="catalogo-section">
        <CategoriesSection
          filters={filters}
          onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          totalProducts={filteredProducts.length}
        />
      </div>

      {/* Main Products Grid Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Active Filter summary if filtered */}
        {(filters.category !== 'Todos' || filters.brand !== 'Todas' || filters.search) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600">Filtros activos:</span>
            {filters.category !== 'Todos' && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                Categoría: {filters.category}
                <button
                  onClick={() => setFilters((f) => ({ ...f, category: 'Todos' }))}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.brand !== 'Todas' && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                Marca: {filters.brand}
                <button
                  onClick={() => setFilters((f) => ({ ...f, brand: 'Todas' }))}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                Búsqueda: "{filters.search}"
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  category: 'Todos',
                  brand: 'Todas',
                  gender: 'Todos',
                  maxPrice: 5000000,
                  sortBy: 'recommended',
                })
              }
              className="text-xs text-lime-700 hover:text-lime-800 font-bold ml-auto"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No encontramos productos que coincidan
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Prueba cambiando la marca o el término de búsqueda para ver más modelos disponibles.
            </p>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  category: 'Todos',
                  brand: 'Todas',
                  gender: 'Todos',
                  maxPrice: 5000000,
                  sortBy: 'recommended',
                })
              }
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-lime-400 font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Ver Todo el Catálogo
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={getProductCode(product)}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
                onAddToCart={(p, sz) => handleAddToCart(p, sz, 1)}
              />
            ))}
          </div>
        )}

        {/* Middle Promo Box: Stringing Highlight */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-slate-800 p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-lime-400/20 text-lime-400 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Taller Profesional Homologado
            </span>
            <h3 className="text-2xl font-extrabold font-heading text-white">
              ¿Tu raqueta perdió tensión o se rompió la cuerda?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Encordamos tu raqueta en máquinas electrónicas de última generación. Cuerdas Luxilon, Babolat, Head y Yonex con entrega garantizada en 2 horas.
            </p>
          </div>

          <button
            onClick={() => setIsEncordadoOpen(true)}
            className="px-6 py-3.5 rounded-xl bg-lime-400 text-slate-950 font-bold text-sm hover:bg-lime-300 transition-all shrink-0 flex items-center gap-2 active:scale-95 shadow-lg shadow-lime-400/20"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Calcular Encordado</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer onOpenEncordado={() => setIsEncordadoOpen(true)} />

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, sz, qty) => handleAddToCart(p, sz, qty)}
      />

      <EncordadoCalculatorModal
        isOpen={isEncordadoOpen}
        onClose={() => setIsEncordadoOpen(false)}
        onAddToCart={(customProduct) => handleAddToCart(customProduct)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onClearCart={handleClearCart}
      />
    </div>
  );
};
