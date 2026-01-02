/**
 * ERPod - Compras Module Logic
 * Handles fetching and displaying purchase orders.
 */

let API_URL = '';
let tableBody;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/compras`;

        tableBody = document.getElementById('compras-table-body');

        cargarCompras();

        const btnNuevo = document.getElementById('btn-nueva-compra');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => {
                showNotification('Módulo de creación en desarrollo', 'info');
            });
        }
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function cargarCompras() {
    if (!tableBody) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderTable(data.data);
            updateKPIs(data.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #EF4444; padding: 20px;">${data.message || 'Error al cargar compras'}</td></tr>`;
        }
    } catch (err) {
        console.error('Error cargando compras:', err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #EF4444; padding: 20px;">Error de conexión con el servidor</td></tr>`;
    }
}

function renderTable(compras) {
    if (!tableBody) return;

    if (compras.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6B7280; padding: 40px;">No se encontraron órdenes de compra</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';

    compras.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${c.id}</td>
            <td>${c.proveedor_nombre || 'Proveedor #' + c.proveedor_id}</td>
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td><strong>$${parseFloat(c.total).toLocaleString()}</strong></td>
            <td><span class="badge ${c.estado === 'Pagada' ? 'active' : 'warning'}">${c.estado || 'Pendiente'}</span></td>
            <td>
                <button class="btn-icon" title="Ver detalle"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" style="color: #EF4444;" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateKPIs(compras) {
    const porPagar = compras.filter(c => c.estado !== 'Pagada').reduce((acc, curr) => acc + parseFloat(curr.total), 0);
    const pedidos = compras.filter(c => c.estado === 'Pendiente').length;

    const kpiPago = document.getElementById('kpi-por-pagar');
    const kpiPedidos = document.getElementById('kpi-pedidos');

    if (kpiPago) kpiPago.textContent = `$${porPagar.toLocaleString()}`;
    if (kpiPedidos) kpiPedidos.textContent = `${pedidos} Órdenes`;
}
