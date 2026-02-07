/**
 * Categories Module
 * Handles listing and managing product categories.
 */

let API_URL = '';
let tableBody;
let currentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/productos`; // Base endpoint

        tableBody = document.getElementById('categorias-table-body');

        // Check auth
        if (!localStorage.getItem('token')) {
            window.location.href = '/frontend/login.html';
            return;
        }

        loadCategories();

    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadCategories() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await resp.json();

        if (result.success) {
            renderTable(result.data);
        } else {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Error al cargar categorías</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Error de conexión</td></tr>';
    }
}

function renderTable(categories) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron categorías</td></tr>';
        return;
    }

    categories.forEach(cat => {
        const isActive = cat.activo !== 0; // Handle older DBs where active might be null
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${cat.nombre}</strong>
            </td>
            <td>
                <span style="color: #64748b; font-size: 0.9em;">${cat.descripcion || '-'}</span>
            </td>
            <td style="text-align: center;">
                <span class="badge" style="background: ${isActive ? '#dcfce7' : '#fee2e2'}; color: ${isActive ? '#166534' : '#991b1b'}; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick='openModal(${JSON.stringify(cat)})' title="Editar" style="color: #6366f1; border: none; background: none; cursor: pointer; font-size: 1.1em;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteCategory(${cat.id})" title="Eliminar" style="color: #ef4444; border: none; background: none; cursor: pointer; font-size: 1.1em;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.openModal = (cat = null) => {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modal-title');

    // Reset form
    document.getElementById('cat_id').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('activo').checked = true;

    if (cat) {
        currentId = cat.id;
        title.innerText = 'Editar Categoría';
        document.getElementById('cat_id').value = cat.id;
        document.getElementById('nombre').value = cat.nombre;
        document.getElementById('descripcion').value = cat.descripcion || '';
        document.getElementById('activo').checked = (cat.activo !== 0);
    } else {
        currentId = null;
        title.innerText = 'Nueva Categoría';
    }

    modal.style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('categoryModal').style.display = 'none';
};

window.saveCategory = async () => {
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        Swal.fire('Error', 'El nombre es obligatorio', 'error');
        return;
    }

    const payload = {
        nombre,
        descripcion: document.getElementById('descripcion').value.trim(),
        activo: document.getElementById('activo').checked ? 1 : 0
    };

    try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/categorias`;
        let method = 'POST';

        if (currentId) {
            url += `/${currentId}`;
            method = 'PUT';
        }

        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            closeModal();
            loadCategories();
        } else {
            Swal.fire('Error', data.message, 'error');
        }

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
};

window.deleteCategory = async (id) => {
    const res = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (res.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_URL}/categorias/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await resp.json();

            if (data.success) {
                Swal.fire('Eliminado', data.message, 'success');
                loadCategories();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    }
};
