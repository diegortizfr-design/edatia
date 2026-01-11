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
                    card.style.cssText = `
                        padding: 30px; 
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                        border-radius: 20px; 
                        display: flex; 
                        flex-direction: column; 
                        position: relative; 
                        overflow: hidden;
                        border: 1px solid rgba(255, 255, 255, 0.5);
                    `;

                    // Simple hover effect via JS
                    card.onmouseenter = () => {
                        card.style.transform = "translateY(-5px)";
                        card.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                    };
                    card.onmouseleave = () => {
                        card.style.transform = "translateY(0)";
                        card.style.boxShadow = "none";
                    };

                    const badgeStyle = s.estado === 'Activa'
                        ? 'background: #ecfdf5; color: #059669; border: 1px solid #10b9813d;'
                        : 'background: #fff7ed; color: #d97706; border: 1px solid #f59e0b3d;';

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                            <div style="background: rgba(99, 102, 241, 0.1); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6366f1; font-size: 1.25rem;">
                                <i class="fas fa-building"></i>
                            </div>
                            <span style="padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; ${badgeStyle}">
                                ${s.estado}
                            </span>
                        </div>
                        <h3 style="margin: 0 0 10px 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">${s.nombre}</h3>
                        <div style="color: #64748b; font-size: 0.95rem; margin-bottom: 25px; flex-grow: 1;">
                            <p style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-map-marker-alt" style="color: #94a3b8; width: 16px;"></i> ${s.direccion}
                            </p>
                            <p style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-phone" style="color: #94a3b8; width: 16px;"></i> ${s.telefono || 'Sin teléfono'}
                            </p>
                        </div>
                        <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                            <button class="btn-edit" style="flex: 1; padding: 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">
                                <i class="fas fa-edit" style="color: #6366f1;"></i> Editar
                            </button>
                            <button style="flex: 1; padding: 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">
                                <i class="fas fa-boxes" style="color: #a855f7;"></i> Bodegas
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
