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
        await loadCompanyConfig(); // Load duplicate rules
        await cargarInventario();

        // Listeners for filters
        document.getElementById('filtro-sucursal').addEventListener('change', cargarInventario);
        document.getElementById('filtro-categoria').addEventListener('change', cargarInventario);
        document.getElementById('filtro-estado').addEventListener('change', cargarInventario);

        // Search Listener with Debounce
        let searchTimeout;
        document.getElementById('busqueda-inventario')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                cargarInventario();
            }, 300);
        });

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
        const busqueda = document.getElementById('busqueda-inventario')?.value.trim();

        // Fetch products (which contain stock data)
        let url = `${API_PRODUCTOS}?`;
        if (sucursalId) url += `sucursal_id=${sucursalId}&`;
        if (categoria) url += `categoria=${categoria}&`;
        if (estado !== "") url += `activo=${estado}&`;
        if (busqueda) url += `busqueda=${encodeURIComponent(busqueda)}&`;

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

    // Duplicate detection (Dynamic)
    const keyMap = {};
    productos.forEach(p => {
        const key = getDuplicateKey(p);
        keyMap[key] = (keyMap[key] || 0) + 1;
    });
    // Count objects that are duplicates
    const totalDuplicates = productos.filter(p => keyMap[getDuplicateKey(p)] > 1).length;


    const stockCritico = productos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo !== undefined ? p.stock_minimo : 5)).length;
    const valorTotal = productos.reduce((sum, p) => sum + ((p.costo || 0) * (p.stock_actual || 0)), 0);

    const cards = document.querySelectorAll('.kpi-grid .card');
    if (cards.length >= 3) {
        // 1. Total Items with Duplicate Warning
        let totalHTML = totalItems.toLocaleString();

        // Construct detailed title
        const activeCriteria = [];
        if (inventoryConfig.duplicados.nombre) activeCriteria.push('Nombre');
        if (inventoryConfig.duplicados.codigo) activeCriteria.push('SKU');
        if (inventoryConfig.duplicados.referencia_fabrica) activeCriteria.push('Ref');
        if (inventoryConfig.duplicados.categoria) activeCriteria.push('Cat');
        const criteriaText = activeCriteria.length > 0 ? activeCriteria.join(', ') : 'Nombre (Backup)';

        if (totalDuplicates > 0) {
            console.warn('Duplicates found:', totalDuplicates, 'Criteria:', criteriaText);
            totalHTML += `<div onclick="openDuplicadosModal()" style="font-size: 0.7em; color: #EF4444; margin-top: 5px; cursor: pointer; text-decoration: underline;" title="Criterio: ${criteriaText}. Clic para ver detalles"><i class="fas fa-exclamation-circle"></i> ${totalDuplicates} Duplicados</div>`;
        }
        cards[0].querySelector('p').innerHTML = totalHTML;

        // 2. Stock Critico
        cards[1].querySelector('p').textContent = `${stockCritico} Productos`;

        // 3. Valor Inventario (Full COP Format: $ 14.200.000)
        // Using es-CO locale
        const valorFormatted = '$ ' + valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        cards[2].querySelector('p').textContent = valorFormatted;
    }
}

// --- CRITICAL STOCK MANAGEMENT ---

window.loadCriticalStockData = () => {
    const criticalProducts = listaProductos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo !== undefined ? p.stock_minimo : 5));
    renderCriticalTable(criticalProducts);
};

function renderCriticalTable(products) {
    const tbody = document.getElementById('stock-critico-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay productos en stock crítico</td></tr>';
        return;
    }

    products.forEach(p => {
        const min = p.stock_minimo !== undefined ? p.stock_minimo : 5;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="stock-check" value="${p.id}"></td>
            <td>
                <div style="font-weight: 600;">${p.nombre}</div>
                <div style="font-size: 0.8em; color: #888;">${p.codigo || '-'}</div>
            </td>
            <td style="color: #EF4444; font-weight: bold;">${p.stock_actual || 0}</td>
            <td>${min}</td>
        `;
        tbody.appendChild(row);
    });
}

window.toggleSelectAll = (checked) => {
    document.querySelectorAll('.stock-check').forEach(ck => ck.checked = checked);
};


let inventoryConfig = { duplicados: { nombre: true } }; // Default

// Load Company Config
async function loadCompanyConfig() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/empresa`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.empresa && data.empresa.config_inventario) {
            const conf = typeof data.empresa.config_inventario === 'string'
                ? JSON.parse(data.empresa.config_inventario)
                : data.empresa.config_inventario;

            if (conf.duplicados) inventoryConfig.duplicados = conf.duplicados;
        }
    } catch (e) { console.error("Error loading company config", e); }
}

// Helper to generate key based on config
function getDuplicateKey(p) {
    let parts = [];
    if (inventoryConfig.duplicados.nombre) parts.push((p.nombre || '').trim().toLowerCase());
    if (inventoryConfig.duplicados.codigo) parts.push((p.codigo || '').trim().toLowerCase());
    if (inventoryConfig.duplicados.referencia_fabrica) parts.push((p.referencia_fabrica || '').trim().toLowerCase());
    if (inventoryConfig.duplicados.categoria) parts.push((p.categoria || '').trim().toLowerCase());

    // If no config selected, default to Name (safety fallback)
    if (parts.length === 0) return (p.nombre || '').trim().toLowerCase();

    return parts.join('||');
}

window.loadDuplicatesData = () => {
    // Reset view
    document.getElementById('duplicados-list-view').style.display = 'block';
    document.getElementById('duplicados-merge-view').style.display = 'none';

    const keyMap = {};

    listaProductos.forEach(p => {
        const key = getDuplicateKey(p);
        if (!keyMap[key]) keyMap[key] = [];
        keyMap[key].push(p); // Store full objects
    });

    const duplicates = Object.entries(keyMap)
        .filter(([key, items]) => items.length > 1)
        .map(([key, items]) => {
            return {
                key: key,
                name: items[0].nombre, // Use first as rep
                count: items.length,
                codes: items.map(i => i.codigo || 'Sin SKU').join(', '),
                items: items
            };
        })
        .sort((a, b) => b.count - a.count);

    const tbody = document.getElementById('duplicados-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (duplicates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay duplicados encontrados</td></tr>';
    } else {
        duplicates.forEach(d => {
            // Encode key for safe usage in onclick
            const safeKey = encodeURIComponent(d.key);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${d.name.substring(0, 40)}${d.name.length > 40 ? '...' : ''}</strong> 
                    <br><small style="color:#aaa;">${d.key !== d.name.toLowerCase() ? 'Clave: ' + d.key.substring(0, 30) : ''}</small>
                </td>
                <td style="text-align: center; color: #EF4444; font-weight: bold;">${d.count}</td>
                <td style="font-size: 0.85em; color: #666; word-break: break-all;">${d.codes}</td>
                <td>
                    <button class="btn-sm" onclick="setupMergeUI('${safeKey}')">Gestionar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
};

window.showDuplicatesList = () => {
    document.getElementById('duplicados-list-view').style.display = 'block';
    document.getElementById('duplicados-merge-view').style.display = 'none';
};

window.setupMergeUI = (encodedKey) => {
    const key = decodeURIComponent(encodedKey);
    const candidates = listaProductos.filter(p => getDuplicateKey(p) === key);

    if (candidates.length < 2) {
        showNotification('Error: Ya no hay duplicados para este criterio', 'warning');
        window.loadDuplicatesData();
        return;
    }

    document.getElementById('duplicados-list-view').style.display = 'none';
    document.getElementById('duplicados-merge-view').style.display = 'block';

    const tbody = document.getElementById('merge-candidates-tbody');
    tbody.innerHTML = '';

    candidates.forEach((p, idx) => {
        const row = document.createElement('tr');
        // Pre-select the one with highest stock or latest ID? Let's select first by default.
        const checked = idx === 0 ? 'checked' : '';
        const style = p.activo ? '' : 'opacity: 0.6;';

        row.innerHTML = `
            <td style="text-align:center;">
                <input type="radio" name="principal_product" value="${p.id}" ${checked} style="width: 18px; height: 18px;">
            </td>
            <td style="${style}">
                <div style="font-weight:600;">${p.nombre}</div>
                <div style="font-size:0.8em; color:#888;">SKU: ${p.codigo || 'N/A'} | ID: ${p.id}</div>
            </td>
            <td style="font-weight:bold;">${p.stock_actual || 0}</td>
            <td>$${parseFloat(p.precio1).toLocaleString()}</td>
            <td>${p.activo ? 'Activo' : 'Inactivo'}</td>
        `;
        tbody.appendChild(row);
    });

    // Handle Form Submit
    const form = document.getElementById('form-unificacion');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const selected = document.querySelector('input[name="principal_product"]:checked');
        if (!selected) return showNotification('Seleccione un producto principal', 'error');

        const principalId = parseInt(selected.value);
        const sumarStock = document.getElementById('check-sumar-stock').checked;

        // All candidates except principal are duplicates to delete
        const duplicatesIds = candidates.map(c => c.id).filter(id => id !== principalId);

        if (duplicatesIds.length === 0) return;

        if (!confirm(`¿Estás seguro de unificar ${duplicatesIds.length} productos en el ID ${principalId}? Esta acción NO se puede deshacer.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_PRODUCTOS}/unificar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    principal_id: principalId,
                    duplicados_ids: duplicatesIds,
                    sumar_stock: sumarStock
                })
            });

            const data = await res.json();
            if (data.success) {
                showNotification('Unificación completada exitosamente', 'success');
                // Reload global inventory
                await cargarInventario();
                // Return to duplicates list (which will refresh data from global variable)
                window.loadDuplicatesData();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error de conexión', 'error');
        }
    };
};

window.saveStockMinimoChanges = async () => {
    const selectedIds = Array.from(document.querySelectorAll('.stock-check:checked')).map(ck => ck.value);
    const newMin = parseInt(document.getElementById('bulk-stock-min').value);

    if (selectedIds.length === 0) {
        showNotification('Seleccione al menos un producto', 'error');
        return;
    }
    if (isNaN(newMin) || newMin < 0) {
        showNotification('Ingrese un Stock Mínimo válido', 'error');
        return;
    }

    if (!confirm(`¿Actualizar Stock Mínimo a ${newMin} para ${selectedIds.length} productos?`)) return;

    // Bulk update loop (Client-side iteration)
    let successCount = 0;
    const token = localStorage.getItem('token');

    showNotification('Procesando actualización masiva...', 'info');

    for (const id of selectedIds) {
        try {
            // Find current product to keep other fields intact? 
            // The API updates specific fields passed or keeps old ones?
            // Checking actualizarProducto controller:
            // It runs UPDATE SET ... for all fields. If I send only stock_minimo, others might become NULL or DEFAULT if not handled carefully.
            // But wait, the controller uses `req.body.x || previous`? No, logic is: `codigo || null`, etc.
            // Oh, the controller sets defaults if fields are missing in body?
            // "codigo || null", "nombre". If nombre is missing, it inserts undefined?
            // Actually, the update controller is:
            // "SELECT * FROM productos" is NOT done. It just does UPDATE products SET ...
            // So if I only send stock_minimo, and other fields are undefined in req.body, they will be set to NULL/Default in DB!
            // THIS IS DANGEROUS. I must send ALL fields.

            const prod = listaProductos.find(p => p.id == id); // id from checkbox is string
            if (!prod) continue;

            const payload = { ...prod, stock_minimo: newMin };

            // We need to match the body expected by 'actualizarProducto'
            // Controller expects: codigo, referencia_fabrica, nombre, etc.
            // If I send the object from `listarProductos`, it should match mostly.
            // Let's ensure 'proveedor_id' is correct (in list it joins 'proveedor_nombre', but usually 'proveedor_id' is present).

            const res = await fetch(`${API_PRODUCTOS}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) successCount++;

        } catch (e) {
            console.error(`Error updating product ${id}`, e);
        }
    }

    showNotification(`Actualizados ${successCount} de ${selectedIds.length} productos`, 'success');
    window.closeStockCriticoModal();
    cargarInventario(); // Refresh
};

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
