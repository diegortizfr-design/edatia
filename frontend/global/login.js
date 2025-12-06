// frontend/global/login.js
const form = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.className = 'message';
    messageDiv.textContent = ''; // Limpiar mensaje anterior

    const nit = document.getElementById('nit').value;
    const usuario = document.getElementById('usuario').value;
    const contraseña = document.getElementById('contraseña').value;

    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nit, usuario, contraseña })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = 'Login exitoso! Redirigiendo a ' + data.data.nombre_carpeta + '...';
            messageDiv.classList.add('success');

            // Guardar token y datos básicos
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data));

            // Redirección dinámica basada en la carpeta de la empresa
            setTimeout(() => {
                window.location.href = `/${data.data.nombre_carpeta}/dashboard_base.html`;
            }, 1500);
        } else {
            messageDiv.textContent = data.message || 'Error al iniciar sesión';
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Error de conexión con el servidor';
        messageDiv.classList.add('error');
    }
});
