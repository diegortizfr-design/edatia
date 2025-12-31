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

// Store loaded data globally
let listaProductos = [];

async function cargarProductos() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            listaProductos = data.data; // Save data
            renderTable(listaProductos);
            updateKPIs(listaProductos);
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
            <td>
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
});

function updateKPIs(productos) {
    const totalItems = productos.length;
    const kpiTotal = document.querySelector('.kpi-grid .card:nth-child(1) p');
    if (kpiTotal) kpiTotal.textContent = totalItems;
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
        document.getElementById('precio_compra').value = producto.precio_compra || 0;
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
        precio_compra: document.getElementById('precio_compra').value,
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
