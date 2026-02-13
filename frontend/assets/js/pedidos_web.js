/**
 * Pedidos Web Management Module
 */

let API_URL = '';
let ordersTableBody;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/ecommerce/orders`;

        ordersTableBody = document.getElementById('pedidos-table-body');

        loadOrders();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderOrders(data.data);
        }
    } catch (e) {
        console.error('Error loading orders:', e);
        if (typeof showNotification === 'function') {
            showNotification('Error al cargar pedidos', 'error');
        }
    }
}

function renderOrders(orders) {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-gray);">No se han recibido pedidos web aún.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.className = 'order-card';
        tr.onclick = () => openOrderDetail(order.id);

        tr.innerHTML = `
            <td><strong>${order.numero_pedido}</strong></td>
            <td>${new Date(order.fecha).toLocaleDateString()} ${new Date(order.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${order.cliente_nombre || 'Cliente Final'}</td>
            <td><strong>$${parseFloat(order.total).toLocaleString()}</strong></td>
            <td><span class="status-badge status-${order.estado.toLowerCase()}">${order.estado}</span></td>
            <td>
                <button class="btn-icon" title="Ver Detalle"><i class="fas fa-eye"></i></button>
            </td>
        `;
        ordersTableBody.appendChild(tr);
    });
}

window.openOrderDetail = async (id) => {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('order-detail-content');
    const title = document.getElementById('modal-order-number');
    const actions = document.getElementById('order-actions-btns');

    modal.style.display = 'flex';
    content.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    actions.innerHTML = '';

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            const order = data.data;
            title.textContent = `Pedido #${order.numero_pedido}`;

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Información del Cliente</h4>
                        <p><strong>Nombre:</strong> ${order.cliente_nombre}</p>
                        <p><strong>Doc:</strong> ${order.cliente_documento}</p>
                        <p><strong>Tel:</strong> ${order.telefono || '-'}</p>
                        <p><strong>Email:</strong> ${order.email || '-'}</p>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Detalles de Entrega</h4>
                        <p><strong>Estado:</strong> <span class="status-badge status-${order.estado.toLowerCase()}">${order.estado}</span></p>
                        <p><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleString()}</p>
                        <p><strong>Info Delivery:</strong> ${order.delivery_info || '-'}</p>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Productos</h4>
                <table class="glass-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.producto_nombre}<br><small style="color:#888;">${item.referencia_fabrica || ''}</small></td>
                                <td>${item.cantidad}</td>
                                <td>$${parseFloat(item.precio_unitario).toLocaleString()}</td>
                                <td>$${(item.cantidad * item.precio_unitario).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right;"><strong>TOTAL:</strong></td>
                            <td><strong style="font-size: 1.2rem; color: var(--primary-color);">$${parseFloat(order.total).toLocaleString()}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                
                ${order.observaciones ? `
                    <div style="margin-top: 20px; padding: 10px; background: #f9fafb; border-radius: 8px;">
                        <strong>Observaciones:</strong><br>${order.observaciones}
                    </div>
                ` : ''}
            `;

            // Render actions based on status
            if (order.estado === 'Pendiente') {
                actions.innerHTML = `
                    <button class="btn-primary" onclick="updateStatus(${order.id}, 'Preparado')">Marcar como Preparado</button>
                    <button class="btn-secondary" style="background:#EF4444; color:white; border:none;" onclick="updateStatus(${order.id}, 'Cancelado')">Cancelar Pedido</button>
                `;
            } else if (order.estado === 'Preparado') {
                actions.innerHTML = `
                    <button class="btn-primary" onclick="updateStatus(${order.id}, 'Enviado')">Marcar como Enviado</button>
                `;
            }
        }
    } catch (e) {
        console.error('Error detail:', e);
        content.innerHTML = '<p style="color:red; text-align:center;">Error al cargar detalle</p>';
    }
}

window.updateStatus = async (id, status) => {
    if (!confirm(`¿Desea cambiar el estado del pedido a "${status}"?`)) return;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: status })
        });
        const data = await resp.json();

        if (data.success) {
            showNotification('Estado actualizado con éxito', 'success');
            closeOrderModal();
            loadOrders();
        }
    } catch (e) {
        console.error('Update status error:', e);
        showNotification('Error al actualizar estado', 'error');
    }
}

window.closeOrderModal = () => {
    document.getElementById('orderModal').style.display = 'none';
}
