/**
 * E-commerce Management Module
 * Handles the virtual store catalog, metadata editing, and JSON export.
 */

let allProducts = [];
let API_URL = '';
let tableBody, modal, form;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/productos`;
        UPLOAD_URL = `${config.apiUrl}/upload`;

        tableBody = document.getElementById('ecommerce-table-body');
        modal = document.getElementById('ecommerceModal');
        form = document.getElementById('ecommerceForm');

        if (form) {
            form.addEventListener('submit', handleSaveEcom);
        }

        loadEcommerceProducts();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadEcommerceProducts() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            allProducts = data.data;
            // Only show products flagged for e-commerce
            const ecommerceProducts = allProducts.filter(p => p.mostrar_en_tienda);
            renderTable(ecommerceProducts);
        }
    } catch (e) {
        console.error('Error loading products:', e);
        if (typeof showNotification === 'function') {
            showNotification('Error al cargar catálogo', 'error');
        }
    }
}

function renderTable(products) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--text-gray);">No hay productos marcados para E-commerce. Actívalos en la configuración de productos.</td></tr>`;
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #eee; background-image: url('${p.imagen_url || ''}'); background-size: cover; background-position: center;"></div>
                    <div>
                        <strong>${p.nombre}</strong><br>
                        <small style="color: #6B7280;">REF: ${p.referencia_fabrica || '-'}</small>
                    </div>
                </div>
            </td>
            <td><strong>$${parseFloat(p.precio1).toLocaleString()}</strong></td>
            <td>
                <span style="color: #10B981; font-weight: 600;"><i class="fas fa-check-circle"></i> En Tienda</span>
            </td>
            <td>
                <button class="btn-icon" onclick='openEcomModal(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar detalles web"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="removeFromStore(${p.id})" title="Quitar de la tienda" style="color: #EF4444;"><i class="fas fa-unlink"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.openEcomModal = (p) => {
    modal.style.display = 'flex';
    form.reset();

    document.getElementById('ecom_prod_id').value = p.id;
    document.getElementById('ecom_nombre').value = p.nombre;
    document.getElementById('ecom_descripcion').value = p.ecommerce_descripcion || '';
    document.getElementById('ecom_imagenes').value = p.ecommerce_imagenes || '';
    document.getElementById('ecom_afecta_inventario').checked = !!p.ecommerce_afecta_inventario;
};

window.closeEcomModal = () => {
    modal.style.display = 'none';
};

async function handleSaveEcom(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const id = document.getElementById('ecom_prod_id').value;

    // We update the same product, but only these e-commerce specific fields
    // First, find the full product to not lose other data
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    const formData = {
        ...product,
        nombre: document.getElementById('ecom_nombre').value,
        ecommerce_descripcion: document.getElementById('ecom_descripcion').value,
        ecommerce_imagenes: document.getElementById('ecom_imagenes').value,
        ecommerce_afecta_inventario: document.getElementById('ecom_afecta_inventario').checked ? 1 : 0
    };

    try {
        const resp = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification('Detalles actualizados', 'success');
            closeEcomModal();
            loadEcommerceProducts();
        }
    } catch (e) {
        console.error('Save error:', e);
        showNotification('Error al guardar detalles', 'error');
    }
}

async function removeFromStore(id) {
    if (!confirm('¿Desea quitar este producto de la tienda virtual?')) return;

    const token = localStorage.getItem('token');
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    const formData = {
        ...product,
        mostrar_en_tienda: 0
    };

    try {
        const resp = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification('Producto removido del catálogo', 'success');
            loadEcommerceProducts();
        }
    } catch (e) {
        console.error('Remove error:', e);
    }
}

window.exportCatalog = () => {
    const ecommerceProducts = allProducts.filter(p => p.mostrar_en_tienda);

    const catalogData = ecommerceProducts.map(p => ({
        id: p.id,
        nombre: p.nombre,
        referencia: p.referencia_fabrica,
        precio: p.precio1,
        descripcion: p.ecommerce_descripcion || p.descripcion,
        imagen_principal: p.imagen_url,
        imagenes: (p.ecommerce_imagenes || '').split(',').map(s => s.trim()).filter(s => s),
        categoria: p.categoria,
        stock_disponible: p.stock_actual,
        afecta_inventario: !!p.ecommerce_afecta_inventario,
        agotado: !!p.ecommerce_afecta_inventario && p.stock_actual <= 0
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catalogData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "catalog.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showNotification('Catálogo exportado exitosamente', 'success');
};

async function uploadEcomImage(input) {
    const file = input.files[0];
    if (!file) return;

    const btn = input.previousElementSibling;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await resp.json();

        if (data.success) {
            const textarea = document.getElementById('ecom_imagenes');
            const current = textarea.value.trim();
            textarea.value = current ? `${current}, ${data.url}` : data.url;
            showNotification('Imagen subida y añadida a la galería', 'success');
        } else {
            showNotification(data.message || 'Error al subir imagen', 'error');
        }
    } catch (e) {
        console.error('Upload error:', e);
        showNotification('Error de conexión al subir imagen', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        input.value = '';
    }
}
