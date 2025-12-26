// frontend/global/login.js
const form = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI Elements
    const btnLogin = document.querySelector('.btn-login');
    const originalBtnText = btnLogin.textContent;

    // Reset message
    messageDiv.className = 'message';
    messageDiv.textContent = '';
    messageDiv.style.display = 'none';

    // Set Loading State
    btnLogin.disabled = true;
    btnLogin.textContent = 'Conectando...';
    btnLogin.style.opacity = '0.7';
    btnLogin.style.cursor = 'wait';

    // Show initial info message
    messageDiv.textContent = 'Procesando... (Si el servidor está en reposo, esto puede tardar hasta 1 minuto)';
    messageDiv.className = 'message'; // Ensure base class
    messageDiv.style.display = 'block';
    messageDiv.style.color = '#fff'; // White text for info

    const nit = document.getElementById('nit').value;
    const usuario = document.getElementById('usuario').value;
    const contraseña = document.getElementById('contraseña').value;

    try {
        // Cargar configuración - Relative path depends on HTML location
        // Assuming login.html is in modules/auth/ and config is in assets/
        const config = await fetch('../../assets/config.json').then(res => res.json());

        const response = await fetch(`${config.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nit, usuario, contraseña })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = '¡Login exitoso! Redirigiendo a ' + data.data.nombre_carpeta + '...';
            messageDiv.className = 'message success';
            // Do not re-enable button on success to prevent double submit during redirect

            // Guardar token y datos básicos
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data));

            // Redirección al Dashboard Unificado Global
            setTimeout(() => {
                window.location.href = `/frontend/modules/core/dashboard.html`;
            }, 1000);
        } else {
            throw new Error(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);

        // Revert Loading State
        btnLogin.disabled = false;
        btnLogin.textContent = originalBtnText;
        btnLogin.style.opacity = '1';
        btnLogin.style.cursor = 'pointer';

        messageDiv.textContent = error.message || 'Error de conexión con el servidor.';
        messageDiv.className = 'message error';
    }
});
