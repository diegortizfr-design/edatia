/**
 * ERPod - POS Logic with Cash Drawer Management
 * Handles product search, cart management, billing process, and payment modal.
 */

let API_BILLING = '';
let API_PRODUCTS = '';
let API_DOCS = '';
let API_CLIENTS = '';
let API_CAJA = '';
let API_CAJA_CONFIG = '';
let API_USERS = '';

// POS State
let cart = [];
let allProducts = [];
let selectedCustomer = { id: 1, nombre: 'Cliente Mostrador' }; // Default
let selectedSeller = null;
let selectedDoc = null;
let sesionCaja = null;
let currentPin = '';
let selectedCajaForPin = null;

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
        API_CAJA = `${API_BASE}/caja`;
        API_CAJA_CONFIG = `${API_BASE}/caja/config`;

        await verificarSesionCaja();
        initPOS();
        setupPaymentModal();
        setupCajaEvents();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function verificarSesionCaja() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_CAJA}/verificar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            if (data.abierta) {
                sesionCaja = data.data;
                showPOSInterface();
                renderCajaInfo();
            } else {
                showLobbyInterface();
                loadLobby();
            }
        } else {
            // Si no hay éxito, mostrar lobby por defecto
            showLobbyInterface();
            loadLobby();
        }
    } catch (e) {
        console.error('Error verificando caja:', e);
        // En caso de error, mostrar lobby por defecto
        showLobbyInterface();
        loadLobby();
    }
}

function showPOSInterface() {
    document.getElementById('pos-lobby').style.display = 'none';
    document.getElementById('pos-main-content').style.display = 'block';
}

function showLobbyInterface() {
    document.getElementById('pos-lobby').style.display = 'flex';
    document.getElementById('pos-main-content').style.display = 'none';
}

async function loadLobby() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CAJA_CONFIG, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            renderLobby(data.data);
        }
    } catch (e) { console.error('Error loading lobby:', e); }
}

function renderLobby(cajas) {
    const grid = document.getElementById('lobby-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const activas = cajas.filter(c => c.estado === 'Activa');

    if (activas.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center;">
                <div style="width: 140px; height: 140px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 35px; border: 3px solid rgba(255, 255, 255, 0.3); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);">
                    <i class="fas fa-cash-register" style="font-size: 4rem; color: white;"></i>
                </div>
                <h2 style="font-size: 1.8rem; color: white; margin: 0 0 15px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">No hay cajas disponibles</h2>
                <p style="font-size: 1.1rem; color: rgba(255, 255, 255, 0.85); margin: 0 0 40px; max-width: 500px; line-height: 1.7; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                    Para comenzar a usar el punto de venta, primero debes configurar al menos una caja activa. Dirígete a la configuración de cajas para crear tu primera caja registradora.
                </p>
                <a href="/frontend/modules/facturacion/configurar_cajas.html" style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 36px; background: white; color: #6366f1; font-size: 1.05rem; font-weight: 700; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25); transition: all 0.3s ease;">
                    <i class="fas fa-cog"></i>
                    Ir a Configurar Cajas
                </a>
            </div>
        `;
        return;
    }

    activas.forEach(c => {
        const card = document.createElement('div');
        const isOpen = !!c.sesion_activa_id;
        card.className = 'caja-lobby-card';
        card.onclick = () => selectCajaLobby(c);

        card.innerHTML = `
            <div class="icon-box"><i class="fas fa-cash-register"></i></div>
            <h3>${c.nombre}</h3>
            <span class="status-indicator ${isOpen ? 'status-abierta' : 'status-cerrada'}">
                ${isOpen ? 'Abierta / En uso' : 'Disponible / Cerrada'}
            </span>
            <div class="user-info">
                ${isOpen ? `Usuario: ${c.sesion_usuario_nombre || 'Desconocido'}` : (c.sucursal_nombre || 'Sucursal General')}
            </div>
            <div class="user-info" style="margin-top: 5px; opacity: 0.8; font-size: 0.75rem;">
                <i class="fas fa-user-circle"></i> Defecto: ${c.cliente_defecto_nombre || 'Cliente Mostrador'}
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectCajaLobby(c) {
    selectedCajaForPin = c;
    currentPin = '';
    updatePinDisplay();
    document.getElementById('pin-caja-nombre').textContent = `Acceso: ${c.nombre}`;
    document.getElementById('modal-pin-caja').style.display = 'flex';
}

window.pressPin = (num) => {
    if (currentPin.length < 4) {
        currentPin += num;
        updatePinDisplay();
        if (currentPin.length === 4) {
            setTimeout(submitPin, 200);
        }
    }
};

window.clearPin = () => {
    currentPin = '';
    updatePinDisplay();
};

window.closePinModal = () => {
    document.getElementById('modal-pin-caja').style.display = 'none';
    selectedCajaForPin = null;
};

function updatePinDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        if (i < currentPin.length) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

async function submitPin() {
    if (!selectedCajaForPin) return;

    // Mostramos modal de apertura con la caja seleccionada (el PIN se enviará en el POST de abrir)
    document.getElementById('modal-pin-caja').style.display = 'none';

    // Set UI for opening
    document.getElementById('caja-id-hidden').value = selectedCajaForPin.id;
    document.getElementById('caja-nombre-display').value = selectedCajaForPin.nombre;
    document.getElementById('base-inicial').value = '';
    document.getElementById('modal-abrir-caja').style.display = 'flex';
    document.getElementById('base-inicial').focus();
}

window.closeOpeningModal = () => {
    document.getElementById('modal-abrir-caja').style.display = 'none';
    showLobbyInterface();
};

function renderCajaInfo() {
    const container = document.getElementById('caja-info-container');
    if (!container) return;

    if (sesionCaja) {
        container.innerHTML = `
            <div class="caja-status caja-abierta">
                <i class="fas fa-unlock"></i> Caja Abierta (Base: $${parseFloat(sesionCaja.base_inicial).toLocaleString()})
            </div>
            <button class="btn-caja btn-caja-cerrar" id="btn-cuadre-caja">
                <i class="fas fa-calculator"></i> Realizar Cuadre
            </button>
        `;

        document.getElementById('btn-cuadre-caja').onclick = abrirModalCuadre;
    } else {
        container.innerHTML = `
            <div class="caja-status caja-cerrada">
                <i class="fas fa-lock"></i> Caja Cerrada
            </div>
            <button class="btn-caja btn-caja-abrir" onclick="document.getElementById('modal-abrir-caja').style.display='flex'">
                <i class="fas fa-door-open"></i> Abrir Caja
            </button>
        `;
    }
}

async function abrirModalCuadre() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_CAJA}/totales`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            const resumenDiv = document.getElementById('resumen-caja');
            let ventasHTML = '<h4>Resumen de Ventas</h4><ul style="list-style:none; padding:0;">';

            let totalVentas = 0;
            data.ventas.forEach(v => {
                ventasHTML += `<li style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>${v.metodo_pago}:</span>
                    <strong>$${parseFloat(v.total).toLocaleString()}</strong>
                </li>`;
                totalVentas += parseFloat(v.total);
            });

            const totalEfectivoVentas = data.ventas.reduce((acc, v) => v.metodo_pago === 'Efectivo' ? acc + parseFloat(v.total) : acc, 0);
            const totalEsperado = parseFloat(data.sesion.base_inicial) + totalEfectivoVentas;

            ventasHTML += `</ul>
                <div style="border-top:1px solid #ddd; margin-top:10px; padding-top:10px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span>Base Inicial:</span>
                        <strong>$${parseFloat(data.sesion.base_inicial).toLocaleString()}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; color: var(--primary-color); font-weight:700; font-size:1.1rem; margin-top:5px;">
                        <span>Efectivo Esperado (Base + Ventas):</span>
                        <span>$${totalEsperado.toLocaleString()}</span>
                    </div>
                </div>`;

            resumenDiv.innerHTML = ventasHTML;
            document.getElementById('modal-cerrar-caja').style.display = 'flex';
        }
    } catch (e) {
        console.error(e);
        showNotification('Error al obtener totales de caja', 'error');
    }
}

async function loadCajasAvailable() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CAJA_CONFIG, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('caja-id-select');
            select.innerHTML = '<option value="">-- Seleccione una caja --</option>';

            const activas = data.data.filter(c => c.estado === 'Activa');
            activas.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre;
                opt.dataset.sucursal = c.sucursal_id || '';
                opt.dataset.documento = c.documento_id || '';
                select.appendChild(opt);
            });
            window.all_cajas_def = activas;
        }
    } catch (e) { console.error('Error cargando cajas:', e); }
}

function setupCajaEvents() {
    // Abrir Caja
    document.getElementById('form-abrir-caja')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cajaId = document.getElementById('caja-id-hidden').value;
        const base = document.getElementById('base-inicial').value;

        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_CAJA}/abrir`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    base_inicial: base,
                    caja_id: cajaId,
                    codigo_acceso: currentPin
                })
            });
            const data = await resp.json();
            if (data.success) {
                showNotification('Caja abierta correctamente', 'success');
                document.getElementById('modal-abrir-caja').style.display = 'none';

                // Recargar info de la caja seleccionada para documentos etc
                const fullCaja = selectedCajaForPin;

                await verificarSesionCaja();

                // Si la caja tiene un documento anclado, seleccionarlo
                if (fullCaja && fullCaja.documento_id) {
                    const docSelect = document.getElementById('pos-document-type');
                    if (docSelect) {
                        docSelect.value = fullCaja.documento_id;
                        selectedDoc = (window.pos_docs_list || []).find(d => d.id == fullCaja.documento_id);
                        updateOrderNumDisplay();
                        loadProducts();
                    }
                }
            } else {
                showNotification(data.message, 'error');
                // Si el error es de PIN, permitir volver a intentarlo o volver al lobby
                if (data.message.toLowerCase().includes('código') || data.message.toLowerCase().includes('pin')) {
                    document.getElementById('modal-abrir-caja').style.display = 'none';
                    selectCajaLobby(selectedCajaForPin);
                }
            }
        } catch (err) {
            showNotification('Error al abrir caja', 'error');
        }
    });

    // Cerrar Caja
    document.getElementById('form-cerrar-caja')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const montoReal = document.getElementById('monto-real').value;
        const obs = document.getElementById('box-observaciones').value;

        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_CAJA}/cerrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ monto_real: montoReal, observaciones: obs })
            });
            const data = await resp.json();
            if (data.success) {
                showNotification('Caja cerrada y cuadre realizado', 'success');
                document.getElementById('modal-cerrar-caja').style.display = 'none';
                sesionCaja = null;
                renderCajaInfo();
                await verificarSesionCaja(); // Esto volverá al lobby
            }
        } catch (err) {
            showNotification('Error al cerrar caja', 'error');
        }
    });

    // Close modals
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.style.display = 'none';
        });
    });
}

// --- REST OF POS LOGIC ORIGINALLY IN FACTURACION.JS ---

async function initPOS() {
    loadProducts();
    loadPOSConfig();
    loadClients();
    loadSellers();
    setupEventListeners();
}

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
            renderCategoryTabs(allProducts);
            renderProductGrid(allProducts);
        }
    } catch (e) { console.error('Error loading products:', e); }
}

let availableCategories = [];

function renderCategoryTabs(products) {
    const optionsList = document.getElementById('category-options-list');
    const searchInput = document.getElementById('category-search-input');

    if (!optionsList || !searchInput) return;

    availableCategories = ['Todos', ...new Set(products.map(p => p.categoria || 'Sin Categoría').filter(c => c))];
    renderCategoryOptions(availableCategories);

    searchInput.onfocus = () => {
        optionsList.style.display = 'block';
        updateCategoryOptionsList(searchInput.value);
    };

    searchInput.oninput = (e) => {
        updateCategoryOptionsList(e.target.value);
    };

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
    if (cat === 'Todos') {
        renderProductGrid(allProducts);
    } else {
        renderProductGrid(allProducts.filter(p => (p.categoria || 'Sin Categoría') === cat));
    }
}

async function loadPOSConfig() {
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
            window.pos_docs_list = posDocs;

            posDocs.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${doc.nombre} (${doc.prefijo || ''}${doc.consecutivo_actual})`;
                opt.dataset.prefijo = doc.prefijo || '';
                opt.dataset.consecutivo = doc.consecutivo_actual;
                docSelect.appendChild(opt);
            });

            if (posDocs.length > 0) {
                docSelect.value = posDocs[0].id;
                selectedDoc = posDocs[0];
                updateOrderNumDisplay();
            }

            docSelect.addEventListener('change', (e) => {
                selectedDoc = posDocs.find(d => d.id == e.target.value);
                updateOrderNumDisplay();
                loadProducts();
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
            let defaultClient = null;

            // Prioridad 1: Cliente configurado en la caja/sesión activa
            if (sesionCaja && sesionCaja.cliente_defecto_id) {
                console.log('Buscando cliente defecto:', sesionCaja.cliente_defecto_id);
                defaultClient = clients.find(c => String(c.id) === String(sesionCaja.cliente_defecto_id));
            }

            // Prioridad 2: Cliente 1 (si no hay otro específico)
            if (!defaultClient) defaultClient = clients.find(c => String(c.id) === '1');

            // Prioridad 3: Primer cliente de la lista
            if (!defaultClient && clients.length > 0) defaultClient = clients[0];

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.nombre_comercial || c.razon_social || c.nombre} (${c.documento || 'Sin doc'})`;
                if (defaultClient && String(c.id) === String(defaultClient.id)) opt.selected = true;
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
        const resp = await fetch(`${API_USERS || '/api/usuarios'}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('pos-seller-select');
            if (!select) return;
            select.innerHTML = '<option value="">👤 Sin Vendedor</option>';

            const sellers = data.data.filter(u => u.estado === 'Activo' || u.estado === 1);
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

function setupEventListeners() {
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

    document.getElementById('btn-cobrar')?.addEventListener('click', openPaymentModal);
    document.getElementById('btn-quick-client')?.addEventListener('click', () => {
        document.getElementById('modal-quick-cliente').style.display = 'flex';
    });
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
            await loadClients();
            const select = document.getElementById('pos-client-select');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text.includes(body.documento)) {
                    select.selectedIndex = i;
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

        let imageHTML = '';
        if (p.imagen_url && p.imagen_url.trim() !== '') {
            imageHTML = `<div class="p-image" style="background-image: url('${p.imagen_url}');"></div>`;
        } else {
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
    if (!sesionCaja) {
        showNotification('Debe abrir la caja para realizar ventas', 'warning');
        document.getElementById('modal-abrir-caja').style.display = 'flex';
        return;
    }

    if (product.maneja_inventario) {
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.cantidad : 0;
        const available = (product.stock_sucursal !== undefined && product.stock_sucursal !== null) ? product.stock_sucursal : (product.stock_actual || 0);

        if (currentQty + 1 > available) {
            showNotification(`Stock insuficiente. Disponible: ${available}`, 'warning');
            return;
        }
    }

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
            stock_max: product.stock_actual
        });
    }
    renderCart();
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) removeFromCart(id);
        else renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

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
            showNotification('Precio inválido', 'warning');
        }
        saveBtn.removeEventListener('click', handleSave);
    };
    saveBtn.addEventListener('click', handleSave);
    input.onkeypress = (e) => { if (e.key === 'Enter') handleSave(); };
};

window.closePriceModal = () => {
    document.getElementById('price-edit-modal').classList.remove('active');
};

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
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
            <div class="item-main-info">
                <span class="item-name" title="${item.nombre}">${item.nombre}</span>
                <span class="item-total-price">$${itemTotal.toLocaleString()}</span>
            </div>
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
    const summaryRows = document.querySelectorAll('.summary-row span:last-child');
    if (summaryRows.length >= 2) {
        summaryRows[0].textContent = `$${subtotal.toLocaleString()}`;
        summaryRows[1].textContent = `$${total.toLocaleString()}`;
    }
    window.currentCartTotal = total;
    window.currentCartSubtotal = subtotal;
    window.currentCartTaxes = taxes;
}

function setupPaymentModal() {
    window.setPaymentType = (type) => {
        document.getElementById('pago-tipo').value = type;
        document.querySelectorAll('.btn-toggle').forEach(b => {
            if (b.dataset.value === type) b.classList.add('active');
            else b.classList.remove('active');
        });
        const sectionContado = document.getElementById('section-contado');
        if (type === 'Contado') {
            sectionContado.style.display = 'block';
            calcChange();
        } else {
            sectionContado.style.display = 'none';
        }
    };
    document.getElementById('pago-monto').addEventListener('input', calcChange);
    document.getElementById('btn-finalizar-venta').addEventListener('click', processFullSale);
}

function openPaymentModal() {
    if (cart.length === 0) return showNotification('El carrito está vacío', 'warning');
    if (!selectedDoc) return showNotification('Seleccione un Tipo de Documento', 'error');
    if (!sesionCaja) return showNotification('Debe abrir la caja', 'error');

    const total = window.currentCartTotal || 0;
    document.getElementById('pago-total-display').textContent = `$${total.toLocaleString()}`;
    document.getElementById('pago-monto').value = '';
    document.getElementById('pago-cambio').textContent = '$0.00';
    setPaymentType('Contado');
    document.getElementById('modal-pago').style.display = 'flex';
    document.getElementById('pago-monto').focus();
}

function calcChange() {
    const total = window.currentCartTotal || 0;
    const paid = parseFloat(document.getElementById('pago-monto').value) || 0;
    const type = document.getElementById('pago-tipo').value;
    if (type === 'Contado') {
        const change = paid - total;
        const changeDisplay = document.getElementById('pago-cambio');
        changeDisplay.textContent = `$${change < 0 ? 0 : change.toLocaleString()}`;
        changeDisplay.style.color = change < 0 ? 'red' : 'green';
    }
}

async function processFullSale() {
    try {
        const token = localStorage.getItem('token');
        const total = window.currentCartTotal || 0;
        const subtotal = window.currentCartSubtotal || 0;
        const impuestos = window.currentCartTaxes || 0;
        const tipoPago = document.getElementById('pago-tipo').value;
        const metodoPago = document.getElementById('pago-metodo').value;
        const montoPagado = parseFloat(document.getElementById('pago-monto').value) || 0;

        if (tipoPago === 'Contado' && montoPagado < total) return showNotification('Monto insuficiente', 'warning');

        const devuelta = (tipoPago === 'Contado') ? (montoPagado - total) : 0;
        const body = {
            documento_id: selectedDoc.id,
            cliente_id: selectedCustomer.id || 1,
            vendedor_id: selectedSeller ? selectedSeller.id : null,
            subtotal, impuesto_total: impuestos, total,
            tipo_pago: tipoPago, metodo_pago: metodoPago,
            monto_pagado, devuelta,
            items: cart.map(i => ({ id: i.id, cantidad: i.cantidad, precio: i.precio, impuesto_porcentaje: i.impuesto_porcentaje, subtotal: i.precio * i.cantidad })),
            caja_sesion_id: sesionCaja ? sesionCaja.id : null
        };

        const btn = document.getElementById('btn-finalizar-venta');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btn.disabled = true;

        const resp = await fetch(API_BILLING, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await resp.json();

        if (data.success) {
            document.getElementById('modal-pago').style.display = 'none';
            setupSuccessModal({ numero: data.numero, recibo: data.recibo, factura_id: data.factura_id });
        } else {
            showNotification(data.message, 'error');
        }
        btn.innerHTML = origText;
        btn.disabled = false;
    } catch (e) {
        showNotification('Error al facturar', 'error');
    }
}

function setupSuccessModal(data) {
    const modal = document.getElementById('modal-recibo');
    document.getElementById('recibo-info').textContent = `Factura: ${data.numero}`;
    document.getElementById('recibo-extra').textContent = data.recibo ? `+ Recibo de Caja: ${data.recibo}` : '';
    modal.style.display = 'flex';
    document.getElementById('btn-pos-finish').onclick = () => { resetPOS(); modal.style.display = 'none'; };
    document.getElementById('btn-pos-view').onclick = () => { printInvoice(data.factura_id); };
}

function resetPOS() {
    cart = [];
    renderCart();
    loadProducts();
    loadPOSConfig();
    document.getElementById('pago-monto').value = '';
    document.getElementById('pago-cambio').textContent = '$0.00';
    selectedSeller = null;
    if (document.getElementById('pos-seller-select')) document.getElementById('pos-seller-select').value = '';
}

function printInvoice(id) {
    window.open(`/frontend/modules/facturacion/print_factura.html?id=${id}`, '_blank');
}
