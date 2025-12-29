document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal-nueva-sucursal');
    const btnNueva = document.getElementById('btn-nueva-sucursal');
    const spanClose = document.querySelector('.close-modal');
    const form = document.getElementById('form-nueva-sucursal');
    const gridContainer = document.getElementById('grid-sucursales'); // Ensure this ID matches HTML

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
        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            // Check if gridContainer exists before setting innerHTML
            if (gridContainer) {
                gridContainer.innerHTML = ""; // Limpiar

                if (data.success && data.data.length > 0) {
                    data.data.forEach(s => {
                        const card = document.createElement('div');
                        card.className = "branch-card";
                        card.style.cssText = "background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; position: relative;";

                        const badgeColor = s.estado === 'Activa' ? 'background: #D1FAE5; color: #059669;' : 'background: #F3F4F6; color: #6B7280;';

                        card.innerHTML = `
                            <div class="branch-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-building" style="color: #4F46E5;"></i> ${s.nombre}
                                </h3>
                                <span class="badge" style="${badgeColor} padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${s.estado}</span>
                            </div>
                            <p style="color: #6B7280; font-size: 0.9rem; margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> ${s.direccion}</p>
                            <p style="color: #6B7280; font-size: 0.9rem; margin-bottom: 15px;"><i class="fas fa-phone"></i> ${s.telefono || 'Sin teléfono'}</p>
                            <div style="display: flex; gap: 10px; margin-top: 15px;">
                                <button style="flex: 1; padding: 8px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer;">Editar</button>
                                <button style="flex: 1; padding: 8px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer;">Bodegas</button>
                            </div>
                        `;
                        gridContainer.appendChild(card);
                    });
                } else {
                    gridContainer.innerHTML = "<p>No hay sucursales registradas.</p>";
                }
            }
        } catch (error) {
            console.error("Error al cargar sucursales:", error);
        }
    }

    // Abrir Modal
    btnNueva.onclick = () => {
        modal.style.display = "block";
    }

    // Cerrar Modal
    spanClose.onclick = () => {
        modal.style.display = "none";
    }

    // Cerrar al dar click fuera
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                alert("✅ Sucursal creada correctamente.");
                modal.style.display = "none";
                form.reset();
                cargarSucursales(); // Recargar lista
            } else {
                alert("⚠️ Error: " + result.message);
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error de conexión al guardar.");
        }
    });
});
