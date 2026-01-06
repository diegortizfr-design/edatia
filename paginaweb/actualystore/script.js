// actualystore/script.js - Lógica del Carrito Frontend

document.addEventListener('DOMContentLoaded', () => {
    // Selectores
    const cartToggle = document.getElementById('cart-btn-nav');
    const cartClose = document.getElementById('cart-close');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');
    const buyButtons = document.querySelectorAll('.product-card .btn-primary');

    let cart = JSON.parse(localStorage.getItem('actualyCart')) || [];

    // --- Funciones del Carrito ---

    const toggleCart = () => {
        cartSidebar.classList.toggle('active');
    };

    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">El carrito está vacío</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                count += item.quantity;

                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toLocaleString()}</p>
                        <div class="cart-item-qty">
                            <button onclick="updateQty(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <span onclick="removeFromCart(${index})" style="cursor:pointer; color: var(--brand-red); font-weight: bold; font-size: 1.2rem;">&times;</span>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
        }

        cartCountBadge.textContent = count;
        cartTotalDisplay.textContent = `$${total.toLocaleString()}`;
        localStorage.setItem('actualyCart', JSON.stringify(cart));
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartUI();
        if (!cartSidebar.classList.contains('active')) toggleCart();
    };

    window.updateQty = (index, change) => {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    // --- Event Listeners ---

    cartToggle.addEventListener('click', toggleCart);

    // Cerrar carrito desde el header (X o texto "Seguir comprando")
    const closeTrigger = document.getElementById('cart-close-container') || cartClose;
    closeTrigger.addEventListener('click', toggleCart);

    // Cerrar carrito desde el botón del footer
    const continueBtn = document.getElementById('cart-continue-btn');
    if (continueBtn) continueBtn.addEventListener('click', toggleCart);

    // Ir a Checkout
    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = button.closest('.product-card');
            if (!card) return; // Si no es una tarjeta de producto, ignorar (ej: botones de navegación)

            e.preventDefault();
            const product = {
                name: card.querySelector('h3').textContent,
                price: parseFloat(card.querySelector('p').textContent.replace('$', '').replace(',', '')),
                img: card.querySelector('img').src
            };
            addToCart(product);
        });
    });

    // Carga inicial
    updateCartUI();
});
