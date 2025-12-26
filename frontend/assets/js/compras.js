// frontend/assets/js/compras.js

const API_URL = '/api/compras';
const tableBody = document.querySelector('.glass-table tbody');
const btnNuevo = document.getElementById('btn-nueva-compra'); // Ensure ID exists in html

document.addEventListener('DOMContentLoaded', () => {
    cargarCompras();
});

async function cargarCompras() {
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
        console.error('Error cargando compras:', err);
    }
}

function renderTable(compras) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    compras.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${c.id}</td>
            <td>${c.proveedor_id}</td> <!-- Idealmente hacer join con terceros -->
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td>$${parseFloat(c.total).toLocaleString()}</td>
            <td><span class="badge ${c.estado === 'Pagada' ? 'active' : 'warning'}">${c.estado}</span></td>
            <td>
                <button class="btn-icon"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
