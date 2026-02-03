// actualystore/script.js - Lógica del Carrito Frontend

document.addEventListener('DOMContentLoaded', () => {
    // Selectores
    const cartToggle = document.getElementById('cart-btn-nav');
    const cartClose = document.getElementById('cart-close');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');
    const catalogContainer = document.getElementById('dynamic-catalog-container');

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

    cartToggle.addEventListener('click', toggleCart);

    // Cerrar carrito desde el header (X o texto "Seguir comprando")
    const closeTrigger = document.getElementById('cart-close-container') || cartClose;
    closeTrigger.addEventListener('click', toggleCart);

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

            if (result.success && catalogContainer) {
                renderErpCatalog(result.data);
            }
        } catch (e) {
            console.error('Error cargando catálogo:', e);
            if (catalogContainer) {
                catalogContainer.innerHTML = '<section class="products"><p style="text-align: center; color: var(--brand-red);">Ocurrió un error al conectar con ERPod.</p></section>';
            }
        }
    };

    // Estado Global de Productos
    let allProducts = [];
    let activeCategory = 'Todo';

    const renderErpCatalog = (products) => {
        allProducts = products;
        renderCategoryShowcase();
        renderCategoryFilters();
        renderProducts();
    };

    const renderCategoryShowcase = () => {
        const showcaseContainer = document.getElementById('category-cards-container');
        if (!showcaseContainer) return;

        // Categorías únicas
        const categories = [...new Set(allProducts.map(p => p.categoria || 'Otros'))];

        showcaseContainer.innerHTML = categories.map(cat => {
            // Obtener primer producto de la categoría para usar su imagen
            const product = allProducts.find(p => (p.categoria || 'Otros') === cat);
            const imageUrl = product && product.imagen_principal
                ? product.imagen_principal
                : 'https://via.placeholder.com/150?text=' + cat.substring(0, 3).toUpperCase();

            return `
            <div class="category-visual-card" onclick="selectCategoryFromShowcase('${cat}')">
                <img src="${imageUrl}" alt="${cat}" class="category-visual-img">
                <h3>${cat}</h3>
            </div>
            `;
        }).join('');

        // Exponer función de selección
        window.selectCategoryFromShowcase = (cat) => {
            activeCategory = cat;
            renderCategoryFilters();
            renderProducts();
            // Scroll suave a los productos
            document.getElementById('dynamic-catalog-container').scrollIntoView({ behavior: 'smooth' });
        };
    };

    const renderCategoryFilters = () => {
        const filterContainer = document.getElementById('category-filters');
        if (!filterContainer) return;

        // Obtener categorías únicas
        const categories = ['Todo', ...new Set(allProducts.map(p => p.categoria || 'Otros'))];

        filterContainer.innerHTML = categories.map(cat => `
            <button class="cat-pill ${cat === activeCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                ${cat}
            </button>
        `).join('');

        // Exponer función globalmente
        window.filterByCategory = (cat) => {
            activeCategory = cat;
            renderCategoryFilters(); // Re-render para actualizar estado activo
            renderProducts();
        };
    };

    const renderProducts = () => {
        catalogContainer.innerHTML = '';

        // Filtrar productos
        const filtered = activeCategory === 'Todo'
            ? allProducts
            : allProducts.filter(p => (p.categoria || 'Otros') === activeCategory);

        if (filtered.length === 0) {
            catalogContainer.innerHTML = '<section class="products"><p style="text-align: center;">No hay productos en esta categoría.</p></section>';
            return;
        }

        // Si es "Todo", mantenemos agrupación por secciones para orden visual?
        // O si ya filtramos, mostramos grid directo.
        // El usuario pidió: "ver todas las categorias y asi elegir cual".
        // Si elige una, mostramos grid. Si es Todo, mostramos grid mixto o secciones?
        // Vamos a hacer grid unificado para "Todo" para modernizar, o secciones si prefiere.
        // Mantengamos secciones para "Todo" para separar visualmente, y GRID único para categorías específicas.

        if (activeCategory === 'Todo') {
            const grouped = filtered.reduce((acc, p) => {
                const cat = p.categoria || 'Otros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(p);
                return acc;
            }, {});

            Object.keys(grouped).forEach(catName => {
                renderProductSection(catName, grouped[catName]);
            });
        } else {
            renderProductSection(activeCategory, filtered);
        }
    };

    const renderProductSection = (title, products) => {
        const section = document.createElement('section');
        section.className = 'products';

        // Animación de entrada suave
        section.style.animation = 'fadeIn 0.5s ease-out';

        section.innerHTML = `
            <h2 class="section-title">${title}</h2>
            <div class="product-grid"></div>
        `;

        const grid = section.querySelector('.product-grid');

        products.forEach(p => {
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

        catalogContainer.appendChild(section);
    };

    // --- Otros Event Listeners ---

    // Carga inicial
    updateCartUI();
    loadProducts();
});
