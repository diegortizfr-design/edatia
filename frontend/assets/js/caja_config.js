/**
 * ERPod - Cash Drawer Configuration Logic
 */

let API_CAJA = '';
let API_SUCURSALES = '';
let API_DOCUMENTOS = '';
let API_PUC = '';
let API_CLIENTS = '';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        const API_BASE = config.apiUrl;
        API_CAJA = `${API_BASE}/caja/config`;
        API_SUCURSALES = `${API_BASE}/sucursales`;
        API_DOCUMENTOS = `${API_BASE}/documentos`;
        API_PUC = `${API_BASE}/contabilidad/puc`;
        API_CLIENTS = `${API_BASE}/terceros`;

        initCajaConfig();
    } catch (e) {
        console.error('Error initializing:', e);
    }
});

async function initCajaConfig() {
    loadCajas();
    loadSucursales();
    loadDocumentos();
    loadPUC();
    loadClientes();
    setupEventListeners();
}

async function loadCajas() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CAJA, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            renderCajas(data.data);
        } else {
            showNotification(data.message || 'Error al cargar cajas', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Error de conexión al cargar cajas', 'error');
    }
}

function renderCajas(cajas) {
    const list = document.getElementById('cajas-list');
    list.innerHTML = '';

    if (cajas.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center;">
                <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);">
                    <i class="fas fa-cash-register" style="font-size: 3.5rem; color: white;"></i>
                </div>
                <h3 style="font-size: 1.5rem; color: #1e293b; margin: 0 0 12px; font-weight: 700;">No hay cajas configuradas</h3>
                <p style="font-size: 1rem; color: #64748b; margin: 0 0 35px; max-width: 450px; line-height: 1.6;">
                    Crea tu primera caja para comenzar a gestionar las ventas en tu punto de venta. Configura documentos, sucursales y parámetros de seguridad.
                </p>
                <button class="btn-primary" onclick="document.getElementById('btn-nueva-caja').click()" style="padding: 14px 32px; font-size: 1rem; border-radius: 12px; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.25);">
                    <i class="fas fa-plus" style="margin-right: 8px;"></i>Crear Primera Caja
                </button>
            </div>
        `;
        return;
    }

    cajas.forEach(c => {
        const card = document.createElement('div');
        card.className = 'caja-card';
        card.innerHTML = `
            <div class="caja-header">
                <span class="caja-name">${c.nombre}</span>
                <span class="caja-badge badge-${c.estado.toLowerCase()}">${c.estado}</span>
            </div>
            <div class="caja-info"><i class="fas fa-building"></i> Sucursal: ${c.sucursal_nombre || 'No asignada'}</div>
            <div class="caja-info"><i class="fas fa-file-invoice"></i> Documento: ${c.documento_nombre || 'No asignado'}</div>
            <div class="caja-info"><i class="fas fa-user-circle"></i> Cliente Defecto: ${c.cliente_defecto_nombre || 'Cliente Mostrador'}</div>
            <div class="caja-actions">
                <button class="btn-icon btn-edit" title="Editar" onclick='editCaja(${JSON.stringify(c).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" onclick="deleteCaja(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });
}

async function loadSucursales() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_SUCURSALES, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('caja-sucursal');
            select.innerHTML = '<option value="">Seleccione Sucursal...</option>';
            data.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.nombre;
                select.appendChild(opt);
            });
            window.all_sucursales = data.data;
        }
    } catch (e) { }
}

async function loadDocumentos() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_DOCUMENTOS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('caja-documento');
            select.innerHTML = '<option value="">Seleccione Documento POS...</option>';

            // Filter POS documents
            const posDocs = data.data.filter(d =>
                ['factura pos', 'venta', 'fv'].includes((d.categoria || '').toLowerCase())
            );

            posDocs.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.nombre} (${d.prefijo || ''})`;
                select.appendChild(opt);
            });
            window.all_documentos = data.data;
        }
    } catch (e) { }
}

async function loadPUC() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_PUC, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('caja-puc');
            select.innerHTML = '<option value="">Seleccione Cuenta Auxiliar...</option>';

            // Filter only detailed accounts (tipo=Auxiliar) that start with '1' (Activos)
            const activos = data.data.filter(a => a.codigo.startsWith('1') && (a.tipo || '').toLowerCase() === 'auxiliar');

            activos.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.codigo;
                opt.textContent = `${a.codigo} - ${a.nombre}`;
                select.appendChild(opt);
            });
        }
    } catch (e) { }
}

async function loadClientes() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_CLIENTS}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('caja-cliente');
            select.innerHTML = '<option value="">-- Cliente Mostrador (Por defecto) --</option>';

            const clientes = data.data.filter(c => c.es_cliente);
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.nombre_comercial || c.razon_social || c.nombre} (${c.documento})`;
                select.appendChild(opt);
            });
        }
    } catch (e) { }
}

function setupEventListeners() {
    document.getElementById('btn-nueva-caja').onclick = () => {
        document.getElementById('modal-title').textContent = 'Nueva Caja';
        document.getElementById('form-caja').reset();
        document.getElementById('caja-id').value = '';
        document.getElementById('modal-caja').style.display = 'flex';
    };

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.onclick = () => document.getElementById(btn.dataset.target).style.display = 'none';
    });

    document.getElementById('form-caja').onsubmit = saveCaja;
}

window.editCaja = (c) => {
    document.getElementById('modal-title').textContent = 'Editar Caja';
    document.getElementById('caja-id').value = c.id;
    document.getElementById('caja-nombre').value = c.nombre;
    document.getElementById('caja-sucursal').value = c.sucursal_id || '';
    document.getElementById('caja-documento').value = c.documento_id || '';
    document.getElementById('caja-estado').value = c.estado;
    document.getElementById('caja-codigo').value = c.codigo_acceso || '';
    document.getElementById('caja-puc').value = c.codigo_puc || '';
    document.getElementById('caja-cliente').value = c.cliente_defecto_id || '';
    document.getElementById('modal-caja').style.display = 'flex';
};

async function saveCaja(e) {
    e.preventDefault();
    const id = document.getElementById('caja-id').value;
    const body = {
        nombre: document.getElementById('caja-nombre').value,
        sucursal_id: document.getElementById('caja-sucursal').value,
        documento_id: document.getElementById('caja-documento').value,
        estado: document.getElementById('caja-estado').value,
        codigo_acceso: document.getElementById('caja-codigo').value,
        codigo_puc: document.getElementById('caja-puc').value,
        cliente_defecto_id: document.getElementById('caja-cliente').value,
        impresora_config: {}
    };

    try {
        const token = localStorage.getItem('token');
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_CAJA}/${id}` : API_CAJA;

        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification(id ? 'Caja actualizada' : 'Caja creada', 'success');
            document.getElementById('modal-caja').style.display = 'none';
            loadCajas();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error al guardar caja', 'error');
    }
}

async function deleteCaja(id) {
    if (!confirm('¿Está seguro de eliminar esta caja?')) return;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_CAJA}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Caja eliminada', 'success');
            loadCajas();
        }
    } catch (e) {
        showNotification('Error al eliminar caja', 'error');
    }
}
