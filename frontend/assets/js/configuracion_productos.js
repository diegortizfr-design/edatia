/**
 * Product Configuration Module
 * Handles CRUD operations for the extended product schema.
 */

let API_URL = '';
let tableBody, modal, form;
let isEditing = false;
let currentId = null;
let allProducts = [];
let UPLOAD_URL = '';
let deleteImageFlag = false;

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
        } else {
            console.error('Error: No se encontró el formulario productForm');
        }

        loadProducts();
        loadSuppliers();
        loadBranchesForStock();

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allProducts.filter(p =>
                    p.nombre.toLowerCase().includes(term) ||
                    (p.codigo && p.codigo.toLowerCase().includes(term)) ||
                    (p.referencia_fabrica && p.referencia_fabrica.toLowerCase().includes(term))
                );
                renderTable(filtered);
            });
        }
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            allProducts = data.data;
            renderTable(allProducts);
            updateKPIs(allProducts);
        }
    } catch (e) {
        console.error('Error loading products:', e);
        showNotification('Error al cargar productos', 'error');
    }
}

async function loadSuppliers() {
    try {
        const token = localStorage.getItem('token');
        // Fix: Use dynamic API URL based on current configuration
        // API_URL is like ".../api/productos", so we replace to get ".../api/terceros"
        const suppliersUrl = API_URL.replace('/productos', '/terceros');

        const resp = await fetch(suppliersUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            const select = document.getElementById('proveedor_id');
            // Added explicit option for no supplier
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
    } catch (e) {
        console.error('Error loading suppliers:', e);
    }
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
        } else {
            showNotification(data.message || 'Error al subir imagen', 'error');
        }
    } catch (e) {
        console.error('Upload error:', e);
        showNotification('Error de conexión al subir imagen', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        input.value = '';
        deleteImageFlag = false; // Reset flag on new upload
    }
}

window.deleteProductImage = () => {
    document.getElementById('imagen_url').value = '';
    deleteImageFlag = true;
    showNotification('Foto removida (Guardar para aplicar)', 'info');
};

function renderTable(products) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 6px; background: #eee; background-image: url('${p.imagen_url || ''}'); background-size: cover; background-position: center;"></div>
                    <div>
                        <strong>${p.nombre}</strong><br>
                        <small style="color: #6B7280;">${p.nombre_alterno || ''}</small>
                    </div>
                </div>
            </td>
            <td>${p.referencia_fabrica || '-'}</td>
            <td><span class="badge" style="background: rgba(79, 70, 229, 0.1); color: var(--primary-color);">${p.categoria}</span></td>
            <td><strong>$${parseFloat(p.precio1).toLocaleString()}</strong></td>
            <td><span style="color: ${p.stock_actual <= p.stock_minimo ? '#EF4444' : 'inherit'}; font-weight: bold;">${p.stock_actual}</span></td>
            <td>
                ${p.activo
                ? '<span class="status-active"><i class="fas fa-check-circle"></i> Activo</span>'
                : '<span class="status-inactive"><i class="fas fa-times-circle"></i> Inactivo</span>'}
            </td>
            <td>
                <button class="btn-icon" onclick="openModal(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteProduct(${p.id})" title="Eliminar" style="color: #EF4444;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateKPIs(products) {
    document.getElementById('kpi-total-productos').textContent = products.filter(p => p.activo).length;

    const categories = new Set(products.map(p => p.categoria));
    document.getElementById('kpi-categorias').textContent = categories.size;

    const lowStock = products.filter(p => p.maneja_inventario && p.stock_actual <= p.stock_minimo).length;
    document.getElementById('kpi-bajo-stock').textContent = lowStock;
}

window.openModal = (idOrObj = null) => {
    modal.style.display = 'flex';
    form.reset();
    deleteImageFlag = false; // Reset delete flag

    let p = null;
    if (idOrObj) {
        if (typeof idOrObj === 'object') {
            p = idOrObj;
        } else {
            // Assume it's an ID
            p = allProducts.find(prod => prod.id == idOrObj);
        }
    }

    if (p) {
        isEditing = true;
        currentId = p.id;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Editar Producto';

        // DEBUG: Check what image URL we have
        // console.log('Editing Product:', p);
        // alert(`Editando ID: ${p.id}\nImagen URL: ${p.imagen_url}`);

        document.getElementById('prod_id').value = p.id;
        document.getElementById('nombre').value = p.nombre;
        document.getElementById('nombre_alterno').value = p.nombre_alterno || '';
        document.getElementById('referencia_fabrica').value = p.referencia_fabrica || '';
        document.getElementById('codigo').value = p.codigo || '';
        document.getElementById('categoria').value = p.categoria || 'General';
        document.getElementById('unidad_medida').value = p.unidad_medida || 'UND';
        document.getElementById('precio1').value = p.precio1;
        document.getElementById('precio2').value = p.precio2;
        document.getElementById('precio2').value = p.precio2;
        // document.getElementById('precio3').value = p.precio3; // Element removed from HTML
        document.getElementById('costo').value = p.costo;
        document.getElementById('impuesto_porcentaje').value = p.impuesto_porcentaje;
        document.getElementById('proveedor_id').value = p.proveedor_id || '';
        document.getElementById('stock_minimo').value = p.stock_minimo;
        document.getElementById('imagen_url').value = p.imagen_url || '';
        document.getElementById('activo').checked = !!p.activo;
        document.getElementById('maneja_inventario').checked = !!p.maneja_inventario;
        document.getElementById('mostrar_en_tienda').checked = !!p.mostrar_en_tienda;

        // Hide Stock Inicial when editing, show Adjustment
        const stockInicialCont = document.getElementById('stock_inicial_container');
        if (stockInicialCont) stockInicialCont.style.display = 'none';

        const ajusteCont = document.getElementById('ajuste_stock_container');
        if (ajusteCont) {
            ajusteCont.style.display = 'block';
            document.getElementById('ajuste_cantidad').value = 0;
            document.getElementById('ajuste_motivo').value = 'Ajuste Manual';

            // Trigger stock fetch for the currently selected branch in the ajuste selector
            if (allBranches.length > 0) {
                consultarStockSucursal();
            }
        }
    } else {
        isEditing = false;
        currentId = null;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-box-open"></i> Nuevo Producto';
        document.getElementById('activo').checked = true;
        document.getElementById('maneja_inventario').checked = true;
        document.getElementById('mostrar_en_tienda').checked = false;
        document.getElementById('stock_inicial').value = 0;

        // Show Stock Inicial for new products, hide Adjustment
        const stockInicialCont = document.getElementById('stock_inicial_container');
        if (stockInicialCont) stockInicialCont.style.display = 'block';

        const ajusteCont = document.getElementById('ajuste_stock_container');
        if (ajusteCont) ajusteCont.style.display = 'none';
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

// --- BRANCH LOADING & AUTOSELECT ---
let allBranches = [];

async function loadBranchesForStock() {
    try {
        const token = localStorage.getItem('token');
        // Derive base URL from API_URL which is ".../api/productos"
        const sucursalesUrl = API_URL.replace('/productos', '/sucursales');

        const res = await fetch(sucursalesUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            allBranches = data.data;
            const selects = ['stock_sucursal_inicial', 'ajuste_sucursal'];

            selects.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;

                el.innerHTML = '<option value="">Seleccione Sucursal...</option>';
                allBranches.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.nombre;
                    el.appendChild(opt);
                });

                // --- SINGLE BRANCH AUTOSELECT ---
                if (allBranches.length === 1) {
                    el.value = allBranches[0].id;
                } else {
                    // Try to find Principal
                    const principal = allBranches.find(s => s.es_principal);
                    if (principal) el.value = principal.id;
                }
            });

            // If editing, trigger initial stock fetch
            if (isEditing) {
                setTimeout(consultarStockSucursal, 100);
            }
        }
    } catch (err) {
        console.error('Error loading branches:', err);
    }
}

async function consultarStockSucursal() {
    const productId = currentId;
    const sucursalId = document.getElementById('ajuste_sucursal').value;
    const stockDisplay = document.getElementById('val_stock_actual');

    if (!productId || !sucursalId) {
        if (stockDisplay) stockDisplay.textContent = '0';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        // We use the same listarProductos but filtered by ID and Branch
        const res = await fetch(`${API_URL}?busqueda=&sucursal_id=${sucursalId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const prod = data.data.find(p => p.id == productId);
            if (prod && stockDisplay) {
                stockDisplay.textContent = prod.stock_sucursal || '0';
            } else if (stockDisplay) {
                stockDisplay.textContent = '0';
            }
        }
    } catch (err) {
        console.error('Error consulting branch stock:', err);
    }
}

// Initial branch load is handled in the main DOMContentLoaded async block.

async function handleSave(e) {
    if (e) e.preventDefault();

    const stock_inicial = parseInt(document.getElementById('stock_inicial')?.value) || 0;
    const ajuste_cantidad = parseInt(document.getElementById('ajuste_cantidad')?.value) || 0;

    // Build Form Data
    const formData = {
        codigo: document.getElementById('codigo').value,
        referencia_fabrica: document.getElementById('referencia_fabrica').value,
        nombre: document.getElementById('nombre').value,
        nombre_alterno: document.getElementById('nombre_alterno').value,
        categoria: document.getElementById('categoria').checked ? (document.getElementById('categoria_select').value || 'General') : document.getElementById('categoria_input').value,
        unidad_medida: document.getElementById('unidad_medida').value,
        precio1: parseFloat(document.getElementById('precio1').value) || 0,
        precio2: parseFloat(document.getElementById('precio2').value) || 0,
        precio3: parseFloat(document.getElementById('precio3').value) || 0,
        costo: parseFloat(document.getElementById('costo').value) || 0,
        impuesto_porcentaje: parseFloat(document.getElementById('impuesto').value) || 0,
        proveedor_id: document.getElementById('proveedor_id').value || null,
        stock_minimo: parseInt(document.getElementById('stock_minimo').value) || 0,
        stock_inicial: stock_inicial,
        ajuste_cantidad: ajuste_cantidad,
        ajuste_motivo: document.getElementById('ajuste_motivo')?.value || 'Ajuste Manual',
        maneja_inventario: document.getElementById('maneja_inventario').checked,
        mostrar_en_tienda: document.getElementById('mostrar_en_tienda').checked,
        activo: document.getElementById('activo').checked,
        // NEW BRANCH FIELD
        sucursal_id: isEditing
            ? document.getElementById('ajuste_sucursal').value
            : document.getElementById('stock_sucursal_inicial').value
    };

    // Validations
    if (!formData.nombre) return showNotification('El nombre es obligatorio', 'warning');
    if (formData.maneja_inventario) {
        if (!formData.sucursal_id && (stock_inicial > 0 || ajuste_cantidad !== 0)) {
            return showNotification('Debe seleccionar una sucursal para el inventario', 'warning');
        }
    }

    try {
        const token = localStorage.getItem('token');
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (data.success) {
            showNotification(isEditing ? 'Producto actualizado' : 'Producto creado', 'success');
            closeModal();
            cargarProductos();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error al guardar', 'error');
    }
}

async function deleteProduct(id) {
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
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error('Delete error:', e);
        showNotification('Error al eliminar', 'error');
    }
}

// --- Bulk Upload Functions ---
window.openBulkModal = () => {
    document.getElementById('bulkModal').style.display = 'flex';
    document.getElementById('bulkModal').querySelector('.modal-glass').style.display = 'block';
    resetBulkModal();
};

window.closeBulkModal = () => {
    document.getElementById('bulkModal').style.display = 'none';
};

function resetBulkModal() {
    document.getElementById('bulk-file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('btn-start-bulk').disabled = true;
    document.getElementById('file-name').textContent = '';
}

window.handleBulkFileSelect = (input) => {
    const file = input.files[0];
    if (file) {
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-info').style.display = 'block';
        document.getElementById('btn-start-bulk').disabled = false;
    }
};

window.uploadBulkFile = async () => {
    const input = document.getElementById('bulk-file-input');
    const file = input.files[0];
    if (!file) return;

    const btn = document.getElementById('btn-start-bulk');
    const originalText = btn.innerHTML;
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
        } else {
            showNotification(data.message || 'Error en la carga masiva', 'error');
        }
    } catch (e) {
        console.error('Bulk upload error:', e);
        showNotification('Error de conexión al subir archivo', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.downloadTemplate = () => {
    // Updated template with mandatory fields marked or implied
    const headers = 'Codigo,Nombre,Categoria,Stock,Referencia,Unidad,Precio1,Precio2,Costo,Impuesto,StockMinimo';
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos_v2.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

async function ejecutarMigracion() {
    if (!confirm('¿Confirma que desea migrar todo el stock actual de todos los productos a la sucursal ACTUALICELL?')) return;

    try {
        const token = localStorage.getItem('token');
        // Derive migration URL from API_URL (which might be https://erpod.onrender.com/api/productos)
        const migrationUrl = API_URL.replace('/productos', '/productos/migrar-a-sucursal');

        const btn = document.querySelector('button[onclick=\"ejecutarMigracion()\"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Procesando...';
        btn.disabled = true;

        const res = await fetch(migrationUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            Swal.fire('¡Éxito!', data.message, 'success');
            loadProducts();
        } else {
            Swal.fire('Error', data.message, 'error');
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (err) {
        console.error('Migration error:', err);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
        const btn = document.querySelector('button[onclick=\"ejecutarMigracion()\"]');
        btn.innerHTML = '<i class=\"fas fa-magic\"></i> Migrar a ACTUALICELL';
        btn.disabled = false;
    }
}
