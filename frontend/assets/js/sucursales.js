document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal-nueva-sucursal');
    const btnNueva = document.getElementById('btn-nueva-sucursal');
    const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const form = document.getElementById('form-nueva-sucursal');
    const gridContainer = document.getElementById('grid-sucursales');

    let API_URL = "";

    // Cargar Configuración
    try {
        const configRes = await fetch("../../assets/config.json");
        const config = await configRes.json();
        API_URL = `${config.apiUrl}/sucursales`;

        cargarSucursales();
    } catch (error) {
        console.error("Error loading config:", error);
    }

    // Listar Sucursales
    async function cargarSucursales() {
        if (!gridContainer) return;

        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            gridContainer.innerHTML = "";

            if (data.success && data.data.length > 0) {
                data.data.forEach(s => {
                    const card = document.createElement('div');
                    card.className = "card";
                    card.style.padding = "25px";

                    const badgeClass = s.estado === 'Activa' ? 'active' : 'warning';

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                                <i class="fas fa-building" style="color: var(--primary-color);"></i> ${s.nombre}
                            </h3>
                            <span class="badge ${badgeClass}">${s.estado}</span>
                        </div>
                        <div style="color: var(--text-gray); font-size: 0.95rem;">
                            <p style="margin-bottom: 8px;"><i class="fas fa-map-marker-alt" style="width: 20px;"></i> ${s.direccion}</p>
                            <p style="margin-bottom: 20px;"><i class="fas fa-phone" style="width: 20px;"></i> ${s.telefono || 'Sin teléfono'}</p>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: auto;">
                            <button class="btn-edit btn-secondary" style="flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-secondary" style="flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                                <i class="fas fa-boxes"></i> Bodegas
                            </button>
                        </div>
                    `;

                    const btnEdit = card.querySelector('.btn-edit');
                    btnEdit.onclick = () => abrirModalEditar(s);

                    gridContainer.appendChild(card);
                });
            } else {
                gridContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6B7280;">
                        <p>No hay sucursales registradas.</p>
                    </div>`;
            }
        } catch (error) {
            console.error("Error al cargar sucursales:", error);
            gridContainer.innerHTML = `<p style="color: #EF4444; grid-column: 1/-1; text-align: center;">Error al cargar datos</p>`;
        }
    }

    // Modal Control
    btnNueva.onclick = () => {
        form.reset();
        document.getElementById('sucursal-id').value = "";
        modal.querySelector('h2').innerText = "Nueva Sucursal";
        modal.querySelector('button[type="submit"]').innerText = "Guardar Sucursal";
        modal.style.display = "flex";
    }

    function abrirModalEditar(sucursal) {
        document.getElementById('sucursal-id').value = sucursal.id;
        document.getElementById('nombre-sucursal').value = sucursal.nombre;
        document.getElementById('direccion-sucursal').value = sucursal.direccion;
        document.getElementById('telefono-sucursal').value = sucursal.telefono || '';
        document.getElementById('estado-sucursal').value = sucursal.estado;

        modal.querySelector('h2').innerText = "Editar Sucursal";
        modal.querySelector('button[type="submit"]').innerText = "Actualizar Sucursal";
        modal.style.display = "flex";
    }

    closeBtns.forEach(btn => {
        btn.onclick = () => modal.style.display = "none";
    });

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    // Save Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('sucursal-id').value;

        const data = {
            nombre: document.getElementById('nombre-sucursal').value,
            direccion: document.getElementById('direccion-sucursal').value,
            telefono: document.getElementById('telefono-sucursal').value,
            estado: document.getElementById('estado-sucursal').value
        };

        const method = id ? "PUT" : "POST";
        const url = id ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                showNotification(id ? "✅ Sucursal actualizada" : "✅ Sucursal creada", "success");
                modal.style.display = "none";
                cargarSucursales();
            } else {
                showNotification("⚠️ Error: " + result.message, "error");
            }
        } catch (error) {
            console.error(error);
            showNotification("❌ Error de comunicación", "error");
        }
    });
});
