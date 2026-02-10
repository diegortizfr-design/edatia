let API_URL = '';
let currentPaisId = null;
let currentDepartamentoId = null;
let currentCiudadId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const configResp = await fetch('../../assets/config.json');
    const config = await configResp.json();
    API_URL = `${config.apiUrl}/geografica`;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Form submissions
    document.getElementById('paisForm').addEventListener('submit', handlePaisSubmit);
    document.getElementById('departamentoForm').addEventListener('submit', handleDepartamentoSubmit);
    document.getElementById('ciudadForm').addEventListener('submit', handleCiudadSubmit);

    loadPaises();
    loadDepartamentos();
    loadCiudades();
});

// ===== PAISES =====
async function loadPaises() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/paises`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderPaises(data.data);
        }
    } catch (err) {
        console.error('Error loading paises:', err);
    }
}

function renderPaises(paises) {
    const tbody = document.getElementById('paises-table');
    tbody.innerHTML = paises.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.codigo || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editPais(${p.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deletePais(${p.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openPaisModal() {
    currentPaisId = null;
    document.getElementById('paisModalTitle').textContent = 'Nuevo País';
    document.getElementById('paisForm').reset();
    document.getElementById('paisModal').style.display = 'flex';
}

function closePaisModal() {
    document.getElementById('paisModal').style.display = 'none';
}

async function editPais(id) {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/paises`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    const pais = data.data.find(p => p.id === id);

    if (pais) {
        currentPaisId = id;
        document.getElementById('paisModalTitle').textContent = 'Editar País';
        document.getElementById('pais_nombre').value = pais.nombre;
        document.getElementById('pais_codigo').value = pais.codigo || '';
        document.getElementById('paisModal').style.display = 'flex';
    }
}

async function handlePaisSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = {
        nombre: document.getElementById('pais_nombre').value,
        codigo: document.getElementById('pais_codigo').value
    };

    const url = currentPaisId ? `${API_URL}/paises/${currentPaisId}` : `${API_URL}/paises`;
    const method = currentPaisId ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            closePaisModal();
            loadPaises();
            loadDepartamentos(); // Refresh for dropdown
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al guardar país');
    }
}

async function deletePais(id) {
    if (!confirm('¿Eliminar este país? Se eliminarán también sus departamentos y ciudades.')) return;

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/paises/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            loadPaises();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al eliminar país');
    }
}

// ===== DEPARTAMENTOS =====
async function loadDepartamentos() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/departamentos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderDepartamentos(data.data);
        }
    } catch (err) {
        console.error('Error loading departamentos:', err);
    }
}

function renderDepartamentos(departamentos) {
    const tbody = document.getElementById('departamentos-table');
    tbody.innerHTML = departamentos.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.pais_nombre || '-'}</td>
            <td>${d.nombre}</td>
            <td>${d.codigo || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editDepartamento(${d.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteDepartamento(${d.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function openDepartamentoModal() {
    currentDepartamentoId = null;
    document.getElementById('departamentoModalTitle').textContent = 'Nuevo Departamento';
    document.getElementById('departamentoForm').reset();
    await loadPaisesSelect();
    document.getElementById('departamentoModal').style.display = 'flex';
}

function closeDepartamentoModal() {
    document.getElementById('departamentoModal').style.display = 'none';
}

async function loadPaisesSelect() {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/paises`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();

    const select = document.getElementById('departamento_pais_id');
    select.innerHTML = '<option value="">Seleccione...</option>' +
        data.data.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

async function editDepartamento(id) {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    const dept = data.data.find(d => d.id === id);

    if (dept) {
        currentDepartamentoId = id;
        document.getElementById('departamentoModalTitle').textContent = 'Editar Departamento';
        await loadPaisesSelect();
        document.getElementById('departamento_pais_id').value = dept.pais_id;
        document.getElementById('departamento_nombre').value = dept.nombre;
        document.getElementById('departamento_codigo').value = dept.codigo || '';
        document.getElementById('departamentoModal').style.display = 'flex';
    }
}

async function handleDepartamentoSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = {
        pais_id: document.getElementById('departamento_pais_id').value,
        nombre: document.getElementById('departamento_nombre').value,
        codigo: document.getElementById('departamento_codigo').value
    };

    const url = currentDepartamentoId ? `${API_URL}/departamentos/${currentDepartamentoId}` : `${API_URL}/departamentos`;
    const method = currentDepartamentoId ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            closeDepartamentoModal();
            loadDepartamentos();
            loadCiudades(); // Refresh for dropdown
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al guardar departamento');
    }
}

async function deleteDepartamento(id) {
    if (!confirm('¿Eliminar este departamento? Se eliminarán también sus ciudades.')) return;

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/departamentos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            loadDepartamentos();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al eliminar departamento');
    }
}

// ===== CIUDADES =====
async function loadCiudades() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/ciudades`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderCiudades(data.data);
        }
    } catch (err) {
        console.error('Error loading ciudades:', err);
    }
}

function renderCiudades(ciudades) {
    const tbody = document.getElementById('ciudades-table');
    tbody.innerHTML = ciudades.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.departamento_nombre || '-'}</td>
            <td>${c.nombre}</td>
            <td>${c.codigo || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editCiudad(${c.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteCiudad(${c.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function openCiudadModal() {
    currentCiudadId = null;
    document.getElementById('ciudadModalTitle').textContent = 'Nueva Ciudad';
    document.getElementById('ciudadForm').reset();
    await loadDepartamentosSelect();
    document.getElementById('ciudadModal').style.display = 'flex';
}

function closeCiudadModal() {
    document.getElementById('ciudadModal').style.display = 'none';
}

async function loadDepartamentosSelect() {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();

    const select = document.getElementById('ciudad_departamento_id');
    select.innerHTML = '<option value="">Seleccione...</option>' +
        data.data.map(d => `<option value="${d.id}">${d.nombre} (${d.pais_nombre})</option>`).join('');
}

async function editCiudad(id) {
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/ciudades`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    const ciudad = data.data.find(c => c.id === id);

    if (ciudad) {
        currentCiudadId = id;
        document.getElementById('ciudadModalTitle').textContent = 'Editar Ciudad';
        await loadDepartamentosSelect();
        document.getElementById('ciudad_departamento_id').value = ciudad.departamento_id;
        document.getElementById('ciudad_nombre').value = ciudad.nombre;
        document.getElementById('ciudad_codigo').value = ciudad.codigo || '';
        document.getElementById('ciudadModal').style.display = 'flex';
    }
}

async function handleCiudadSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = {
        departamento_id: document.getElementById('ciudad_departamento_id').value,
        nombre: document.getElementById('ciudad_nombre').value,
        codigo: document.getElementById('ciudad_codigo').value
    };

    const url = currentCiudadId ? `${API_URL}/ciudades/${currentCiudadId}` : `${API_URL}/ciudades`;
    const method = currentCiudadId ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            closeCiudadModal();
            loadCiudades();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al guardar ciudad');
    }
}

async function deleteCiudad(id) {
    if (!confirm('¿Eliminar esta ciudad?')) return;

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/ciudades/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            alert(data.message);
            loadCiudades();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error al eliminar ciudad');
    }
}
