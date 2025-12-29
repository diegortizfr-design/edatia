// frontend/global/js/configuracion_terceros.js

let API_URL = ''; // Will be loaded from config
const tableBody = document.querySelector('.glass-table tbody');
const modal = document.getElementById('modal-tercero');
const form = document.getElementById('form-tercero');
const btnNuevo = document.querySelector('.btn-guardar'); // The "Nuevo Tercero" button
const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
const modalTitle = document.getElementById('modal-title');

// State
let isEditing = false;
let currentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load Config first
    try {
        const configRes = await fetch('../../assets/config.json');
        const config = await configRes.json();
        API_URL = `${config.apiUrl}/terceros`;

        cargarTerceros();
    } catch (error) {
        console.error('Error loading config:', error);
        alert('Error cargando configuración del sistema');
    }

    // Event Listeners

    // Event Listeners
    btnNuevo.addEventListener('click', () => abrirModal());


    closeBtns.forEach(btn => {
        btn.addEventListener('click', cerrarModal);
    });

    // Removed window.onclick to prevent closing when clicking outside

    form.addEventListener('submit', guardarTercero);
});

// Store loaded data globally to access it safely
let listaTerceros = [];

async function cargarTerceros() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            listaTerceros = data.data; // Save data
            renderTable(listaTerceros);
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error('Error cargando terceros:', err);
    }
}

function renderTable(terceros) {
    tableBody.innerHTML = '';

    terceros.forEach(t => {
        const badges = [];
        if (t.es_cliente) badges.push('<span class="badge cliente">Cliente</span>');
        if (t.es_proveedor) badges.push('<span class="badge proveedor">Proveedor</span>');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${t.nombre_comercial}</strong><br><small style="color:#666">${t.razon_social || ''}</small></td>
            <td>${t.documento}</td>
            <td>${badges.join(' ')}</td>
            <td>${t.telefono || '-'}</td>
            <td>${t.direccion || '-'}</td>
            <td>
                <!-- Use data-id instead of complex onclick -->
                <button class="btn-icon btn-editar" data-id="${t.id}" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-eliminar" data-id="${t.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Re-attach listeners using event delegation
    // Note: We could attach this once to tableBody, but rebuilding it here is also fine if we clear body
}

// Event delegation for table actions
tableBody.addEventListener('click', (e) => {
    // Handle Edit
    const btnEdit = e.target.closest('.btn-editar');
    if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id);
        const tercero = listaTerceros.find(t => t.id === id);
        if (tercero) abrirModal(tercero);
    }

    // Handle Delete
    const btnDelete = e.target.closest('.btn-eliminar');
    if (btnDelete) {
        const id = parseInt(btnDelete.dataset.id);
        eliminarTercero(id);
    }
});

function abrirModal(tercero = null) {
    modal.style.display = 'block';
    if (tercero) {
        isEditing = true;
        currentId = tercero.id;
        modalTitle.textContent = 'Editar Tercero';

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
        modalTitle.textContent = 'Nuevo Tercero';
        form.reset();
        document.getElementById('es_cliente').checked = true; // Default
    }
}

function cerrarModal() {
    modal.style.display = 'none';
}

// Separate delete function (no longer needs to be on window)
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
            cargarTerceros(); // Reload
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error al eliminar');
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
            cerrarModal();
            cargarTerceros();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error al guardar');
    }
}
