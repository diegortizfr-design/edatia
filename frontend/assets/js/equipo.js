/**
 * ERPod - Team Management Console (Unified)
 * Handles Users, Roles, and Cargos logic with a tabbed interface.
 */

let API_BASE = '';
let API_USERS = '';
let API_ROLES = '';
let API_CARGOS = '';

// Globals
let isEditingUser = false;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_BASE = config.apiUrl;
        API_USERS = `${API_BASE}/usuarios`;
        API_ROLES = `${API_BASE}/usuarios/roles`;
        API_CARGOS = `${API_BASE}/usuarios/cargos`;

        // Initialize Listeners
        document.getElementById('usuarioForm')?.addEventListener('submit', handleUserSave);
        document.getElementById('roleForm')?.addEventListener('submit', handleRoleSave);
        document.getElementById('cargoForm')?.addEventListener('submit', handleCargoSave);

        // Initial Data Load
        loadUsers();
        loadRoles();
        loadCargos();
        loadColaboradores();

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

// --- UI / NAVIGATION ---
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
    const content = document.getElementById(`tab-${tabName}`);

    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
};

// --- USERS LOGIC ---
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_USERS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) renderUsersTable(data.data);
    } catch (e) { console.error('Error loading users:', e); }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usuarios-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    users.forEach(u => {
        const initials = u.nombre ? u.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
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
            <td><span class="badge ${u.estado === 'Activo' ? 'active' : 'inactive'}" style="background: ${u.status === 'Activo' ? '#dcfce7' : '#fee2e2'}; color: ${u.status === 'Activo' ? '#166534' : '#991b1b'};">${u.estado}</span></td>
            <td style="text-align: center;">
                <button class="btn-icon" onclick='openUsuarioModal(${JSON.stringify(u)})' style="color: var(--primary-color); background:none; border:none; cursor:pointer; margin-right:8px;"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" style="color: #EF4444; background:none; border:none; cursor:pointer;" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.openUsuarioModal = (u = null) => {
    isEditingUser = !!u;
    currentUserId = u ? u.id : null;
    const modal = document.getElementById('usuarioModal');
    const form = document.getElementById('usuarioForm');
    modal.style.display = 'flex';
    form.reset();

    document.getElementById('modal-title-user').textContent = isEditingUser ? 'Editar Usuario' : 'Nuevo Usuario';

    if (u) {
        document.getElementById('nombre').value = u.nombre || '';
        document.getElementById('usuario_name').value = u.usuario || '';
        document.getElementById('email').value = u.email || '';
        document.getElementById('telefono').value = u.telefono || '';
        document.getElementById('rol_id').value = u.rol_id || '';
        document.getElementById('cargo_id').value = u.cargo_id || '';
        document.getElementById('estado').value = u.estado || 'Activo';
        document.getElementById('tercero_id').value = u.tercero_id || '';
        document.getElementById('password').required = false;
        document.getElementById('password').placeholder = 'Dejar vacío para no cambiar';
    } else {
        document.getElementById('password').required = true;
        document.getElementById('password').placeholder = 'Mínimo 6 caracteres';
    }
};

window.closeUsuarioModal = () => {
    document.getElementById('usuarioModal').style.display = 'none';
};

async function handleUserSave(e) {
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
        const url = isEditingUser ? `${API_USERS}/${currentUserId}` : API_USERS;
        const resp = await fetch(url, {
            method: isEditingUser ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const data = await resp.json();
        if (data.success) {
            showNotification(isEditingUser ? 'Usuario actualizado' : 'Usuario creado', 'success');
            closeUsuarioModal();
            loadUsers();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error al guardar usuario', 'error'); }
}

async function deleteUser(id) {
    if (!confirm('¿Seguro desea eliminar este usuario?')) return;
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_USERS}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) { showNotification('Usuario eliminado', 'success'); loadUsers(); }
    } catch (e) { showNotification('Error al eliminar', 'error'); }
}

// --- SELECTS DATA LOADER ---
async function loadRoles() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_ROLES, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('rol_id');
            const tableBody = document.getElementById('roles-table-body');

            // For User Modal Select
            select.innerHTML = '<option value="">-- Seleccionar Rol --</option>';
            data.data.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.nombre;
                select.appendChild(opt);
            });

            // For Roles Table in Tab
            if (tableBody) {
                tableBody.innerHTML = '';
                data.data.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight:600;">${r.nombre}</td>
                        <td style="text-align: center;">
                            <button class="btn-icon" onclick='openRoleModal(${JSON.stringify(r)})' style="background:none; border:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" style="color:red; background:none; border:none; cursor:pointer;" onclick="deleteRole(${r.id})"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        }
    } catch (e) { console.error('Error roles:', e); }
}

async function loadCargos() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CARGOS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('cargo_id');
            const tableBody = document.getElementById('cargos-table-body');

            select.innerHTML = '<option value="">-- Seleccionar Cargo --</option>';
            data.data.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre;
                select.appendChild(opt);
            });

            if (tableBody) {
                tableBody.innerHTML = '';
                data.data.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight:600;">${c.nombre}</td>
                        <td>${c.rol_nombre || '<span style="color:#999;">Sin rol</span>'}</td>
                        <td style="text-align: center;">
                            <button class="btn-icon" onclick='openCargoModal(${JSON.stringify(c)})' style="background:none; border:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" style="color:red; background:none; border:none; cursor:pointer;" onclick="deleteCargo(${c.id})"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        }
    } catch (e) { console.error('Error cargos:', e); }
}

async function loadColaboradores() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_USERS}/colaboradores`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('tercero_id');
            select.innerHTML = '<option value="">Ninguno / No aplica</option>';
            data.data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = `${t.nombre_comercial} (${t.documento})`;
                opt.setAttribute('data-cargo-id', t.cargo_id || '');
                select.appendChild(opt);
            });

            // Add event listener to auto-populate cargo when tercero is selected
            select.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];
                const cargoId = selectedOption.getAttribute('data-cargo-id');
                const cargoSelect = document.getElementById('cargo_id');
                if (cargoId && cargoSelect) {
                    cargoSelect.value = cargoId;
                } else {
                    cargoSelect.value = '';
                }
            });
        }
    } catch (e) { console.error(e); }
}

// --- ROLES & CARGOS CRUD ---
window.openRoleModal = (r = null) => {
    const modal = document.getElementById('roleModal');
    modal.style.display = 'flex';
    document.getElementById('roleForm').reset();
    document.getElementById('edit_role_id').value = r ? r.id : '';
    if (r) {
        document.getElementById('role_nombre').value = r.nombre;
        document.getElementById('role_descripcion').value = r.descripcion || '';
    }
};

window.closeRoleModal = () => document.getElementById('roleModal').style.display = 'none';

async function handleRoleSave(e) {
    e.preventDefault();
    const id = document.getElementById('edit_role_id').value;
    const body = {
        nombre: document.getElementById('role_nombre').value,
        descripcion: document.getElementById('role_descripcion').value
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_ROLES}/${id}` : API_ROLES;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (data.success) { showNotification('Rol guardado', 'success'); closeRoleModal(); loadRoles(); loadUsers(); }
        else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error al guardar rol', 'error'); }
}

async function deleteRole(id) {
    if (!confirm('¿Eliminar este rol?')) return;
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_ROLES}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        loadRoles(); loadUsers();
    } catch (e) { showNotification('Error', 'error'); }
}

window.openCargoModal = async (c = null) => {
    const modal = document.getElementById('cargoModal');
    modal.style.display = 'flex';
    document.getElementById('cargoForm').reset();
    document.getElementById('edit_cargo_id').value = c ? c.id : '';
    if (c) {
        document.getElementById('cargo_nombre').value = c.nombre;
        document.getElementById('cargo_descripcion').value = c.descripcion || '';
        document.getElementById('cargo_rol_id').value = c.rol_id || '';
    }

    // Load roles into dropdown
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_ROLES, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('cargo_rol_id');
            select.innerHTML = '<option value="">Sin rol asignado</option>';
            data.data.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.nombre;
                if (c && c.rol_id == r.id) opt.selected = true;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error('Error loading roles:', e); }
};

window.closeCargoModal = () => document.getElementById('cargoModal').style.display = 'none';

async function handleCargoSave(e) {
    e.preventDefault();
    const id = document.getElementById('edit_cargo_id').value;
    const body = {
        nombre: document.getElementById('cargo_nombre').value,
        descripcion: document.getElementById('cargo_descripcion').value,
        rol_id: document.getElementById('cargo_rol_id').value || null
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_CARGOS}/${id}` : API_CARGOS;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (data.success) { showNotification('Cargo guardado', 'success'); closeCargoModal(); loadCargos(); loadUsers(); }
        else showNotification(data.message, 'error');
    } catch (e) { showNotification('Error al guardar cargo', 'error'); }
}

async function deleteCargo(id) {
    if (!confirm('¿Eliminar este cargo?')) return;
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_CARGOS}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        loadCargos(); loadUsers();
    } catch (e) { showNotification('Error', 'error'); }
}
