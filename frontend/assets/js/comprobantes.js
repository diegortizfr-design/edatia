const BACKEND_URL = 'https://erpod.onrender.com';
let comprobantesData = [];
let pucCuentas = []; // Para el selector de cuentas
let editingComprobanteId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadPUC();
    await loadComprobantes();

    // Set today's date as default
    document.getElementById('comp-fecha').valueAsDate = new Date();

    // Filters
    document.getElementById('filter-tipo').addEventListener('change', loadComprobantes);
    document.getElementById('filter-estado').addEventListener('change', loadComprobantes);
    document.getElementById('filter-fecha-inicio').addEventListener('change', loadComprobantes);
    document.getElementById('filter-fecha-fin').addEventListener('change', loadComprobantes);

    // Modal
    const modal = document.getElementById('modal-comprobante');
    const btnNuevo = document.getElementById('btn-nuevo-comprobante');
    const closeBtns = document.querySelectorAll('.close-modal-btn');
    const form = document.getElementById('form-comprobante');

    btnNuevo.addEventListener('click', () => {
        openModal();
    });

    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) document.getElementById(target).style.display = 'none';
    }));

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    };

    document.getElementById('btn-agregar-movimiento').addEventListener('click', agregarMovimiento);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveComprobante();
    });
});

// Load PUC for account selector
async function loadPUC() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(BACKEND_URL + '/api/contabilidad/puc', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
            pucCuentas = json.data;
        }
    } catch (e) {
        console.error('Error loading PUC:', e);
    }
}

// Load comprobantes with filters
async function loadComprobantes() {
    const tbody = document.getElementById('comprobantes-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    try {
        const token = localStorage.getItem('token');

        // Build query params
        const params = new URLSearchParams();
        const tipo = document.getElementById('filter-tipo').value;
        const estado = document.getElementById('filter-estado').value;
        const fechaInicio = document.getElementById('filter-fecha-inicio').value;
        const fechaFin = document.getElementById('filter-fecha-fin').value;

        if (tipo) params.append('tipo', tipo);
        if (estado) params.append('estado', estado);
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);

        const res = await fetch(BACKEND_URL + '/api/contabilidad/comprobantes?' + params.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const json = await res.json();

        if (json.success) {
            comprobantesData = json.data;
            renderComprobantes(comprobantesData);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center">Error cargando datos.</td></tr>';
        }

    } catch (e) {
        console.error('Error loading comprobantes:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center">Error de conexión.</td></tr>';
    }
}

function renderComprobantes(data) {
    const tbody = document.getElementById('comprobantes-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="background: #eff6ff; display: inline-block; padding: 20px; border-radius: 50%; margin-bottom: 15px;">
                        <i class="fas fa-file-invoice" style="color: #3b82f6; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1e293b; margin-bottom: 5px;">No hay comprobantes</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">Crea tu primer comprobante contable.</p>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(comp => {
        const row = document.createElement('tr');

        const estadoBadge = comp.estado === 'Contabilizado' ? 'success' :
            comp.estado === 'Borrador' ? 'warning' : 'danger';

        const tipoBadge = comp.tipo === 'Ingreso' ? 'success' :
            comp.tipo === 'Egreso' ? 'danger' : 'info';

        row.innerHTML = `
            <td style="font-family: monospace; font-weight: 600;">${comp.numero}</td>
            <td><span class="badge ${tipoBadge}">${comp.tipo}</span></td>
            <td>${new Date(comp.fecha).toLocaleDateString('es-CO')}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${comp.descripcion || '-'}</td>
            <td style="font-weight: 600; color: var(--primary);">$${parseFloat(comp.total_debito || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge ${estadoBadge}">${comp.estado}</span></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    ${comp.estado === 'Borrador' ? `
                        <button class="btn-icon" title="Editar" onclick="editComprobante(${comp.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" title="Contabilizar" onclick="contabilizarComprobante(${comp.id})" style="color: #10b981;"><i class="fas fa-check-circle"></i></button>
                        <button class="btn-icon" title="Eliminar" onclick="deleteComprobante(${comp.id})" style="color: #ef4444;"><i class="fas fa-trash"></i></button>
                    ` : `
                        <button class="btn-icon" title="Ver" onclick="viewComprobante(${comp.id})"><i class="fas fa-eye"></i></button>
                    `}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openModal(comprobante = null) {
    editingComprobanteId = comprobante ? comprobante.id : null;

    document.getElementById('modal-title').textContent = comprobante ? 'Editar Comprobante' : 'Nuevo Comprobante';
    document.getElementById('form-comprobante').reset();
    document.getElementById('movimientos-tbody').innerHTML = '';

    if (comprobante) {
        document.getElementById('comp-numero').value = comprobante.numero;
        document.getElementById('comp-numero').disabled = true;
        document.getElementById('comp-tipo').value = comprobante.tipo;
        document.getElementById('comp-fecha').value = comprobante.fecha;
        document.getElementById('comp-descripcion').value = comprobante.descripcion || '';

        // Load movimientos
        if (comprobante.movimientos) {
            comprobante.movimientos.forEach(mov => {
                agregarMovimiento(mov);
            });
        }
    } else {
        document.getElementById('comp-numero').disabled = false;
        document.getElementById('comp-fecha').valueAsDate = new Date();
        // Add one empty row
        agregarMovimiento();
    }

    document.getElementById('modal-comprobante').style.display = 'flex';
}

function agregarMovimiento(data = null) {
    const tbody = document.getElementById('movimientos-tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>
            <select class="form-control cuenta-select" required style="font-size: 0.85rem;">
                <option value="">Seleccionar cuenta...</option>
                ${pucCuentas.map(c => `<option value="${c.codigo}">${c.codigo} - ${c.nombre}</option>`).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="form-control mov-descripcion" placeholder="Descripción" style="font-size: 0.85rem;">
        </td>
        <td>
            <input type="number" class="form-control mov-debito" placeholder="0.00" step="0.01" min="0" value="0" style="font-size: 0.85rem;">
        </td>
        <td>
            <input type="number" class="form-control mov-credito" placeholder="0.00" step="0.01" min="0" value="0" style="font-size: 0.85rem;">
        </td>
        <td>
            <button type="button" class="btn-icon" onclick="eliminarMovimiento(this)" style="color: #ef4444;">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    // Set data if provided
    if (data) {
        row.querySelector('.cuenta-select').value = data.cuenta_codigo;
        row.querySelector('.mov-descripcion').value = data.descripcion || '';
        row.querySelector('.mov-debito').value = parseFloat(data.debito || 0);
        row.querySelector('.mov-credito').value = parseFloat(data.credito || 0);
    }

    // Add listeners for balance calculation
    row.querySelector('.mov-debito').addEventListener('input', calcularBalance);
    row.querySelector('.mov-credito').addEventListener('input', calcularBalance);

    calcularBalance();
}

function eliminarMovimiento(btn) {
    btn.closest('tr').remove();
    calcularBalance();
}

function calcularBalance() {
    const rows = document.querySelectorAll('#movimientos-tbody tr');
    let totalDebito = 0;
    let totalCredito = 0;

    rows.forEach(row => {
        const debito = parseFloat(row.querySelector('.mov-debito').value || 0);
        const credito = parseFloat(row.querySelector('.mov-credito').value || 0);
        totalDebito += debito;
        totalCredito += credito;
    });

    document.getElementById('total-debito').textContent = '$' + totalDebito.toLocaleString('es-CO', { minimumFractionDigits: 2 });
    document.getElementById('total-credito').textContent = '$' + totalCredito.toLocaleString('es-CO', { minimumFractionDigits: 2 });

    // Check balance
    const balanced = Math.abs(totalDebito - totalCredito) < 0.01;
    const balanceRow = document.getElementById('balance-row');
    balanceRow.style.display = balanced ? 'none' : 'table-row';

    return balanced;
}

async function saveComprobante() {
    const numero = document.getElementById('comp-numero').value.trim();
    const tipo = document.getElementById('comp-tipo').value;
    const fecha = document.getElementById('comp-fecha').value;
    const descripcion = document.getElementById('comp-descripcion').value.trim();

    // Get movimientos
    const rows = document.querySelectorAll('#movimientos-tbody tr');
    const movimientos = [];

    for (const row of rows) {
        const cuenta_codigo = row.querySelector('.cuenta-select').value;
        const desc = row.querySelector('.mov-descripcion').value;
        const debito = parseFloat(row.querySelector('.mov-debito').value || 0);
        const credito = parseFloat(row.querySelector('.mov-credito').value || 0);

        if (!cuenta_codigo) {
            alert('Todas las filas deben tener una cuenta seleccionada');
            return;
        }

        if (debito === 0 && credito === 0) continue; // Skip empty rows

        movimientos.push({
            cuenta_codigo,
            descripcion: desc,
            debito,
            credito
        });
    }

    if (movimientos.length === 0) {
        alert('Debe agregar al menos un movimiento');
        return;
    }

    if (!calcularBalance()) {
        alert('El comprobante no está balanceado. Débitos deben ser igual a Créditos.');
        return;
    }

    const payload = {
        numero,
        tipo,
        fecha,
        descripcion,
        movimientos
    };

    try {
        const token = localStorage.getItem('token');
        const url = editingComprobanteId
            ? `${BACKEND_URL}/api/contabilidad/comprobantes/${editingComprobanteId}`
            : `${BACKEND_URL}/api/contabilidad/comprobantes`;

        const method = editingComprobanteId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'Error al guardar el comprobante');
            return;
        }

        document.getElementById('modal-comprobante').style.display = 'none';
        if (window.showNotification) showNotification('Comprobante guardado exitosamente', 'success');
        await loadComprobantes();

    } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor');
    }
}

async function editComprobante(id) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/contabilidad/comprobantes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const json = await res.json();

        if (json.success) {
            openModal(json.data);
        }
    } catch (e) {
        console.error(e);
        alert('Error al cargar el comprobante');
    }
}

async function viewComprobante(id) {
    // For now, just edit in read-only mode
    await editComprobante(id);
    // Disable all inputs
    document.querySelectorAll('#form-comprobante input, #form-comprobante select, #form-comprobante button[type="button"]').forEach(el => {
        el.disabled = true;
    });
    document.getElementById('btn-guardar-comprobante').style.display = 'none';
}

async function deleteComprobante(id) {
    if (!confirm('¿Está seguro de eliminar este comprobante?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/contabilidad/comprobantes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success) {
            if (window.showNotification) showNotification('Comprobante eliminado', 'success');
            await loadComprobantes();
        } else {
            alert(data.message || 'Error al eliminar');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function contabilizarComprobante(id) {
    if (!confirm('¿Desea contabilizar este comprobante? Esta acción no se puede deshacer.')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/contabilidad/comprobantes/${id}/contabilizar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success) {
            if (window.showNotification) showNotification('Comprobante contabilizado exitosamente', 'success');
            await loadComprobantes();
        } else {
            alert(data.message || 'Error al contabilizar');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}
