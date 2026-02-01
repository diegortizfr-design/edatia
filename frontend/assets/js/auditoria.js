let API_BASE = '';
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', async () => {
    const configResp = await fetch('/frontend/assets/config.json');
    const config = await configResp.json();
    API_BASE = config.apiUrl + '/usuarios';

    loadRoles();
    loadCargos();
    setupEventListeners();
});

async function loadRoles() {
    try {
        const resp = await fetch(`${API_BASE}/roles`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) renderRoles(data.data);
    } catch (e) { console.error(e); }
}

async function loadCargos() {
    try {
        const resp = await fetch(`${API_BASE}/cargos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) renderCargos(data.data);
    } catch (e) { console.error(e); }
}

function renderRoles(roles) {
    const body = document.getElementById('roles-table-body');
    body.innerHTML = roles.map(r => `
        <tr>
            <td><strong>${r.nombre}</strong></td>
            <td>${r.descripcion || '-'}</td>
            <td>
                <button class="btn-icon" onclick='openRoleModal(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                <button class="btn-icon" style="color:red;" onclick="deleteRole(${r.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderCargos(cargos) {
    const body = document.getElementById('cargos-table-body');
    body.innerHTML = cargos.map(c => `
        <tr>
            <td><strong>${c.nombre}</strong></td>
            <td>
                <button class="btn-icon" onclick='openCargoModal(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                <button class="btn-icon" style="color:red;" onclick="deleteCargo(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// ROLE MODAL & CRUD
window.openRoleModal = (role = null) => {
    const modal = document.getElementById('roleModal');
    const form = document.getElementById('roleForm');
    form.reset();
    if (role) {
        document.getElementById('role_id').value = role.id;
        document.getElementById('role_nombre').value = role.nombre;
        document.getElementById('role_descripcion').value = role.descripcion || '';
    } else {
        document.getElementById('role_id').value = '';
    }
    modal.style.display = 'flex';
};

window.closeRoleModal = () => document.getElementById('roleModal').style.display = 'none';

async function deleteRole(id) {
    if (!confirm('¿Seguro que desea eliminar este rol?')) return;
    const resp = await fetch(`${API_BASE}/roles/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    const data = await resp.json();
    if (data.success) { showNotification('Rol eliminado', 'success'); loadRoles(); }
}

// CARGO MODAL & CRUD
window.openCargoModal = (cargo = null) => {
    const modal = document.getElementById('cargoModal');
    const form = document.getElementById('cargoForm');
    form.reset();
    if (cargo) {
        document.getElementById('cargo_id').value = cargo.id;
        document.getElementById('cargo_nombre').value = cargo.nombre;
    } else {
        document.getElementById('cargo_id').value = '';
    }
    modal.style.display = 'flex';
};

window.closeCargoModal = () => document.getElementById('cargoModal').style.display = 'none';

async function deleteCargo(id) {
    if (!confirm('¿Seguro que desea eliminar este cargo?')) return;
    const resp = await fetch(`${API_BASE}/cargos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    const data = await resp.json();
    if (data.success) { showNotification('Cargo eliminado', 'success'); loadCargos(); }
}

function setupEventListeners() {
    document.getElementById('roleForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('role_id').value;
        const nombre = document.getElementById('role_nombre').value;
        const descripcion = document.getElementById('role_descripcion').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/roles/${id}` : `${API_BASE}/roles`;

        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nombre, descripcion })
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Rol guardado correctamente', 'success');
            closeRoleModal();
            loadRoles();
        } else {
            showNotification('Error: ' + (data.message || 'No se pudo guardar el rol'), 'error');
        }
    };

    document.getElementById('cargoForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('cargo_id').value;
        const nombre = document.getElementById('cargo_nombre').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/cargos/${id}` : `${API_BASE}/cargos`;

        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nombre })
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Cargo guardado correctamente', 'success');
            closeCargoModal();
            loadCargos();
        } else {
            showNotification('Error: ' + (data.message || 'No se pudo guardar el cargo'), 'error');
        }
    };
}
