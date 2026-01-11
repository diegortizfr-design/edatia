/**
 * ERPod - Cash Receipts List Logic
 */

let API_URL = '';
const tableBody = document.getElementById('recibos-table-body');
let allReceipts = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/facturacion/recibos`;

        loadReceipts();
        setupFilters();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadReceipts() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            allReceipts = data.data;
            renderTable(allReceipts);
            updateKPIs(allReceipts);
        }
    } catch (e) {
        console.error('Error loading receipts:', e);
    }
}

function setupFilters() {
    const searchInput = document.getElementById('filter-search');
    const dateInput = document.getElementById('filter-date');

    const runFilters = () => {
        const term = searchInput.value.toLowerCase();
        const date = dateInput.value;

        const filtered = allReceipts.filter(r => {
            const matchesTerm = (r.numero_recibo || '').toLowerCase().includes(term) ||
                (r.cliente_nombre && r.cliente_nombre.toLowerCase().includes(term));

            const matchesDate = !date || r.fecha.startsWith(date);

            return matchesTerm && matchesDate;
        });

        renderTable(filtered);
    };

    searchInput.addEventListener('input', runFilters);
    dateInput.addEventListener('change', runFilters);
}

function renderTable(receipts) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    receipts.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.numero_recibo || 'N/A'}</strong></td>
            <td>${new Date(r.fecha).toLocaleString()}</td>
            <td>${r.cliente_nombre || 'Cliente General'}</td>
            <td>${r.concepto || '-'}</td>
            <td><strong style="color: green;">$${parseFloat(r.monto).toLocaleString()}</strong></td>
            <td>
                <button class="btn-icon" title="Ver (No impl.)"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateKPIs(receipts) {
    const today = new Set();
    let totalValue = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    receipts.forEach(r => {
        if (r.fecha.startsWith(todayStr)) {
            today.add(r.id);
            totalValue += parseFloat(r.monto);
        }
    });

    document.getElementById('kpi-recibos-hoy').textContent = today.size;
    document.getElementById('kpi-total-caja').textContent = `$${totalValue.toLocaleString()}`;
}
