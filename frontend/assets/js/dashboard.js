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

    // Si el usuario no tiene módulos definidos, usar por defecto
    const modulos = userData.modulos || ["compras", "inventario", "facturacion", "reportes"];

    container.innerHTML = ""; // Limpiar

    modulos.forEach(mod => {
        // Normalizar nombre del módulo (minusculas)
        const modKey = mod.toLowerCase();
        const config = moduleConfig[modKey] || { icon: "cube", desc: "Gestión del módulo " + mod };

        // Crear Card
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <i class="fas fa-${config.icon}"></i>
            <h3>${mod.charAt(0).toUpperCase() + mod.slice(1)}</h3>
            <p>${config.desc}</p>
        `;
        // Click en card para navegar (futuro)
        card.addEventListener('click', () => {
            console.log(`Navegando a módulo ${mod}`);
            // window.location.href = `modules/${mod}/index.html`; 
        });

        container.appendChild(card);

        // Agregar al menú lateral también - DESHABILITADO POR DUPLICIDAD HTML
        // const link = document.createElement("a");
        // link.href = "#";
        // link.innerHTML = `<i class="fas fa-${config.icon}"></i> ${mod.charAt(0).toUpperCase() + mod.slice(1)}`;
        // menuContainer.appendChild(link);
    });

    // 4. Lógica de Logout
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
