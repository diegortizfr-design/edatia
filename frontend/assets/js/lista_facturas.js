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
        setupFilters();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadInvoices() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
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

    const runFilters = () => {
        const term = searchInput.value.toLowerCase();
        const date = dateInput.value;

        const filtered = allInvoices.filter(f => {
            const matchesTerm = f.numero_factura.toLowerCase().includes(term) ||
                (f.cliente_nombre && f.cliente_nombre.toLowerCase().includes(term));

            const matchesDate = !date || f.fecha.startsWith(date);

            return matchesTerm && matchesDate;
        });

        renderTable(filtered);
    };

    searchInput.addEventListener('input', runFilters);
    dateInput.addEventListener('change', runFilters);
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
                <button class="btn-icon" title="Imprimir"><i class="fas fa-print"></i></button>
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
