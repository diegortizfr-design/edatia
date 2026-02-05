/**
 * ERPod - Formal Invoicing (Factura Venta) Logic
 */

let API_BILLING = '';
let API_PRODUCTS = '';
let API_DOCS = '';
let API_CLIENTS = '';
let API_USERS = '';

let fv_cart = [];
let fv_allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('/frontend/assets/config.json');
        const config = await configResp.json();
        const API_BASE = config.apiUrl;
        API_BILLING = `${API_BASE}/facturacion`;
        API_PRODUCTS = `${API_BASE}/productos`;
        API_DOCS = `${API_BASE}/documentos`;
        API_CLIENTS = `${API_BASE}/terceros`;
        API_USERS = `${API_BASE}/usuarios`;

        initFV();
    } catch (e) { console.error(e); }
});

async function initFV() {
    loadFVConfig();
    loadFVClients();
    loadFVSellers();
    setupFVEventListeners();
}

async function loadFVConfig() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_DOCS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('fv-document-type');
            select.innerHTML = '';
            // Filter categories that look like Formal Invoices
            const fvDocs = data.data.filter(d => ['fv', 'factura de venta'].includes((d.categoria || '').toLowerCase()));
            fvDocs.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.nombre} (${d.prefijo || ''}${d.consecutivo_actual})`;
                select.appendChild(opt);
            });
        }
    } catch (e) { }
}

async function loadFVClients() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_CLIENTS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            const select = document.getElementById('fv-cliente-select');
            select.innerHTML = '<option value="">Seleccione Cliente...</option>';
            data.data.filter(c => c.es_cliente).forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.nombre_comercial || c.nombre} - ${c.documento}`;
                select.appendChild(opt);
            });
        }
    } catch (e) { }
}

async function loadFVSellers() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_USERS, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (data.success) {
            // Find a seller select if we add it to the UI later, 
            // but for now let's just ensure we have the data
            window.fv_sellers = data.data;
        }
    } catch (e) { }
}

function setupFVEventListeners() {
    document.getElementById('btn-abrir-busqueda').onclick = () => {
        document.getElementById('modal-busqueda').style.display = 'flex';
        document.getElementById('fv-search-input').focus();
    };

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.onclick = () => document.getElementById(btn.dataset.target).style.display = 'none';
    });

    document.getElementById('fv-search-input').onkeydown = async (e) => {
        if (e.key === 'Enter') {
            const term = e.target.value;
            if (term.length < 2) return;
            searchFVProducts(term);
        }
    };

    document.getElementById('btn-generar-fv').onclick = processFV;
}

async function searchFVProducts(term) {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_PRODUCTS}?busqueda=${term}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const tbody = document.getElementById('fv-search-results');
            tbody.innerHTML = '';
            data.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.codigo || ''}</td>
                    <td>${p.nombre}</td>
                    <td>$${parseFloat(p.precio1).toLocaleString()}</td>
                    <td>${p.stock_actual || 0}</td>
                    <td><button class="btn-caja btn-caja-abrir" onclick='addToFVCart(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Agregar</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) { }
}

window.addToFVCart = (product) => {
    const existing = fv_cart.find(i => i.id === product.id);
    if (existing) {
        existing.cantidad++;
    } else {
        fv_cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: parseFloat(product.precio1),
            impuesto_porcentaje: parseFloat(product.impuesto_porcentaje) || 0,
            cantidad: 1
        });
    }
    renderFVCart();
    showNotification('Producto agregado', 'success');
};

function renderFVCart() {
    const tbody = document.getElementById('fv-cart-body');
    tbody.innerHTML = '';

    if (fv_cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:gray; padding:40px;">No hay items seleccionados</td></tr>';
        document.getElementById('fv-subtotal').textContent = '$0.00';
        document.getElementById('fv-iva').textContent = '$0.00';
        document.getElementById('fv-total').textContent = '$0.00';
        return;
    }

    let subtotal = 0;
    let iva = 0;

    fv_cart.forEach((item, index) => {
        const itemSub = item.precio * item.cantidad;
        const itemIva = itemSub * (item.impuesto_porcentaje / 100);

        subtotal += itemSub;
        iva += itemIva;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>$${item.precio.toLocaleString()}</td>
            <td><input type="number" value="${item.cantidad}" style="width:50px;" onchange="updateFVQty(${index}, this.value)"></td>
            <td>${item.impuesto_porcentaje}%</td>
            <td>$${itemSub.toLocaleString()}</td>
            <td><button style="color:red; border:none; background:none; cursor:pointer;" onclick="removeItemFV(${index})"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    const total = subtotal + iva;
    document.getElementById('fv-subtotal').textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById('fv-iva').textContent = `$${iva.toLocaleString()}`;
    document.getElementById('fv-total').textContent = `$${total.toLocaleString()}`;

    window.currentFVTotal = total;
    window.currentFVSubtotal = subtotal;
    window.currentFVIva = iva;
}

window.updateFVQty = (index, val) => {
    const v = parseInt(val);
    if (v > 0) fv_cart[index].cantidad = v;
    else fv_cart.splice(index, 1);
    renderFVCart();
};

window.removeItemFV = (index) => {
    fv_cart.splice(index, 1);
    renderFVCart();
};

async function processFV() {
    const clienteId = document.getElementById('fv-cliente-select').value;
    const docId = document.getElementById('fv-document-type').value;

    if (!clienteId) return showNotification('Seleccione un cliente', 'warning');
    if (!docId) return showNotification('Seleccione tipo de documento', 'warning');
    if (fv_cart.length === 0) return showNotification('Agregue items', 'warning');

    try {
        const token = localStorage.getItem('token');
        const body = {
            documento_id: docId,
            cliente_id: clienteId,
            subtotal: window.currentFVSubtotal,
            impuesto_total: window.currentFVIva,
            total: window.currentFVTotal,
            tipo_pago: document.getElementById('fv-tipo-pago').value,
            metodo_pago: document.getElementById('fv-metodo-pago').value,
            monto_pagado: window.currentFVTotal, // Assume full payment for now or adjust based on type
            devuelta: 0,
            items: fv_cart.map(i => ({
                id: i.id,
                cantidad: i.cantidad,
                precio: i.precio,
                impuesto_porcentaje: i.impuesto_porcentaje,
                subtotal: i.precio * i.cantidad
            }))
        };

        const resp = await fetch(API_BILLING, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification('Factura generada exitosamente: ' + data.numero, 'success');
            fv_cart = [];
            renderFVCart();
            window.open(`/frontend/modules/facturacion/print_factura.html?id=${data.factura_id}`, '_blank');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        showNotification('Error al generar factura', 'error');
    }
}
