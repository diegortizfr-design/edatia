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
let selectedSeller = null;
let selectedDoc = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        const API_BASE = config.apiUrl;
        API_BILLING = `${API_BASE}/facturacion`;
        API_PRODUCTS = `${API_BASE}/productos`;
        API_DOCS = `${API_BASE}/documentos`;
        API_CLIENTS = `${API_BASE}/terceros`;
        API_USERS = `${API_BASE}/usuarios`;

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
    loadSellers();
    setupEventListeners();
}

// --- DATA LOADING ---

// --- DATA LOADING ---

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        let url = API_PRODUCTS;
        if (selectedDoc && selectedDoc.sucursal_id) {
            url += `?sucursal_id=${selectedDoc.sucursal_id}`;
        }
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            allProducts = data.data;
            renderCategoryTabs(allProducts); // New: Dynamic Categories
            renderProductGrid(allProducts);
        }
    } catch (e) { console.error('Error loading products:', e); }
}

let availableCategories = [];

function renderCategoryTabs(products) {
    const optionsList = document.getElementById('category-options-list');
    const searchInput = document.getElementById('category-search-input');

    if (!optionsList || !searchInput) return;

    // Get unique categories
    availableCategories = ['Todos', ...new Set(products.map(p => p.categoria || 'Sin Categoría').filter(c => c))];

    renderCategoryOptions(availableCategories);

    // Setup searchable dropdown events
    searchInput.onfocus = () => {
        optionsList.style.display = 'block';
        updateCategoryOptionsList(searchInput.value);
    };

    searchInput.oninput = (e) => {
        updateCategoryOptionsList(e.target.value);
    };

    // Close when clicking outside
    document.addEventListener('mousedown', (e) => {
        const container = document.getElementById('category-dropdown-container');
        if (container && !container.contains(e.target)) {
            optionsList.style.display = 'none';
        }
    });
}

function updateCategoryOptionsList(term) {
    const normalizedTerm = (term || '').toLowerCase();
    const filtered = availableCategories.filter(cat => cat.toLowerCase().includes(normalizedTerm));
    renderCategoryOptions(filtered);
}

let currentSelectedCategory = 'Todos';

function renderCategoryOptions(categoriesToShow) {
    const optionsList = document.getElementById('category-options-list');
    if (!optionsList) return;

    optionsList.innerHTML = '';
    categoriesToShow.forEach(cat => {
        const div = document.createElement('div');
        div.className = `category-option ${cat === currentSelectedCategory ? 'active' : ''}`;
        div.textContent = cat;
        div.onclick = (e) => {
            e.stopPropagation();
            filterByCategory(cat);
            optionsList.style.display = 'none';
            // If "Todos" is selected, keep search clear, otherwise show category
            const searchInput = document.getElementById('category-search-input');
            if (cat === 'Todos') searchInput.value = '';
            else searchInput.value = cat;
        };
        optionsList.appendChild(div);
    });

    if (categoriesToShow.length === 0) {
        optionsList.innerHTML = '<div class="category-option" style="color:gray; font-style:italic;">No encontrado</div>';
    }
}

function filterByCategory(cat) {
    currentSelectedCategory = cat;

    // Render grid
    if (cat === 'Todos') {
        renderProductGrid(allProducts);
    } else {
        renderProductGrid(allProducts.filter(p => (p.categoria || 'Sin Categoría') === cat));
    }
}

async function loadPOSConfig() {
    // ... (unchanged) ...
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_DOCS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const docSelect = document.getElementById('pos-document-type');
            docSelect.innerHTML = '<option value="">Seleccione Documento...</option>';

            const posDocs = data.data.filter(d =>
                ['factura de venta', 'factura pos', 'venta', 'fv'].includes((d.categoria || '').toLowerCase())
            );

            posDocs.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${doc.nombre} (${doc.prefijo || ''}${doc.consecutivo_actual})`;
                opt.dataset.prefijo = doc.prefijo || '';
                opt.dataset.consecutivo = doc.consecutivo_actual;
                docSelect.appendChild(opt);
            });

            if (posDocs.length > 0) {
                docSelect.value = posDocs[0].id; // Select first
                selectedDoc = posDocs[0];
                updateOrderNumDisplay();
            }

            docSelect.addEventListener('change', (e) => {
                selectedDoc = posDocs.find(d => d.id == e.target.value);
                updateOrderNumDisplay();
                loadProducts(); // Reload stock for the new branch
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

            const clients = data.data.filter(c => c.es_cliente);

            let defaultClient = clients.find(c => c.documento === '22222222222');
            if (!defaultClient && clients.length > 0) defaultClient = clients[0];

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                // FIX: Use 'documento' instead of 'numero_documento'
                opt.textContent = `${c.nombre_comercial || c.razon_social || c.nombre} - ${c.documento || 'Sin NIT'}`;
                if (defaultClient && c.id === defaultClient.id) opt.selected = true;
                select.appendChild(opt);
            });

            if (defaultClient) {
                selectedCustomer = defaultClient;
                select.value = defaultClient.id;
            }

            select.addEventListener('change', (e) => {
                const found = clients.find(c => c.id == e.target.value);
                if (found) selectedCustomer = found;
            });
        }
    } catch (e) { console.error(e); }
}

async function loadSellers() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_USERS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('pos-seller-select');
            if (!select) return;
            select.innerHTML = '<option value="">👤 Sin Vendedor</option>';

            const sellers = data.data.filter(u => u.estado === 'Activo');

            sellers.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `👤 ${s.nombre}`;
                select.appendChild(opt);
            });

            select.addEventListener('change', (e) => {
                const found = sellers.find(s => s.id == e.target.value);
                selectedSeller = found ? found : null;
            });
        }
    } catch (e) { console.error('Error loading sellers:', e); }
}

// --- UI LOGIC ---

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.codigo && p.codigo.toLowerCase().includes(term)) ||
                (p.nombre_alterno && p.nombre_alterno.toLowerCase().includes(term)) ||
                (p.referencia_fabrica && p.referencia_fabrica.toLowerCase().includes(term))
            );
            renderProductGrid(filtered);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') { e.preventDefault(); searchInput.focus(); }
        });
    }



    // Checkout Button
    document.getElementById('btn-cobrar')?.addEventListener('click', openPaymentModal);

    // Quick Client Button
    document.getElementById('btn-quick-client')?.addEventListener('click', () => {
        document.getElementById('modal-quick-cliente').style.display = 'flex';
    });

    // Quick Client Form Submit
    document.getElementById('form-quick-cliente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveQuickClient();
    });
}

async function saveQuickClient() {
    const btn = document.querySelector('#form-quick-cliente .btn-guardar');
    const originalText = btn.textContent;
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    const body = {
        nombre_comercial: document.getElementById('quick-cli-nombre').value,
        tipo_documento: document.getElementById('quick-cli-tipo').value,
        documento: document.getElementById('quick-cli-doc').value,
        telefono: document.getElementById('quick-cli-tel').value,
        email: document.getElementById('quick-cli-email').value,
        direccion: document.getElementById('quick-cli-dir').value,
        es_cliente: 1,
        es_proveedor: 0,
        estado: 1
    };

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CLIENTS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await resp.json();

        if (data.success) {
            showNotification('Cliente creado exitosamente', 'success');
            document.getElementById('modal-quick-cliente').style.display = 'none';
            document.getElementById('form-quick-cliente').reset();

            // Reload clients and select the new one (by finding NIT)
            await loadClients();

            // Select the new client
            const select = document.getElementById('pos-client-select');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text.includes(body.documento)) {
                    select.selectedIndex = i;
                    // Actualizar el estado global del cliente seleccionado
                    const optValue = select.options[i].value;
                    selectedCustomer = { id: optValue, nombre: body.nombre_comercial };
                    break;
                }
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error al crear cliente', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function renderProductGrid(products) {
    const container = document.getElementById('product-grid');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(p => {
        if (!p.activo) return;

        let stockLabel = '';
        let noStock = false;
        if (p.maneja_inventario) {
            const stock = (p.stock_sucursal !== undefined && p.stock_sucursal !== null) ? p.stock_sucursal : (p.stock_actual || 0);
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

        // Image Handling
        let imageHTML = '';
        if (p.imagen_url && p.imagen_url.trim() !== '') {
            imageHTML = `<div class="p-image" style="background-image: url('${p.imagen_url}');"></div>`;
        } else {
            // Fallback Icon
            imageHTML = `<div class="p-image" style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #cbd5e1;">
                            <i class="fas fa-box-open" style="font-size: 2.5rem;"></i>
                         </div>`;
        }

        card.innerHTML = `
            ${imageHTML}
            <div class="p-details" style="display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                <h4 title="${p.nombre}" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; height: 2.2em;">${p.nombre}</h4>
                <div style="display:flex; justify-content:space-between; align-items: center; margin-top: auto;">
                    <span class="price" style="font-size: 1rem;">$${parseFloat(p.precio1 || 0).toLocaleString()}</span>
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
    if (product.maneja_inventario) {
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.cantidad : 0;
        const available = (product.stock_sucursal !== undefined && product.stock_sucursal !== null) ? product.stock_sucursal : (product.stock_actual || 0);

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
            precio1: parseFloat(product.precio1 || 0),
            precio2: parseFloat(product.precio2 || 0),
            impuesto_porcentaje: parseFloat(product.impuesto_porcentaje) || 0,
            cantidad: 1,
            maneja_inventario: product.maneja_inventario,
            stock_max: product.stock_actual // Keep ref just in case
        });
    }
    renderCart();
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            removeFromCart(id);
        } else {
            renderCart();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

// --- PRICING HELPERS ---

window.changePriceType = (id, type) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (type === '1') item.precio = item.precio1;
    else if (type === '2') item.precio = item.precio2;

    renderCart();
};

window.editManualPrice = (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('price-edit-modal');
    const input = document.getElementById('manual-price-input');
    const nameLabel = document.getElementById('modal-product-name');
    const saveBtn = document.getElementById('save-price-btn');

    nameLabel.textContent = item.nombre;
    input.value = item.precio;
    modal.classList.add('active');

    const handleSave = () => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val >= 0) {
            item.precio = val;
            renderCart();
            closePriceModal();
        } else {
            if (window.showNotification) showNotification('Precio inválido', 'warning');
        }
        saveBtn.removeEventListener('click', handleSave);
    };

    saveBtn.addEventListener('click', handleSave);

    // Permitir guardar con Enter
    input.onkeypress = (e) => {
        if (e.key === 'Enter') handleSave();
    };
};

window.closePriceModal = () => {
    document.getElementById('price-edit-modal').classList.remove('active');
};

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) {
        console.error('No se encontró #cart-container');
        return;
    }

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:#94a3b8; padding-top:40px;">
                <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>Carrito vacío</p>
            </div>
        `;
        document.querySelectorAll('.summary-row span:last-child').forEach(s => s.textContent = '$0.00');
        return;
    }

    let subtotal = 0;
    let taxes = 0;

    cart.forEach(item => {
        const itemTotal = (item.precio || 0) * (item.cantidad || 0);
        const itemTax = itemTotal * ((item.impuesto_porcentaje || 0) / 100);

        subtotal += itemTotal;
        taxes += itemTax;

        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <!-- Fila 1: Producto y Total item -->
            <div class="item-main-info">
                <span class="item-name" title="${item.nombre}">${item.nombre}</span>
                <span class="item-total-price">$${itemTotal.toLocaleString()}</span>
            </div>
            
            <!-- Fila 2: Información de Precio -->
            <div class="item-pricing-row">
                <div class="item-pricing-area">
                    <span class="item-qty-label">${item.cantidad} x</span>
                    <span class="item-unit-price" title="Doble clic para editar" ondblclick="editManualPrice(${item.id})">
                        $${(item.precio || 0).toLocaleString()}
                    </span>
                    <select class="item-price-select" onchange="changePriceType(${item.id}, this.value)">
                        <option value="1" ${item.precio === item.precio1 ? 'selected' : ''}>P1</option>
                        <option value="2" ${item.precio === item.precio2 ? 'selected' : ''}>P2</option>
                        ${(item.precio !== item.precio1 && item.precio !== item.precio2) ? '<option value="custom" selected>M</option>' : ''}
                    </select>
                </div>
            </div>

            <!-- Fila 3: Acciones (Abajo) -->
            <div class="item-actions-row">
                <div class="item-controls-area">
                    <button class="qty-btn" title="Restar" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <button class="qty-btn" title="Sumar" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="item-remove-btn" title="Eliminar" onclick="event.stopPropagation(); removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
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
            vendedor_id: selectedSeller ? selectedSeller.id : null,
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
            // SUCCESS
            document.getElementById('modal-pago').style.display = 'none';
            setupSuccessModal({
                numero: data.numero,
                recibo: data.recibo,
                factura_id: data.factura_id
            });

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

// --- SUCCESS MODAL ---

function setupSuccessModal(data) {
    const modal = document.getElementById('modal-recibo');
    document.getElementById('recibo-info').textContent = `Factura: ${data.numero}`;
    document.getElementById('recibo-extra').textContent = data.recibo ? `+ Recibo de Caja: ${data.recibo}` : '';
    modal.style.display = 'flex';

    // Button Handlers
    const btnFinish = document.getElementById('btn-pos-finish');
    const btnView = document.getElementById('btn-pos-view');

    // Clone to remove old listeners
    const newBtnFinish = btnFinish.cloneNode(true);
    const newBtnView = btnView.cloneNode(true);
    btnFinish.parentNode.replaceChild(newBtnFinish, btnFinish);
    btnView.parentNode.replaceChild(newBtnView, btnView);

    newBtnFinish.addEventListener('click', () => {
        resetPOS();
        modal.style.display = 'none';
    });

    newBtnView.addEventListener('click', () => {
        printInvoice(data.factura_id);
    });
}

function resetPOS() {
    cart = [];
    renderCart();
    loadProducts(); // Update stock locally
    loadPOSConfig(); // Consecutive update
    // Clear Payment Inputs
    document.getElementById('pago-monto').value = '';
    document.getElementById('pago-cambio').textContent = '$0.00';
    // Reset Seller
    selectedSeller = null;
    const selectSeller = document.getElementById('pos-seller-select');
    if (selectSeller) selectSeller.value = '';
}

function printInvoice(id) {
    window.open(`/frontend/modules/facturacion/print_factura.html?id=${id}`, '_blank');
}

function sendWhatsApp(numeroFactura, facturaId) {
    // 1. Construir mensaje y URL
    // Usamos el dominio principal para el link de la factura
    const urlFactura = `https://erpod.site/frontend/modules/facturacion/print_factura.html?id=${facturaId}`;
    const mensaje = encodeURIComponent(`Hola *${selectedCustomer.nombre_comercial || selectedCustomer.nombre || 'Cliente'}*, adjunto el link de tu factura *${numeroFactura}*: ${urlFactura}`);

    // 2. Abrir WhatsApp sin número para que el usuario elija el contacto manualmente
    window.open(`https://api.whatsapp.com/send?text=${mensaje}`, '_blank');
}
