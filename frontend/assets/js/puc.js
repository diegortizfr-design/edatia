const BACKEND_URL = 'https://erpod.onrender.com';
let pucData = [];


document.addEventListener('DOMContentLoaded', async () => {
    await loadPUC();

    // Listeners
    document.getElementById('search-puc').addEventListener('keyup', (e) => filterPUC(e.target.value));
    document.getElementById('btn-import-puc').addEventListener('click', importTemplate);

    // Modal Logic
    const modal = document.getElementById('modal-nueva-cuenta');
    const form = document.getElementById('form-nueva-cuenta');
    const btnNew = document.getElementById('btn-nueva-cuenta');
    const closeBtns = document.querySelectorAll('.close-modal-btn');
    const selectPadre = document.getElementById('new-padre');
    const prefixSpan = document.getElementById('prefix-code');
    const labelNivel = document.getElementById('new-nivel-label');

    if (btnNew) btnNew.addEventListener('click', () => {
        form.reset();
        populateParentSelect();
        updateFormState(); // Set initial state (Clase)
        modal.style.display = 'flex';
    });

    selectPadre?.addEventListener('change', updateFormState);

    function populateParentSelect() {
        if (!selectPadre) return;
        selectPadre.innerHTML = '<option value="">-- Ninguna (Crear Clase) --</option>';
        // Sort by code for better tree understanding
        const sorted = [...pucData].sort((a, b) => a.codigo.localeCompare(b.codigo));
        sorted.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.codigo;
            // Indent for readability
            const indent = '\u00A0'.repeat((c.nivel - 1) * 3); // using nbsp unicode
            opt.textContent = `${c.codigo} - ${c.nombre}`; // textContent treats unicode correctly
            // Visual hierarchy trick
            if (c.nivel > 4) opt.style.color = '#888';
            selectPadre.appendChild(opt);
        });
    }

    function updateFormState() {
        if (!selectPadre) return;
        const parentCode = selectPadre.value;

        if (!parentCode) {
            // Root Level (Clase)
            prefixSpan.textContent = '';
            prefixSpan.style.display = 'none';
            document.getElementById('new-codigo-suffix').placeholder = '1 (Un dígito)';
            labelNivel.value = 'Clase (Nivel 1)';
            document.getElementById('new-tipo').value = 'Clase';
            document.getElementById('new-nivel').value = 1;
        } else {
            // Child Level
            const parent = pucData.find(c => c.codigo === parentCode);
            if (parent) {
                prefixSpan.textContent = parentCode;
                prefixSpan.style.display = 'flex'; // Changed to flex to align
                document.getElementById('new-codigo-suffix').placeholder = 'Completar dígitos';

                // Determine next level
                let nextLevel = parent.nivel + 1;
                let nextType = '';

                if (nextLevel === 2) nextType = 'Grupo';
                else if (nextLevel === 3) nextType = 'Cuenta';
                else if (nextLevel === 4) nextType = 'Subcuenta';
                else nextType = 'Auxiliar';

                labelNivel.value = `${nextType} (Nivel ${nextLevel})`;
                document.getElementById('new-tipo').value = nextType;
                document.getElementById('new-nivel').value = nextLevel;

                // Inherit Nature
                document.getElementById('new-naturaleza').value = parent.naturaleza;
            }
        }
    }

    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) document.getElementById(target).style.display = 'none';
        else modal.style.display = 'none';
    }));

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAccount();
    });
});

async function saveAccount() {
    const parentCode = document.getElementById('new-padre').value;
    const suffix = document.getElementById('new-codigo-suffix').value.trim();
    const codigo = parentCode + suffix;

    const nombre = document.getElementById('new-nombre').value.trim().toUpperCase();
    const tipo = document.getElementById('new-tipo').value;
    const nivel = parseInt(document.getElementById('new-nivel').value);
    const naturaleza = document.getElementById('new-naturaleza').value;

    // Config Flags
    const reqTercero = document.getElementById('check-tercero').checked;
    const reqCostos = document.getElementById('check-costos').checked;
    const reqBase = document.getElementById('check-base').checked;

    // Validation
    if (!suffix || !nombre) return alert('Código y Nombre son obligatorios');

    // Strict Length Validation (Colombian PUC Standard)
    if (tipo === 'Clase' && codigo.length !== 1) return alert('La Clase debe tener 1 dígito');
    if (tipo === 'Grupo' && codigo.length !== 2) return alert('El Grupo debe tener 2 dígitos (Ej: 11)');
    if (tipo === 'Cuenta' && codigo.length !== 4) return alert('La Cuenta debe tener 4 dígitos (Ej: 1105)');

    const newAccount = {
        codigo,
        nombre,
        naturaleza,
        nivel,
        tipo,
        requiere_tercero: reqTercero,
        requiere_costos: reqCostos,
        requiere_base: reqBase,
        estado: 'Activa'
    };

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/contabilidad/puc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newAccount)
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'Error al guardar la cuenta');
            return;
        }

        // Reload
        await loadPUC();
        document.getElementById('modal-nueva-cuenta').style.display = 'none';
        if (window.showNotification) showNotification('Cuenta creada exitosamente', 'success');

    } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor');
    }
}

async function loadPUC() {
    const tbody = document.getElementById('puc-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/contabilidad/puc', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const json = await res.json();

        if (json.success) {
            pucData = json.data;
            renderPUC(pucData);
            updateKPIs();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center">Error cargando datos.</td></tr>';
        }

    } catch (e) {
        console.error('Error loading PUC:', e);
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center">Error de conexión.</td></tr>';
    }
}

function renderPUC(data) {
    const tbody = document.getElementById('puc-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="background: #eff6ff; display: inline-block; padding: 20px; border-radius: 50%; margin-bottom: 15px;">
                        <i class="fas fa-book" style="color: #3b82f6; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1e293b; margin-bottom: 5px;">Plan de Cuentas Vacío</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">No hay cuentas registradas actualmente.</p>
                    <button class="btn-primary" onclick="importTemplate()">
                        <i class="fas fa-file-import"></i> Cargar Plantilla Predeterminada
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    // Sort by code
    data.sort((a, b) => a.codigo.localeCompare(b.codigo));

    data.forEach(cuenta => {
        const row = document.createElement('tr');

        // Indentation based on level
        const paddingLeft = (cuenta.nivel - 1) * 20;
        const isBold = cuenta.nivel <= 2;

        row.innerHTML = `
            <td style="font-family: monospace; font-weight: ${isBold ? 700 : 400};">${cuenta.codigo}</td>
            <td style="padding-left: ${paddingLeft + 10}px; font-weight: ${isBold ? 600 : 400};">
                ${cuenta.nivel > 1 ? '<i class="fas fa-turn-up fa-rotate-90" style="margin-right:8px; color:#cbd5e1; font-size:0.8rem"></i>' : ''}
                ${cuenta.nombre}
            </td>
            <td><span class="badge ${cuenta.naturaleza === 'Debito' ? 'success' : 'warning'}">${cuenta.naturaleza}</span></td>
            <td>Nivel ${cuenta.nivel}</td>
            <td><span class="badge success">Activa</span></td>
            <td>
                <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterPUC(query) {
    if (!query) {
        renderPUC(pucData);
        return;
    }
    const lower = query.toLowerCase();
    const filtered = pucData.filter(c =>
        c.codigo.toLowerCase().includes(lower) ||
        c.nombre.toLowerCase().includes(lower)
    );
    renderPUC(filtered);
}

async function importTemplate() {
    if (!confirm('¿Desea cargar la plantilla predeterminada? Esto sobrescribirá los cambios no guardados si no usa base de datos real.')) return;

    try {
        const res = await fetch('/frontend/assets/data/puc_template.json');
        const data = await res.json();
        pucData = data;
        localStorage.setItem('erpod_puc', JSON.stringify(data)); // Simple persistence for demo
        renderPUC(pucData);
        updateKPIs();
        if (window.showNotification) showNotification('Plantilla cargada correctamente', 'success');
    } catch (e) {
        console.error(e);
        alert('Error cargando plantilla');
    }
}

function updateKPIs() {
    // Simple mock calculation logic could go here
    document.getElementById('kpi-total-activos').textContent = '$0.00';
}
