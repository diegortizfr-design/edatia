// Lógica de Interfaz para Gestión de Averías (Conectado a API)

let API_BASE = '';
let API_URL = '';
let PRODUCTOS_URL = '';
let SUCURSALES_URL = '';
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '../../modules/auth/login.html';
        return;
    }

    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_BASE = config.apiUrl;
        API_URL = `${API_BASE}/averias`;
        PRODUCTOS_URL = `${API_BASE}/productos`;
        SUCURSALES_URL = `${API_BASE}/sucursales`;

        cargarAverias();
        setupSearch();
        loadSucursales();
    } catch (e) {
        console.error('Error loading config:', e);
    }
});

async function cargarAverias() {
    try {
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            renderTabla(result.data);
            renderStats(result.stats);
        } else {
            console.error('Error cargando averías:', result.message);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

function renderStats(stats) {
    if (!stats) return;
    // Asumiendo el orden de las tarjetas en el HTML: Total, Valor, Recuperados
    const numberElements = document.querySelectorAll('.stat .number');
    if (numberElements.length >= 3) {
        numberElements[0].textContent = stats.totalItems || 0;
        numberElements[1].textContent = formatCurrency(stats.valorPerdida || 0);
        numberElements[2].textContent = stats.recuperados || 0;
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('tablaAverias');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No hay reportes de averías.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f3f4f6';

        const badgeClass = getBadgeClass(item.estado);
        const esEstadoFinal = ['Vendido al Costo', 'Uso Personal', 'Desechado'].includes(item.estado);

        tr.innerHTML = `
            <td style="padding: 15px;">
                <div class="product-cell" style="display: flex; align-items: center; gap: 10px;">
                    <div class="img-placeholder" style="width: 35px; height: 35px; background: #e0e7ff; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #4F46E5;">
                        ${item.imagen_url ? `<img src="${item.imagen_url}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div>
                        <strong style="color: #1F2937; display: block;">${item.producto_nombre}</strong>
                        <small style="color: #6B7280;">${item.referencia_fabrica || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td style="padding: 15px; color: #4B5563;">${item.motivo_descripcion}</td>
            <td style="padding: 15px; color: #4B5563;">${item.sucursal_nombre}</td>
            <td style="padding: 15px; color: #1F2937; font-weight: 600;">${item.cantidad}</td>
            <td style="padding: 15px; color: #4B5563;">${new Date(item.fecha_reporte).toLocaleDateString()}</td>
            <td style="padding: 15px;"><span class="badge ${badgeClass}" style="padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">${item.estado}</span></td>
            <td style="padding: 15px; display: flex; gap: 8px;">
                <button class="btn-icon" title="Gestionar" style="background: none; border: none; color: #6B7280; cursor: pointer; font-size: 1rem;"><i class="fas fa-cog"></i></button>
                ${!esEstadoFinal ? `
                    <button class="btn-icon" onclick="abrirModalSalida(${item.id})" title="Dar Salida Definitiva" 
                        style="background: #fee2e2; border: none; color: #DC2626; cursor: pointer; font-size: 1rem; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getBadgeClass(estado) {
    switch (estado) {
        case 'Pendiente': return 'warning';
        case 'Para Remate': return 'info';
        case 'Para Regalo': return 'success';
        case 'Desechado': return 'danger';
        case 'Recuperado': return 'success';
        case 'Vendido al Costo': return 'danger';
        case 'Uso Personal': return 'danger';
        default: return 'info';
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

// --- Búsqueda de Productos en Modal ---
let searchTimeout;
let searchInputModal = document.querySelector('#formAveria input[placeholder="Escribe código o nombre..."]');

const resultsContainer = document.createElement('div');
resultsContainer.className = 'search-results mockup-results';
resultsContainer.style.display = 'none';
resultsContainer.style.position = 'absolute';
resultsContainer.style.background = 'white';
resultsContainer.style.width = '100%';
resultsContainer.style.zIndex = '1000';
resultsContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
resultsContainer.style.maxHeight = '200px';
resultsContainer.style.overflowY = 'auto';

let selectedProductId = null;

function setupSearch() {
    searchInputModal = document.querySelector('#formAveria input[placeholder="Escribe código o nombre..."]');

    if (!searchInputModal) return;

    if (!resultsContainer.parentNode) {
        const container = searchInputModal.parentNode;
        container.style.position = 'relative';
        container.appendChild(resultsContainer);
    }

    searchInputModal.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(searchTimeout);

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => buscarProductos(query), 300);
    });

    searchInputModal.addEventListener('blur', () => {
        setTimeout(() => {
            resultsContainer.style.display = 'none';
        }, 200);
    });
}

async function buscarProductos(query) {
    try {
        const response = await fetch(`${PRODUCTOS_URL}?busqueda=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            showResults(result.data);
        } else {
            resultsContainer.innerHTML = '<div class="result-item" style="padding:10px;">No encontrado</div>';
            resultsContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error buscando producto:', error);
    }
}

function showResults(products) {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'block';

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.style.padding = '8px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #eee';
        div.onmouseover = () => div.style.background = '#f3f4f6';
        div.onmouseout = () => div.style.background = 'transparent';

        div.textContent = `${p.nombre} (Stock: ${p.stock_sucursal || p.stock_actual || 0})`;

        div.onclick = () => selectProduct(p);
        resultsContainer.appendChild(div);
    });
}

function selectProduct(product) {
    selectedProductId = product.id;
    if (searchInputModal) searchInputModal.value = product.nombre;
    resultsContainer.style.display = 'none';
}

// --- Manejo de Sucursales ---
async function loadSucursales() {
    const select = document.querySelector('select');
    try {
        const response = await fetch(SUCURSALES_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        if (result.success && result.data) {
            select.innerHTML = '';
            result.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.nombre;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.log('Using default sucursales');
    }
}

// --- Modal Functions ---
window.abrirModalReporte = function () {
    document.getElementById('modalReporte').style.display = 'flex';
    document.getElementById('formAveria').reset();
    selectedProductId = null;
    resultsContainer.style.display = 'none';
}

window.cerrarModalReporte = function () {
    document.getElementById('modalReporte').style.display = 'none';
}

window.abrirModalSalida = function (id) {
    document.getElementById('salidaAveriaId').value = id;
    document.getElementById('modalSalida').style.display = 'flex';
}

window.cerrarModalSalida = function () {
    document.getElementById('modalSalida').style.display = 'none';
    document.getElementById('formSalida').reset();
}

window.onclick = function (event) {
    const modalR = document.getElementById('modalReporte');
    const modalS = document.getElementById('modalSalida');
    if (event.target == modalR) modalR.style.display = 'none';
    if (event.target == modalS) modalS.style.display = 'none';
}

// --- Form Submits ---
document.getElementById('formAveria').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!selectedProductId) {
        alert('Por favor busque y seleccione un producto válido.');
        return;
    }

    const selects = this.querySelectorAll('select');
    const inputs = this.querySelectorAll('input');
    const textareas = this.querySelectorAll('textarea');

    const sucursalId = selects[0].value;
    const cantidad = inputs[1].value;
    const motivo = textareas[0].value;
    const estado = selects[1].value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                producto_id: selectedProductId,
                sucursal_id: sucursalId,
                cantidad: cantidad,
                motivo: motivo,
                estado: estado
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Avería registrada correctamente.');
            cerrarModalReporte();
            cargarAverias();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error de conexión al guardar.');
    }
});

document.getElementById('formSalida').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('salidaAveriaId').value;
    const nuevoEstado = document.getElementById('tipoSalida').value;
    const observaciones = document.getElementById('obsSalida').value;

    if (!confirm(`¿Confirmar salida como ${nuevoEstado}? No podrá deshacer esta acción.`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}/salida`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nuevoEstado, observaciones })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            cerrarModalSalida();
            cargarAverias();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error de conexión al procesar salida.');
    }
});
