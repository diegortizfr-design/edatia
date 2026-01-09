/**
 * ERPod - POS Logic
 * Handles product search, cart management, billing process, and payment modal.
 */

let API_BILLING = '';
let API_PRODUCTS = '';
let API_DOCS = '';
let API_CLIENTS = ''; // Need clients too

// POS State
let cart = [];
let allProducts = [];
let selectedCustomer = { id: 1, nombre: 'Cliente Mostrador' }; // Default
let selectedDoc = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        const API_BASE = config.apiUrl;
        API_BILLING = `${API_BASE}/facturacion`;
        API_PRODUCTS = `${API_BASE}/productos`;
        API_DOCS = `${API_BASE}/documentos`;
        API_CLIENTS = `${API_BASE}/terceros`; // Assuming this endpoint exists

        initPOS();
        setupPaymentModal();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function initPOS() {
    loadProducts();
    loadPOSConfig();
    loadClients();
    setupEventListeners();
}

// --- DATA LOADING ---

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_PRODUCTS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            allProducts = data.data;
            renderProductGrid(allProducts);
        }
    } catch (e) { console.error('Error loading products:', e); }
}

async function loadPOSConfig() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_DOCS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const docSelect = document.getElementById('pos-document-type');
            docSelect.innerHTML = '<option value="">Seleccione Documento...</option>';

            // Filter for 'Factura' related categories
            const posDocs = data.data.filter(d =>
                d.categoria === 'Factura de Venta' ||
                d.categoria === 'Factura POS' ||
                d.categoria === 'Venta' ||
                d.categoria === 'FV'
            );

            posDocs.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${doc.nombre} (${doc.prefijo || ''}${doc.consecutivo_actual})`;
                opt.dataset.prefijo = doc.prefijo || '';
                opt.dataset.consecutivo = doc.consecutivo_actual;
                docSelect.appendChild(opt);
            });

            // Auto-select first if available
            if (posDocs.length > 0) {
                docSelect.value = posDocs[0].id; // Select first
                selectedDoc = posDocs[0];
                updateOrderNumDisplay();
            }

            docSelect.addEventListener('change', (e) => {
                selectedDoc = posDocs.find(d => d.id == e.target.value);
                updateOrderNumDisplay();
            });
        }
    } catch (e) { console.error('Error loading POS config:', e); }
}

function updateOrderNumDisplay() {
    const orderNum = document.querySelector('.order-num');
    if (orderNum && selectedDoc) {
        orderNum.textContent = `#${selectedDoc.prefijo || ''}${selectedDoc.consecutivo_actual}`;
    } else if (orderNum) {
        orderNum.textContent = '---';
    }
}

async function loadClients() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CLIENTS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('pos-client-select');
            select.innerHTML = '';

            // Add 'Cliente Mostrador' or general if not in list, usually ID 1 is generic or we add manually
            const clients = data.data.filter(c => c.es_cliente);

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre_comercial || c.razon_social;
                select.appendChild(opt);
            });

            select.addEventListener('change', (e) => {
                selectedCustomer = { id: e.target.value };
            });
        }
    } catch (e) { console.error(e); }
}

// --- UI LOGIC ---

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

        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') { e.preventDefault(); searchInput.focus(); }
        });
    }

    // Category filter
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const cat = tab.dataset.category;
            const filtered = cat === 'todos' ? allProducts : allProducts.filter(p => p.categoria && p.categoria.toLowerCase() === cat.toLowerCase());
            renderProductGrid(filtered);
        });
    });

    // Checkout Button
    document.getElementById('btn-cobrar')?.addEventListener('click', openPaymentModal);
}

function renderProductGrid(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(p => {
        if (!p.activo) return; // Skip inactive

        // Stock Display Logic
        let stockLabel = '';
        let noStock = false;

        if (p.afecta_inventario) {
            const stock = p.stock_actual || 0;
            if (stock <= 0) {
                stockLabel = '<span style="color:red; font-size:0.8rem;">Sin Stock</span>';
                noStock = true;
            } else {
                stockLabel = `<span style="color:green; font-size:0.8rem;">Stock: ${stock}</span>`;
            }
        }

        const card = document.createElement('div');
        card.className = `product-card ${noStock ? 'disabled' : ''}`;
        if (noStock) card.style.opacity = '0.6';

        card.innerHTML = `
            <div class="p-image" style="background-image: url('${p.imagen_url || ''}'); background-color: #f3f3f3;"></div>
            <div class="p-details">
                <h4>${p.nombre}</h4>
                <div style="display:flex; justify-content:space-between;">
                    <span class="price">$${parseFloat(p.precio1).toLocaleString()}</span>
                    ${stockLabel}
                </div>
            </div>
        `;

        if (!noStock) {
            card.onclick = () => addToCart(p);
        }
        container.appendChild(card);
    });
}

function addToCart(product) {
    // 1. Check if affects inventory and has stock
    if (product.afecta_inventario) {
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.cantidad : 0;
        const available = product.stock_actual || 0;

        if (currentQty + 1 > available) {
            showNotification(`Stock insuficiente. Disponible: ${available}`, 'warning');
            return;
        }
    }

    // 2. Add
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.cantidad++;
    } else {
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: parseFloat(product.precio1),
            impuesto_porcentaje: parseFloat(product.impuesto_porcentaje) || 0,
            cantidad: 1,
            afecta_inventario: product.afecta_inventario,
            stock_max: product.stock_actual // Keep ref just in case
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
        summaryRows[0].textContent = `$${subtotal.toLocaleString()}`;
        summaryRows[1].textContent = `$${total.toLocaleString()}`;
    }

    // Store logic total for modal
    window.currentCartTotal = total;
    window.currentCartSubtotal = subtotal;
    window.currentCartTaxes = taxes;
}

// --- PAYMENT MODAL LOGIC ---

function setupPaymentModal() {
    // Close Btns
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.target).style.display = 'none';
        });
    });

    // Payment Type Toggle (Contado/Credito)
    window.setPaymentType = (type) => {
        document.getElementById('pago-tipo').value = type;
        document.querySelectorAll('.btn-toggle').forEach(b => {
            if (b.dataset.value === type) b.classList.add('active');
            else b.classList.remove('active');
        });

        const sectionContado = document.getElementById('section-contado');
        if (type === 'Contado') {
            sectionContado.style.display = 'block';
            calcChange(); // Recalc
        } else {
            sectionContado.style.display = 'none';
        }
    };

    // Amount Input Calculation
    document.getElementById('pago-monto').addEventListener('input', calcChange);

    // Confirm Button
    document.getElementById('btn-finalizar-venta').addEventListener('click', processFullSale);
}

function openPaymentModal() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'warning');
        return;
    }
    if (!selectedDoc) {
        showNotification('Seleccione un Tipo de Documento', 'error');
        return;
    }

    const modal = document.getElementById('modal-pago');
    const total = window.currentCartTotal || 0;
    document.getElementById('pago-total-display').textContent = `$${total.toLocaleString()}`;

    // Reset fields
    document.getElementById('pago-monto').value = '';
    document.getElementById('pago-cambio').textContent = '$0.00';
    setPaymentType('Contado'); // Default

    modal.style.display = 'flex';
    document.getElementById('pago-monto').focus();
}

function calcChange() {
    const total = window.currentCartTotal || 0;
    const paid = parseFloat(document.getElementById('pago-monto').value) || 0;
    const type = document.getElementById('pago-tipo').value;

    if (type === 'Contado') {
        const change = paid - total;
        document.getElementById('pago-cambio').textContent = `$${change < 0 ? 0 : change.toLocaleString()}`;
        document.getElementById('pago-cambio').style.color = change < 0 ? 'red' : 'green';
    }
}

async function processFullSale() {
    try {
        const token = localStorage.getItem('token');
        const total = window.currentCartTotal || 0;
        const subtotal = window.currentCartSubtotal || 0;
        const impuestos = window.currentCartTaxes || 0;

        const tipoPago = document.getElementById('pago-tipo').value; // Contado/Credito
        const metodoPago = document.getElementById('pago-metodo').value; // Efectivo/Tarjeta...
        const montoPagado = parseFloat(document.getElementById('pago-monto').value) || 0;

        // Validation for Contado
        if (tipoPago === 'Contado' && montoPagado < total) {
            showNotification('El monto recibido es insuficiente', 'warning');
            return;
        }

        const devuelta = (tipoPago === 'Contado') ? (montoPagado - total) : 0;

        // Prepare Items
        const saleItems = cart.map(item => {
            const itemSub = item.precio * item.cantidad;
            return {
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio,
                impuesto_porcentaje: item.impuesto_porcentaje,
                subtotal: itemSub
            };
        });

        const body = {
            documento_id: selectedDoc.id,
            cliente_id: selectedCustomer.id || 1, // Default to 1 (Generic) if null
            subtotal: subtotal,
            impuesto_total: impuestos,
            total: total,
            tipo_pago: tipoPago,
            metodo_pago: metodoPago,
            monto_pagado: montoPagado,
            devuelta: devuelta,
            items: saleItems
        };

        // Loading state
        const btn = document.getElementById('btn-finalizar-venta');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btn.disabled = true;

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
            // SUCCESS
            document.getElementById('modal-pago').style.display = 'none';

            // Show Receipt Modal
            const receiptModal = document.getElementById('modal-recibo');
            document.getElementById('recibo-info').textContent = `Factura: ${data.numero}`;
            document.getElementById('recibo-extra').textContent = data.recibo ? `+ Recibo de Caja: ${data.recibo}` : '';

            receiptModal.style.display = 'flex';

            // Reset
            cart = [];
            renderCart();
            loadProducts(); // Update stock locally
            loadPOSConfig(); // Consecutive update

        } else {
            showNotification(data.message, 'error');
        }

        // Restore Button
        btn.innerHTML = origText;
        btn.disabled = false;

    } catch (e) {
        console.error(e);
        showNotification('Error de conexión al facturar', 'error');
    }
}
