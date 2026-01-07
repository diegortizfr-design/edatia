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

    // --- Carga de API ERPod ---
    const NIT = '1143875756';
    const API_URL = `https://api-erpod.onrender.com/api/public/ecommerce/${NIT}`;

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

    const renderErpCatalog = (products) => {
        catalogContainer.innerHTML = '';
        if (products.length === 0) {
            catalogContainer.innerHTML = '<section class="products"><p style="text-align: center;">No hay productos disponibles por ahora.</p></section>';
            return;
        }

        // Agrupar por categoría
        const grouped = products.reduce((acc, p) => {
            const cat = p.categoria || 'Otros';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {});

        // Renderizar cada categoría como una sección
        Object.keys(grouped).forEach(catName => {
            const productsInCat = grouped[catName];

            const section = document.createElement('section');
            section.className = 'products';
            section.id = 'catalogo'; // Punto de anclaje genérico

            section.innerHTML = `
                <h2 class="section-title">${catName}</h2>
                <div class="product-grid"></div>
            `;

            const grid = section.querySelector('.product-grid');

            productsInCat.forEach(p => {
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
                            name: p.nombre,
                            price: p.precio,
                            img: p.imagen_principal || 'https://via.placeholder.com/300x300?text=No+Image'
                        });
                    });
                }

                grid.appendChild(card);
            });

            catalogContainer.appendChild(section);
        });
    };

    // --- Otros Event Listeners ---

    // Carga inicial
    updateCartUI();
    loadProducts();
});
