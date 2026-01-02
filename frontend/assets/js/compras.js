/**
 * ERPod - Compras Module Logic
 */

let API_URL = '';
let PRODUCTOS_URL = '';
let TERCEROS_URL = '';
let tableBody, modal, btnNuevo, closeBtns;
let carrito = [];
let proveedores = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/compras`;
        PRODUCTOS_URL = `${config.apiUrl}/productos`;
        TERCEROS_URL = `${config.apiUrl}/terceros`;

        // Initialize DOM Elements
        tableBody = document.getElementById('compras-table-body');
        modal = document.getElementById('modal-nueva-compra');
        btnNuevo = document.getElementById('btn-nueva-compra');
        closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

        cargarCompras();

        if (btnNuevo) btnNuevo.addEventListener('click', abrirModalCompra);

        closeBtns.forEach(btn => btn.addEventListener('click', cerrarModal));

        // Search Logic
        const inputBusqueda = document.getElementById('busqueda-producto');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') buscarProducto(inputBusqueda.value);
            });
        }

        document.getElementById('btn-buscar-producto')?.addEventListener('click', () => {
            buscarProducto(document.getElementById('busqueda-producto').value);
        });

        document.getElementById('btn-guardar-compra')?.addEventListener('click', guardarCompra);

        // Set default date to today
        const dateInput = document.getElementById('compra-fecha');
        if (dateInput) dateInput.valueAsDate = new Date();

        // Quick Create Listeners
        document.getElementById('btn-quick-proveedor')?.addEventListener('click', () => {
            document.getElementById('modal-quick-proveedor').style.display = 'flex';
        });
        document.getElementById('close-quick-prov')?.addEventListener('click', () => {
            document.getElementById('modal-quick-proveedor').style.display = 'none';
        });
        document.getElementById('save-quick-prov')?.addEventListener('click', guardarQuickProveedor);

        document.getElementById('btn-quick-producto')?.addEventListener('click', () => {
            document.getElementById('modal-quick-producto').style.display = 'flex';
        });
        document.getElementById('close-quick-prod')?.addEventListener('click', () => {
            document.getElementById('modal-quick-producto').style.display = 'none';
        });
        document.getElementById('save-quick-prod')?.addEventListener('click', guardarQuickProducto);

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

// --- LISTING LOGIC ---

async function cargarCompras() {
    if (!tableBody) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            renderTable(data.data);
            updateKPIs(data.data);
        }
    } catch (err) { console.error(err); }
}

function renderTable(compras) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (compras.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #6B7280;">No hay órdenes registradas</td></tr>`;
        return;
    }
    compras.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${c.id}</td>
            <td>${c.proveedor_nombre || 'Proveedor #' + c.proveedor_id}</td>
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td><strong>$${parseFloat(c.total).toLocaleString()}</strong></td>
            <td><span class="badge ${c.estado === 'Pagada' ? 'active' : 'warning'}">${c.estado || 'Pendiente'}</span></td>
            <td>
                <button class="btn-icon" title="Ver detalle"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateKPIs(compras) {
    const porPagar = compras.filter(c => c.estado !== 'Pagada').reduce((acc, curr) => acc + parseFloat(curr.total), 0);
    document.getElementById('kpi-por-pagar').textContent = `$${porPagar.toLocaleString()}`;
    document.getElementById('kpi-pedidos').textContent = `${compras.filter(c => c.estado === 'Pendiente').length} Órdenes`;
    document.getElementById('kpi-recepciones').textContent = `${compras.length} Totales`;
}

// --- CREATION LOGIC ---

async function abrirModalCompra() {
    modal.style.display = 'flex';
    carrito = [];
    renderCarrito();
    await cargarProveedores();
}

function cerrarModal() {
    modal.style.display = 'none';
}

async function cargarProveedores() {
    const select = document.getElementById('compra-proveedor');
    if (select.options.length > 1) return; // Already loaded

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${TERCEROS_URL}?tipo=proveedor`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
            data.data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nombre_comercial;
                select.appendChild(opt);
            });
        }
    } catch (err) { console.error('Error loading providers', err); }
}

async function buscarProducto(query) {
    if (!query) return;
    const resultadosDiv = document.getElementById('resultados-busqueda');
    resultadosDiv.style.display = 'block';
    resultadosDiv.innerHTML = '<div style="padding:10px;">Buscando...</div>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${PRODUCTOS_URL}?busqueda=${encodeURIComponent(query)}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        resultadosDiv.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(prod => {
                const item = document.createElement('div');
                item.style.padding = '10px';
                item.style.borderBottom = '1px solid #eee';
                item.style.cursor = 'pointer';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.innerHTML = `<span>${prod.nombre} (Stock: ${prod.stock_actual})</span> <strong>$${parseFloat(prod.costo).toLocaleString()}</strong>`;
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
            resultadosDiv.innerHTML = '<div style="padding:10px; color: red;">No encontrado (Intenta crear el producto primero)</div>';
        }
    } catch (err) {
        resultadosDiv.innerHTML = '<div style="padding:10px;">Error al buscar</div>';
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
    if (!proveedorId) return showNotification('Selecciona un proveedor', 'error');

    const payload = {
        proveedor_id: proveedorId,
        fecha: document.getElementById('compra-fecha').value,
        total: carrito.reduce((sum, i) => sum + i.subtotal, 0),
        estado: 'Recibida', // Auto-receive for now
        items: carrito
    };

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showNotification('Compra registrada exitosamente', 'success');
            cerrarModal();
            cargarCompras();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (err) {
        showNotification('Error al guardar compra', 'error');
    }
}
