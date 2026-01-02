/**
 * Component Loader
 * Loads shared HTML components (Sidebar, Header) into the current page.
 * Handles active menu highlighting and logout functionality.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Determine base path for assets (handling different depths)
    // Simple heuristic: check if we are in a module subfolder or root
    const pathDepth = window.location.pathname.split('/').length - 2; // -1 for empty start, -1 for filename
    let relativePrefix = '../';
    if (window.location.pathname.includes('/modules/')) {
        relativePrefix = '../../';
    }
    // If in root of modules (not nested), depth might differ. 
    // For simplicity in this structure: frontend/modules/category/file.html -> depth 3 from root.
    // assets are in frontend/assets. 
    // So from frontend/modules/core/dashboard.html -> ../../assets

    // Better approach: Absolute paths from web root if server is set up correctly.
    // Assuming server.js serves 'frontend' at root or specific mounts.
    // Based on server.js: app.use('/frontend', express.static(...));
    // So URLs should be /frontend/modules/...

    // Let's assume we serve everything under / 
    // But wait, server.js says: app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
    // Typically users open files directly or via localhost:4000/frontend/...

    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer = document.getElementById('header-container');

    if (sidebarContainer) {
        try {
            const resp = await fetch('/frontend/shared/sidebar.html');
            if (resp.ok) {
                const html = await resp.text();
                sidebarContainer.innerHTML = html;
                initSidebar();
            } else {
                console.error('Failed to load sidebar', resp.status);
            }
        } catch (e) {
            console.error('Error loading sidebar:', e);
        }
    }

    if (headerContainer) {
        try {
            const resp = await fetch('/frontend/shared/header.html');
            if (resp.ok) {
                const html = await resp.text();
                headerContainer.innerHTML = html;
                // Init header logic if any (user name, etc)
            }
        } catch (e) {
            console.error('Error loading header:', e);
        }
    }
});

function initSidebar() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.menu a');

    // Remove any pre-existing active classes (just in case)
    links.forEach(l => l.classList.remove('active'));

    links.forEach(link => {
        const href = link.getAttribute('href');

        // Exact match or includes for nested routes if necessary
        // Using endsWith or exact match to avoid "Home" being active on all sub-pages if it was just "/"
        if (href && (currentPath === href || currentPath.endsWith(href))) {
            link.classList.add('active');

            // Open parent dropdown if this link is inside one
            const menuDropdown = link.closest('.menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.add('active');
                // Also highlight the toggle of the dropdown to show where we are
                const toggle = menuDropdown.querySelector('.dropdown-toggle');
                if (toggle) toggle.classList.add('active');
            }
        }

        // Dropdown toggle logic
        if (link.classList.contains('dropdown-toggle')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Find the parent container
                const menuDropdown = link.closest('.menu-dropdown');
                if (menuDropdown) {
                    menuDropdown.classList.toggle('active');
                }
            });
        }
    });

    // Logout logic
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/frontend/modules/auth/login.html';
        });
    }
}
