/**
 * ERPod - Compras Module Logic
 */

let API_URL = '';
let PRODUCTOS_URL = '';
let TERCEROS_URL = '';
let SUCURSALES_URL = '';
let DOCUMENTOS_URL = '';
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

    // New Modals Listeners (Invoice & Inspection)
    const btnsCloseAdjuntar = document.querySelectorAll('.close-modal-btn[data-target="modal-adjuntar-factura"]');
    btnsCloseAdjuntar.forEach(btn => btn.addEventListener('click', () => document.getElementById('modal-adjuntar-factura').style.display = 'none'));

    const btnsCloseInsp = document.querySelectorAll('.close-modal-btn[data-target="modal-inspeccion"]');
    btnsCloseInsp.forEach(btn => btn.addEventListener('click', () => document.getElementById('modal-inspeccion').style.display = 'none'));

    document.getElementById('btn-confirmar-factura')?.addEventListener('click', guardarFacturaAdjunta);
    document.getElementById('btn-confirmar-recepcion')?.addEventListener('click', guardarInspeccion);


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
        DOCUMENTOS_URL = `${config.apiUrl}/documentos`;

        // Load Data
        await cargarProveedores();
        await cargarSucursales();
        await cargarDocumentosCompra();
        await cargarCompras();

    } catch (e) {
        console.error('Initialization error:', e);
        if (window.showNotification) localShowNotification('Error conectando con el servidor. Revise su conexión.', 'error');

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
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: #6B7280;">No hay órdenes registradas</td></tr>`;
        return;
    }
    compras.forEach(c => {
        const row = document.createElement('tr');
        const comboDoc = c.combo_documento || 'N/A';
        // Fallback for old records or failed joins
        const refProv = c.factura_referencia || '-';  // Cruce
        const provName = c.proveedor_nombre || 'Desc.';
        const provNit = c.proveedor_nit || '-';

        // Calculate subtotal roughly
        const total = parseFloat(c.total || 0);

        row.innerHTML = `
            <td><strong>${comboDoc}</strong></td>
            <td><strong>${refProv}</strong></td>
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td>${provNit}</td>
            <td>${provName}</td>
            <td>$${total.toLocaleString()}</td>
            <td><strong>$${total.toLocaleString()}</strong></td>
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
    if (['realizada'].some(x => s.includes(x))) return 'primary'; // Blue/Primary for Realized Invoice
    if (['aprobada'].some(x => s.includes(x))) return 'warning'; // Yellow
    if (['rechazada', 'cancelada', 'devolucion'].some(x => s.includes(x))) return 'cancelada'; // Red
    return 'pendiente'; // Gray
}

function updateKPIs(compras) {
    const porPagar = compras.filter(c => c.estado_pago !== 'Pago').reduce((acc, curr) => acc + parseFloat(curr.total), 0);
    const elPagar = document.getElementById('kpi-por-pagar');
    if (elPagar) elPagar.textContent = `$${porPagar.toLocaleString()}`;

    const elPedidos = document.getElementById('kpi-pedidos');
    if (elPedidos) elPedidos.textContent = `${compras.filter(c => c.estado === 'Orden de Compra' || c.estado === 'Pendiente').length} Órdenes`;

    const elRecep = document.getElementById('kpi-recepciones');
    if (elRecep) elRecep.textContent = `${compras.length} Totales`;
}

// --- CREATION LOGIC ---

async function abrirModalCompra(modo = 'orden') {
    modoCompra = modo;
    const titulo = document.querySelector('#modal-nueva-compra h2');
    const btn = document.getElementById('btn-guardar-compra');

    const refFieldContainer = document.getElementById('compra-factura-ref').parentElement; // Get the .form-control div

    if (modo === 'factura') {
        titulo.textContent = 'Registrar Factura de Compra';
        btn.textContent = 'Guardar Factura (Realizada)';
        refFieldContainer.style.display = 'block'; // Show for Factura
        await cargarDocumentosCompra('FC'); // Factura Compra
    } else {
        titulo.textContent = 'Nueva Orden de Compra';
        btn.textContent = 'Guardar Orden';
        refFieldContainer.style.display = 'none'; // Hide for Orden
        await cargarDocumentosCompra('OC'); // Orden Compra
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

async function cargarDocumentosCompra(filtro = 'OC') {
    const select = document.getElementById('compra-documento');
    if (!select) return;

    // Clear previous options
    select.innerHTML = '<option value="">Seleccione documento...</option>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(DOCUMENTOS_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
            data.data.forEach(d => {
                // Filter by category passed in arg
                let categoriaDoc = d.categoria;
                if (categoriaDoc === 'Factura de Compra') categoriaDoc = 'FC';
                if (categoriaDoc === 'Orden de Compra') categoriaDoc = 'OC';

                if (categoriaDoc === filtro) {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = `${d.nombre} (${d.prefijo || ''}${d.consecutivo_actual})`;
                    select.appendChild(opt);
                }
            });
        }
    } catch (err) { console.error('Error loading documentos', err); }
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
    if (carrito.length === 0) return localShowNotification('El carrito está vacío', 'error');

    const proveedorId = document.getElementById('compra-proveedor').value;
    const sucursalId = document.getElementById('compra-sucursal').value;

    if (!proveedorId) return localShowNotification('Selecciona un proveedor', 'error');
    if (!sucursalId) return localShowNotification('Selecciona una sucursal destino', 'error');

    const btnGuardar = document.getElementById('btn-guardar-compra');
    const originalText = btnGuardar.getAttribute('data-original-text') || btnGuardar.innerHTML;
    if (!btnGuardar.getAttribute('data-original-text')) btnGuardar.setAttribute('data-original-text', originalText);

    const toggleBtn = (disable, err = null) => {
        btnGuardar.disabled = disable;
        btnGuardar.innerHTML = disable ? '<i class="fas fa-spinner fa-spin"></i> Guardando...' : originalText;
        if (err) localShowNotification(err, 'error');
    };

    toggleBtn(true);

    // Determine initial state based on mode
    // Factura -> 'Realizada' (Ready for Inspection/Receiving)
    // Orden -> 'Orden de Compra' (Needs Approval)
    const estadoInicial = (modoCompra === 'factura') ? 'Realizada' : 'Orden de Compra';

    // New Fields
    const documentoId = document.getElementById('compra-documento').value;
    const facturaRef = document.getElementById('compra-factura-ref').value;

    if (!documentoId) {
        return toggleBtn(false, 'Seleccione un documento (consecutivo)');
    }

    // Validation: Invoice Reference Mandatory if Mode = Factura
    if (modoCompra === 'factura' && !facturaRef) {
        return toggleBtn(false, 'Debe ingresar el número de factura del proveedor');
    }

    const payload = {
        proveedor_id: proveedorId,
        sucursal_id: sucursalId,
        documento_id: documentoId,
        factura_referencia: facturaRef, // Cruce
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
            localShowNotification('Compra registrada exitosamente', 'success');
            cerrarModal();
            cargarCompras();
            setTimeout(() => {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalText;
            }, 500);
        } else {
            localShowNotification('Error: ' + data.message, 'error');
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = originalText;
        }
    } catch (err) {
        localShowNotification('Error al guardar compra: ' + err.message, 'error');
        toggleBtn(false);
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
        addBtn(containerEstado, '🖨️ PDF', 'btn-secondary', () => imprimirOrden(compra.id));
        addBtn(containerEstado, 'Registrar Factura', 'btn-primary', () => abrirModalAdjuntar(compra.id));
    } else if (estado === 'realizada') {
        addBtn(containerEstado, 'Recibir Mercancía', 'btn-primary', () => abrirModalInspeccion(compra.id));
    } else if (estado === 'recibida') {
        addBtn(containerEstado, 'Completar (Stock)', 'btn-primary', () => completarCompra(compra.id));
    } else if (estado === 'completada') {
        const span = document.createElement('span');
        span.className = 'badge recibida';
        span.innerHTML = '<i class="fas fa-check-circle"></i> Compra Finalizada';
        containerEstado.appendChild(span);
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
    // Open the print view in a new window/tab
    const width = 850;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open(`print_orden.html?id=${id}`, 'PrintOrden', `width=${width},height=${height},top=${top},left=${left}`);
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
            localShowNotification(`Estado cambiado a: ${nuevoEstado}`, 'success');
            // Mock update local for speed, then reload

            const c = allComprasData.find(x => x.id === id);
            if (c) c.estado = nuevoEstado;
            verCompra(id);
            cargarCompras();
        } else {
            localShowNotification('Error: ' + data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        localShowNotification('Error de conexión', 'error');
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
            localShowNotification(`Pago registrado: ${nuevoEstado}`, 'success');
            const c = allComprasData.find(x => x.id === id);

            if (c) c.estado_pago = nuevoEstado;
            verCompra(id);
            cargarCompras();
        } else {
            localShowNotification('Error: ' + data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        localShowNotification('Error de conexión', 'error');
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
            localShowNotification('Proveedor creado', 'success');
            document.getElementById('modal-quick-proveedor').style.display = 'none';

            form.reset();
            await cargarProveedores();
            // Auto Select?
            const select = document.getElementById('compra-proveedor');
            select.value = resp.id || resp.data?.id;
        } else {
            localShowNotification('Error: ' + resp.message, 'error');
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
            localShowNotification('Producto creado', 'success');
            document.getElementById('modal-quick-producto').style.display = 'none';
            form.reset();
            // Auto add to cart? need full product object.
            // For now just notify.
        } else {
            localShowNotification('Error: ' + resp.message, 'error');
        }
    } catch (err) { console.error(err); }
}

// Helper to safely call global notification
function localShowNotification(msg, type) {
    if (window.showNotification) window.showNotification(msg, type);
    else alert(msg);
}

// --- NEW WORKFLOW HANDLERS ---

function abrirModalAdjuntar(id) {
    compraActualId = id;
    document.getElementById('factura-ref-input').value = '';
    const fileInput = document.getElementById('factura-file-input');
    if (fileInput) fileInput.value = '';
    document.getElementById('modal-adjuntar-factura').style.display = 'flex';
}

async function guardarFacturaAdjunta() {
    const ref = document.getElementById('factura-ref-input').value;
    const fileInput = document.getElementById('factura-file-input');

    if (!ref) return localShowNotification('Ingrese el número de factura', 'error');

    const formData = new FormData();
    formData.append('estado', 'Realizada');
    formData.append('factura_referencia', ref);
    if (fileInput && fileInput.files[0]) {
        formData.append('factura', fileInput.files[0]);
    }

    try {
        const token = localStorage.getItem('token');
        // Note: Do NOT set Content-Type header when sending FormData, fetch sets it automatically with boundary
        const res = await fetch(`${API_URL}/${compraActualId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            localShowNotification('Factura registrada. Estado: Realizada', 'success');
            document.getElementById('modal-adjuntar-factura').style.display = 'none';

            // Workflow: Auto-advance to Inspection
            // First refresh list to update status in memory/UI
            await cargarCompras();

            // Open Inspection Modal Immediately
            setTimeout(() => {
                abrirModalInspeccion(compraActualId);
            }, 300);

        } else {
            localShowNotification('Error: ' + data.message, 'error');
        }
    } catch (e) { console.error(e); }
}


async function abrirModalInspeccion(id) {
    compraActualId = id;
    const modalInspeccion = document.getElementById('modal-inspeccion');
    const tbody = document.getElementById('inspeccion-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Cargando productos...</td></tr>';
    modalInspeccion.style.display = 'flex';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        tbody.innerHTML = '';

        if (data.success && data.data && data.data.length > 0) {
            data.data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.nombre_producto || 'Producto #' + item.producto_id}</td>
                    <td>${item.cantidad}</td>
                    <td>
                        <input type="number" id="insp-qty-${item.producto_id}" 
                               class="received-qty-input"
                               data-prod="${item.producto_id}"
                               min="0" 
                               max="${item.cantidad}" 
                               value="${item.cantidad}" 
                               style="width: 80px; padding: 5px; border:1px solid #ddd; border-radius:4px; text-align: center;">
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" checked style="transform: scale(1.2);">
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: orange;">No se encontraron detalles de productos para esta compra.</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Error cargando productos.</td></tr>';
    }
}

async function guardarInspeccion() {
    // Collect specific quantities
    const inputs = document.querySelectorAll('.received-qty-input');
    const receivedItems = [];

    inputs.forEach(inp => {
        receivedItems.push({
            producto_id: inp.dataset.prod,
            cantidad_recibida: parseFloat(inp.value) || 0
        });
    });

    // Validar si hay cambios (Parcialidad no soportada fully en backend en este paso, pero podemos guardar notas o ajustar items)
    // Por ahora, asumimos que el usuario edita lo que realmente entra.
    // TODO: Send `receivedItems` to backend to adjust Purchase Details if needed (Partial Delivery feature)
    // Current Logic: Just advance state manually.

    await cambiarEstado(compraActualId, 'Recibida');
    document.getElementById('modal-inspeccion').style.display = 'none';
}

async function completarCompra(id) {
    if (!confirm('¿Confirma que la mercancía ha sido ingresada al inventario de la sucursal?')) return;
    await cambiarEstado(id, 'Completada');
}

