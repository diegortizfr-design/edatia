/**
 * ERPod - Compras Module Logic
 */

let API_URL = '';
let PRODUCTOS_URL = '';
let TERCEROS_URL = '';
let SUCURSALES_URL = '';
let DOCUMENTOS_URL = '';
let UPLOAD_URL = '';
let tableBody, modal, btnNuevo, closeBtns;
let carrito = [];
let compraActualId = null;
let allComprasData = [];
let modoCompra = 'orden'; // 'orden' | 'factura'
let allProductsCatalogue = [];
let bulkSelection = {}; // { productId: quantity }
let sortStockAsc = false;

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

    // Filter out nested close buttons (handled by specific setupQuickModal)
    closeBtns.forEach(btn => {
        if (!btn.classList.contains('nested-close')) {
            btn.addEventListener('click', cerrarModal);
        }
    });
    // Listener removed here as it is assigned dynamically in abrirModalCompra
    // document.getElementById('btn-guardar-compra')?.addEventListener('click', guardarCompra);

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

    // Quick Create Listeners - Updated IDs to match new Glassmorphism Modal
    setupQuickModal('modal-quick-tercero', 'btn-quick-proveedor', 'close-quick-tercero', 'btn-cancel-quick-tercero', 'form-quick-tercero', guardarQuickProveedor);
    setupQuickModal('modal-quick-producto', 'btn-quick-producto', 'close-quick-prod', 'cancel-quick-prod', 'form-quick-producto', guardarQuickProducto);

    // Specific button for product save because it's not a submit button in the new structure (to match original config module)
    document.getElementById('btn-save-quick-prod')?.addEventListener('click', () => {
        document.getElementById('form-quick-producto').dispatchEvent(new Event('submit'));
    });

    // Modals Listeners (Invoice & Inspection)
    const btnsCloseAdjuntar = document.querySelectorAll('.close-modal-btn[data-target="modal-adjuntar-factura"]');
    btnsCloseAdjuntar.forEach(btn => btn.addEventListener('click', () => document.getElementById('modal-adjuntar-factura').style.display = 'none'));

    const btnsCloseInsp = document.querySelectorAll('.close-modal-btn[data-target="modal-inspeccion"]');
    btnsCloseInsp.forEach(btn => btn.addEventListener('click', () => document.getElementById('modal-inspeccion').style.display = 'none'));

    document.getElementById('btn-confirmar-factura')?.addEventListener('click', guardarFacturaAdjunta);
    document.getElementById('btn-save-inspeccion')?.addEventListener('click', guardarInspeccion); // Fixed ID match

    // Bulk Selector Listeners
    document.getElementById('btn-bulk-productos')?.addEventListener('click', abrirCargarProductosMasivo);
    document.getElementById('close-bulk-prod')?.addEventListener('click', cerrarBulkSelector);
    document.getElementById('btn-cancel-bulk')?.addEventListener('click', cerrarBulkSelector);
    document.getElementById('btn-confirm-bulk')?.addEventListener('click', confirmarSeleccionMasiva);
    document.getElementById('filter-bulk-prod')?.addEventListener('input', (e) => renderBulkProdList(e.target.value));

    document.getElementById('btn-sort-stock')?.addEventListener('click', () => {
        sortStockAsc = !sortStockAsc;
        const btn = document.getElementById('btn-sort-stock');
        if (sortStockAsc) {
            btn.style.background = '#eef2ff';
            btn.style.borderColor = '#6366f1';
            btn.style.color = '#6366f1';
        } else {
            btn.style.background = 'white';
            btn.style.borderColor = '#cbd5e1';
            btn.style.color = '#64748b';
        }
        renderBulkProdList(document.getElementById('filter-bulk-prod').value);
    });

    // ... setupQuickModal function ...

    // --- STATE MANAGEMENT ---

    async function guardarFacturaAdjunta() {
        if (!compraActualId) return;

        const facturaRef = document.getElementById('factura-ref-input').value; // Correct ID for small modal
        const fileInput = document.getElementById('factura-file-input');

        if (!facturaRef) {
            return localShowNotification('Debe ingresar el número de factura del proveedor', 'warning');
        }

        const formData = new FormData();
        formData.append('factura_referencia', facturaRef);
        formData.append('estado', 'Realizada'); // Auto-transition to Realizada

        if (fileInput.files.length > 0) {
            formData.append('archivo', fileInput.files[0]);
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${compraActualId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type for FormData
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                localShowNotification('Factura registrada correctamente', 'success');
                document.getElementById('modal-adjuntar-factura').style.display = 'none';
                // Clear inputs
                document.getElementById('factura-ref-input').value = '';
                fileInput.value = '';

                // Refund/Reload
                const c = allComprasData.find(x => x.id === compraActualId);
                if (c) {
                    c.estado = 'Realizada';
                    c.factura_referencia = facturaRef;
                }
                verCompra(compraActualId);
                cargarCompras();
            } else {
                localShowNotification(data.message, 'error');
            }
        } catch (e) {
            console.error(e);
            localShowNotification('Error al guardar factura', 'error');
        }
    }

    async function guardarQuickProveedor(e) {
        if (e && e.preventDefault) e.preventDefault();

        const nombre = document.getElementById('qt_nombre_comercial').value;
        const documento = document.getElementById('qt_documento').value;

        if (!nombre || !documento) {
            localShowNotification('Nombre y Documento son obligatorios', 'warning');
            return;
        }

        const formData = {
            nombre_comercial: nombre,
            razon_social: document.getElementById('qt_razon_social').value,
            tipo_documento: document.getElementById('qt_tipo_documento').value,
            documento: documento,
            telefono: document.getElementById('qt_telefono').value,
            email: document.getElementById('qt_email').value,
            direccion: document.getElementById('qt_direccion').value,
            es_cliente: document.getElementById('qt_es_cliente').checked,
            es_proveedor: document.getElementById('qt_es_proveedor').checked
        };

        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(TERCEROS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await resp.json();
            if (data.success) {
                localShowNotification('Proveedor creado exitosamente', 'success');
                document.getElementById('modal-quick-tercero').style.display = 'none';
                document.getElementById('form-quick-tercero').reset();

                await cargarProveedores();

                // Auto-select the new provider
                const select = document.getElementById('compra-proveedor');
                const newId = data.id || data.data?.id;
                if (newId) {
                    setTimeout(() => {
                        select.value = newId;
                    }, 200);
                }

            } else {
                localShowNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Quick Provider Error:', error);
            localShowNotification('Error al crear proveedor', 'error');
        }
    }
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
        UPLOAD_URL = `${config.apiUrl}/upload`;

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
        // Custom reset for quick product image
        if (modalId === 'modal-quick-producto') {
            deleteQuickProductImage();
        }
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
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon" onclick="verCompra(${c.id})" title="Ver detalle" style="color: #6366f1;"><i class="fas fa-eye"></i></button>
                    ${c.estado !== 'Completada' ? `
                        <button class="btn-icon" onclick="editarCompra(${c.id})" title="Editar" style="color: #0ea5e9;"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="eliminarCompra(${c.id})" title="Eliminar" style="color: #ef4444;"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </div>
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
    compraActualId = null; // Reset ID
    const titulo = document.querySelector('#modal-nueva-compra h2');
    const btn = document.getElementById('btn-guardar-compra');

    // Reset inputs
    document.getElementById('compra-factura-ref').value = '';
    const dateInput = document.getElementById('compra-fecha');
    if (dateInput) dateInput.valueAsDate = new Date();
    document.getElementById('compra-proveedor').value = '';
    document.getElementById('compra-documento').value = '';
    document.getElementById('compra-sucursal').value = '';
    document.getElementById('compra-metodo-pago').value = 'Contado';

    const refFieldContainer = document.getElementById('compra-factura-ref').parentElement;

    // Remove previous listeners to avoid duplicates (cleanest way: clone node or named functions)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    const finalBtn = document.getElementById('btn-guardar-compra');

    if (modo === 'factura') {
        titulo.textContent = 'Registrar Factura de Compra';
        finalBtn.innerHTML = '<i class="fas fa-file-check" style="margin-right: 8px;"></i> Guardar Factura (Realizada)';
        finalBtn.classList.remove('btn-secondary', 'btn-primary');
        finalBtn.classList.add('btn-premium');
        refFieldContainer.style.display = 'block';
        finalBtn.addEventListener('click', guardarFactura);
        await cargarDocumentosCompra('FC');
    } else {
        titulo.textContent = 'Nueva Orden de Compra';
        finalBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i> Guardar Orden';
        finalBtn.classList.add('btn-primary');
        finalBtn.classList.remove('btn-secondary', 'btn-premium');
        refFieldContainer.style.display = 'none';

        // Ensure the value is really gone so it passes the 'if (factura_referencia)' check as false
        document.getElementById('compra-factura-ref').value = '';

        finalBtn.addEventListener('click', guardarOrden);
        await cargarDocumentosCompra('OC');
    }

    modal.style.display = 'flex';
    carrito = [];
    renderCarrito();
    document.getElementById('mensaje-vacio').style.display = 'block';
    document.getElementById('compra-total').textContent = '$0.00';
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

function agregarAlCarrito(producto, manualQty = null) {
    const existing = carrito.find(i => i.producto_id === producto.id);
    const qtyToAdd = manualQty !== null ? parseFloat(manualQty) : 1;

    if (existing) {
        if (manualQty !== null) {
            existing.cantidad += qtyToAdd;
        } else {
            existing.cantidad++;
        }
        existing.subtotal = existing.cantidad * existing.costo;
    } else {
        carrito.push({
            producto_id: producto.id,
            nombre: producto.nombre,
            cantidad: qtyToAdd,
            costo: parseFloat(producto.costo || 0),
            subtotal: qtyToAdd * parseFloat(producto.costo || 0)
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

async function guardarOrden() {
    await procesarGuardado('Orden de Compra');
}

async function guardarFactura() {
    // Explicit Validation for Invoice
    const facturaRef = document.getElementById('compra-factura-ref').value;
    if (!facturaRef) return localShowNotification('Debe ingresar el número de factura del proveedor', 'error');

    await procesarGuardado('Realizada');
}

async function eliminarCompra(id) {
    if (!confirm('¿Está seguro de eliminar esta compra?')) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            localShowNotification('Eliminado correctamente', 'success');
            cargarCompras();
        } else {
            localShowNotification(data.message, 'error');
        }
    } catch (e) { localShowNotification('Error eliminando', 'error'); }
}

async function editarCompra(id) {
    const compra = allComprasData.find(c => c.id === id);
    if (!compra) return;

    compraActualId = id;
    abrirModalCompra(compra.factura_referencia ? 'factura' : 'orden');

    compraActualId = id; // Re-set
    const titulo = document.querySelector('#modal-nueva-compra h2');
    titulo.textContent = `Editar ${compra.factura_referencia ? 'Factura' : 'Orden'} #${compra.numero_comprobante || id}`;

    document.getElementById('compra-proveedor').value = compra.proveedor_id;
    document.getElementById('compra-sucursal').value = compra.sucursal_id || '';
    document.getElementById('compra-fecha').value = new Date(compra.fecha).toISOString().split('T')[0];
    document.getElementById('compra-factura-ref').value = compra.factura_referencia || '';
    document.getElementById('compra-metodo-pago').value = compra.metodo_pago || 'Contado';

    setTimeout(() => {
        document.getElementById('compra-documento').value = compra.documento_id || '';
    }, 500);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            carrito = data.data.map(item => ({
                producto_id: item.producto_id,
                nombre: item.nombre_producto,
                cantidad: parseFloat(item.cantidad),
                costo: parseFloat(item.costo_unitario),
                subtotal: parseFloat(item.subtotal)
            }));
            renderCarrito();
            document.getElementById('compra-total').textContent = `$${parseFloat(compra.total).toLocaleString()}`;
        }
    } catch (err) { console.error(err); }
}


async function procesarGuardado(estadoForzado) {
    if (carrito.length === 0) return localShowNotification('El carrito está vacío', 'error');

    const proveedorId = document.getElementById('compra-proveedor').value;
    const sucursalId = document.getElementById('compra-sucursal').value;
    const documentoId = document.getElementById('compra-documento').value;
    const facturaRef = document.getElementById('compra-factura-ref').value;
    const fecha = document.getElementById('compra-fecha').value;
    const metodoPago = document.getElementById('compra-metodo-pago').value;

    if (!proveedorId) return localShowNotification('Selecciona un proveedor', 'error');
    if (!sucursalId) return localShowNotification('Selecciona una sucursal destino', 'error');
    if (!documentoId) return localShowNotification('Seleccione un documento (consecutivo)', 'error');

    const btnGuardar = document.getElementById('btn-guardar-compra');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const payload = {
        proveedor_id: proveedorId,
        sucursal_id: sucursalId,
        documento_id: documentoId,
        factura_referencia: facturaRef,
        fecha: fecha,
        metodo_pago: metodoPago,
        total: carrito.reduce((sum, i) => sum + i.subtotal, 0),
        estado: estadoForzado, // Explicit state
        items: carrito
    };

    try {
        const token = localStorage.getItem('token');
        const url = compraActualId ? `${API_URL}/${compraActualId}` : API_URL;
        const method = compraActualId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            localShowNotification(compraActualId ? 'Actualizado exitosamente' : 'Guardado exitosamente', 'success');
            cerrarModal();
            cargarCompras();
        } else {
            localShowNotification('Error: ' + data.message, 'error');
        }
    } catch (err) {
        localShowNotification('Error al guardar: ' + err.message, 'error');
    } finally {
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
    document.getElementById('view-doc-ref').textContent = `Documento: ${compra.combo_documento || compra.numero_comprobante || id}`;
    document.getElementById('view-proveedor').textContent = compra.proveedor_nombre || `ID: ${compra.proveedor_id}`;
    document.getElementById('view-fecha').textContent = new Date(compra.fecha).toLocaleDateString();
    document.getElementById('view-total').textContent = `$${parseFloat(compra.total).toLocaleString()}`;

    // Update Badges / States
    const elEstado = document.getElementById('view-estado-compra');
    elEstado.innerHTML = `<span class="badge ${getBadgeClass(compra.estado)}">${compra.estado || 'Orden de Compra'}</span>`;

    const elPago = document.getElementById('view-estado-pago');
    elPago.innerHTML = `<span class="badge ${getBadgeClass(compra.estado_pago)}">${compra.estado_pago || 'Debe'}</span>`;

    // Generate Actions
    generateActionButtons(compra);

    // Populate Items
    const tbody = document.getElementById('view-detalle-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(item => {
                const tr = document.createElement('tr');
                const subtotal = parseFloat(item.subtotal || (item.cantidad * item.costo_unitario));
                tr.innerHTML = `
                    <td style="padding: 12px 20px;">${item.nombre_producto}</td>
                    <td style="padding: 12px 20px; text-align: center;">${item.cantidad}</td>
                    <td style="padding: 12px 20px;">$${parseFloat(item.costo_unitario).toLocaleString()}</td>
                    <td style="padding: 12px 20px; font-weight: 600;">$${subtotal.toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">No hay productos registrados para esta compra.</td></tr>';
        }
    } catch (err) {
        console.error('Error fetching details:', err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ef4444;">Error cargando productos.</td></tr>';
    }
}

function generateActionButtons(compra) {
    const containerEstado = document.getElementById('view-actions-compra');
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

    const nombre = document.getElementById('qt_nombre_comercial').value;
    const documento = document.getElementById('qt_documento').value;

    if (!nombre || !documento) {
        localShowNotification('Nombre y Documento son obligatorios', 'warning');
        return;
    }

    const formData = {
        nombre_comercial: nombre,
        razon_social: document.getElementById('qt_razon_social').value,
        tipo_documento: document.getElementById('qt_tipo_documento').value,
        documento: documento,
        telefono: document.getElementById('qt_telefono').value,
        email: document.getElementById('qt_email').value,
        direccion: document.getElementById('qt_direccion').value,
        es_cliente: document.getElementById('qt_es_cliente').checked,
        es_proveedor: document.getElementById('qt_es_proveedor').checked,
        tipo: 'Proveedor' // Legacy compatibility
    };

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(TERCEROS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await resp.json();
        if (data.success) {
            localShowNotification('Proveedor creado exitosamente', 'success');
            document.getElementById('modal-quick-tercero').style.display = 'none';
            document.getElementById('form-quick-tercero').reset();

            await cargarProveedores();

            // Auto-select the new provider
            const select = document.getElementById('compra-proveedor');
            const newId = data.id || data.data?.id;
            if (newId) {
                setTimeout(() => {
                    select.value = newId;
                }, 200);
            }

        } else {
            localShowNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Quick Provider Error:', error);
        localShowNotification('Error al crear proveedor', 'error');
    }
}

async function uploadQuickProductImage(input) {
    const file = input.files[0];
    if (!file) return;

    const btn = input.nextElementSibling; // The "Subir Foto" button
    const container = document.getElementById('qp_image_preview_container');
    const preview = document.getElementById('qp_image_preview');
    const icon = container.querySelector('i');
    const deleteBtn = document.getElementById('qp_btn_delete_img');

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await resp.json();

        if (data.success) {
            document.getElementById('qp_imagen_url').value = data.url;
            preview.src = data.url;
            preview.style.display = 'block';
            icon.style.display = 'none';
            deleteBtn.style.display = 'flex';
            localShowNotification('Imagen subida con éxito', 'success');
        } else {
            localShowNotification(data.message || 'Error al subir imagen', 'error');
        }
    } catch (e) {
        console.error('Upload error:', e);
        localShowNotification('Error de conexión al subir imagen', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        input.value = '';
    }
}

function deleteQuickProductImage() {
    const container = document.getElementById('qp_image_preview_container');
    const preview = document.getElementById('qp_image_preview');
    const icon = container.querySelector('i');
    const deleteBtn = document.getElementById('qp_btn_delete_img');
    const urlInput = document.getElementById('qp_imagen_url');

    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    if (icon) icon.style.display = 'block';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (urlInput) urlInput.value = '';
}

window.uploadQuickProductImage = uploadQuickProductImage;
window.deleteQuickProductImage = deleteQuickProductImage;

async function guardarQuickProducto(e) {
    if (e) e.preventDefault();

    const nombre = document.getElementById('qp_nombre').value;
    if (!nombre) return localShowNotification('El nombre es obligatorio', 'warning');

    const formData = {
        nombre: nombre,
        referencia_fabrica: document.getElementById('qp_referencia_fabrica').value,
        codigo: document.getElementById('qp_codigo').value,
        categoria: document.getElementById('qp_categoria').value,
        unidad_medida: document.getElementById('qp_unidad_medida').value,
        precio1: parseFloat(document.getElementById('qp_precio1').value) || 0,
        precio2: parseFloat(document.getElementById('qp_precio2').value) || 0,
        costo: parseFloat(document.getElementById('qp_costo').value) || 0,
        impuesto_porcentaje: parseFloat(document.getElementById('qp_impuesto_porcentaje').value) || 0,
        stock_minimo: parseInt(document.getElementById('qp_stock_minimo').value) || 0,
        activo: document.getElementById('qp_activo').checked ? 1 : 0,
        maneja_inventario: document.getElementById('qp_maneja_inventario').checked ? 1 : 0,
        imagen_url: document.getElementById('qp_imagen_url').value || ''
    };

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(PRODUCTOS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const resp = await res.json();
        if (resp.success) {
            localShowNotification('Producto creado exitosamente', 'success');
            document.getElementById('modal-quick-producto').style.display = 'none';
            document.getElementById('form-quick-producto').reset();
            deleteQuickProductImage();

            // Auto-add to cart
            const newProd = {
                id: resp.id || resp.data?.id,
                nombre: formData.nombre,
                costo: formData.costo,
                stock_actual: 0
            };
            if (newProd.id) {
                agregarAlCarrito(newProd);
            }
        } else {
            localShowNotification('Error: ' + resp.message, 'error');
        }
    } catch (err) {
        console.error(err);
        localShowNotification('Error de conexión al crear producto', 'error');
    }
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
        const res = await fetch(`${API_URL}/${compraActualId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            localShowNotification('Factura registrada. Estado: Realizada', 'success');
            document.getElementById('modal-adjuntar-factura').style.display = 'none';

            await cargarCompras();

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
    const inputs = document.querySelectorAll('.received-qty-input');
    await cambiarEstado(compraActualId, 'Recibida');
    document.getElementById('modal-inspeccion').style.display = 'none';
}

async function completarCompra(id) {
    if (!confirm('¿Confirma que la mercancía ha sido ingresada al inventario de la sucursal?')) return;
    await cambiarEstado(id, 'Completada');
}

/**
 * BULK SELECTOR LOGIC
 */
async function abrirCargarProductosMasivo() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(PRODUCTOS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            allProductsCatalogue = data.data || [];
            bulkSelection = {};
            document.getElementById('bulk-selection-count').textContent = '0 productos seleccionados';
            document.getElementById('filter-bulk-prod').value = '';
            renderBulkProdList();
            document.getElementById('modal-bulk-productos').style.display = 'flex';
        } else {
            localShowNotification('Error al cargar catálogo', 'error');
        }
    } catch (err) {
        console.error(err);
        localShowNotification('Error de conexión', 'error');
    }
}

function renderBulkProdList(filter = '') {
    const listBody = document.getElementById('bulk-prod-body');
    listBody.innerHTML = '';

    let filtered = allProductsCatalogue.filter(p =>
        p.nombre.toLowerCase().includes(filter.toLowerCase()) ||
        (p.referencia_fabrica && p.referencia_fabrica.toLowerCase().includes(filter.toLowerCase())) ||
        (p.codigo && p.codigo.toLowerCase().includes(filter.toLowerCase()))
    );

    if (sortStockAsc) {
        filtered.sort((a, b) => (parseFloat(a.stock_actual) || 0) - (parseFloat(b.stock_actual) || 0));
    } else {
        filtered.sort((a, b) => (parseFloat(b.stock_actual) || 0) - (parseFloat(a.stock_actual) || 0));
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        const isSelected = bulkSelection[p.id] !== undefined;
        const qty = bulkSelection[p.id] || '';

        tr.innerHTML = `
            <td style="padding: 12px 20px; text-align: center;">
                <input type="checkbox" ${isSelected ? 'checked' : ''} 
                    onchange="toggleBulkSelection(${p.id}, this.checked)"
                    style="transform: scale(1.3); cursor: pointer; accent-color: #6366f1;">
            </td>
            <td style="padding: 12px 20px;">
                <div style="font-weight: 600; color: #1e293b;">${p.nombre}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${p.referencia_fabrica || 'Sin ref.'} | ${p.codigo || 'S/N'}</div>
            </td>
            <td style="padding: 12px 20px; color: #64748b;">${p.stock_actual || 0}</td>
            <td style="padding: 12px 20px;">
                <input type="number" id="bulk-qty-${p.id}" value="${qty}" min="0" 
                    placeholder="0"
                    onchange="window.updateBulkSelection(${p.id}, this.value)"
                    style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center;">
            </td>
        `;
        listBody.appendChild(tr);
    });
}

function toggleBulkSelection(id, checked) {
    if (checked) {
        if (!bulkSelection[id]) {
            bulkSelection[id] = 1;
            const input = document.getElementById(`bulk-qty-${id}`);
            if (input) input.value = 1;
        }
    } else {
        delete bulkSelection[id];
        const input = document.getElementById(`bulk-qty-${id}`);
        if (input) input.value = '';
    }
    updateBulkCounter();
}

function updateBulkSelection(id, val) {
    const qty = parseFloat(val) || 0;
    if (qty > 0) {
        bulkSelection[id] = qty;
        const cb = document.querySelector(`input[type="checkbox"][onchange*="toggleBulkSelection(${id}"]`);
        if (cb) cb.checked = true;
    } else {
        delete bulkSelection[id];
        const cb = document.querySelector(`input[type="checkbox"][onchange*="toggleBulkSelection(${id}"]`);
        if (cb) cb.checked = false;
    }
    updateBulkCounter();
}

function updateBulkCounter() {
    const count = Object.keys(bulkSelection).length;
    const counterEl = document.getElementById('bulk-selection-count');
    if (counterEl) counterEl.textContent = `${count} productos seleccionados`;
}

function confirmarSeleccionMasiva() {
    const ids = Object.keys(bulkSelection);
    if (ids.length === 0) {
        return localShowNotification('No has seleccionado ningún producto con cantidad', 'warning');
    }

    let addedCount = 0;
    ids.forEach(id => {
        const prod = allProductsCatalogue.find(p => p.id == id);
        if (prod) {
            agregarAlCarrito(prod, bulkSelection[id]);
            addedCount++;
        }
    });

    localShowNotification(`${addedCount} productos añadidos`, 'success');
    cerrarBulkSelector();
}

function cerrarBulkSelector() {
    document.getElementById('modal-bulk-productos').style.display = 'none';
    allProductsCatalogue = [];
    bulkSelection = {};
}

window.updateBulkSelection = updateBulkSelection;
window.toggleBulkSelection = toggleBulkSelection;

