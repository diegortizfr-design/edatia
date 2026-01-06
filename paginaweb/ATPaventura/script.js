// ATPAventura - Premium Cart & Shop System

document.addEventListener('DOMContentLoaded', () => {
    // --- NAVBAR & SCROLL LOGIC ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.padding = '1rem 0';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.4)';
            navbar.style.padding = '1.5rem 0';
        }
    });

    // --- CART SYSTEM ---
    let cart = JSON.parse(localStorage.getItem('atpCart')) || [];

    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalValue = document.getElementById('cart-total-value');
    const cartCountBadge = document.getElementById('cart-count');
    const cartClose = document.getElementById('cart-close');
    const cartContinue = document.getElementById('cart-continue');
    const cartTrigger = document.querySelector('.cart-trigger');

    // Mobile Menu Toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    const toggleCart = () => {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    };

    if (cartTrigger) cartTrigger.addEventListener('click', toggleCart);
    if (cartClose) cartClose.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);
    if (cartContinue) cartContinue.addEventListener('click', toggleCart);

    const updateCart = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px;">Tu equipaje de placer está vacío.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                count += item.quantity;

                const itemHTML = `
                    <div class="cart-item">
                        <img src="${item.img}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>$${item.price.toLocaleString()}</p>
                            <div class="cart-qty">
                                <button onclick="window.updateQty(${index}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="window.updateQty(${index}, 1)">+</button>
                            </div>
                        </div>
                        <button class="cart-item-remove" onclick="window.removeFromCart(${index})">
                            &times;
                        </button>
                    </div>
                `;
                cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
            });
        }

        cartTotalValue.innerText = `$${total.toLocaleString()}`;
        cartCountBadge.innerText = count;
        localStorage.setItem('atpCart', JSON.stringify(cart));
    };

    // Global accessibility for inline events
    window.updateQty = (index, delta) => {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCart();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCart();
    };

    // Add to Cart Logic
    const buyButtons = document.querySelectorAll('.btn-add-to-cart');
    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const product = {
                id: btn.getAttribute('data-id'),
                name: btn.getAttribute('data-name'),
                price: parseInt(btn.getAttribute('data-price')),
                img: btn.getAttribute('data-img'),
                quantity: 1
            };

            const existing = cart.find(i => i.id === product.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push(product);
            }

            updateCart();
            if (!cartSidebar.classList.contains('active')) toggleCart();
        });
    });

    // --- FILTERS LOGIC ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-filter');

            products.forEach(p => {
                if (category === 'all' || p.getAttribute('data-category') === category) {
                    p.style.display = 'block';
                    p.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    p.style.display = 'none';
                }
            });
        });
    });

    // Initial render
    updateCart();
});
