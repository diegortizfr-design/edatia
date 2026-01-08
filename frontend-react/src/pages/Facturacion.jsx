import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ShoppingCart, Search, User, CreditCard, Banknote, ArrowRight, X, Monitor, Layers, Coffee, Pizza, Cherry, Plus } from 'lucide-react';
import './Facturacion.css';

const Facturacion = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('todos');
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocType, setSelectedDocType] = useState(null);
    const [customer, setCustomer] = useState({ id: null, nombre: 'Cliente Mostrador' });
    const searchRef = useRef(null);

    useEffect(() => {
        loadData();
        const handleKeyDown = (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadData = async () => {
        try {
            const [prodResp, docResp] = await Promise.all([
                api.get('/productos'),
                api.get('/documentos')
            ]);

            if (prodResp.data.ok || prodResp.data.success) {
                const all = prodResp.data.data.filter(p => p.activo);
                setProducts(all);
                setFilteredProducts(all);
                const cats = [...new Set(all.map(p => p.categoria).filter(c => c))];
                setCategories(cats);
            }

            if (docResp.data.ok || docResp.data.success) {
                const posDoc = docResp.data.data.find(d => d.categoria === 'Factura POS' || d.categoria === 'Factura Venta');
                setSelectedDocType(posDoc);
            }
        } catch (err) {
            console.error('Error loading POS data:', err);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        const lowTerm = term.toLowerCase();
        const filtered = products.filter(p =>
            p.nombre.toLowerCase().includes(lowTerm) ||
            (p.codigo && p.codigo.toLowerCase().includes(lowTerm))
        );
        setFilteredProducts(filtered);
    };

    const handleCategoryFilter = (cat) => {
        setActiveCategory(cat);
        if (cat === 'todos') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()));
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, {
                id: product.id,
                nombre: product.nombre,
                precio: parseFloat(product.precio1),
                impuesto_porcentaje: parseFloat(product.impuesto_porcentaje) || 0,
                cantidad: 1
            }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let tax = 0;
        cart.forEach(item => {
            const itemSub = item.precio * item.cantidad;
            subtotal += itemSub;
            tax += itemSub * (item.impuesto_porcentaje / 100);
        });
        return { subtotal, tax, total: subtotal + tax };
    };

    const handleCheckout = async (method) => {
        if (cart.length === 0) return alert('El carrito está vacío');
        if (!selectedDocType) return alert('No hay configuración de Factura POS');

        const { subtotal, tax, total } = calculateTotals();

        const body = {
            documento_id: selectedDocType.id,
            cliente_id: customer.id,
            subtotal,
            impuesto_total: tax,
            total,
            metodo_pago: method,
            items: cart.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio,
                impuesto_porcentaje: item.impuesto_porcentaje,
                subtotal: item.precio * item.cantidad
            }))
        };

        try {
            const resp = await api.post('/facturacion', body);
            if (resp.data.ok || resp.data.success) {
                alert(`Venta Exitosa: ${resp.data.numero} `);
                setCart([]);
                loadData(); // Resync products (stock) and doc consecutive
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Error al procesar la venta');
        }
    };

    const { subtotal, total } = calculateTotals();

    const getCategoryIcon = (cat) => {
        const c = cat.toLowerCase();
        if (c.includes('bebi')) return <Coffee size={18} />;
        if (c.includes('comi')) return <Pizza size={18} />;
        if (c.includes('postre')) return <Cherry size={18} />;
        return <Plus size={18} />;
    };

    return (
        <div className="pos-container">
            {/* LEFT: PRODUCTS */}
            <section className="pos-products card dashboard-card">
                <header className="pos-header">
                    <div className="header-title">
                        <h1><Monitor size={32} /> Punto de Venta</h1>
                        <p className="subtitle">Caja: Principal | Vendedor: Usuario</p>
                    </div>
                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            ref={searchRef}
                            placeholder="Buscar producto (F3)..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </header>

                <div className="category-tabs">
                    <button className={`tab ${activeCategory === 'todos' ? 'active' : ''} `} onClick={() => handleCategoryFilter('todos')}>
                        <Layers size={18} /> Todos
                    </button>
                    {categories.map(cat => (
                        <button key={cat} className={`tab ${activeCategory === cat ? 'active' : ''} `} onClick={() => handleCategoryFilter(cat)}>
                            {getCategoryIcon(cat)} {cat}
                        </button>
                    ))}
                </div>

                <div className="product-grid">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                            <div className="p-image" style={{ backgroundImage: p.imagen_url ? `url(${p.imagen_url})` : 'none' }}>
                                {!p.imagen_url && <Plus size={40} color="#e5e7eb" />}
                            </div>
                            <div className="p-details">
                                <h4>{p.nombre}</h4>
                                <span className="price">${parseFloat(p.precio1).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* RIGHT: CART */}
            <aside className="pos-cart card dashboard-card">
                <div className="cart-header">
                    <h3><ShoppingCart size={24} /> Orden</h3>
                    <span className="order-num">#{selectedDocType ? `${selectedDocType.prefijo || ''}${selectedDocType.consecutivo_actual} ` : '---'}</span>
                </div>

                <div className="cart-customer">
                    <User size={20} />
                    <span>{customer.nombre}</span>
                    <button className="btn-icon-small"><Search size={14} /></button>
                </div>

                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item.id} className="cart-item">
                            <div className="item-info">
                                <strong>{item.nombre}</strong>
                                <small>{item.cantidad} x ${item.precio.toLocaleString()}</small>
                            </div>
                            <div className="item-total-group">
                                <span className="item-total">${(item.precio * item.cantidad).toLocaleString()}</span>
                                <button className="remove-btn" onClick={() => removeFromCart(item.id)}><X size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carrito vacío</div>
                    )}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                    </div>

                    <div className="cart-actions">
                        <button className="btn-pay cash" onClick={() => handleCheckout('Efectivo')} title="Efectivo">
                            <Banknote size={24} />
                        </button>
                        <button className="btn-pay card-pay" onClick={() => handleCheckout('Tarjeta')} title="Tarjeta">
                            <CreditCard size={24} />
                        </button>
                    </div>
                    <button className="btn-checkout" onClick={() => handleCheckout('General')}>
                        Cobrar <ArrowRight size={20} />
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default Facturacion;
