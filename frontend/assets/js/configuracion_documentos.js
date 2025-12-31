/**
 * ERPod - Document Configuration Module
 * Handles CRUD and UI logic for documents types.
 */

const API_URL = '/api/documentos';
const API_BRANCHES = '/api/sucursales';

let allDocuments = [];
let branches = [];
let isEditing = false;
let currentId = null;

// DOM Elements
const tableBody = document.getElementById('documentos-table-body');
const modal = document.getElementById('docModal');
const docForm = document.getElementById('docForm');
const categorySelect = document.getElementById('categoria');
const resolutionSection = document.getElementById('resolution-section');

document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    loadBranches();

    // Toggle resolution fields based on category
    categorySelect.addEventListener('change', (e) => {
        toggleResolution(e.target.value);
    });

    docForm.addEventListener('submit', handleSave);
});

async function loadDocuments() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            allDocuments = data.data;
            renderTable(allDocuments);
        }
    } catch (e) {
        console.error('Error loading documents:', e);
    }
}

async function loadBranches() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(API_BRANCHES, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            branches = data.data;
            const select = document.getElementById('sucursal_id');
            select.innerHTML = '';
            branches.forEach(b => {
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

function renderTable(docs) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    docs.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><i class="fas fa-file-alt" style="color: var(--primary-color)"></i></td>
            <td><strong>${d.categoria}</strong></td>
            <td>${d.prefijo ? d.prefijo + ' - ' : ''}${d.nombre}</td>
            <td>${d.consecutivo_actual}</td>
            <td>${d.nombre_sucursal || 'Principal'}</td>
            <td>${d.resolucion_numero || '-'}</td>
            <td><span class="badge ${d.estado ? 'active' : ''}">${d.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn-icon" onclick="openModal(${JSON.stringify(d).replace(/"/g, '&quot;')})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" style="color: #EF4444;" onclick="deleteDocument(${d.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function toggleResolution(cat) {
    // Show resolution fields only for Invoices
    if (cat === 'FV' || cat === 'POS') {
        resolutionSection.style.display = 'block';
    } else {
        resolutionSection.style.display = 'none';
    }
}

window.openModal = (doc = null) => {
    isEditing = !!doc;
    currentId = doc ? doc.id : null;
    modal.style.display = 'flex';
    docForm.reset();

    if (doc) {
        document.getElementById('doc_id').value = doc.id;
        document.getElementById('categoria').value = doc.categoria;
        document.getElementById('sucursal_id').value = doc.sucursal_id;
        document.getElementById('nombre').value = doc.nombre;
        document.getElementById('prefijo').value = doc.prefijo || '';
        document.getElementById('consecutivo_actual').value = doc.consecutivo_actual;

        // Resolution fields
        document.getElementById('resolucion_numero').value = doc.resolucion_numero || '';
        document.getElementById('resolucion_fecha_vencimiento').value = doc.resolucion_fecha_vencimiento ? doc.resolucion_fecha_vencimiento.split('T')[0] : '';
        document.getElementById('resolucion_rango_inicial').value = doc.resolucion_rango_inicial || '';
        document.getElementById('resolucion_rango_final').value = doc.resolucion_rango_final || '';
        document.getElementById('resolucion_texto').value = doc.resolucion_texto || '';

        // Advanced
        document.getElementById('documento_equivalente').value = doc.documento_equivalente || 'NO APLICA';
        document.getElementById('tipo_doc_electronico').value = doc.tipo_doc_electronico || 'NO APLICA';
        document.getElementById('excluir_impuestos').checked = !!doc.excluir_impuestos;

        toggleResolution(doc.categoria);
    } else {
        toggleResolution(categorySelect.value);
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const body = {
        categoria: document.getElementById('categoria').value,
        sucursal_id: document.getElementById('sucursal_id').value,
        nombre: document.getElementById('nombre').value,
        prefijo: document.getElementById('prefijo').value,
        consecutivo_actual: parseInt(document.getElementById('consecutivo_actual').value),

        resolucion_numero: document.getElementById('resolucion_numero').value,
        resolucion_fecha_vencimiento: document.getElementById('resolucion_fecha_vencimiento').value,
        resolucion_rango_inicial: document.getElementById('resolucion_rango_inicial').value,
        resolucion_rango_final: document.getElementById('resolucion_rango_final').value,
        resolucion_texto: document.getElementById('resolucion_texto').value,

        documento_equivalente: document.getElementById('documento_equivalente').value,
        tipo_doc_electronico: document.getElementById('tipo_doc_electronico').value,
        excluir_impuestos: document.getElementById('excluir_impuestos').checked,
        estado: 1
    };

    try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${currentId}` : API_URL;

        const resp = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (data.success) {
            showNotification(isEditing ? 'Documento actualizado' : 'Documento creado', 'success');
            closeModal();
            loadDocuments();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (e) {
        console.error('Error saving document:', e);
        showNotification('Error al guardar documento', 'error');
    }
}

async function deleteDocument(id) {
    if (!confirm('¿Está seguro de eliminar esta configuración de documento?')) return;

    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Documento eliminado', 'success');
            loadDocuments();
        }
    } catch (e) {
        console.error('Error deleting document:', e);
    }
}
