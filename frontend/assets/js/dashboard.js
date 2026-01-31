document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificación de Seguridad
    const token = localStorage.getItem("token");
    // El objeto 'user' viene del login y debe contener la info de la empresa
    // Estructura esperada: { id, nombre, email, ... data_empresa: { nombre, logo, modulos, carpeta } }
    // OJO: En el login guardaste: localStorage.setItem('user', JSON.stringify(data.data));
    const userData = JSON.parse(localStorage.getItem("user"));

    // Si no hay token o datos de usuario, mandar al login
    if (!token || !userData) {
        window.location.href = "login.html";
        return;
    }

    // 2. Personalizar Interfaz
    const userNameEl = document.getElementById("user-name");
    const empresaNombreEl = document.getElementById("empresa-nombre");
    const logoImgEl = document.getElementById("logo-img");
    const userAvatarEl = document.getElementById("user-avatar");

    if (userNameEl) userNameEl.textContent = userData.usuario || "Admin"; // Ajustar según tu objeto usuario
    if (empresaNombreEl) empresaNombreEl.textContent = userData.nombre_empresa || "ERPod Empresas";

    // Logo: Si no hay logo específico, usar uno por defecto basado en la carpeta
    // La ruta relativa depende de dónde esté este archivo. Si está en frontend/global/
    // y los logos en clientes/X/assets/logo.png:
    // Ruta: ../../clientes/${userData.nombre_carpeta}/assets/logo.png
    if (logoImgEl) {
        if (userData.nombre_carpeta) {
            logoImgEl.src = `../../clientes/${userData.nombre_carpeta}/logo.png`;
            // Fallback si falla la carga
            logoImgEl.onerror = () => { logoImgEl.style.display = 'none'; };
        } else {
            logoImgEl.style.display = 'none';
        }
    }

    // Avatar
    if (userAvatarEl) {
        userAvatarEl.src = `https://ui-avatars.com/api/?name=${userData.usuario || 'User'}&background=random`;
    }

    // 3. Renderizar Módulos (Cards)
    const container = document.getElementById("cards-container");
    const menuContainer = document.getElementById("menu-principal");

    // Definición de iconos y descripciones para los módulos
    const moduleConfig = {
        "compras": { icon: "shopping-cart", desc: "Gestiona tus órdenes de compra y proveedores." },
        "inventario": { icon: "boxes", desc: "Controla tus existencias, entradas y salidas." },
        "facturacion": { icon: "file-invoice-dollar", desc: "Emite y controla facturas electrónicas fácilmente." },
        "reportes": { icon: "chart-line", desc: "Visualiza tus estadísticas financieras en tiempo real." },
        "configuracion": { icon: "cog", desc: "Ajustes generales del sistema." },
        "tienda": { icon: "store", desc: "Gestiona tu tienda virtual." }
    };

    document.querySelectorAll(".menu-dropdown .dropdown-toggle").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const parent = toggle.parentElement;
            parent.classList.toggle("active");
        });
    });

    // 3. Renderizar Módulos Dinámicos (Solo si existen y no son los filtrados)
    // El 'container' ya fue declarado en la línea 44

    // Filtramos los módulos que el usuario pidió quitar
    const modulosFiltrados = (userData.modulos || ["reportes"]).filter(m => !["compras", "inventario", "facturacion", "reportes"].includes(m.toLowerCase()));

    // Solo limpiamos si vamos a renderizar módulos dinámicos adicionales, 
    // pero manteniendo los widgets estáticos que ya están en el HTML.
    if (modulosFiltrados.length > 0) {
        modulosFiltrados.forEach(mod => {
            const modKey = mod.toLowerCase();
            const config = moduleConfig[modKey] || { icon: "cube", desc: "Gestión del módulo " + mod };
            const card = document.createElement("div");
            card.className = "card widget-card"; // Usar la misma clase para consistencia
            card.innerHTML = `
                <div class="card-icon-box"><i class="fas fa-${config.icon}"></i></div>
                <div class="widget-content">
                    <h3>${mod.charAt(0).toUpperCase() + mod.slice(1)}</h3>
                    <p class="sub-text">${config.desc}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 4. Cargar Datos de los Widgets
    await cargarWidgets();

    // 5. Lógica de Logout
    const logoutBtn = document.querySelector(".btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("¿Deseas cerrar sesión?")) {
                localStorage.clear();
                window.location.href = "login.html";
            }
        });
    }
});

async function cargarWidgets() {
    try {
        const token = localStorage.getItem("token");

        // A. Cierre del Día Anterior
        fetch('/api/facturacion/facturas', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const ayer = new Date();
                    ayer.setDate(ayer.getDate() - 1);
                    const ayerStr = ayer.toISOString().split('T')[0];

                    const ventasAyer = data.data.filter(f => f.fecha_emision.startsWith(ayerStr));
                    const totalAyer = ventasAyer.reduce((sum, f) => sum + parseFloat(f.total), 0);

                    document.getElementById('val-cierre').textContent = totalAyer > 0
                        ? `$${totalAyer.toLocaleString('es-CO')} COP`
                        : '$0.00 COP';
                    document.getElementById('date-cierre').textContent = `Jornada del ${ayer.toLocaleDateString()}`;
                }
            }).catch(err => {
                document.getElementById('val-cierre').textContent = '$0.00 COP';
                console.error("Error cierre:", err);
            });

        // B. Compromisos Hoy (camIA)
        fetch('/api/camia/resumen', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const agendaVal = document.getElementById('val-agenda');
                const agendaStat = document.getElementById('status-agenda');

                if (data.success && data.resumen) {
                    const totalE = data.resumen.eventos.reduce((acc, curr) => acc + curr.total, 0);
                    if (totalE > 0) {
                        agendaVal.textContent = `${totalE} Compromisos`;
                        agendaStat.textContent = 'Agenda activa para hoy';
                        agendaVal.style.color = '#3b82f6';
                    } else {
                        agendaVal.textContent = 'Sin compromisos';
                        agendaStat.textContent = 'Día despejado';
                    }
                }
            }).catch(err => console.error("Error agenda:", err));

    } catch (error) {
        console.error("Error cargando widgets:", error);
    }
}
