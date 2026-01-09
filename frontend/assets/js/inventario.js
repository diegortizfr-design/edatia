// frontend/global/js/inventario.js

let API_URL = '';
let tableBody, modal, form, modalTitle;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/productos`;

        tableBody = document.querySelector('.glass-table tbody');
        modal = document.getElementById('productModal');
        form = document.getElementById('form-producto');
        modalTitle = document.getElementById('modal-title');

        cargarProductos();

        if (form) {
            form.addEventListener('submit', guardarProducto);
        }
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

// State
let isEditing = false;
let currentId = null;
let API_INVENTARIO = '';

// Store loaded data globally
let listaProductos = [];

async function cargarProductos() {
    try {
        const token = localStorage.getItem('token');
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_INVENTARIO = `${config.apiUrl}/inventario`;

        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            listaProductos = data.data; // Save data
            renderTable(listaProductos);
            updateKPIs(listaProductos);
            loadProductsForSelect(listaProductos);
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error('Error cargando productos:', err);
    }
}

function renderTable(productos) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    productos.forEach(p => {
        const statusBadge = p.activo
            ? '<span class="badge active" style="color:#059669; background:#ECFDF5; padding:4px 8px; border-radius:4px;">Activo</span>'
            : '<span class="badge" style="color:#6B7280; background:#F3F4F6; padding:4px 8px; border-radius:4px;">Inactivo</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${p.nombre}</strong><br>
                <small style="color: #666;">${p.descripcion || ''}</small>
            </td>
            <td>${p.codigo || '-'}</td>
            <td>${p.categoria || 'General'}</td>
            <td><strong>${p.stock_actual || 0}</strong></td>
            <td>$${parseFloat(p.precio_venta).toLocaleString()}</td>
            <td>${statusBadge}</td>
            <td style="display: flex; gap: 5px;">
                <button class="btn-icon btn-kardex" data-id="${p.id}" title="Ver Movimientos"><i class="fas fa-history"></i></button>
                <button class="btn-icon btn-editar" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-eliminar" data-id="${p.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Event Delegation
tableBody.addEventListener('click', (e) => {
    // Edit
    const btnEdit = e.target.closest('.btn-editar');
    if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id);
        const producto = listaProductos.find(p => p.id === id);
        if (producto) window.openModal(producto);
    }

    // Delete
    const btnDelete = e.target.closest('.btn-eliminar');
    if (btnDelete) {
        const id = parseInt(btnDelete.dataset.id);
        eliminarProducto(id);
    }

    // Kardex
    const btnKardex = e.target.closest('.btn-kardex');
    if (btnKardex) {
        const id = parseInt(btnKardex.dataset.id);
        verKardex(id);
    }
});

function updateKPIs(productos) {
    // 1. Total Items
    const totalItems = productos.length;

    // 2. Critical Stock (Assume min stock 5 for default if not set, or use p.stock_minimo)
    const stockCritico = productos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 5)).length;

    // 3. Inventory Value (Cost * Quantity)
    const valorTotal = productos.reduce((sum, p) => sum + ((p.costo || 0) * (p.stock_actual || 0)), 0);

    const cards = document.querySelectorAll('.kpi-grid .card');
    if (cards.length >= 3) {
        cards[0].querySelector('p').textContent = totalItems.toLocaleString();

        cards[1].querySelector('p').textContent = `${stockCritico} Productos`;

        cards[2].querySelector('p').textContent = `$${valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
}

// Logic for Adjustments
function loadProductsForSelect(products) {
    const select = document.getElementById('ajuste-producto');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione...</option>';

    products.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.nombre} (Stock: ${p.stock_actual})`;
        select.appendChild(opt);
    });
}

document.getElementById('form-ajuste')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!confirm('¿Confirmar ajuste de inventario? Esta acción afectará el stock.')) return;

    const body = {
        producto_id: document.getElementById('ajuste-producto').value,
        tipo: document.getElementById('ajuste-tipo').value,
        cantidad: document.getElementById('ajuste-cantidad').value,
        motivo: document.getElementById('ajuste-motivo').value
    };

    try {
        const token = localStorage.getItem('token');
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
            alert('Ajuste realizado exitosamente');
            window.closeAjusteModal();
            document.getElementById('form-ajuste').reset();
            cargarProductos(); // Reload table & KPIs
        } else {
            alert(data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error al realizar ajuste');
    }
});

async function verKardex(id) {
    const prod = listaProductos.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('kardex-product-name').textContent = prod.nombre;
    const tbody = document.getElementById('kardex-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
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
                const date = new Date(m.created_at).toLocaleString();
                const color = m.tipo_movimiento.includes('ENTRADA') || m.tipo_movimiento === 'COMPRA' ? 'green' : 'red';
                const sign = color === 'green' ? '+' : '-';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${date}</td>
                    <td><span class="badge" style="color: ${color}; bg: transparent;">${m.tipo_movimiento}</span></td>
                    <td>${m.motivo || '-'} <small style="color: grey;">${m.documento_referencia ? '(' + m.documento_referencia + ')' : ''}</small></td>
                    <td style="font-weight: bold; color: ${color};">${sign}${m.cantidad}</td>
                    <td>${m.stock_nuevo}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay movimientos registrados</td></tr>';
        }

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5">Error cargando historial</td></tr>';
    }
}


// Global functions for HTML access
window.openModal = (producto = null) => {
    modal.style.display = 'flex';
    if (producto) {
        isEditing = true;
        currentId = producto.id;
        modalTitle.textContent = 'Editar Producto';

        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('codigo').value = producto.codigo || '';
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precio_compra').value = producto.costo || 0; // Changed to costo
        document.getElementById('precio_venta').value = producto.precio_venta || 0;
        document.getElementById('impuesto_porcentaje').value = producto.impuesto_porcentaje || 19;
        document.getElementById('activo').checked = !!producto.activo;
    } else {
        isEditing = false;
        currentId = null;
        modalTitle.textContent = 'Nuevo Producto';
        form.reset();
        document.getElementById('activo').checked = true;
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

// No longer exposing editarProducto to window global scope for onclick
// window.editarProducto is removed

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar producto?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            cargarProductos();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error eliminando');
    }
}

async function guardarProducto(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const formData = {
        nombre: document.getElementById('nombre').value,
        codigo: document.getElementById('codigo').value,
        descripcion: document.getElementById('descripcion').value,
        costo: document.getElementById('precio_compra').value, // Mapped to Costo
        precio_venta: document.getElementById('precio_venta').value,
        impuesto_porcentaje: document.getElementById('impuesto_porcentaje').value,
        activo: document.getElementById('activo').checked
    };

    try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;

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
            window.closeModal();
            cargarProductos();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error al guardar');
    }
}
