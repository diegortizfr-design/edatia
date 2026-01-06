// actualystore/checkout.js - Lógica del flujo de compra por pasos

document.addEventListener('DOMContentLoaded', () => {
    const checkoutItemsContainer = document.getElementById('checkout-items');
    const checkoutTotalDisplay = document.getElementById('checkout-total');

    // Pasos
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    // Botones de Navegación
    const btnToStep2 = document.getElementById('btn-to-step-2');
    const btnBackToStep1 = document.getElementById('btn-back-to-step-1');
    const btnBackToStep2 = document.getElementById('btn-back-to-step-2');
    const checkoutForm = document.getElementById('checkout-form');

    // Botones Finales
    const payWhatsapp = document.getElementById('pay-whatsapp');
    const payGateway = document.getElementById('pay-gateway');

    let cart = JSON.parse(localStorage.getItem('actualyCart')) || [];

    // --- Funciones de Renderizado ---

    const renderSummary = () => {
        checkoutItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            checkoutItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tienes productos seleccionados.</p>';
            btnToStep2.disabled = true;
            btnToStep2.style.opacity = '0.5';
            return;
        }

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.padding = '15px 0';
            itemDiv.style.borderBottom = '1px solid #eee';

            itemDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.img}" width="50" height="50" style="object-fit: contain;">
                    <div>
                        <h4 style="font-size: 1rem;">${item.name}</h4>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${item.quantity} x $${item.price.toLocaleString()}</span>
                    </div>
                </div>
                <strong style="color: var(--brand-blue);">$${subtotal.toLocaleString()}</strong>
            `;
            checkoutItemsContainer.appendChild(itemDiv);
        });

        checkoutTotalDisplay.textContent = `$${total.toLocaleString()}`;
    };

    // --- Navegación entre pasos ---

    btnToStep2.addEventListener('click', () => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        window.scrollTo(0, 0);
    });

    btnBackToStep1.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'flex'; // section is block but display as container
        step1.style.flexDirection = 'column';
    });

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        step2.style.display = 'none';
        step3.style.display = 'block';
        window.scrollTo(0, 0);
    });

    btnBackToStep2.addEventListener('click', () => {
        step3.style.display = 'none';
        step2.style.display = 'block';
    });

    // --- Finalización de Compra ---

    payWhatsapp.addEventListener('click', () => {
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;
        const delivery = document.querySelector('input[name="delivery"]:checked').value;

        let message = `*Nuevo Pedido - ActualyStore*\n\n`;
        message += `*Cliente:* ${name}\n`;
        message += `*Teléfono:* ${phone}\n`;
        message += `*Entrega:* ${delivery === 'domicilio' ? 'Domicilio' : 'Recoger en tienda'}\n`;
        if (delivery === 'domicilio') message += `*Dirección:* ${address}\n`;
        message += `\n*Productos:*\n`;

        cart.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}\n`;
        });

        message += `\n*Total:* ${checkoutTotalDisplay.textContent}`;

        const encodedMessage = encodeURIComponent(message);
        // Usar un número de prueba o dejar que el usuario lo complete
        const whatsappUrl = `https://wa.me/573000000000?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        // Limpiar carrito tras pedido
        // localStorage.removeItem('actualyCart');
        // alert('¡Gracias por tu pedido! Serás redirigido a WhatsApp.');
        // window.location.href = 'index.html';
    });

    payGateway.addEventListener('click', () => {
        alert('Funcionalidad de Pasarela de Pago integrada próximamente. Por ahora, utiliza WhatsApp para coordinar el pago.');
    });

    // Exponer función de toggle de dirección al scope global
    window.toggleAddress = (show) => {
        document.getElementById('address-container').style.display = show ? 'block' : 'none';
        document.getElementById('cust-address').required = show;
    };

    renderSummary();
});
