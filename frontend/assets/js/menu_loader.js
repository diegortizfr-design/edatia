/**
 * ERPod Menu Loader
 * Centralizes the sidebar menu structure and rendering for the entire project.
 * Handles active state highlighting automatically based on URL.
 */

const menuConfig = [
    {
        label: "Inicio",
        icon: "fas fa-home",
        link: "dashboard.html",
        id: "nav-home"
    },
    {
        label: "Compras",
        icon: "fas fa-shopping-cart",
        link: "#",
        id: "nav-compras",
        submenu: [
            { label: "Tablero de Órdenes", link: "compras.html" },
            { label: "Proveedores", link: "compras.html" } // Update when proveedores.html exists
        ]
    },
    {
        label: "Inventario",
        icon: "fas fa-boxes",
        link: "#",
        id: "nav-inventario",
        submenu: [
            { label: "Monitor de Stock", link: "inventario.html" },
            { label: "Movimientos", link: "inventario.html" }
        ]
    },
    {
        label: "Facturación",
        icon: "fas fa-file-invoice-dollar",
        link: "#",
        id: "nav-facturacion",
        submenu: [
            { label: "Punto de Venta (POS)", link: "facturacion.html" },
            { label: "Historial Ventas", link: "facturacion.html" }
        ]
    },
    {
        label: "Configuración",
        icon: "fas fa-cog",
        link: "#",
        id: "nav-configuracion",
        submenu: [
            { label: "Empresa", link: "configuracion_empresa.html" },
            { label: "Sucursales", link: "configuracion_sucursales.html" },
            { label: "Terceros", link: "configuracion_terceros.html" },
            { label: "Documentos", link: "configuracion_documentos.html" },
            { label: "Usuarios y Roles", link: "configuracion_usuarios.html" },
            { label: "Impuestos", link: "configuracion_impuestos.html" },
            { label: "Formas de Pago", link: "configuracion_pagos.html" },
            { label: "Canal Online", link: "configuracion_ecommerce.html" }
        ]
    },
    {
        label: "Reportes",
        icon: "fas fa-chart-pie",
        link: "reportes.html",
        id: "nav-reportes"
    }
];

function renderMenu() {
    const navContainer = document.getElementById('menu-principal');
    if (!navContainer) {
        console.error('Menu container #menu-principal not found!');
        return;
    }

    // Clear existing content (fallback/hardcoded)
    navContainer.innerHTML = '';

    // Robust path extraction: Decode, take filename, remove query/hash, normalize to lowercase
    const rawPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const currentPath = decodeURIComponent(rawPath).split('?')[0].split('#')[0].toLowerCase();

    menuConfig.forEach(item => {
        // Is this item active? (Case-insensitive match)
        const isActive = item.link.toLowerCase() === currentPath;
        // Is any submenu item active?
        const hasActiveSub = item.submenu?.some(sub => sub.link.toLowerCase() === currentPath);

        // Element for Main Item
        if (item.submenu) {
            // Dropdown Menu Item
            const menuDiv = document.createElement('div');
            menuDiv.className = 'menu-item menu-dropdown';

            // Toggle Link
            const toggleLink = document.createElement('a');
            toggleLink.className = `dropdown-toggle ${hasActiveSub ? 'active' : ''}`;
            toggleLink.innerHTML = `<i class="${item.icon}"></i> <span>${item.label}</span>`;

            // Submenu Container
            const submenuDiv = document.createElement('div');
            submenuDiv.className = 'dropdown-menu';


            // Auto-expand if active (handled by CSS via parent .active class)
            if (hasActiveSub) {
                menuDiv.classList.add('active');
            }

            // Submenu Items
            item.submenu.forEach(sub => {
                const subLink = document.createElement('a');
                subLink.href = sub.link;
                subLink.textContent = sub.label;
                if (sub.link.toLowerCase() === currentPath) subLink.className = 'active';
                submenuDiv.appendChild(subLink);
            });

            // Click Event for Toggle
            toggleLink.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent navigation for toggle links

                // Close other open menus (optional, creates accordion effect)
                /* 
                const allMenus = navContainer.querySelectorAll('.menu-dropdown');
                allMenus.forEach(menu => {
                    if (menu !== menuDiv) menu.classList.remove('active');
                });
                */

                // Toggle current menu
                menuDiv.classList.toggle('active');
            });

            menuDiv.appendChild(toggleLink);
            menuDiv.appendChild(submenuDiv);
            navContainer.appendChild(menuDiv);

        } else {
            // Simple Link Item
            const link = document.createElement('a');
            link.href = item.link;
            link.className = isActive ? 'active' : '';
            link.innerHTML = `<i class="${item.icon}"></i> <span>${item.label}</span>`;
            navContainer.appendChild(link);
        }
    });
}

// Initialize Menu when DOM is ready
document.addEventListener('DOMContentLoaded', renderMenu);
