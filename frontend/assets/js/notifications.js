/**
 * ERPod Global Notifications
 * Provides a unified way to show toast messages.
 */

// Create Container on Load
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
});

const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
};

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <i class="toast-icon ${icons[type] || icons.info}"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger Animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 300); // Wait for slide out animation
    }, 4000); // Visible for 4s
}

// Expose to global scope
window.showToast = showToast;
