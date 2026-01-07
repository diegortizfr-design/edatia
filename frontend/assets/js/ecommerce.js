/**
 * E-commerce Management Module
 * Handles the virtual store catalog, metadata editing, and JSON export.
 */

let allProducts = [];
let ecommerceProducts = [];
let API_URL = '';
let tableBody, modal, form, categoryFilter;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/productos`;
        UPLOAD_URL = `${config.apiUrl}/upload`;

        tableBody = document.getElementById('ecommerce-table-body');
        modal = document.getElementById('ecommerceModal');
        form = document.getElementById('ecommerceForm');
        categoryFilter = document.getElementById('category-filter');

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
            ecommerceProducts = allProducts.filter(p => p.mostrar_en_tienda);
            populateCategories(ecommerceProducts);
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
        const imageUrl = p.imagen_url || (p.ecommerce_imagenes ? p.ecommerce_imagenes.split(',')[0].trim() : '');
        const thumbContent = imageUrl
            ? `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`
            : `<i class="fas fa-box" style="color: #9CA3AF; font-size: 1.2rem;"></i>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 15px; padding: 10px 0;">
                    <div style="width: 60px; height: 60px; border-radius: 12px; background: #f3f4f6; border: 1px solid #e5e7eb; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${thumbContent}
                    </div>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <strong style="color: #1F2937; font-size: 1rem;">${p.nombre}</strong>
                        <span style="color: #6B7280; font-size: 0.85rem;">REF: ${p.referencia_fabrica || '-'}</span>
                    </div>
                </div>
            </td>
            <td><strong style="font-size: 1rem; color: #111827;">$${parseFloat(p.precio1).toLocaleString()}</strong></td>
            <td>
                <span style="background: rgba(16, 185, 129, 0.1); color: #059669; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                    <i class="fas fa-check-circle"></i> En Tienda
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon" onclick='openPreview(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Ver vista previa" style="background: rgba(59, 130, 246, 0.1); color: #2563EB;"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" onclick='openEcomModal(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar detalles web" style="background: rgba(79, 70, 229, 0.1); color: var(--primary-color);"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="removeFromStore(${p.id})" title="Quitar de la tienda" style="background: rgba(239, 68, 68, 0.1); color: #DC2626;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function populateCategories(products) {
    if (!categoryFilter) return;

    // Get unique categories
    const categories = [...new Set(products.map(p => p.categoria).filter(c => c))];

    // Reset but keep "All"
    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';

    categories.sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}

function filterByCategory() {
    const selected = categoryFilter.value;
    if (selected === 'all') {
        renderTable(ecommerceProducts);
    } else {
        const filtered = ecommerceProducts.filter(p => p.categoria === selected);
        renderTable(filtered);
    }
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

window.openPreview = (p) => {
    const modal = document.getElementById('previewModal');
    modal.style.display = 'flex';

    document.getElementById('preview-name').textContent = p.nombre;
    document.getElementById('preview-category').textContent = p.categoria || 'General';
    document.getElementById('preview-ref').textContent = `Ref: ${p.referencia_fabrica || '-'}`;
    document.getElementById('preview-price').textContent = `$${parseFloat(p.precio1).toLocaleString()}`;
    document.getElementById('preview-description').innerHTML = p.ecommerce_descripcion || p.descripcion || 'Sin descripción disponible.';

    const badge = document.getElementById('preview-stock-badge');
    const isOutOfStock = p.ecommerce_afecta_inventario && p.stock_actual <= 0;

    if (isOutOfStock) {
        badge.textContent = 'Agotado';
        badge.className = 'badge-stock badge-out-of-stock';
    } else {
        badge.textContent = 'Disponible';
        badge.className = 'badge-stock badge-in-stock';
    }

    // Images
    const mainImg = document.getElementById('preview-img-main');
    const thumbsTrack = document.getElementById('preview-thumbnails');

    const extraImages = (p.ecommerce_imagenes || '').split(',').map(s => s.trim()).filter(s => s);
    const allImgs = [];
    if (p.imagen_url) allImgs.push(p.imagen_url);
    allImgs.push(...extraImages);

    mainImg.style.backgroundImage = allImgs.length > 0 ? `url('${allImgs[0]}')` : 'none';

    thumbsTrack.innerHTML = '';
    allImgs.forEach((url, idx) => {
        const div = document.createElement('div');
        div.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
        div.style.backgroundImage = `url('${url}')`;
        div.onclick = () => {
            mainImg.style.backgroundImage = `url('${url}')`;
            document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
        };
        thumbsTrack.appendChild(div);
    });
};

window.closePreviewModal = () => {
    document.getElementById('previewModal').style.display = 'none';
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
