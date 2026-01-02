// frontend/assets/js/configuracion_terceros.js

let API_URL = '';
let tableBody, modal, form, btnNuevo, closeBtns, modalTitle;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configRes = await fetch('../../assets/config.json');
        const config = await configRes.json();
        API_URL = `${config.apiUrl}/terceros`;

        // Initialize DOM Elements
        tableBody = document.getElementById('terceros-table-body');
        modal = document.getElementById('modal-tercero');
        form = document.getElementById('form-tercero');
        btnNuevo = document.getElementById('btn-nuevo-tercero');
        closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
        modalTitle = document.getElementById('modal-title');

        cargarTerceros();

        if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModal());

        closeBtns.forEach(btn => {
            btn.addEventListener('click', cerrarModal);
        });

        if (form) form.addEventListener('submit', guardarTercero);

        window.onclick = (event) => {
            if (event.target == modal) cerrarModal();
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
});

// State
let isEditing = false;
let currentId = null;
let listaTerceros = [];

async function cargarTerceros() {
    if (!tableBody) return;

    try {
        const token = localStorage.getItem('token');
        let url = API_URL;

        // Apply filtering based on mode
        if (window.TERCEROS_MODE === 'cliente') {
            url += '?tipo=cliente';
        } else if (window.TERCEROS_MODE === 'proveedor') {
            url += '?tipo=proveedor';
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            listaTerceros = data.data;
            renderTable(listaTerceros);
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error('Error cargando terceros:', err);
    }
}

function renderTable(terceros) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (terceros.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #6B7280;">No hay terceros registrados</td></tr>';
        return;
    }

    terceros.forEach(t => {
        const badges = [];
        if (t.es_cliente) badges.push('<span class="badge cliente">Cliente</span>');
        if (t.es_proveedor) badges.push('<span class="badge proveedor">Proveedor</span>');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--text-dark);">${t.nombre_comercial}</div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">${t.razon_social || ''}</div>
            </td>
            <td>${t.documento}</td>
            <td><div style="display: flex; gap: 5px;">${badges.join('')}</div></td>
            <td>${t.telefono || '-'}</td>
            <td>${t.direccion || '-'}</td>
            <td>
                <button class="btn-icon btn-editar" data-id="${t.id}" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-eliminar" data-id="${t.id}" title="Eliminar" style="color: #EF4444;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Event delegation
if (tableBody) {
    tableBody.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('.btn-editar');
        if (btnEdit) {
            const id = parseInt(btnEdit.dataset.id);
            const tercero = listaTerceros.find(t => t.id === id);
            if (tercero) abrirModal(tercero);
        }

        const btnDelete = e.target.closest('.btn-eliminar');
        if (btnDelete) {
            const id = parseInt(btnDelete.dataset.id);
            eliminarTercero(id);
        }
    });
}

function abrirModal(tercero = null) {
    if (!modal) return;
    modal.style.display = 'flex';
    if (tercero) {
        isEditing = true;
        currentId = tercero.id;
        modalTitle.textContent = 'Editar Tercero';
        form.querySelector('button[type="submit"]').textContent = 'Actualizar Tercero';

        document.getElementById('nombre_comercial').value = tercero.nombre_comercial;
        document.getElementById('razon_social').value = tercero.razon_social || '';
        document.getElementById('tipo_documento').value = tercero.tipo_documento || 'NIT';
        document.getElementById('documento').value = tercero.documento;
        document.getElementById('telefono').value = tercero.telefono || '';
        document.getElementById('direccion').value = tercero.direccion || '';
        document.getElementById('email').value = tercero.email || '';
        document.getElementById('es_cliente').checked = !!tercero.es_cliente;
        document.getElementById('es_proveedor').checked = !!tercero.es_proveedor;
    } else {
        isEditing = false;
        currentId = null;
        modalTitle.textContent = window.TERCEROS_MODE === 'proveedor' ? 'Nuevo Proveedor' : 'Nuevo Cliente';
        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = window.TERCEROS_MODE === 'proveedor' ? 'Guardar Proveedor' : 'Guardar Cliente';

        form.reset();

        // Default constraints based on mode
        if (window.TERCEROS_MODE === 'cliente') {
            const checkCliente = document.getElementById('es_cliente');
            if (checkCliente) checkCliente.checked = true;
            const checkProv = document.getElementById('es_proveedor');
            if (checkProv) checkProv.checked = false;
        } else if (window.TERCEROS_MODE === 'proveedor') {
            const checkCliente = document.getElementById('es_cliente');
            if (checkCliente) checkCliente.checked = false;
            const checkProv = document.getElementById('es_proveedor');
            if (checkProv) checkProv.checked = true;
        } else {
            // Default legacy behavior
            const checkCliente = document.getElementById('es_cliente');
            if (checkCliente) checkCliente.checked = true;
        }
    }
}

function cerrarModal() {
    if (modal) modal.style.display = 'none';
}

async function eliminarTercero(id) {
    if (!confirm('¿Estás seguro de eliminar este tercero?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            showNotification('Tercero eliminado', 'success');
            cargarTerceros();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Error al eliminar', 'error');
    }
}

async function guardarTercero(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const formData = {
        nombre_comercial: document.getElementById('nombre_comercial').value,
        razon_social: document.getElementById('razon_social').value,
        tipo_documento: document.getElementById('tipo_documento').value,
        documento: document.getElementById('documento').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        email: document.getElementById('email').value,
        es_cliente: document.getElementById('es_cliente').checked,
        es_proveedor: document.getElementById('es_proveedor').checked
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
            showNotification(isEditing ? 'Tercero actualizado' : 'Tercero guardado', 'success');
            cerrarModal();
            cargarTerceros();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Error al guardar', 'error');
    }
}
