// Oro Laminado - Premium Shop Logic
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const NIT = '1143875756';
    const API_URL = `https://erpod.onrender.com/api/public/ecommerce/${NIT}`;
    const LOCAL_STORAGE_KEY = 'oroLaminadoCart';

    // Selectors
    const cartToggle = document.getElementById('cart-btn-nav');
    const cartClose = document.getElementById('cart-close');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');
    const catalogGrid = document.getElementById('dynamic-catalog-grid');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.querySelector('.nav-links');

    // State
    let cart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    let allProducts = [];
    let activeCategory = 'Todo';

    // Mock Products for Presentation
    const mockProducts = [
        {
            id: 'mock-1',
            nombre: 'Pulsera Eslabones 18K',
            precio: 185000,
            categoria: 'Pulseras',
            imagen_principal: 'https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Elegante pulsera de eslabones con baño de oro de 18K.'
        },
        {
            id: 'mock-2',
            nombre: 'Anillo Brillante Crystal',
            precio: 125000,
            categoria: 'Anillos',
            imagen_principal: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Anillo con cristales incrustados y acabado premium.'
        },
        {
            id: 'mock-3',
            nombre: 'Cadena Tejido Cordón',
            precio: 210000,
            categoria: 'Cadenas',
            imagen_principal: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Cadena con diseño de cordón, ideal para dijes pesados.'
        },
        {
            id: 'mock-4',
            nombre: 'Aretes Aros Elegance',
            precio: 95000,
            categoria: 'Aretes',
            imagen_principal: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Aretes tipo aro con cierre de seguridad.'
        },
        {
            id: 'mock-5',
            nombre: 'Reloj Gold Classic',
            precio: 450000,
            categoria: 'Relojes',
            imagen_principal: 'https://images.unsplash.com/photo-1524333800407-b98ac37a6c65?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Reloj de pulso con acabados en oro laminado.'
        },
        {
            id: 'mock-6',
            nombre: 'Gargantilla Minimalista',
            precio: 140000,
            categoria: 'Cadenas',
            imagen_principal: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop',
            descripcion: 'Gargantilla sutil para uso diario.'
        }
    ];

    // --- Cart Functions ---
    const toggleCart = () => cartSidebar.classList.toggle('active');

    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Tu joyero está esperando ser llenado.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                count += item.quantity;

                const el = document.createElement('div');
                el.className = 'cart-item-premium';
                el.style.display = 'flex';
                el.style.gap = '15px';
                el.style.padding = '15px 0';
                el.style.borderBottom = '1px solid var(--border-gold)';
                el.innerHTML = `
                    <img src="${item.img}" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid var(--border-gold);">
                    <div style="flex: 1">
                        <h4 style="font-size: 0.9rem; margin-bottom: 5px;">${item.name}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="gold-text">$${item.price.toLocaleString()}</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button onclick="updateQty(${index}, -1)" style="background: none; border: 1px solid var(--border-gold); color: white; width: 25px; cursor: pointer;">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQty(${index}, 1)" style="background: none; border: 1px solid var(--border-gold); color: white; width: 25px; cursor: pointer;">+</button>
                            </div>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(el);
            });
        }

        cartCountBadge.textContent = count;
        cartTotalDisplay.textContent = `$${total.toLocaleString()}`;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    };

    const addToCart = (product) => {
        const existing = cart.find(i => i.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartUI();
        if (!cartSidebar.classList.contains('active')) toggleCart();
    };

    window.updateQty = (index, change) => {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        updateCartUI();
    };

    // --- API & Catalog ---
    const loadProducts = async () => {
        try {
            const resp = await fetch(API_URL);
            const result = await resp.json();

            if (result.success && result.data && result.data.length > 0) {
                allProducts = result.data;
            } else {
                console.log("No API products found, using mock data for presentation.");
                allProducts = mockProducts;
            }
            renderFilters();
            renderProducts();
        } catch (e) {
            console.error("Connection error, using mock data.", e);
            allProducts = mockProducts;
            renderFilters();
            renderProducts();
        }
    };

    const renderFilters = () => {
        const filterContainer = document.getElementById('category-filters-sidebar');
        if (!filterContainer) return;

        const categories = ['Todo', ...new Set(allProducts.map(p => p.categoria || 'Joyas'))];
        filterContainer.innerHTML = categories.map(cat => `
            <button class="${cat === activeCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    };

    window.filterByCategory = (cat) => {
        activeCategory = cat;
        renderFilters();
        renderProducts();
    };

    const renderProducts = () => {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';

        const filtered = activeCategory === 'Todo'
            ? allProducts
            : allProducts.filter(p => (p.categoria || 'Joyas') === activeCategory);

        if (filtered.length === 0) {
            catalogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 100px;">Colección no disponible por el momento.</p>';
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const price = p.precio || 0;
            const img = p.imagen_principal || 'https://images.unsplash.com/photo-1611085583191-a3b1a6a2e646?q=80&w=400&auto=format&fit=crop';

            card.innerHTML = `
                <img src="${img}" alt="${p.nombre}" loading="lazy">
                <h3>${p.nombre}</h3>
                <p>$${price.toLocaleString()}</p>
                <button class="btn-gold-fill btn-buy" ${p.agotado ? 'disabled' : ''}>
                    ${p.agotado ? 'Agotado' : 'Añadir al Joyero'}
                </button>
            `;

            const btn = card.querySelector('.btn-buy');
            if (btn && !p.agotado) {
                btn.addEventListener('click', () => {
                    addToCart({ id: p.id, name: p.nombre, price: price, img: img });
                });
            }
            catalogGrid.appendChild(card);
        });
    };

    // --- Event Listeners ---
    if (cartToggle) cartToggle.addEventListener('click', toggleCart);
    if (cartClose) cartClose.addEventListener('click', toggleCart);
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu joyero está vacío');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // Init
    updateCartUI();
    loadProducts();
});
