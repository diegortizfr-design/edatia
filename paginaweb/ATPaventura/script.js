document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('atpCart')) || [];
    let activeCategory = 'TODO';
    let paises = [];
    let departamentos = [];
    let ciudades = [];

    // --- DOM ELEMENTS ---
    const productsContainer = document.getElementById('products-container');
    const categoryFilters = document.getElementById('category-filters');
    const cartBtn = document.getElementById('cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartClose = document.getElementById('cart-close');
    const cartContinue = document.getElementById('cart-continue');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalValue = document.getElementById('cart-total-value');
    const cartCountBadge = document.getElementById('cart-count');

    // --- INITIALIZATION ---
    fetchProducts();
    fetchGeographicData();
    updateCartUI();

    // --- API FETCH ---
    async function fetchProducts() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/${CONFIG.NIT}`);
            const result = await response.json();

            if (result.success) {
                allProducts = result.data;
                renderFilters();
                renderProducts();
            } else {
                productsContainer.innerHTML = `<p style="text-align:center; color: var(--accent-red);">Error al cargar productos: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            productsContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No se pudo conectar con el catálogo.</p>';
        }
    }

    async function fetchGeographicData() {
        try {
            // Fetch countries (public endpoint needed or hardcoded)
            // For now, we'll hardcode Colombia since it's seeded
            paises = [{ id: 1, nombre: 'Colombia', codigo: 'CO' }];

            // Populate country select
            const paisSelect = document.getElementById('checkout_pais');
            if (paisSelect) {
                paisSelect.innerHTML = '<option value="">Seleccione...</option>' +
                    paises.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('Error fetching geographic data:', error);
        }
    }

    // Geographic cascading selects
    window.onPaisChange = async () => {
        const paisId = document.getElementById('checkout_pais').value;
        const deptSelect = document.getElementById('checkout_departamento');
        const citySelect = document.getElementById('checkout_ciudad');

        if (!paisId) {
            deptSelect.innerHTML = '<option value="">Primero seleccione un país</option>';
            citySelect.innerHTML = '<option value="">Primero seleccione un departamento</option>';
            return;
        }

        try {
            // Fetch departments for selected country
            const response = await fetch(`https://erpod.onrender.com/api/public/ecommerce/${CONFIG.NIT}/departamentos?pais_id=${paisId}`);
            const result = await response.json();

            if (result.success) {
                departamentos = result.data;
                deptSelect.innerHTML = '<option value="">Seleccione...</option>' +
                    departamentos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
                citySelect.innerHTML = '<option value="">Primero seleccione un departamento</option>';
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            deptSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    window.onDepartamentoChange = async () => {
        const deptId = document.getElementById('checkout_departamento').value;
        const citySelect = document.getElementById('checkout_ciudad');

        if (!deptId) {
            citySelect.innerHTML = '<option value="">Primero seleccione un departamento</option>';
            return;
        }

        try {
            const response = await fetch(`https://erpod.onrender.com/api/public/ecommerce/${CONFIG.NIT}/ciudades?departamento_id=${deptId}`);
            const result = await response.json();

            if (result.success) {
                ciudades = result.data;
                citySelect.innerHTML = '<option value="">Seleccione...</option>' +
                    ciudades.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
            citySelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    // --- RENDER FUNCTIONS ---
    function renderFilters() {
        const categories = ['TODO', ...new Set(allProducts.map(p => p.categoria || 'Otros'))];

        categoryFilters.innerHTML = categories.map(cat => `
            <button class="filter-btn ${cat === activeCategory ? 'active' : ''}" 
                    onclick="setCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    }

    window.setCategory = (cat) => {
        activeCategory = cat;
        renderFilters();
        renderProducts();
    };

    function renderProducts() {
        let filtered = allProducts;
        if (activeCategory !== 'TODO') {
            filtered = allProducts.filter(p => (p.categoria || 'Otros') === activeCategory);
        }

        if (filtered.length === 0) {
            productsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No hay productos en esta categoría.</p>';
            return;
        }

        productsContainer.innerHTML = filtered.map(p => {
            const image = p.imagen_principal || 'https://via.placeholder.com/300x400?text=Sin+Imagen';
            const price = parseFloat(p.precio).toLocaleString('es-CO');
            const isAgotado = p.agotado;

            return `
                <div class="product-card">
                    <div style="overflow: hidden;">
                        <img src="${image}" alt="Producto: ${p.nombre} - ATP Aventura" class="product-img" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${p.nombre}</h3>
                        <p class="product-price">$${price}</p>
                        
                        ${isAgotado
                    ? '<button class="btn-add" disabled style="opacity: 0.5; cursor: not-allowed;">Agotado</button>'
                    : `<button class="btn-add" onclick="addToCart('${p.id}')">Agregar al Carrito</button>`
                }
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- CART LOGIC ---
    window.addToCart = (id) => {
        const product = allProducts.find(p => p.id == id);
        if (!product) return;

        const existing = cart.find(item => item.id == id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.nombre,
                price: parseFloat(product.precio),
                img: product.imagen_principal || 'https://via.placeholder.com/80',
                quantity: 1
            });
        }

        updateCartUI();
        openCart();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    window.updateQty = (index, change) => {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    function updateCartUI() {
        localStorage.setItem('atpCart', JSON.stringify(cart));

        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCountBadge.textContent = count;
        cartCountBadge.style.display = count > 0 ? 'block' : 'none';

        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        cartTotalValue.textContent = `$${total.toLocaleString('es-CO')}`;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">Tu carrito está vacío.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div style="flex: 1;">
                        <h5 style="color: var(--text-primary); margin-bottom: 5px;">${item.name}</h5>
                        <div style="color: var(--accent-gold); font-size: 0.9rem;">$${(item.price * item.quantity).toLocaleString('es-CO')}</div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                            <button onclick="updateQty(${index}, -1)" style="background: #333; color: white; border: none; width: 25px; height: 25px; cursor: pointer;">-</button>
                            <span style="color: var(--text-primary); font-size: 0.9rem;">${item.quantity}</span>
                            <button onclick="updateQty(${index}, 1)" style="background: #333; color: white; border: none; width: 25px; height: 25px; cursor: pointer;">+</button>
                        </div>
                    </div>
                    <span onclick="removeFromCart(${index})" style="color: var(--accent-red); cursor: pointer; font-size: 1.2rem;">&times;</span>
                </div>
            `).join('');
        }
    }

    // --- CHECKOUT MODAL ---
    window.startCheckout = () => {
        if (cart.length === 0) return alert('El carrito está vacío');

        // Open checkout modal
        document.getElementById('checkoutModal').style.display = 'flex';

        // Setup event listeners for cascading selects
        document.getElementById('checkout_pais').addEventListener('change', onPaisChange);
        document.getElementById('checkout_departamento').addEventListener('change', onDepartamentoChange);
    };

    window.closeCheckoutModal = () => {
        document.getElementById('checkoutModal').style.display = 'none';
        document.getElementById('checkoutForm').reset();
    };

    // Variables to store current order data
    let currentOrderData = null;

    // Handle checkout form submission
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Prepare data
        currentOrderData = {
            cliente: {
                nombre: document.getElementById('checkout_nombre').value,
                tipo_documento: document.getElementById('checkout_tipo_documento').value,
                documento: document.getElementById('checkout_documento').value,
                telefono: document.getElementById('checkout_telefono').value,
                email: document.getElementById('checkout_email').value,
                pais_id: document.getElementById('checkout_pais').value,
                departamento_id: document.getElementById('checkout_departamento').value,
                ciudad_id: document.getElementById('checkout_ciudad').value,
                direccion: document.getElementById('checkout_direccion').value,
                direccion_adicional: document.getElementById('checkout_direccion_adicional').value
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                cantidad: item.quantity,
                precio_unitario: item.price
            }))
        };

        // 2. Register order in database first (to ensure persistence)
        try {
            const response = await fetch(`${CONFIG.API_URL}/${CONFIG.NIT}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente: currentOrderData.cliente,
                    items: currentOrderData.items.map(i => ({
                        producto_id: i.id,
                        cantidad: i.cantidad,
                        precio_unitario: i.precio_unitario
                    }))
                })
            });

            const result = await response.json();

            if (result.success) {
                currentOrderData.numero_pedido = result.numero_pedido;
                // 3. Show Success Modal with Summary
                closeCheckoutModal();
                showOrderSuccessModal(currentOrderData);
            } else {
                alert('Error al registrar pedido: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error al conectar con el servidor.');
        }
    });

    function showOrderSuccessModal(order) {
        const modal = document.getElementById('successModal');
        const summaryContent = document.getElementById('order-summary-content');
        const clientDetailsEl = document.getElementById('summary-client-details');
        const whatsappBtn = document.getElementById('whatsapp-order-btn');

        // Find city and department names
        const dept = departamentos.find(d => d.id == order.cliente.departamento_id);
        const city = ciudades.find(c => c.id == order.cliente.ciudad_id);
        const cityLabel = city ? city.nombre : 'No especificada';
        const deptLabel = dept ? dept.nombre : '';

        // Populate client details in the modal
        clientDetailsEl.innerHTML = `
            <strong>Nombre:</strong> ${order.cliente.nombre}<br>
            <strong>Documento:</strong> ${order.cliente.tipo_documento} ${order.cliente.documento}<br>
            <strong>Dirección:</strong> ${order.cliente.direccion}<br>
            ${order.cliente.direccion_adicional ? `<strong>Adicional:</strong> ${order.cliente.direccion_adicional}<br>` : ''}
            <strong>Ciudad:</strong> ${cityLabel} ${deptLabel ? `- ${deptLabel}` : ''}
        `;

        const total = order.items.reduce((acc, i) => acc + (i.precio_unitario * i.cantidad), 0);

        // Build items HTML
        let itemsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">
                <span style="color: var(--text-primary); font-size: 0.9rem;">${item.cantidad}x ${item.name}</span>
                <span style="color: var(--accent-gold); font-size: 0.9rem;">$${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
            </div>
        `).join('');

        summaryContent.innerHTML = `
            ${itemsHtml}
            <div style="display: flex; justify-content: space-between; margin-top: 15px; font-weight: bold; border-top: 1px solid var(--accent-gold); padding-top: 10px;">
                <span style="color: var(--text-primary);">TOTAL</span>
                <span style="color: var(--accent-gold);">$${total.toLocaleString('es-CO')}</span>
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary); text-align: right;">
                Pedido #${order.numero_pedido}
            </div>
        `;

        modal.style.display = 'flex';

        // Update WhatsApp button handler
        whatsappBtn.onclick = () => {
            let message = `*NUEVO PEDIDO - AVENTURA EXTREMA*\n\n`;
            message += `*CLIENTE:*\n`;
            message += `- Nombre: ${order.cliente.nombre}\n`;
            message += `- Doc: ${order.cliente.tipo_documento} ${order.cliente.documento}\n`;
            message += `- Tel: ${order.cliente.telefono}\n\n`;

            message += `*DATOS DE ENVÍO:*\n`;
            message += `- Dirección: ${order.cliente.direccion}\n`;
            if (order.cliente.direccion_adicional) message += `- Adicional: ${order.cliente.direccion_adicional}\n`;
            message += `- Ciudad: ${cityLabel} ${deptLabel}\n\n`;

            message += `*PRODUCTOS:*\n`;
            order.items.forEach(item => {
                message += `- ${item.cantidad}x ${item.name} ($${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')})\n`;
            });

            message += `\n*TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*\n`;
            message += `*Pedido #:* ${order.numero_pedido}\n\n`;
            message += `_Hola, acabo de confirmar mi pedido en la web. Por favor ayúdenme con el pago y despacho._`;

            const whatsappUrl = `https://wa.me/573217917076?text=${encodeURIComponent(message)}`;

            // Clear cart and redirect
            cart = [];
            updateCartUI();
            localStorage.removeItem('atpCart');
            window.open(whatsappUrl, '_blank');
            modal.style.display = 'none';
            location.reload(); // Refresh to clean state after purchase
        };
    }

    window.closePaymentModal = () => {
        document.getElementById('paymentModal').style.display = 'none';
    };

    // --- UI EVENTS ---
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }

    // Toggle Mobile Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.querySelector('.nav-links');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon (optional)
            hamburgerBtn.classList.toggle('fa-bars');
            hamburgerBtn.classList.toggle('fa-times');
        });
    }

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (hamburgerBtn) {
                hamburgerBtn.classList.add('fa-bars');
                hamburgerBtn.classList.remove('fa-times');
            }
        });
    });

    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    if (cartContinue) cartContinue.addEventListener('click', closeCart);

    // Contact Form Handler
    const contactBtn = document.querySelector('.contact-form .btn-primary');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            alert('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto con total discreción.');
            // Optionally clear the form
            document.querySelector('.contact-form').reset();
        });
    }

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
});
