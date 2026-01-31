// frontend/assets/js/nomina_roles.js

let API_URL = '';
let tableBody, modal, form, btnNuevo, closeBtns, modalTitle;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configRes = await fetch('/frontend/assets/config.json');
        const config = await configRes.json();
        API_URL = `${config.apiUrl}/nomina/cargos`;

        tableBody = document.getElementById('cargos-table-body');
        modal = document.getElementById('modal-cargo');
        form = document.getElementById('form-cargo');
        btnNuevo = document.getElementById('btn-nuevo-cargo');
        closeBtns = document.querySelectorAll('.close-modal');
        modalTitle = document.getElementById('modal-title');

        cargarCargos();

        if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModal());
        closeBtns.forEach(btn => btn.addEventListener('click', cerrarModal));
        if (form) form.addEventListener('submit', guardarCargo);

    } catch (error) {
        console.error('Error initialization:', error);
    }
});

let isEditing = false;
let currentId = null;
let listaCargos = [];

async function cargarCargos() {
    if (!tableBody) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            listaCargos = data.data;
            renderTable(listaCargos);
        }
    } catch (err) { console.error(err); }
}

function renderTable(cargos) {
    tableBody.innerHTML = '';
    cargos.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 16px 24px; font-weight: 600;">${c.nombre}</td>
            <td style="padding: 16px 24px; color: #64748b;">${c.descripcion || '-'}</td>
            <td style="padding: 16px 24px; text-align: center;">
                <button class="btn-icon" onclick="abrirModal(${c.id})" title="Editar" style="background: none; border: none; color: #6366f1; cursor: pointer; margin-right: 10px;"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="eliminarCargo(${c.id})" title="Eliminar" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

window.abrirModal = (id = null) => {
    modal.style.display = 'flex';
    if (id) {
        const cargo = listaCargos.find(c => c.id === id);
        isEditing = true;
        currentId = id;
        modalTitle.textContent = 'Editar Cargo';
        document.getElementById('cargo-nombre').value = cargo.nombre;
        document.getElementById('cargo-descripcion').value = cargo.descripcion || '';
    } else {
        isEditing = false;
        currentId = null;
        modalTitle.textContent = 'Nuevo Cargo';
        form.reset();
    }
}

function cerrarModal() { modal.style.display = 'none'; }

async function guardarCargo(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
        nombre: document.getElementById('cargo-nombre').value,
        descripcion: document.getElementById('cargo-descripcion').value
    };

    try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            showNotification('Cargo guardado con éxito', 'success');
            cerrarModal();
            cargarCargos();
        }
    } catch (err) { console.error(err); }
}

window.eliminarCargo = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este cargo?')) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
            showNotification('Cargo eliminado', 'info');
            cargarCargos();
        }
    } catch (err) { console.error(err); }
}
