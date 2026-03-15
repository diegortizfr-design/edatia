/**
 * Product Configuration Module
 * Handles CRUD operations, Pagination, Search, and Unification.
 */

let API_URL = '';
let tableBody, modal, form;
let isEditing = false;
let currentId = null;
let UPLOAD_URL = '';
let deleteImageFlag = false;

// Pagination & Search State
let currentPage = 1;
let itemsPerPage = 50;
let totalItems = 0;
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/productos`;
        UPLOAD_URL = `${config.apiUrl}/upload`;

        tableBody = document.getElementById('productos-table-body');
        modal = document.getElementById('productModal');
        form = document.getElementById('productForm');

        if (form) {
            form.addEventListener('submit', handleSave);
        }

        // Setup Search with Debounce
        const searchInput = document.getElementById('search-input'); // Ensure this ID exists in layout or header
        if (searchInput) {
            let timeout = null;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    currentSearchTerm = e.target.value.trim();
                    currentPage = 1; // Reset to page 1 on search
                    loadProducts();
                }, 500);
            });
        }

        // Setup Unification Form
        const unifyForm = document.getElementById('form-unificacion');
        if (unifyForm) {
            unifyForm.addEventListener('submit', handleUnificationSubmit);
        }

        loadProducts();
        loadSuppliers();
        loadBranchesForStock();
        loadCategories();

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

// --- LOAD PRODUCTS (Server-Side Pagination & Search) ---
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}?page=${currentPage}&limit=${itemsPerPage}`;

        if (currentSearchTerm) {
            url += `&busqueda=${encodeURIComponent(currentSearchTerm)}`;
        }

        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderTable(data.data);

            // Handle Pagination Data
            if (data.pagination) {
                totalItems = data.pagination.total;
                currentPage = data.pagination.page;
                renderPaginationControls(data.pagination);
            }

            updateKPIs(data.data); // Note: KPIs might need server-side calc locally if paginated, but for now client-side on page is acceptable or we might lose accuracy. 
            // Ideally backend returns KPI stats. For now we keep it simple.
        }
    } catch (e) {
        console.error('Error loading products:', e);
        showNotification('Error al cargar productos', 'error');
    }
}

function renderTable(products) {
    window.currentPageProducts = products;
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No se encontraron productos</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 28px; height: 28px; border-radius: 4px; background: #f1f5f9; background-image: url('${p.imagen_url || ''}'); background-size: cover; background-position: center; flex-shrink: 0;"></div>
                    <div style="min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.nombre}">${p.nombre}</div>
                        ${p.codigo ? `<small style="color: #6366f1; font-family: monospace; font-size: 0.75rem;">${p.codigo}</small>` : ''}
                    </div>
                </div>
            </td>
            <td><small>${p.referencia_fabrica || '-'}</small></td>
            <td><span class="badge-sm" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">${p.categoria}</span></td>
            <td><span style="font-weight: 600;">$${parseFloat(p.precio1).toLocaleString()}</span></td>
            <td><span style="color: ${p.stock_actual <= p.stock_minimo ? '#EF4444' : 'inherit'}; font-weight: 700;">${p.stock_actual}</span></td>
            <td style="text-align: center;">
                ${p.activo
                ? '<i class="fas fa-check-circle" style="color: #10B981;" title="Activo"></i>'
                : '<i class="fas fa-times-circle" style="color: #94a3b8;" title="Inactivo"></i>'}
            </td>
            <td>
                <div style="display: flex; gap: 4px; justify-content: flex-end;">
                    <button class="btn-icon-glass" onclick="openModal(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon-glass" onclick="deleteProduct(${p.id})" title="Eliminar" style="color: #EF4444;"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderPaginationControls(pagination) {
    const info = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    if (info) {
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.page * pagination.limit, pagination.total);
        info.textContent = `Mostrando ${start} - ${end} de ${pagination.total}`;
    }

    if (prevBtn) {
        prevBtn.disabled = pagination.page <= 1;
        prevBtn.onclick = () => changePage(-1); // Safety re-bind
    }

    if (nextBtn) {
        nextBtn.disabled = pagination.page >= pagination.totalPages;
        nextBtn.onclick = () => changePage(1); // Safety re-bind
    }
}

window.changePage = (delta) => {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    loadProducts();
};

// --- KPI UPDATE (Simplified) ---
function updateKPIs(products) {
    // Note: With pagination, this only reflects the current page. 
    // For accurate global KPIs, backend should return stats. 
    // We will leave it as is for now, managing visible items.
    // Or simpler: Just set "Total Productos" to totalItems from pagination.

    if (totalItems > 0) {
        const kpiTotal = document.getElementById('kpi-total-productos');
        if (kpiTotal) kpiTotal.textContent = totalItems;
    }
}

// --- DUPLICATE MANAGEMENT ---
let duplicatesGroups = [];
let currentMergeGroup = null;

window.openDuplicadosModal = async () => {
    document.getElementById('duplicadosModal').style.display = 'flex';
    document.getElementById('duplicados-list-view').style.display = 'block';
    document.getElementById('duplicados-merge-view').style.display = 'none';

    const tbody = document.getElementById('duplicados-tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Buscando duplicados...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/duplicados`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            duplicatesGroups = data.data;
            renderDuplicatesList(duplicatesGroups);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Error al cargar duplicados</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Error de conexión</td></tr>';
    }
};

window.closeDuplicadosModal = () => {
    document.getElementById('duplicadosModal').style.display = 'none';
};

function renderDuplicatesList(groups) {
    const tbody = document.getElementById('duplicados-tbody');
    tbody.innerHTML = '';

    if (groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron duplicados (por nombre)</td></tr>';
        return;
    }

    groups.forEach(d => {
        const safeKey = encodeURIComponent(d.key);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${d.name}</strong> 
                <br><small style="color:#aaa;">Clave: ${d.key}</small>
            </td>
            <td style="text-align: center; color: #EF4444; font-weight: bold;">${d.count}</td>
            <td style="font-size: 0.85em; color: #666; word-break: break-all;">${d.codes}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="setupMergeUI('${safeKey}')">Gestionar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.setupMergeUI = (encodedKey) => {
    const key = decodeURIComponent(encodedKey);
    const group = duplicatesGroups.find(g => g.key === key);
    if (!group) return;

    currentMergeGroup = group;

    document.getElementById('duplicados-list-view').style.display = 'none';
    document.getElementById('duplicados-merge-view').style.display = 'block';

    const tbody = document.getElementById('merge-candidates-tbody');
    tbody.innerHTML = '';

    group.items.forEach((p, index) => {
        // Pre-select first item as principal ideally
        const isFirst = index === 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">
                <input type="radio" name="principal_product" value="${p.id}" ${isFirst ? 'checked' : ''} style="transform: scale(1.5); cursor: pointer;">
            </td>
            <td>
                <strong>${p.nombre}</strong><br>
                ${p.codigo ? '<span class="badge">' + p.codigo + '</span>' : '<span class="badge" style="background:#ddd;">Sin SKU</span>'}
            </td>
            <td>${p.referencia_fabrica || '-'}</td>
            <td><strong>${p.stock_actual}</strong></td>
            <td>$${parseFloat(p.precio1).toLocaleString()}</td>
            <td>${p.activo ? '<i class="fas fa-check" style="color:green;"></i>' : '<i class="fas fa-times" style="color:red;"></i>'}</td>
        `;
        tbody.appendChild(row);
    });
};

window.showDuplicatesList = () => {
    document.getElementById('duplicados-list-view').style.display = 'block';
    document.getElementById('duplicados-merge-view').style.display = 'none';
    currentMergeGroup = null;
};

async function handleUnificationSubmit(e) {
    e.preventDefault();
    if (!currentMergeGroup) return;

    const principalId = document.querySelector('input[name="principal_product"]:checked')?.value;
    if (!principalId) return Swal.fire('Error', 'Debe seleccionar un producto principal', 'warning');

    const duplicates = currentMergeGroup.items.filter(p => p.id != principalId).map(p => p.id);
    if (duplicates.length === 0) return Swal.fire('Error', 'No hay productos duplicados para unificar (deben ser al menos 2)', 'warning');

    const sumarStock = document.getElementById('check-sumar-stock').checked;

    if (!confirm(`¿Está seguro de unificar ${duplicates.length} productos en el seleccionado? Esta acción no se puede deshacer.`)) return;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/unificar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                principal_id: principalId,
                duplicados_ids: duplicates,
                sumar_stock: sumarStock
            })
        });

        const data = await resp.json();
        if (data.success) {
            Swal.fire('¡Unificado!', data.message, 'success');
            // Reload duplicates list
            await window.openDuplicadosModal();
            // Reload main table too
            loadProducts();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error al procesar la unificación', 'error');
    }
}


// --- TEMPLATE DOWNLOAD ---
window.downloadTemplate = () => {
    // Exact SQL Structure Match
    // id, empresa_id, codigo, referencia_fabrica, nombre, nombre_alterno, categoria, 
    // unidad_medida, precio1, precio2, precio3, costo, impuesto_porcentaje, proveedor_id, stock_minimo...
    // Simplified User Version:
    const headers = [
        'codigo', 'nombre', 'categoria', 'stock_inicial', // Common required
        'referencia_fabrica', 'nombre_alterno',
        'unidad_medida', 'precio1', 'precio2', 'precio3',
        'costo', 'impuesto_porcentaje', 'stock_minimo',
        'descripcion'
    ];

    // Create CSV content
    const csvContent = headers.join(',') + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos_sql_match.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- EXISTING FUNCTIONS (Suppliers, Images, etc.) ---

async function loadSuppliers() {
    try {
        const token = localStorage.getItem('token');
        const suppliersUrl = API_URL.replace('/productos', '/terceros');
        const resp = await fetch(suppliersUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('proveedor_id');
            select.innerHTML = '<option value="">-- Sin Proveedor Fijo --</option>';
            data.data.forEach(t => {
                if (t.es_proveedor) {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.nombre_comercial;
                    select.appendChild(opt);
                }
            });
        }
    } catch (e) { console.error('Error loading suppliers:', e); }
}

async function uploadProductImage(input) {
    const file = input.files[0];
    if (!file) return;
    const btn = input.previousElementSibling;
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
            document.getElementById('imagen_url').value = data.url;
            showNotification('Imagen subida con éxito', 'success');
        } else showNotification(data.message || 'Error', 'error');
    } catch (e) { showNotification('Error de conexión', 'error'); }
    finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        input.value = '';
    }
}

window.deleteProductImage = () => {
    document.getElementById('imagen_url').value = '';
    deleteImageFlag = true;
    showNotification('Foto removida (Guardar para aplicar)', 'info');
};

let allBranches = [];
async function loadBranchesForStock() {
    try {
        const token = localStorage.getItem('token');
        const sucursalesUrl = API_URL.replace('/productos', '/sucursales');
        const res = await fetch(sucursalesUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            allBranches = data.data;
            const el = document.getElementById('stock_sucursal_inicial');
            if (el) {
                el.innerHTML = '<option value="">Seleccione Sucursal...</option>';
                allBranches.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.nombre;
                    el.appendChild(opt);
                });
                if (allBranches.length === 1) el.value = allBranches[0].id;
            }
        }
    } catch (err) { console.error('Error loading branches:', err); }
}

async function loadCategories() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/categorias`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('categoria');
            if (select) {
                // Keep default option
                select.innerHTML = '<option value="">Seleccione una categoría</option>';
                data.data.forEach(c => {
                    const opt = document.createElement('option');
                    // Store Name as value because Product table uses Name
                    opt.value = c.nombre;
                    opt.textContent = c.nombre;
                    select.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error('Error loading categories:', e); }
}

window.openModal = async (id = null) => {
    modal.style.display = 'flex';
    form.reset();
    deleteImageFlag = false;

    if (id) {
        // Fetch single product details if needed, or use row data if we had it. 
        // With pagination, we rely on fetch by ID or passing object.
        // For simplicity, let's fetch by ID to be sure.
        try {
            const token = localStorage.getItem('token');
            // Since our list might be partial, fetching by ID is safer for full details
            // But currently list endpoint returns full details.
            // Let's use `fetch(`${API_URL}/${id}`)` if available, or finding in current page list.
            // Since we implemented Listing, we likely have the item in current page list.
            // But to be robust:
            // Let's check if we can use `loadProducts` data. It is not globally stored as map.
            // I'll add `allProducts` (current page) to look up.

            // Re-fetch current page products to global scope? 
            // `loadProducts` sets `renderTable`. I should store `currentProducts` there.
            // Actually, let's just fetch the single product to be 100% sure we have fresh data.
            // But we don't have a `GET /productos/:id` explicitly shown in controller?
            // Controller has `listarProductos` and `crear`, `actualizar`.
            // Controller does NOT seem to have `GET /:id`?
            // Let's check `productosRoutes.js`.
            // `router.put('/:id', ...)`
            // `router.get('/', ...)`
            // It seems `GET /:id` is missing!
            // So we MUST rely on the data passed to the table.
            // I need to store the current page data in a global variable.

            // Since I don't have access to the object in `onclick`, I should pass the object or store it.
            // I will assume `onclick="openModal(123)"`.
            // I will update `loadProducts` to store `currentPageProducts`.

            // Wait, I need to fix `openModal` to find from `currentPageProducts`.

            const p = window.currentPageProducts.find(prod => prod.id === id);
            if (p) {
                fillModal(p);
            } else {
                showNotification('Error: Producto no encontrado en vista actual', 'error');
            }

        } catch (e) { console.error(e); }
    } else {
        isEditing = false;
        currentId = null;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-box-open"></i> Nuevo Producto';
        document.getElementById('activo').checked = true;
        document.getElementById('maneja_inventario').checked = true;
        document.getElementById('mostrar_en_tienda').checked = false;
        document.getElementById('stock_inicial').value = 0;
        document.getElementById('stock_inicial_container').style.display = 'grid';
    }
};

window.currentPageProducts = []; // Global to store current page items

// Update `loadProducts` to set this
const originalRenderTable = renderTable;
renderTable = (products) => {
    window.currentPageProducts = products;
    originalRenderTable(products);
};


function fillModal(p) {
    isEditing = true;
    currentId = p.id;
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
    document.getElementById('prod_id').value = p.id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('nombre_alterno').value = p.nombre_alterno || '';
    document.getElementById('referencia_fabrica').value = p.referencia_fabrica || '';
    document.getElementById('codigo').value = p.codigo || '';
    document.getElementById('categoria').value = p.categoria || 'General';
    document.getElementById('unidad_medida').value = p.unidad_medida || 'UND';
    document.getElementById('precio1').value = p.precio1;
    document.getElementById('precio2').value = p.precio2;
    document.getElementById('costo').value = p.costo;
    document.getElementById('impuesto_porcentaje').value = p.impuesto_porcentaje;
    document.getElementById('proveedor_id').value = p.proveedor_id || '';
    document.getElementById('stock_minimo').value = p.stock_minimo;
    document.getElementById('imagen_url').value = p.imagen_url || '';
    document.getElementById('activo').checked = !!p.activo;
    document.getElementById('maneja_inventario').checked = !!p.maneja_inventario;
    document.getElementById('mostrar_en_tienda').checked = !!p.mostrar_en_tienda;
    document.getElementById('stock_inicial_container').style.display = 'none';
}


window.closeModal = () => { modal.style.display = 'none'; };

async function handleSave(e) {
    if (e) e.preventDefault();
    const stock_inicial = parseInt(document.getElementById('stock_inicial')?.value) || 0;
    const formData = {
        codigo: document.getElementById('codigo').value,
        referencia_fabrica: document.getElementById('referencia_fabrica').value,
        nombre: document.getElementById('nombre').value,
        nombre_alterno: document.getElementById('nombre_alterno').value,
        categoria: document.getElementById('categoria').value || 'General',
        unidad_medida: document.getElementById('unidad_medida').value,
        precio1: parseFloat(document.getElementById('precio1').value) || 0,
        precio2: parseFloat(document.getElementById('precio2').value) || 0,
        costo: parseFloat(document.getElementById('costo').value) || 0,
        impuesto_porcentaje: parseFloat(document.getElementById('impuesto_porcentaje').value) || 0,
        proveedor_id: document.getElementById('proveedor_id').value || null,
        stock_minimo: parseInt(document.getElementById('stock_minimo').value) || 0,
        stock_inicial: stock_inicial,
        maneja_inventario: document.getElementById('maneja_inventario').checked,
        mostrar_en_tienda: document.getElementById('mostrar_en_tienda').checked,
        activo: document.getElementById('activo').checked,
        sucursal_id: !isEditing ? document.getElementById('stock_sucursal_inicial').value : null,
        imagen_url: document.getElementById('imagen_url').value
    };

    if (!formData.nombre) return showNotification('El nombre es obligatorio', 'warning');

    try {
        const token = localStorage.getItem('token');
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
            showNotification(isEditing ? 'Producto actualizado' : 'Producto creado', 'success');
            closeModal();
            loadProducts();
        } else showNotification(data.message, 'error');
    } catch (err) { showNotification('Error al guardar', 'error'); }
}

window.deleteProduct = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Producto eliminado', 'success');
            loadProducts();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error al eliminar', 'error'); }
};

// --- BULK UPLOAD ---
window.openBulkModal = () => {
    document.getElementById('bulkModal').style.display = 'flex';
    document.querySelector('#bulkModal .modal-glass').style.display = 'block';
    resetBulkModal();
};
window.closeBulkModal = () => { document.getElementById('bulkModal').style.display = 'none'; };
function resetBulkModal() {
    document.getElementById('bulk-file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('btn-start-bulk').disabled = true;
    document.getElementById('file-name').textContent = '';
}
window.handleBulkFileSelect = (input) => {
    if (input.files[0]) {
        document.getElementById('file-name').textContent = input.files[0].name;
        document.getElementById('file-info').style.display = 'block';
        document.getElementById('btn-start-bulk').disabled = false;
    }
};
window.uploadBulkFile = async () => {
    const input = document.getElementById('bulk-file-input');
    const file = input.files[0];
    if (!file) return;
    const btn = document.getElementById('btn-start-bulk');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;
    const formData = new FormData();
    formData.append('archivo', file);
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/bulk-upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await resp.json();
        if (data.success) {
            showNotification(data.message, 'success');
            closeBulkModal();
            loadProducts();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error de conexión', 'error'); }
    finally {
        btn.innerHTML = 'Iniciar Carga';
        btn.disabled = false;
    }
};
