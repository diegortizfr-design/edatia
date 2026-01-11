/**
 * Inventario Module JS
 * Optimized for real-time stock management and premium UI.
 */

let API_BASE = '';
let API_PRODUCTOS = '';
let API_INVENTARIO = '';
let tableBody;
let listaProductos = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_BASE = config.apiUrl;
        API_PRODUCTOS = `${API_BASE}/productos`;
        API_INVENTARIO = `${API_BASE}/inventario`;

        tableBody = document.querySelector('.glass-table tbody');

        // Initial Load
        await loadSucursales();
        await cargarInventario();

        // Listeners for filters
        document.getElementById('filtro-sucursal').addEventListener('change', cargarInventario);
        document.getElementById('filtro-categoria').addEventListener('change', cargarInventario);
        document.getElementById('filtro-estado').addEventListener('change', cargarInventario);

        // Adjustment Form
        document.getElementById('form-ajuste')?.addEventListener('submit', registrarAjuste);

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadSucursales() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/sucursales`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        const select = document.getElementById('filtro-sucursal');
        if (data.success && select) {
            select.innerHTML = '<option value="">Todas las Sucursales</option>';
            data.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.nombre;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Error loading branches:', e);
    }
}

async function cargarInventario() {
    try {
        const token = localStorage.getItem('token');
        const sucursalId = document.getElementById('filtro-sucursal').value;
        const categoria = document.getElementById('filtro-categoria').value;
        const estado = document.getElementById('filtro-estado').value;

        // Fetch products (which contain stock data)
        let url = `${API_PRODUCTOS}?`;
        if (sucursalId) url += `sucursal_id=${sucursalId}&`;
        if (categoria) url += `categoria=${categoria}&`;
        if (estado !== "") url += `activo=${estado}&`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            listaProductos = data.data;
            renderTable(listaProductos, sucursalId);
            updateKPIs(listaProductos);
            updateCategoryFilter(listaProductos);
            loadProductsForAjuste(listaProductos);
        }
    } catch (err) {
        console.error('Error cargando inventario:', err);
    }
}

function renderTable(productos, sucursalId = null) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    productos.forEach(p => {
        const stockActual = sucursalId ? (p.stock_sucursal || 0) : (p.stock_actual || 0);
        const stockLabel = sucursalId ? '(En Sucursal)' : '(Global)';

        // Critical stock check
        const isCritical = stockActual <= (p.stock_minimo || 5);
        const stockStyle = isCritical ? 'color: #EF4444; font-weight: bold;' : 'font-weight: 600;';

        const statusBadge = p.activo
            ? '<span class="badge" style="background:rgba(16,185,129,0.1); color:#10B981; border:1px solid rgba(16,185,129,0.2);">Activo</span>'
            : '<span class="badge" style="background:rgba(107,114,128,0.1); color:#6B7280; border:1px solid rgba(107,114,128,0.2);">Inactivo</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="prod-avatar">${p.nombre.charAt(0)}</div>
                    <div>
                        <div style="font-weight:600;">${p.nombre}</div>
                        <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${p.descripcion || ''}</div>
                    </div>
                </div>
            </td>
            <td><code>${p.codigo || '-'}</code></td>
            <td>${p.categoria || 'General'}</td>
            <td>
                <div style="${stockStyle}">${stockActual}</div>
                <div style="font-size:0.7rem; color:rgba(255,255,255,0.4);">${stockLabel}</div>
            </td>
            <td style="font-weight:600;">$${parseFloat(p.precio1 || 0).toLocaleString()}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button class="btn-icon-glass" onclick="verKardex(${p.id})" title="Kardex / Movimientos"><i class="fas fa-history"></i></button>
                    ${p.maneja_inventario ? `<button class="btn-icon-glass" onclick="openFastAjuste(${p.id})" title="Ajuste Rápido"><i class="fas fa-plus-minus"></i></button>` : ''}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateKPIs(productos) {
    const totalItems = productos.length;
    const stockCritico = productos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 5)).length;
    const valorTotal = productos.reduce((sum, p) => sum + ((p.costo || 0) * (p.stock_actual || 0)), 0);

    const cards = document.querySelectorAll('.kpi-grid .card');
    if (cards.length >= 3) {
        cards[0].querySelector('p').textContent = totalItems.toLocaleString();
        cards[1].querySelector('p').textContent = `${stockCritico} Productos`;
        cards[2].querySelector('p').textContent = '$' + (valorTotal / 1000000).toFixed(1) + 'M';
    }
}

function updateCategoryFilter(productos) {
    const select = document.getElementById('filtro-categoria');
    const currentVal = select.value;
    const categories = [...new Set(productos.map(p => p.categoria).filter(c => c))];

    select.innerHTML = '<option value="">Todas las Categorías</option>';
    categories.sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
    select.value = currentVal;
}

function loadProductsForAjuste(products) {
    const select = document.getElementById('ajuste-producto');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Seleccione...</option>';
    products.filter(p => p.maneja_inventario).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nombre;
        select.appendChild(opt);
    });
    select.value = current;
}

async function registrarAjuste(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const body = {
        producto_id: document.getElementById('ajuste-producto').value,
        tipo: document.getElementById('ajuste-tipo').value,
        cantidad: document.getElementById('ajuste-cantidad').value,
        motivo: document.getElementById('ajuste-motivo').value
    };

    try {
        const res = await fetch(`${API_INVENTARIO}/ajuste`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            showNotification('Ajuste registrado exitosamente', 'success');
            window.closeAjusteModal();
            document.getElementById('form-ajuste').reset();
            cargarInventario();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        showNotification('Error en la conexión', 'error');
    }
}

window.verKardex = async (id) => {
    const prod = listaProductos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('kardex-product-name').textContent = prod.nombre;
    const tbody = document.getElementById('kardex-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';
    document.getElementById('kardexModal').style.display = 'flex';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_INVENTARIO}/kardex/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(m => {
                const date = new Date(m.created_at).toLocaleDateString() + ' ' + new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isEntry = m.tipo_movimiento.includes('ENTRADA') || m.tipo_movimiento === 'COMPRA';
                const color = isEntry ? '#10B981' : '#F87171';
                const sign = isEntry ? '+' : '-';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${date}</td>
                    <td><span class="badge-sm" style="background:${color}22; color:${color}; border:1px solid ${color}44;">${m.tipo_movimiento}</span></td>
                    <td>${m.motivo || '-'} <br><small style="opacity:0.6;">${m.documento_referencia || ''}</small></td>
                    <td style="font-weight: bold; color: ${color};">${sign}${m.cantidad}</td>
                    <td style="font-weight: 500;">${m.stock_nuevo}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; opacity:0.5;">No hay movimientos</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar</td></tr>';
    }
};

window.openFastAjuste = (id) => {
    document.getElementById('ajuste-producto').value = id;
    window.openAjusteModal();
}
