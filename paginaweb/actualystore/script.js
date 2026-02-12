// actualystore/script.js - Lógica del Carrito Frontend

document.addEventListener('DOMContentLoaded', () => {
    // Selectores
    const cartToggle = document.getElementById('cart-btn-nav');
    const cartClose = document.getElementById('cart-close');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');

    let cart = JSON.parse(localStorage.getItem('actualyCart')) || [];

    // --- Funciones del Carrito ---

    const toggleCart = () => {
        cartSidebar.classList.toggle('active');
    };

    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">El carrito está vacío</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                count += item.quantity;

                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toLocaleString()}</p>
                        <div class="cart-item-qty">
                            <button onclick="updateQty(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <span onclick="removeFromCart(${index})" style="cursor:pointer; color: var(--brand-red); font-weight: bold; font-size: 1.2rem;">&times;</span>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
        }

        cartCountBadge.textContent = count;
        cartTotalDisplay.textContent = `$${total.toLocaleString()}`;
        localStorage.setItem('actualyCart', JSON.stringify(cart));
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartUI();
        if (!cartSidebar.classList.contains('active')) toggleCart();
    };

    window.updateQty = (index, change) => {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    // --- Event Listeners ---

    if (cartToggle) cartToggle.addEventListener('click', toggleCart);

    // Cerrar carrito desde el header (X o texto "Seguir comprando")
    const closeTrigger = document.getElementById('cart-close-container') || cartClose;
    if (closeTrigger) closeTrigger.addEventListener('click', toggleCart);

    // Cerrar carrito desde el botón del footer
    const continueBtn = document.getElementById('cart-continue-btn');
    if (continueBtn) continueBtn.addEventListener('click', toggleCart);

    // Ir a Checkout
    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    // --- Menú Móvil Hamburger ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.querySelector('nav ul');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        navMenu.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // --- Carga de API ERPod ---
    const NIT = '1005892267';
    const API_URL = `https://erpod.onrender.com/api/public/ecommerce/${NIT}`;

    const loadProducts = async () => {
        try {
            const resp = await fetch(API_URL);
            const result = await resp.json();

            if (result.success) {
                renderErpCatalog(result.data);
            } else {
                console.error('API Error:', result.message);
                const grid = document.getElementById('dynamic-catalog-grid');
                if (grid) {
                    grid.innerHTML = `<div style="text-align: center; width: 100%; padding: 50px;"><p style="color: var(--brand-red);">Error del servidor: ${result.message || 'No se pudieron cargar los productos'}.</p></div>`;
                }
            }
        } catch (e) {
            console.error('Error cargando catálogo:', e);
            const grid = document.getElementById('dynamic-catalog-grid');
            if (grid) {
                grid.innerHTML = '<div style="text-align: center; width: 100%; padding: 50px;"><p style="color: var(--brand-red);">Ocurrió un error al conectar con ERPod.</p></div>';
            }
        }
    };

    // Estado Global de Productos
    let allProducts = [];
    let activeCategory = 'Todo';

    const renderErpCatalog = (products) => {
        allProducts = products;
        renderCategoryFilters();
        renderProducts();
    };

    const renderCategoryFilters = () => {
        const filterContainer = document.getElementById('category-filters-sidebar');
        if (!filterContainer) return;

        // Calculate counts
        const counts = allProducts.reduce((acc, p) => {
            const cat = p.categoria || 'Otros';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        const categories = ['Todo', ...new Set(allProducts.map(p => p.categoria || 'Otros'))];

        filterContainer.innerHTML = categories.map(cat => {
            const count = cat === 'Todo' ? allProducts.length : (counts[cat] || 0);
            return `
            <button class="filter-btn-sidebar ${cat === activeCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                <span>${cat}</span>
                <span class="filter-count">${count}</span>
            </button>
            `;
        }).join('');

        // Exponer función globalmente
        window.filterByCategory = (cat) => {
            activeCategory = cat;
            renderCategoryFilters(); // Update active state
            renderProducts();

            // Scroll to top of grid on mobile
            if (window.innerWidth <= 900) {
                const grid = document.getElementById('dynamic-catalog-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    };

    const renderProducts = () => {
        const catalogGrid = document.getElementById('dynamic-catalog-grid');
        if (!catalogGrid) return;

        catalogGrid.innerHTML = '';

        // Filtrar productos
        const filtered = activeCategory === 'Todo'
            ? allProducts
            : allProducts.filter(p => (p.categoria || 'Otros') === activeCategory);

        if (filtered.length === 0) {
            catalogGrid.innerHTML = '<div style="text-align: center; width: 100%; padding: 50px;"><p>No hay productos en esta categoría.</p></div>';
            return;
        }

        // Header for Grid
        const header = document.createElement('div');
        header.className = 'catalog-header-unified';
        header.innerHTML = `<h2 class="catalog-title-unified">${activeCategory}</h2><p>${filtered.length} productos</p>`;
        catalogGrid.appendChild(header);

        // Grid Container
        const grid = document.createElement('div');
        grid.className = 'products-grid-unified';

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const buttonHtml = p.agotado
                ? `<button class="btn-primary" style="background: #9CA3AF; cursor: not-allowed; width: 100%; border: none; padding: 12px; border-radius: 12px;" disabled>Agotado</button>`
                : `<button class="btn-buy btn-primary" style="width: 100%; border: none; padding: 12px; border-radius: 12px;">Comprar</button>`;

            card.innerHTML = `
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 15px; background: #f9fafb; margin-bottom: 15px;">
                    <img src="${p.imagen_principal || 'https://via.placeholder.com/300x300?text=No+Image'}" alt="${p.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <h3>${p.nombre}</h3>
                <p style="font-weight: 700; color: var(--brand-blue); font-size: 1.2rem; margin-bottom: 15px;">$${p.precio.toLocaleString()}</p>
                ${buttonHtml}
            `;

            const buyBtn = card.querySelector('.btn-buy');
            if (buyBtn) {
                buyBtn.addEventListener('click', () => {
                    addToCart({
                        id: p.id,
                        name: p.nombre,
                        price: p.precio,
                        img: p.imagen_principal || 'https://via.placeholder.com/300x300?text=No+Image'
                    });
                });
            }

            grid.appendChild(card);
        });

        catalogGrid.appendChild(grid);
    };

    // --- Otros Event Listeners ---

    // Carga inicial
    updateCartUI();
    loadProducts();
});
