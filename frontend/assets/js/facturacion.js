// frontend/assets/js/facturacion.js

const API_URL = '/api/facturacion';
const tableBody = document.querySelector('.glass-table tbody');

document.addEventListener('DOMContentLoaded', () => {
    cargarFacturas();
});

async function cargarFacturas() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderTable(data.data);
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error('Error cargando facturas:', err);
    }
}

function renderTable(facturas) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    facturas.forEach(f => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${f.id}</td>
            <td>${f.cliente_id}</td>
            <td>${new Date(f.fecha).toLocaleDateString()}</td>
            <td>$${parseFloat(f.total).toLocaleString()}</td>
            <td><span class="badge ${f.estado === 'Pagada' ? 'active' : 'warning'}">${f.estado}</span></td>
            <td>
                <button class="btn-icon"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
