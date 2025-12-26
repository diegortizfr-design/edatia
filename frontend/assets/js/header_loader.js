/**
 * ERPod Header Loader
 * Centralizes the header structure (Title, Search, User Profile) for the entire project.
 */

const headerConfig = {
    'dashboard.html': {
        title: '',
        searchPlaceholder: 'Buscar módulos, facturas...'
    },
    'compras.html': {
        title: 'Gestión de Compras',
        icon: 'fas fa-shopping-cart',
        searchPlaceholder: 'Buscar orden #, proveedor...'
    },
    'inventario.html': {
        title: 'Gestión de Inventario',
        icon: 'fas fa-boxes',
        searchPlaceholder: 'Buscar producto, SKU...'
    },
    'facturacion.html': {
        title: 'Punto de Venta',
        icon: 'fas fa-cash-register',
        searchPlaceholder: 'Buscar producto (F3)...'
    },
    'reportes.html': {
        title: 'Reportes y Analíticas',
        icon: 'fas fa-chart-pie',
        searchPlaceholder: 'Buscar reporte...'
    },
    'configuracion_empresa.html': { title: 'Configuración de Empresa', icon: 'fas fa-building' },
    'configuracion_sucursales.html': { title: 'Configuración de Sucursales', icon: 'fas fa-store' },
    'configuracion_usuarios.html': { title: 'Usuarios y Roles', icon: 'fas fa-users-cog' },
    'configuracion_terceros.html': { title: 'Gestión de Terceros', icon: 'fas fa-users' },
    'configuracion_impuestos.html': { title: 'Configuración de Impuestos', icon: 'fas fa-percentage' },
    'configuracion_pagos.html': { title: 'Formas de Pago', icon: 'fas fa-credit-card' },
    'configuracion_ecommerce.html': { title: 'Canal Online', icon: 'fas fa-globe' },
    'configuracion_documentos.html': { title: 'Configuración de Documentos', icon: 'fas fa-file-invoice' }
};

function renderHeader() {
    const headerContainer = document.getElementById('main-header');
    if (!headerContainer) return;

    // Determine current page configuration
    const rawPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const currentPath = decodeURIComponent(rawPath).split('?')[0].split('#')[0].toLowerCase();
    const config = headerConfig[currentPath] || { title: 'ERPod', icon: 'fas fa-cube' };

    // Build HTML Components

    // 1. Title Section (Optional)
    const titleHtml = config.title ? `
        <div class="header-title">
            <h1><i class="${config.icon}" style="color: var(--primary-color);"></i> ${config.title}</h1>
        </div>
    ` : '';

    // 2. Search Bar (Hidden per user request - Phase 1)
    /*
    const searchHtml = `
        <div class="search-bar" style="${config.title ? '' : 'width: 300px;'}">
            <i class="fas fa-search" style="color: #9CA3AF"></i>
            <input type="text" placeholder="${config.searchPlaceholder || 'Buscar...'}">
        </div>
    `;
    */
    const searchHtml = ''; // Hidden for now

    // 3. User Info (Standardized)
    const userHtml = `
        <div class="user-info">
            <span class="user-name">Hola, <strong>Admin</strong></span>
            <img src="https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff" alt="Usuario"
                class="user-avatar" id="user-avatar">
        </div>
    `;

    // Combine
    headerContainer.innerHTML = `
        ${titleHtml}
        ${searchHtml}
        ${userHtml}
    `;
}

document.addEventListener('DOMContentLoaded', renderHeader);
