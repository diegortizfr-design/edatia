/**
 * ERPod Auth Guard
 * Protects pages from unauthorized access.
 * Checks for valid session in localStorage. 
 * Redirects to login (index.html) if no session found.
 */

(function checkSession() {
    // List of public pages that don't require login
    const publicPages = ['index.html', 'login.html', 'register.html', 'forgot-password.html', 'landing.html'];

    const path = window.location.pathname.split('/').pop().toLowerCase();

    // If we are on a public page, do nothing
    if (publicPages.includes(path) || path === '') return;

    // Check for session token (Adjust key 'user_session' as per actual login implementation)
    // For now, checks if the key exists.
    const session = localStorage.getItem('token');

    if (!session) {
        console.warn('Acceso denegado: No se encontró sesión activa.');
        // Save current URL to redirect back after login (optional future feature)
        // Redirect to Login (Absolute path to avoid relative path confusion)
        window.location.href = '/frontend/modules/auth/login.html';
    }
})();

/**
 * Helper function to handle Logout
 * Can be called by the sidebar logout button
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/frontend/modules/auth/login.html';
}

// Attach logout handler to buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('.btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});
