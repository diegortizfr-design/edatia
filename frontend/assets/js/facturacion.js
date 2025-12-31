/**
 * ERPod - POS Logic
 * Handles product search, cart management, and billing process.
 */

let API_BILLING = '';
let API_PRODUCTS = '';
let API_DOCS = '';

// POS State
let cart = [];
let allProducts = [];
let selectedCustomer = { id: null, nombre: 'Cliente Mostrador' };
let selectedDoc = null; // We'll fetch available POS document types

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        const API_BASE = config.apiUrl;
        API_BILLING = `${API_BASE}/facturacion`;
        API_PRODUCTS = `${API_BASE}/productos`;
        API_DOCS = `${API_BASE}/documentos`;

        initPOS();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function initPOS() {
    loadProducts();
    loadPOSConfig(); // To get the invoice consecutive/type
    setupEventListeners();
}

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_PRODUCTS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            allProducts = data.data;
            renderProductGrid(allProducts);
        }
    } catch (e) {
        console.error('Error loading products:', e);
    }
}

async function loadPOSConfig() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_DOCS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            // Find a POS or Invoice document type
            selectedDocType = data.data.find(d => d.categoria === 'Factura POS' || d.categoria === 'Factura Venta');
            if (selectedDocType) {
                const orderNum = document.querySelector('.order-num');
                if (orderNum) orderNum.textContent = `#${selectedDocType.prefijo || ''}${selectedDocType.consecutivo_actual}`;
            }
        }
    } catch (e) {
        console.error('Error loading POS config:', e);
    }
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                (p.codigo && p.codigo.toLowerCase().includes(term))
            );
            renderProductGrid(filtered);
        });

        // F3 focus
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // Category filter
    const tabs = document.querySelectorAll('.category-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const cat = tab.dataset.category;
            const filtered = cat === 'todos' ? allProducts : allProducts.filter(p => p.categoria.toLowerCase() === cat.toLowerCase());
            renderProductGrid(filtered);
        });
    });

    // Checkout
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => processSale('Efectivo'));
    }

    document.querySelector('.btn-pay.cash')?.addEventListener('click', () => processSale('Efectivo'));
    document.querySelector('.btn-pay.card-pay')?.addEventListener('click', () => processSale('Tarjeta'));
}

function renderProductGrid(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(p => {
        if (!p.activo) return;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="p-image" style="background-image: url('${p.imagen_url || ''}'); background-color: #f3f3f3;"></div>
            <div class="p-details">
                <h4>${p.nombre}</h4>
                <span class="price">$${parseFloat(p.precio1).toLocaleString()}</span>
            </div>
        `;
        card.onclick = () => addToCart(p);
        container.appendChild(card);
    });
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.cantidad++;
    } else {
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: parseFloat(product.precio1),
            impuesto_porcentaje: parseFloat(product.impuesto_porcentaje) || 0,
            cantidad: 1
        });
    }
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    container.innerHTML = '';

    let subtotal = 0;
    let taxes = 0;

    cart.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        const itemTax = itemTotal * (item.impuesto_porcentaje / 100);

        subtotal += itemTotal;
        taxes += itemTax;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <strong>${item.nombre}</strong>
                <small>${item.cantidad} x $${item.precio.toLocaleString()}</small>
            </div>
            <div class="item-total">$${itemTotal.toLocaleString()}</div>
            <button class="remove-btn" onclick="event.stopPropagation(); removeFromCart(${item.id})"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });

    const total = subtotal + taxes;

    // Update summary
    const summaryRows = document.querySelectorAll('.summary-row span:last-child');
    if (summaryRows.length >= 2) {
        summaryRows[0].textContent = `$${subtotal.toLocaleString()}`; // Subtotal
        summaryRows[1].textContent = `$${total.toLocaleString()}`;    // Total
    }
}

async function processSale(method) {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'warning');
        return;
    }

    if (!selectedDocType) {
        showNotification('Configure un tipo de documento (Factura POS) para continuar', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');

        let subtotal = 0;
        let impuesto_total = 0;

        const saleItems = cart.map(item => {
            const itemSub = item.precio * item.cantidad;
            const itemTax = itemSub * (item.impuesto_porcentaje / 100);
            subtotal += itemSub;
            impuesto_total += itemTax;

            return {
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio,
                impuesto_porcentaje: item.impuesto_porcentaje,
                subtotal: itemSub
            };
        });

        const total = subtotal + impuesto_total;

        const body = {
            documento_id: selectedDocType.id,
            cliente_id: selectedCustomer.id,
            subtotal,
            impuesto_total,
            total,
            metodo_pago: method,
            items: saleItems
        };

        const resp = await fetch(API_BILLING, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification(`Venta Exitosa: ${data.numero}`, 'success');
            cart = [];
            renderCart();
            loadProducts(); // Refresh stock
            loadPOSConfig(); // Update next consecutive
        } else {
            showNotification(data.message, 'error');
        }

    } catch (e) {
        console.error('Checkout error:', e);
        showNotification('Error al procesar la venta', 'error');
    }
}
