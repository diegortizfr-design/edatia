document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-nueva-sucursal');
    const btnNueva = document.getElementById('btn-nueva-sucursal');
    const spanClose = document.querySelector('.close-modal');
    const form = document.getElementById('form-nueva-sucursal');

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

        // Aquí iría la lógica para enviar al backend (POST /api/sucursales)
        alert('Funcionalidad de guardar pendiente de implementar en backend.');
        modal.style.display = "none";
    });
});
