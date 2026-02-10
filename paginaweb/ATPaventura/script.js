document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('atpCart')) || [];
    let activeCategory = 'Todo';
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
        const categories = ['Todo', ...new Set(allProducts.map(p => p.categoria || 'Otros'))];

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
        if (activeCategory !== 'Todo') {
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
                        <img src="${image}" alt="${p.nombre}" class="product-img">
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

    // Handle checkout form submission
    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
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
                producto_id: item.id,
                cantidad: item.quantity,
                precio_unitario: item.price
            }))
        };

        try {
            const response = await fetch(`${CONFIG.API_URL}/${CONFIG.NIT}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('¡Pedido confirmado! Nos pondremos en contacto contigo pronto.');
                cart = [];
                updateCartUI();
                closeCheckoutModal();
                closeCart();
            } else {
                alert('Error al procesar el pedido: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error al enviar el pedido. Por favor intenta nuevamente.');
        }
    });

    // --- UI EVENTS ---
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }

    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    if (cartContinue) cartContinue.addEventListener('click', closeCart);

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.style.padding = '1rem 5%';
            nav.style.background = 'rgba(5, 5, 5, 0.95)';
        } else {
            nav.style.padding = '1.5rem 5%';
            nav.style.background = 'rgba(5, 5, 5, 0.8)';
        }
    });
});
