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

    payWhatsapp.addEventListener('click', async () => {
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;

        // Address components
        const dept = document.getElementById('cust-dept').value;
        const city = document.getElementById('cust-city').value;
        const neighborhood = document.getElementById('cust-neighborhood').value;
        const exactAddress = document.getElementById('cust-address').value;

        const delivery = document.querySelector('input[name="delivery"]:checked').value;

        if (!name || !phone) {
            alert('Por favor completa tu nombre y teléfono');
            return;
        }

        let fullAddress = '';
        if (delivery === 'domicilio') {
            if (!dept || !city || !neighborhood || !exactAddress) {
                alert('Por favor completa todos los campos de dirección (Departamento, Ciudad, Barrio y Dirección)');
                return;
            }
            fullAddress = `${exactAddress}, ${neighborhood}, ${city} - ${dept}`;
        }

        // Mostrar estado de carga
        const originalText = payWhatsapp.innerText;
        payWhatsapp.innerText = 'Procesando Pedido...';
        payWhatsapp.disabled = true;

        const NIT = '1005892267'; // Quemado por ahora
        const API_URL = `https://erpod.onrender.com/api/public/ecommerce/${NIT}/order`;

        try {
            // Enviar pedido al servidor
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente: {
                        nombre: name,
                        telefono: phone,
                        direccion: fullAddress
                    },
                    items: cart.map(item => ({
                        id: item.id, // Asegurarse que script.js guarda el ID en el carrito
                        name: item.name,
                        quantity: item.quantity
                    })),
                    delivery: delivery
                })
            });

            const result = await response.json();
            let orderNumber = 'Pendiente';

            if (result.success) {
                orderNumber = result.numero_pedido;
                // Limpiar carrito solo si fue exitoso
                localStorage.removeItem('actualyCart');
            } else {
                console.warn('Error guardando pedido:', result.message);
                alert('Hubo un problema registrando el pedido en el sistema, pero continuaremos por WhatsApp.');
            }

            // Construir mensaje de WhatsApp
            let message = `*Nuevo Pedido - ActualyStore*\n`;
            message += `*Pedido #:* ${orderNumber}\n\n`;
            message += `*Cliente:* ${name}\n`;
            message += `*Teléfono:* ${phone}\n`;
            message += `*Entrega:* ${delivery === 'domicilio' ? 'Domicilio' : 'Recoger en tienda'}\n`;
            if (delivery === 'domicilio') {
                message += `*Ciudad:* ${city} - ${dept}\n`;
                message += `*Dirección:* ${exactAddress} (${neighborhood})\n`;
            }
            message += `\n*Productos:*\n`;

            cart.forEach(item => {
                message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}\n`;
            });

            message += `\n*Total:* ${checkoutTotalDisplay.textContent}`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/573000000000?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión. Te redirigiremos a WhatsApp directamente.');

            // Fallback directo a WhatsApp
            const message = `*Nuevo Pedido (Sin registrar en sistema)*\nClient: ${name}\nTotal: ${checkoutTotalDisplay.textContent}`;
            window.open(`https://wa.me/573000000000?text=${encodeURIComponent(message)}`, '_blank');
        } finally {
            payWhatsapp.innerText = originalText;
            payWhatsapp.disabled = false;
        }
    });

    payGateway.addEventListener('click', () => {
        alert('Funcionalidad de Pasarela de Pago integrada próximamente. Por ahora, utiliza WhatsApp para coordinar el pago.');
    });

    // Exponer función de toggle de dirección al scope global
    window.toggleAddress = (isDelivery) => {
        document.getElementById('address-container').style.display = isDelivery ? 'block' : 'none';
        const branchContainer = document.getElementById('branch-container');
        branchContainer.style.display = isDelivery ? 'none' : 'block';

        if (!isDelivery) {
            loadBranches();
        }
    };

    let branchesLoaded = false;
    async function loadBranches() {
        if (branchesLoaded) return;
        const branchSelect = document.getElementById('branch-select');
        branchSelect.innerHTML = '<option value="">Cargando tiendas...</option>';

        const NIT = '1005892267'; // Quemado por ahora
        try {
            const res = await fetch(`https://erpod.onrender.com/api/public/ecommerce/${NIT}/branches`);
            const data = await res.json();

            if (data.success && data.data.length > 0) {
                branchSelect.innerHTML = '<option value="">Selecciona una tienda...</option>';
                data.data.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch.id;
                    option.textContent = branch.nombre;
                    option.dataset.address = branch.direccion; // Guardar dirección
                    branchSelect.appendChild(option);
                });

                branchSelect.addEventListener('change', (e) => {
                    const selected = branchSelect.options[branchSelect.selectedIndex];
                    const info = document.getElementById('branch-info');
                    if (selected.value) {
                        info.textContent = `Dirección: ${selected.dataset.address || 'Sin dirección registrada'}`;
                    } else {
                        info.textContent = '';
                    }
                });

                branchesLoaded = true;
            } else {
                branchSelect.innerHTML = '<option value="">No hay tiendas disponibles</option>';
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            branchSelect.innerHTML = '<option value="">Error cargando tiendas</option>';
        }
    }

    renderSummary();
});
