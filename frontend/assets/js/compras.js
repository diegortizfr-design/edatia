/**
 * ERPod - Compras Module Logic
 */

let API_URL = '';
let PRODUCTOS_URL = '';
let TERCEROS_URL = '';
let SUCURSALES_URL = '';
let tableBody, modal, btnNuevo, closeBtns;
let carrito = [];
let compraActualId = null;
let allComprasData = [];
let modoCompra = 'orden'; // 'orden' | 'factura'

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize DOM Elements & Listeners (Synchronous - Critical for UI responsiveness)
    tableBody = document.getElementById('compras-table-body');
    modal = document.getElementById('modal-nueva-compra');
    btnNuevo = document.getElementById('btn-nueva-compra');
    closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const inputBusqueda = document.getElementById('busqueda-producto');

    // Attach Listeners
    if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModalCompra('orden'));
    document.getElementById('btn-registrar-factura')?.addEventListener('click', () => abrirModalCompra('factura'));

    closeBtns.forEach(btn => btn.addEventListener('click', cerrarModal));
    document.getElementById('btn-guardar-compra')?.addEventListener('click', guardarCompra);

    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') buscarProducto(inputBusqueda.value);
        });
    }
    document.getElementById('btn-buscar-producto')?.addEventListener('click', () => {
        buscarProducto(document.getElementById('busqueda-producto').value);
    });

    // View Modal Actions
    document.getElementById('close-ver-compra')?.addEventListener('click', () => document.getElementById('modal-ver-compra').style.display = 'none');
    document.getElementById('btn-cerrar-view')?.addEventListener('click', () => document.getElementById('modal-ver-compra').style.display = 'none');

    // Quick Create Listeners
    setupQuickModal('modal-quick-proveedor', 'btn-quick-proveedor', 'close-quick-prov', 'cancel-quick-prov', 'form-quick-proveedor', guardarQuickProveedor);
    setupQuickModal('modal-quick-producto', 'btn-quick-producto', 'close-quick-prod', 'cancel-quick-prod', 'form-quick-producto', guardarQuickProducto);

    // Set default date
    const dateInput = document.getElementById('compra-fecha');
    if (dateInput) dateInput.valueAsDate = new Date();


    // 2. Async Data Loading
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/compras`;
        PRODUCTOS_URL = `${config.apiUrl}/productos`;
        TERCEROS_URL = `${config.apiUrl}/terceros`;
        SUCURSALES_URL = `${config.apiUrl}/sucursales`;

        // Load Data
        await cargarProveedores();
        await cargarSucursales();
        await cargarCompras();

    } catch (e) {
        console.error('Initialization error:', e);
        if (window.showNotification) showNotification('Error conectando con el servidor. Revise su conexión.', 'error');

        // Remove loading state from table if present
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">
                <i class="fas fa-exclamation-triangle"></i> Error cargando datos. Revise la consola.
             </td></tr>`;
        }
    }
});

function setupQuickModal(modalId, btnOpenId, btnCloseId, btnCancelId, formId, submitHandler) {
    document.getElementById(btnOpenId)?.addEventListener('click', () => {
        document.getElementById(modalId).style.display = 'flex';
    });
    const close = () => {
        document.getElementById(modalId).style.display = 'none';
        document.getElementById(formId)?.reset();
    }
    document.getElementById(btnCloseId)?.addEventListener('click', close);
    document.getElementById(btnCancelId)?.addEventListener('click', close);
    document.getElementById(formId)?.addEventListener('submit', submitHandler);
}

// --- LISTING LOGIC ---

async function cargarCompras() {
    if (!tableBody) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            allComprasData = data.data;
            renderTable(data.data);
            updateKPIs(data.data);
        }
    } catch (err) { console.error('Error loading purchases:', err); }
}

function renderTable(compras) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (compras.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #6B7280;">No hay órdenes registradas</td></tr>`;
        return;
    }
    compras.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${c.id}</td>
            <td>${c.proveedor_nombre || 'Proveedor #' + c.proveedor_id}</td>
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td><strong>$${parseFloat(c.total).toLocaleString()}</strong></td>
            <td><span class="badge ${getBadgeClass(c.estado)}">${c.estado || 'Orden de Compra'}</span></td>
            <td><span class="badge ${getBadgeClass(c.estado_pago)}">${c.estado_pago || 'Debe'}</span></td>
            <td>
                <button class="btn-icon" onclick="verCompra(${c.id})" title="Ver detalle"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getBadgeClass(status) {
    if (!status) return 'pendiente';
    const s = status.toLowerCase();
    if (['recibida', 'completada', 'pago'].some(x => s.includes(x))) return 'recibida'; // Green
    if (['aprobada', 'realizada'].some(x => s.includes(x))) return 'warning'; // Yellow
    if (['rechazada', 'cancelada', 'devolucion'].some(x => s.includes(x))) return 'cancelada'; // Red
    return 'pendiente'; // Gray
}

function updateKPIs(compras) {
    const porPagar = compras.filter(c => c.estado_pago !== 'Pago').reduce((acc, curr) => acc + parseFloat(curr.total), 0);
    document.getElementById('kpi-por-pagar').textContent = `$${porPagar.toLocaleString()}`;
    document.getElementById('kpi-pedidos').textContent = `${compras.filter(c => c.estado === 'Orden de Compra' || c.estado === 'Pendiente').length} Órdenes`;
    document.getElementById('kpi-recepciones').textContent = `${compras.length} Totales`;
}

// --- CREATION LOGIC ---

async function abrirModalCompra(modo = 'orden') {
    modoCompra = modo;
    const titulo = document.querySelector('#modal-nueva-compra h2');
    const btn = document.getElementById('btn-guardar-compra');

    if (modo === 'factura') {
        titulo.textContent = 'Registrar Factura de Compra';
        btn.textContent = 'Guardar Factura (Realizada)';
    } else {
        titulo.textContent = 'Nueva Orden de Compra';
        btn.textContent = 'Guardar Orden';
    }

    modal.style.display = 'flex';
    carrito = [];
    renderCarrito();
}

function cerrarModal() {
    modal.style.display = 'none';
}

async function cargarProveedores() {
    const select = document.getElementById('compra-proveedor');
    if (!select || select.options.length > 1) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${TERCEROS_URL}?tipo=proveedor`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
            data.data.forEach(p => {
                if (p.es_proveedor || p.tipo === 'Proveedor' || p.tipo === 'Ambos') {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.nombre_comercial || p.nombre || p.razon_social;
                    select.appendChild(opt);
                }
            });
        }
    } catch (err) { console.error('Error loading providers', err); }
}

async function cargarSucursales() {
    const select = document.getElementById('compra-sucursal');
    if (!select || select.options.length > 1) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(SUCURSALES_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
            data.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.nombre;
                select.appendChild(opt);
            });
        }
    } catch (err) { console.error('Error loading sucursales', err); }
}

// --- CART & SAVING ---

async function buscarProducto(query) {
    if (!query) return;
    const resultadosDiv = document.getElementById('resultados-busqueda');
    resultadosDiv.style.display = 'block';
    resultadosDiv.innerHTML = '<div style="padding:10px; color: #666;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

    if (!PRODUCTOS_URL) {
        console.error('PRODUCTOS_URL no definido');
        resultadosDiv.innerHTML = '<div style="padding:10px; color: orange;">Iniciando sistema... Intente en unos segundos.</div>';
        return;
    }

    try {
        console.log(`Buscando producto: ${query} en ${PRODUCTOS_URL}`);
        const token = localStorage.getItem('token');

        const res = await fetch(`${PRODUCTOS_URL}?busqueda=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();

        resultadosDiv.innerHTML = '';
        if (data.success && data.data && data.data.length > 0) {
            data.data.forEach(prod => {
                const item = document.createElement('div');
                item.style.padding = '10px';
                item.style.borderBottom = '1px solid #eee';
                item.style.cursor = 'pointer';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.innerHTML = `<span>${prod.nombre} (Stock: ${prod.stock_actual || 0})</span> <strong>$${parseFloat(prod.costo || 0).toLocaleString()}</strong>`;
                item.onmouseover = () => item.style.background = '#f9fafb';
                item.onmouseout = () => item.style.background = 'white';
                item.onclick = () => {
                    agregarAlCarrito(prod);
                    resultadosDiv.style.display = 'none';
                    document.getElementById('busqueda-producto').value = '';
                };
                resultadosDiv.appendChild(item);
            });
        } else {
            resultadosDiv.innerHTML = '<div style="padding:10px; color: #EF4444;">No encontrado</div>';
        }
    } catch (err) {
        console.error('Error buscarProducto:', err);
        resultadosDiv.innerHTML = `<div style="padding:10px; color: #EF4444;">Error: ${err.message || 'No se pudo buscar'}</div>`;
    }
}

function agregarAlCarrito(producto) {
    const existing = carrito.find(i => i.producto_id === producto.id);
    if (existing) {
        existing.cantidad++;
        existing.subtotal = existing.cantidad * existing.costo;
    } else {
        carrito.push({
            producto_id: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            costo: parseFloat(producto.costo || 0),
            subtotal: parseFloat(producto.costo || 0)
        });
    }
    renderCarrito();
}

function renderCarrito() {
    const tbody = document.getElementById('detalle-compra-body');
    const msg = document.getElementById('mensaje-vacio');
    const totalEl = document.getElementById('compra-total');

    tbody.innerHTML = '';

    if (carrito.length === 0) {
        msg.style.display = 'block';
        totalEl.textContent = '$0.00';
        return;
    }

    msg.style.display = 'none';
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.subtotal;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nombre}</td>
            <td><input type="number" min="1" value="${item.cantidad}" onchange="actualizarLinea(${index}, 'cantidad', this.value)" style="width: 60px; padding: 5px;"></td>
            <td><input type="number" step="0.01" value="${item.costo}" onchange="actualizarLinea(${index}, 'costo', this.value)" style="width: 100px; padding: 5px;"></td>
            <td>$${item.subtotal.toLocaleString()}</td>
            <td><i class="fas fa-trash" style="color: #EF4444; cursor: pointer;" onclick="eliminarLinea(${index})"></i></td>
        `;
        tbody.appendChild(row);
    });

    totalEl.textContent = `$${total.toLocaleString()}`;
}

window.actualizarLinea = (index, field, value) => {
    const item = carrito[index];
    if (field === 'cantidad') item.cantidad = parseFloat(value);
    if (field === 'costo') item.costo = parseFloat(value);
    item.subtotal = item.cantidad * item.costo;
    renderCarrito();
};

window.eliminarLinea = (index) => {
    carrito.splice(index, 1);
    renderCarrito();
};

async function guardarCompra() {
    if (carrito.length === 0) return showNotification('El carrito está vacío', 'error');

    const proveedorId = document.getElementById('compra-proveedor').value;
    const sucursalId = document.getElementById('compra-sucursal').value;

    if (!proveedorId) return showNotification('Selecciona un proveedor', 'error');
    if (!sucursalId) return showNotification('Selecciona una sucursal destino', 'error');

    const btnGuardar = document.getElementById('btn-guardar-compra');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    // Determine initial state based on mode
    const estadoInicial = (modoCompra === 'factura') ? 'Realizada' : 'Orden de Compra';

    const payload = {
        proveedor_id: proveedorId,
        sucursal_id: sucursalId,
        fecha: document.getElementById('compra-fecha').value,
        total: carrito.reduce((sum, i) => sum + i.subtotal, 0),
        estado: estadoInicial,
        items: carrito
    };

    try {
        const token = localStorage.getItem('token');

        // Timeout wrapper
        const fetchWithTimeout = (url, options, timeout = 15000) => {
            return Promise.race([
                fetch(url, options),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), timeout))
            ]);
        };

        const res = await fetchWithTimeout(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showNotification('Compra registrada exitosamente', 'success');
            cerrarModal();
            cargarCompras();
            setTimeout(() => {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalText;
            }, 500);
        } else {
            showNotification('Error: ' + data.message, 'error');
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = originalText;
        }
    } catch (err) {
        showNotification('Error al guardar compra', 'error');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalText;
    }
}

// --- VIEW & STATES LOGIC ---

window.verCompra = async (id) => {
    const compra = allComprasData.find(c => c.id === id);
    if (!compra) return;

    compraActualId = id;
    const modalVer = document.getElementById('modal-ver-compra');
    modalVer.style.display = 'flex';

    // Populate Headers
    document.getElementById('view-orden-id').textContent = compra.id;
    document.getElementById('view-proveedor').textContent = compra.proveedor_nombre || `ID: ${compra.proveedor_id}`;
    document.getElementById('view-sucursal').textContent = compra.sucursal_id ? `Sucursal #${compra.sucursal_id}` : 'General';
    document.getElementById('view-fecha').textContent = new Date(compra.fecha).toLocaleDateString();
    document.getElementById('view-total').textContent = `$${parseFloat(compra.total).toLocaleString()}`;

    // Update Badges
    const badgeEstado = document.getElementById('view-estado-badge');
    badgeEstado.textContent = compra.estado || 'Orden de Compra';
    badgeEstado.className = `badge ${getBadgeClass(compra.estado)}`;

    const badgePago = document.getElementById('view-pago-badge');
    badgePago.textContent = compra.estado_pago || 'Debe';
    badgePago.className = `badge ${getBadgeClass(compra.estado_pago)}`;

    // Generate Actions
    generateActionButtons(compra);

    // Clear Items (TODO: Fetch Items from Backend)
    document.getElementById('view-detalle-body').innerHTML = '<tr><td colspan="4" style="text-align: center; color: #aaa;">Visualización de items pronto...</td></tr>';
}

function generateActionButtons(compra) {
    const containerEstado = document.getElementById('view-actions-estado');
    const containerPago = document.getElementById('view-actions-pago');

    containerEstado.innerHTML = '';
    containerPago.innerHTML = '';

    const estado = (compra.estado || 'orden de compra').toLowerCase();

    // Workflow: Orden -> Aprobada -> Realizada -> Recibida -> Completada
    if (estado === 'orden de compra') {
        addBtn(containerEstado, 'Aprobar', 'btn-primary', () => cambiarEstado(compra.id, 'Aprobada'));
        addBtn(containerEstado, 'Rechazar', 'btn-secondary', () => cambiarEstado(compra.id, 'Rechazada'));
    } else if (estado === 'aprobada') {
        addBtn(containerEstado, 'Imprimir / Enviar', 'btn-secondary', () => imprimirOrden(compra.id));
        addBtn(containerEstado, 'Registrar Factura (Realizada)', 'btn-primary', () => cambiarEstado(compra.id, 'Realizada'));
    } else if (estado === 'realizada') {
        addBtn(containerEstado, 'Recibir Mercancía', 'btn-primary', () => cambiarEstado(compra.id, 'Recibida'));
    } else if (estado === 'recibida') {
        addBtn(containerEstado, 'Completar (Stock)', 'btn-primary', () => cambiarEstado(compra.id, 'Completada'));
    }

    // Payment Flow
    const pago = (compra.estado_pago || 'debe').toLowerCase();
    if (pago === 'debe') {
        addBtn(containerPago, 'Registrar Pago', 'btn-primary', () => cambiarEstadoPago(compra.id, 'Pago'));
    } else if (pago === 'pago') {
        addBtn(containerPago, 'Devolución', 'btn-secondary', () => cambiarEstadoPago(compra.id, 'Devolucion'));
    }
}

function imprimirOrden(id) {
    showNotification(`Generando PDF para orden #${id}... (Simulado)`, 'success');
    // Logic to open PDF generation window would go here
}

function addBtn(container, text, cls, onClick) {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.style.padding = '5px 10px';
    btn.style.fontSize = '0.8rem';
    btn.style.borderRadius = '8px';
    btn.style.marginLeft = '5px';
    btn.textContent = text;
    btn.onclick = onClick;
    container.appendChild(btn);
}

async function cambiarEstado(id, nuevoEstado) {
    if (!confirm(`¿Cambiar estado a ${nuevoEstado}?`)) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await res.json();

        if (data.success) {
            showNotification(`Estado cambiado a: ${nuevoEstado}`, 'success');
            // Mock update local for speed, then reload
            const c = allComprasData.find(x => x.id === id);
            if (c) c.estado = nuevoEstado;
            verCompra(id);
            cargarCompras();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error de conexión', 'error');
    }
}

async function cambiarEstadoPago(id, nuevoEstado) {
    if (!confirm(`¿Registrar ${nuevoEstado}?`)) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ estado_pago: nuevoEstado })
        });
        const data = await res.json();

        if (data.success) {
            showNotification(`Pago registrado: ${nuevoEstado}`, 'success');
            const c = allComprasData.find(x => x.id === id);
            if (c) c.estado_pago = nuevoEstado;
            verCompra(id);
            cargarCompras();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error de conexión', 'error');
    }
}

// --- QUICK FUNCTIONS ---

async function guardarQuickProveedor(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('form-quick-proveedor');

    // Simplistic extraction - adjust based on actual form IDs if needed, 
    // but assuming standard form behavior or specific IDs were used in HTML.
    // For safety, let's use FormData
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Ensure critical fields
    data.tipo = 'Proveedor';
    data.es_proveedor = 1;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(TERCEROS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const resp = await res.json();
        if (resp.success) {
            showNotification('Proveedor creado', 'success');
            document.getElementById('modal-quick-proveedor').style.display = 'none';
            form.reset();
            await cargarProveedores();
            // Auto Select?
            const select = document.getElementById('compra-proveedor');
            select.value = resp.id || resp.data?.id;
        } else {
            showNotification('Error: ' + resp.message, 'error');
        }
    } catch (err) { console.error(err); }
}

async function guardarQuickProducto(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('form-quick-producto');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(PRODUCTOS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const resp = await res.json();
        if (resp.success) {
            showNotification('Producto creado', 'success');
            document.getElementById('modal-quick-producto').style.display = 'none';
            form.reset();
            // Auto add to cart? need full product object.
            // For now just notify.
        } else {
            showNotification('Error: ' + resp.message, 'error');
        }
    } catch (err) { console.error(err); }
}

function showNotification(msg, type) {
    if (window.showNotification) window.showNotification(msg, type);
    else alert(msg);
}
