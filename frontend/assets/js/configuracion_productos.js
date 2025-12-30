/**
 * Product Configuration Module
 * Handles CRUD operations for the extended product schema.
 */

const API_URL = '/api/productos';
let tableBody, modal, form;
let isEditing = false;
let currentId = null;
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
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
        const resp = await fetch('/api/terceros', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            const select = document.getElementById('proveedor_id');
            select.innerHTML = '<option value="">Seleccione un proveedor...</option>';
            data.data.forEach(t => {
                if (t.tipo === 'Proveedor' || t.tipo === 'Ambos') {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.nombre;
                    select.appendChild(opt);
                }
            });
        }
    } catch (e) {
        console.error('Error loading suppliers:', e);
    }
}

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
                <button class="btn-icon" onclick="openModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Editar"><i class="fas fa-edit"></i></button>
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

window.openModal = (p = null) => {
    modal.style.display = 'flex';
    form.reset();

    if (p) {
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
        document.getElementById('precio3').value = p.precio3;
        document.getElementById('costo').value = p.costo;
        document.getElementById('impuesto_porcentaje').value = p.impuesto_porcentaje;
        document.getElementById('proveedor_id').value = p.proveedor_id || '';
        document.getElementById('stock_minimo').value = p.stock_minimo;
        document.getElementById('imagen_url').value = p.imagen_url || '';
        document.getElementById('activo').checked = !!p.activo;
        document.getElementById('maneja_inventario').checked = !!p.maneja_inventario;
    } else {
        isEditing = false;
        currentId = null;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-box-open"></i> Nuevo Producto';
        document.getElementById('activo').checked = true;
        document.getElementById('maneja_inventario').checked = true;
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = {
        nombre: document.getElementById('nombre')?.value || '',
        nombre_alterno: document.getElementById('nombre_alterno')?.value || '',
        referencia_fabrica: document.getElementById('referencia_fabrica')?.value || '',
        codigo: document.getElementById('codigo')?.value || '',
        categoria: document.getElementById('categoria')?.value || 'General',
        unidad_medida: document.getElementById('unidad_medida')?.value || 'UND',
        precio1: parseFloat(document.getElementById('precio1')?.value) || 0,
        precio2: parseFloat(document.getElementById('precio2')?.value) || 0,
        precio3: parseFloat(document.getElementById('precio3')?.value) || 0,
        costo: parseFloat(document.getElementById('costo')?.value) || 0,
        impuesto_porcentaje: parseFloat(document.getElementById('impuesto_porcentaje')?.value) || 0,
        proveedor_id: document.getElementById('proveedor_id')?.value || null,
        stock_minimo: parseInt(document.getElementById('stock_minimo')?.value) || 0,
        imagen_url: document.getElementById('imagen_url')?.value || '',
        activo: document.getElementById('activo')?.checked || false,
        maneja_inventario: document.getElementById('maneja_inventario')?.checked || false
    };

    if (!formData.nombre) {
        showNotification('El nombre del producto es obligatorio', 'warning');
        return;
    }

    try {
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        const resp = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification(isEditing ? 'Producto actualizado' : 'Producto creado', 'success');
            closeModal();
            loadProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error('Save error:', e);
        showNotification('Error al guardar producto', 'error');
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
