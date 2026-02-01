/**
 * User Management Module
 */

let API_URL = '';
let ROLES_URL = '';
let CARGOS_URL = '';
let tableBody, modal, form;
let isEditing = false;
let currentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/usuarios`;
        ROLES_URL = `${config.apiUrl}/usuarios/roles`;
        CARGOS_URL = `${config.apiUrl}/usuarios/cargos`;

        tableBody = document.getElementById('usuarios-table-body');
        modal = document.getElementById('usuarioModal');
        form = document.getElementById('usuarioForm');

        if (form) {
            form.addEventListener('submit', handleSave);
        }

        loadUsers();
        loadRoles();
        loadCargos();
        loadColaboradores();

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderTable(data.data);
        }
    } catch (e) {
        console.error('Error loading users:', e);
        showNotification('Error al cargar usuarios', 'error');
    }
}

async function loadRoles() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(ROLES_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('rol_id');
            select.innerHTML = '<option value="">-- Seleccionar Rol --</option>';
            data.data.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.nombre;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error(e); }
}

async function loadCargos() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(CARGOS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('cargo_id');
            select.innerHTML = '<option value="">-- Seleccionar Cargo --</option>';
            data.data.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error(e); }
}

async function loadColaboradores() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/colaboradores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('tercero_id');
            select.innerHTML = '<option value="">Ninguno / No aplica</option>';
            data.data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.nombre_comercial} (${t.documento})`;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error(e); }
}

function renderTable(users) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        const initials = u.nombre ? u.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

        tr.innerHTML = `
            <td>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
                        ${initials}
                    </div>
                    <div>
                        <span style="font-weight: 600; display: block;">${u.nombre || 'Sin nombre'}</span>
                        <small style="color: #64748b;">@${u.usuario}</small>
                    </div>
                </div>
            </td>
            <td>${u.email || '-'}</td>
            <td><span class="badge" style="background: #E0E7FF; color: #4338CA;">${u.rol_nombre || 'Sin Rol'}</span></td>
            <td>${u.cargo_nombre || '-'}</td>
            <td><span class="badge ${u.estado === 'Activo' ? 'active' : 'inactive'}">${u.estado}</span></td>
            <td>
                <button class="btn-icon" onclick='openModal(${JSON.stringify(u)})'><i class="fas fa-edit"></i></button>
                <button class="btn-icon" style="color: #EF4444;" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.openModal = (u = null) => {
    isEditing = !!u;
    currentId = u ? u.id : null;
    modal.style.display = 'flex';
    form.reset();

    document.getElementById('modal-title').textContent = isEditing ? 'Editar Usuario' : 'Nuevo Usuario';

    if (u) {
        document.getElementById('nombre').value = u.nombre || '';
        document.getElementById('usuario_name').value = u.usuario || '';
        document.getElementById('email').value = u.email || '';
        document.getElementById('telefono').value = u.telefono || '';
        document.getElementById('rol_id').value = u.rol_id || '';
        document.getElementById('cargo_id').value = u.cargo_id || '';
        document.getElementById('estado').value = u.estado || 'Activo';
        document.getElementById('tercero_id').value = u.tercero_id || '';
        document.getElementById('password').placeholder = 'Dejar en blanco para mantener actual';
        document.getElementById('password').required = false;
    } else {
        document.getElementById('estado').value = 'Activo';
        document.getElementById('password').placeholder = 'Contraseña';
        document.getElementById('password').required = true;
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = {
        nombre: document.getElementById('nombre').value,
        usuario: document.getElementById('usuario_name').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        rol_id: document.getElementById('rol_id').value || null,
        cargo_id: document.getElementById('cargo_id').value || null,
        estado: document.getElementById('estado').value,
        password: document.getElementById('password').value,
        tercero_id: document.getElementById('tercero_id').value || null
    };

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
            showNotification(isEditing ? 'Usuario actualizado' : 'Usuario creado', 'success');
            closeModal();
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error al guardar', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('¿Seguro que desea eliminar este usuario?')) return;
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Usuario eliminado', 'success');
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error al eliminar', 'error');
    }
}
