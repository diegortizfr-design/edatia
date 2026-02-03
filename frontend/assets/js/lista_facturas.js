/**
 * ERPod - Invoice History Logic
 * Handles fetching, filtering and displaying past sales.
 */

let API_URL = '';
const tableBody = document.getElementById('facturas-table-body');
let allInvoices = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/facturacion`;

        loadInvoices();
        loadBranches();
        setupFilters();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadBranches() {
    try {
        const token = localStorage.getItem('token');
        // Derive branches URL
        const branchesUrl = API_URL.replace('/facturacion', '/sucursales');

        const resp = await fetch(branchesUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('filter-branch');
            data.data.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.nombre;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Error loading branches:', e);
    }
}

async function loadInvoices(filters = {}) {
    try {
        const token = localStorage.getItem('token');

        // Build Query String
        const params = new URLSearchParams();
        if (filters.search) params.append('busqueda', filters.search);
        if (filters.date) params.append('fecha', filters.date);
        if (filters.branch) params.append('sucursal_id', filters.branch);
        if (filters.prefix) params.append('prefijo', filters.prefix);

        const url = `${API_URL}?${params.toString()}`;

        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            allInvoices = data.data;
            renderTable(allInvoices);
            updateKPIs(allInvoices);
        }
    } catch (e) {
        console.error('Error loading invoices:', e);
    }
}

function setupFilters() {
    const searchInput = document.getElementById('filter-search');
    const dateInput = document.getElementById('filter-date');
    const branchSelect = document.getElementById('filter-branch');
    const prefixInput = document.getElementById('filter-prefix');

    const runFilters = () => {
        const filters = {
            search: searchInput.value,
            date: dateInput.value,
            branch: branchSelect.value,
            prefix: prefixInput.value
        };
        loadInvoices(filters);
    };

    // Debounce for text inputs
    let timeout = null;
    const debouncedRun = () => {
        clearTimeout(timeout);
        timeout = setTimeout(runFilters, 500);
    };

    searchInput.addEventListener('input', debouncedRun);
    prefixInput.addEventListener('input', debouncedRun);

    dateInput.addEventListener('change', runFilters);
    branchSelect.addEventListener('change', runFilters);
}

function renderTable(invoices) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    invoices.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.numero_factura}</strong></td>
            <td>${new Date(f.fecha).toLocaleString()}</td>
            <td>${f.cliente_nombre || 'Cliente Mostrador'}</td>
            <td>${f.metodo_pago}</td>
            <td><strong>$${parseFloat(f.total).toLocaleString()}</strong></td>
            <td><span class="badge active">${f.estado}</span></td>
            <td>
                <button class="btn-icon" onclick="viewDetails(${f.id})" title="Ver Detalle"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="printInvoice(${f.id})" title="Imprimir"><i class="fas fa-print"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateKPIs(invoices) {
    const today = new Set();
    let totalValue = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach(f => {
        if (f.fecha.startsWith(todayStr)) {
            today.add(f.id);
            totalValue += parseFloat(f.total);
        }
    });

    document.getElementById('kpi-ventas-hoy').textContent = today.size;
    document.getElementById('kpi-total-recaudado').textContent = `$${totalValue.toLocaleString()}`;
}

function viewDetails(id) {
    // Modular future implementation for invoice detail modal
    showNotification('Funcionalidad de detalle en desarrollo', 'info');
}

function printInvoice(id) {
    window.open(`/frontend/modules/facturacion/print_factura.html?id=${id}`, '_blank');
}
