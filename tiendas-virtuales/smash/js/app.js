// Smash - Tienda de Tenis y Pádel
// Frontend Application State & Controller
// Basado en inventario real sin fotos simuladas

const state = {
  products: [...SMASH_PRODUCTS],
  filteredProducts: [...SMASH_PRODUCTS],
  cart: JSON.parse(localStorage.getItem('smash_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('smash_wishlist') || '[]'),
  filters: {
    search: '',
    category: 'all',
    brand: 'all',
    gender: 'all',
    maxPrice: 4500000,
    sortBy: 'recommended'
  },
  activeModalProduct: null,
  isCartOpen: false,
  isWishlistOpen: false
};

// Formato de moneda colombiana (COP)
function formatCOP(amount) {
  if (!amount && amount !== 0) return 'Consultar precio';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

function saveCart() {
  localStorage.setItem('smash_cart', JSON.stringify(state.cart));
  updateCartCounters();
}

function saveWishlist() {
  localStorage.setItem('smash_wishlist', JSON.stringify(state.wishlist));
  updateWishlistCounters();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-animation flex items-center gap-2.5 bg-neutral-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-neutral-800';
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-lime-400' : 'bg-sky-400'}"></span>
    <span class="flex-grow">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-neutral-400 hover:text-white ml-2 text-sm">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// Helper: Generador de marco para foto (Sin simulación, deja el espacio limpio)
function renderProductImageSlot(product, compact = false) {
  if (product.image) {
    return `
      <img 
        src="${product.image}" 
        alt="${product.name}" 
        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    `;
  }

  // Espacio limpio reservado para la foto real
  if (compact) {
    return `
      <div class="w-16 h-16 rounded bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 flex-shrink-0 border border-neutral-200">
        <svg class="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      </div>
    `;
  }

  return `
    <div class="w-full h-full bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 p-4 relative group-hover:bg-neutral-200/60 transition-colors">
      <svg class="w-9 h-9 stroke-1 text-neutral-300 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
      <span class="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Espacio para foto</span>
      ${product.code ? `<span class="text-[9px] text-neutral-400 font-mono mt-0.5">Ref: ${product.code}</span>` : ''}
    </div>
  `;
}

// --- FILTRADO Y ORDENAMIENTO ---
function applyFilters() {
  let list = [...state.products];

  // Búsqueda
  if (state.filters.search.trim()) {
    const term = state.filters.search.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term))
    );
  }

  // Categoría
  if (state.filters.category !== 'all') {
    list = list.filter(p => p.category === state.filters.category);
  }

  // Marca
  if (state.filters.brand !== 'all') {
    list = list.filter(p => p.brand && p.brand.toLowerCase() === state.filters.brand.toLowerCase());
  }

  // Género
  if (state.filters.gender !== 'all') {
    list = list.filter(p => p.gender === state.filters.gender || p.gender === 'Unisex');
  }

  // Precio Máximo
  list = list.filter(p => p.price <= state.filters.maxPrice);

  // Ordenamiento
  switch (state.filters.sortBy) {
    case 'price-asc':
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // recommended
      break;
  }

  state.filteredProducts = list;
  renderProductGrid();
  renderActiveFilterChips();
  updateResultsCount();
}

// --- RENDER DE PRODUCTOS ---
function renderProductGrid() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('no-products-state');
  if (!grid) return;

  if (state.filteredProducts.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = state.filteredProducts.map(product => {
    const isWishlisted = state.wishlist.includes(product.id);

    return `
      <div class="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-400 transition-all duration-200 flex flex-col justify-between">
        
        <!-- Contenedor del Espacio para Foto -->
        <div class="relative w-full aspect-square bg-neutral-100 overflow-hidden cursor-pointer" onclick="openQuickView('${product.id}')">
          ${renderProductImageSlot(product)}

          <!-- Badges discretos -->
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            ${product.badge ? `
              <span class="inline-block px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-semibold tracking-wider uppercase rounded shadow-sm">
                ${product.badge}
              </span>
            ` : ''}
          </div>

          <!-- Botón Favoritos -->
          <button 
            type="button"
            onclick="event.stopPropagation(); toggleWishlist('${product.id}')" 
            class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-neutral-400 hover:text-red-500 flex items-center justify-center shadow-sm transition-colors z-10"
            title="Guardar en favoritos"
          >
            <svg class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'fill-none stroke-current'}" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <!-- Información del Producto -->
        <div class="p-4 flex flex-col flex-grow">
          <div class="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
            <span class="font-bold uppercase tracking-wider text-neutral-800">${product.brand || 'Smash'}</span>
            <span class="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">${product.category}</span>
          </div>

          <h3 
            class="font-semibold text-neutral-900 text-sm leading-snug hover:text-neutral-600 cursor-pointer line-clamp-2 mb-2"
            onclick="openQuickView('${product.id}')"
          >
            ${product.name}
          </h3>

          <!-- Tallas / Medidas disponibles -->
          ${product.sizes && product.sizes.length ? `
            <div class="flex flex-wrap gap-1 mb-3">
              ${product.sizes.slice(0, 3).map(s => `
                <span class="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">
                  ${s}
                </span>
              `).join('')}
              ${product.sizes.length > 3 ? `
                <span class="text-[10px] text-neutral-400 self-center">+${product.sizes.length - 3}</span>
              ` : ''}
            </div>
          ` : '<div class="h-4"></div>'}

          <!-- Precios y Botón de Compra -->
          <div class="pt-3 border-t border-neutral-100 mt-auto flex items-center justify-between gap-2">
            <div>
              <span class="text-base font-bold text-neutral-900">
                ${formatCOP(product.price)}
              </span>
            </div>

            <button 
              type="button"
              onclick="addToCart('${product.id}')"
              class="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-3 py-2 rounded-lg text-xs transition-colors active:scale-95"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActiveFilterChips() {
  const container = document.getElementById('active-filters-chips');
  if (!container) return;

  const chips = [];

  if (state.filters.search) {
    chips.push({ key: 'search', label: `"${state.filters.search}"` });
  }
  if (state.filters.category !== 'all') {
    chips.push({ key: 'category', label: state.filters.category });
  }
  if (state.filters.brand !== 'all') {
    chips.push({ key: 'brand', label: state.filters.brand });
  }
  if (state.filters.gender !== 'all') {
    chips.push({ key: 'gender', label: state.filters.gender });
  }
  if (state.filters.maxPrice < 4500000) {
    chips.push({ key: 'maxPrice', label: `Hasta: ${formatCOP(state.filters.maxPrice)}` });
  }

  if (chips.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-1.5 py-2">
      <span class="text-xs text-neutral-400 font-medium mr-1">Filtros activos:</span>
      ${chips.map(chip => `
        <span class="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 text-xs px-2.5 py-1 rounded-md border border-neutral-200">
          ${chip.label}
          <button onclick="removeFilter('${chip.key}')" class="text-neutral-400 hover:text-neutral-900 ml-1">✕</button>
        </span>
      `).join('')}
      <button onclick="clearAllFilters()" class="text-xs text-neutral-500 hover:text-neutral-900 underline ml-2">
        Borrar todos
      </button>
    </div>
  `;
}

function updateResultsCount() {
  const el = document.getElementById('results-count');
  if (el) {
    el.innerText = `${state.filteredProducts.length} productos disponibles en inventario`;
  }
}

// --- CARRITO ---
function addToCart(productId, selectedSize = null, quantity = 1) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const size = selectedSize || (product.sizes && product.sizes.length ? product.sizes[0] : 'Estándar');

  const existingIndex = state.cart.findIndex(
    item => item.id === productId && item.size === size
  );

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += quantity;
  } else {
    state.cart.push({
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      brand: product.brand,
      size: size,
      quantity: quantity
    });
  }

  saveCart();
  renderCartDrawer();
  showToast(`"${product.name}" agregado al carrito`, 'success');
}

function updateCartQuantity(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].quantity += delta;

  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }

  saveCart();
  renderCartDrawer();
}

function removeFromCart(index) {
  if (!state.cart[index]) return;
  state.cart.splice(index, 1);
  saveCart();
  renderCartDrawer();
}

function getCartCalculations() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeShippingThreshold = 200000;
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 15000;
  const total = subtotal + shipping;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const missingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return { subtotal, shipping, total, progressPercent, missingForFreeShipping };
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('cart-empty-view');
  const fullView = document.getElementById('cart-full-view');
  if (!container) return;

  const { subtotal, shipping, total, progressPercent, missingForFreeShipping } = getCartCalculations();

  if (state.cart.length === 0) {
    if (emptyView) emptyView.classList.remove('hidden');
    if (fullView) fullView.classList.add('hidden');
    return;
  }

  if (emptyView) emptyView.classList.add('hidden');
  if (fullView) fullView.classList.remove('hidden');

  const progressBar = document.getElementById('free-shipping-progress');
  const shippingText = document.getElementById('shipping-promo-text');
  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (shippingText) {
    if (missingForFreeShipping === 0) {
      shippingText.innerHTML = `<span class="text-neutral-900 font-semibold">✓ Calificas para Envío Gratis a Colombia</span>`;
    } else {
      shippingText.innerHTML = `Faltan <span class="font-bold text-neutral-900">${formatCOP(missingForFreeShipping)}</span> para envío gratis`;
    }
  }

  container.innerHTML = state.cart.map((item, index) => `
    <div class="flex gap-3 py-3 border-b border-neutral-100 items-start">
      <div class="w-14 h-14 rounded bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 flex-shrink-0 border border-neutral-200">
        <svg class="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        </svg>
        <span class="text-[8px] text-neutral-400 font-mono">${item.code || ''}</span>
      </div>

      <div class="flex-grow min-w-0">
        <div class="flex justify-between items-start">
          <h4 class="text-xs font-semibold text-neutral-900 truncate pr-2">${item.name}</h4>
          <button onclick="removeFromCart(${index})" class="text-neutral-400 hover:text-neutral-700 text-xs">✕</button>
        </div>
        <div class="text-[11px] text-neutral-500 mb-2">Talla/Medida: ${item.size}</div>
        
        <div class="flex justify-between items-center">
          <div class="text-xs font-bold text-neutral-900">${formatCOP(item.price)}</div>
          
          <div class="flex items-center border border-neutral-200 rounded">
            <button onclick="updateCartQuantity(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-xs text-neutral-600 hover:bg-neutral-100">-</button>
            <span class="w-6 text-center text-xs font-medium text-neutral-900">${item.quantity}</span>
            <button onclick="updateCartQuantity(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-xs text-neutral-600 hover:bg-neutral-100">+</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.innerText = formatCOP(subtotal);
  if (shippingEl) shippingEl.innerText = shipping === 0 ? 'Gratis' : formatCOP(shipping);
  if (totalEl) totalEl.innerText = formatCOP(total);
}

function updateCartCounters() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-counter-badge');
  badges.forEach(b => {
    b.innerText = count;
    if (count > 0) {
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function toggleCartDrawer(open = null) {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer) return;

  const shouldOpen = open !== null ? open : !state.isCartOpen;
  state.isCartOpen = shouldOpen;

  if (shouldOpen) {
    renderCartDrawer();
    drawer.classList.remove('translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  } else {
    drawer.classList.add('translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function sendCartToWhatsApp() {
  if (state.cart.length === 0) {
    showToast('Tu carrito está vacío', 'info');
    return;
  }

  const { subtotal, shipping, total } = getCartCalculations();
  const phone = "573105559876";
  
  let text = `Hola Smash, deseo ordenar los siguientes productos de su inventario:\n\n`;

  state.cart.forEach((item, idx) => {
    text += `${idx + 1}. [${item.code || 'REF'}] ${item.name} (${item.size}) x${item.quantity} = ${formatCOP(item.price * item.quantity)}\n`;
  });

  text += `\nSubtotal: ${formatCOP(subtotal)}`;
  text += `\nEnvío: ${shipping === 0 ? 'Gratis' : formatCOP(shipping)}`;
  text += `\nTotal: ${formatCOP(total)}`;
  text += `\n\nQuedo atento a la confirmación de disponibilidad y despacho.`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// --- FAVORITOS ---
function toggleWishlist(productId) {
  const index = state.wishlist.indexOf(productId);
  const product = state.products.find(p => p.id === productId);

  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast('Eliminado de favoritos', 'info');
  } else {
    state.wishlist.push(productId);
    showToast(`"${product?.name}" guardado`, 'success');
  }

  saveWishlist();
  renderProductGrid();
  renderWishlistDrawer();
}

function updateWishlistCounters() {
  const count = state.wishlist.length;
  const badges = document.querySelectorAll('.wishlist-counter-badge');
  badges.forEach(b => {
    b.innerText = count;
    if (count > 0) {
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function toggleWishlistDrawer(open = null) {
  const drawer = document.getElementById('wishlist-drawer');
  const backdrop = document.getElementById('wishlist-backdrop');
  if (!drawer) return;

  const shouldOpen = open !== null ? open : !state.isWishlistOpen;
  state.isWishlistOpen = shouldOpen;

  if (shouldOpen) {
    renderWishlistDrawer();
    drawer.classList.remove('translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  } else {
    drawer.classList.add('translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function renderWishlistDrawer() {
  const container = document.getElementById('wishlist-items-container');
  const emptyView = document.getElementById('wishlist-empty-view');
  if (!container) return;

  const wishlistedItems = state.products.filter(p => state.wishlist.includes(p.id));

  if (wishlistedItems.length === 0) {
    container.innerHTML = '';
    if (emptyView) emptyView.classList.remove('hidden');
    return;
  }

  if (emptyView) emptyView.classList.add('hidden');

  container.innerHTML = wishlistedItems.map(p => `
    <div class="flex items-center gap-3 py-3 border-b border-neutral-100">
      <div class="w-14 h-14 rounded bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 flex-shrink-0 border border-neutral-200">
        <svg class="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        </svg>
      </div>
      <div class="flex-grow min-w-0">
        <h4 class="text-xs font-semibold text-neutral-900 truncate">${p.name}</h4>
        <div class="text-xs font-bold text-neutral-900 mt-0.5">${formatCOP(p.price)}</div>
        <div class="flex gap-3 mt-1.5">
          <button 
            onclick="addToCart('${p.id}'); toggleWishlist('${p.id}')"
            class="text-[11px] font-medium text-neutral-900 hover:underline"
          >
            Mover al Carrito
          </button>
          <button 
            onclick="toggleWishlist('${p.id}')"
            class="text-[11px] text-neutral-400 hover:text-red-600"
          >
            Quitar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- VISTA RÁPIDA ---
function openQuickView(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.activeModalProduct = product;
  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  document.getElementById('qv-title').innerText = product.name;
  document.getElementById('qv-brand').innerText = product.brand || 'Smash';
  document.getElementById('qv-category').innerText = product.category;
  document.getElementById('qv-price').innerText = formatCOP(product.price);
  document.getElementById('qv-code').innerText = product.code ? `Código: ${product.code}` : '';
  document.getElementById('qv-description').innerText = product.description || '';

  // Contenedor de espacio para foto en modal
  const qvImageContainer = document.getElementById('qv-image-container');
  if (qvImageContainer) {
    qvImageContainer.innerHTML = `
      <div class="w-full h-full bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 p-6">
        <svg class="w-12 h-12 stroke-1 text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Espacio para foto</span>
        <span class="text-[10px] text-neutral-400 mt-1">Ref: ${product.code || 'N/A'}</span>
      </div>
    `;
  }

  // Tallas
  const sizeContainer = document.getElementById('qv-sizes');
  if (sizeContainer) {
    if (product.sizes && product.sizes.length) {
      sizeContainer.innerHTML = product.sizes.map((s, idx) => `
        <label class="cursor-pointer">
          <input type="radio" name="qv-size-opt" value="${s}" ${idx === 0 ? 'checked' : ''} class="peer sr-only">
          <span class="inline-block px-3 py-1.5 text-xs rounded border border-neutral-300 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white text-neutral-700 transition-colors">
            ${s}
          </span>
        </label>
      `).join('');
    } else {
      sizeContainer.innerHTML = `<span class="text-xs text-neutral-400">Medida única</span>`;
    }
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  state.activeModalProduct = null;
}

function addActiveProductToCart() {
  if (!state.activeModalProduct) return;
  const selectedRadio = document.querySelector('input[name="qv-size-opt"]:checked');
  const size = selectedRadio ? selectedRadio.value : null;
  addToCart(state.activeModalProduct.id, size);
  closeQuickView();
  toggleCartDrawer(true);
}

// --- CHECKOUT SIMULADO ---
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Tu carrito está vacío', 'info');
    return;
  }

  toggleCartDrawer(false);
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const { subtotal, shipping, total } = getCartCalculations();
  document.getElementById('checkout-modal-subtotal').innerText = formatCOP(subtotal);
  document.getElementById('checkout-modal-shipping').innerText = shipping === 0 ? 'Gratis' : formatCOP(shipping);
  document.getElementById('checkout-modal-total').innerText = formatCOP(total);

  showCheckoutStep(1);
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function showCheckoutStep(stepNumber) {
  document.querySelectorAll('.checkout-step-content').forEach(el => el.classList.add('hidden'));
  const current = document.getElementById(`checkout-step-${stepNumber}`);
  if (current) current.classList.remove('hidden');

  for (let i = 1; i <= 3; i++) {
    const pill = document.getElementById(`step-pill-${i}`);
    if (pill) {
      if (i <= stepNumber) {
        pill.className = "w-6 h-6 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center";
      } else {
        pill.className = "w-6 h-6 rounded-full bg-neutral-200 text-neutral-500 font-medium text-xs flex items-center justify-center";
      }
    }
  }
}

function submitCheckoutOrder(event) {
  event.preventDefault();
  const orderNumber = `SMASH-${Math.floor(100000 + Math.random() * 900000)}`;
  document.getElementById('confirmed-order-number').innerText = orderNumber;
  
  state.cart = [];
  saveCart();
  renderCartDrawer();

  showCheckoutStep(3);
  showToast('Pedido registrado con éxito', 'success');
}

// --- ACCIONES DE FILTRO ---
function setCategoryFilter(cat) {
  state.filters.category = cat;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.className = "cat-filter-btn text-left text-xs font-semibold text-neutral-900 py-1 transition-colors flex justify-between";
    } else {
      btn.className = "cat-filter-btn text-left text-xs text-neutral-500 hover:text-neutral-900 py-1 transition-colors flex justify-between";
    }
  });
  applyFilters();
}

function setBrandFilter(brand) {
  state.filters.brand = brand;
  const sel = document.getElementById('brand-select');
  if (sel) sel.value = brand;
  applyFilters();
}

function removeFilter(key) {
  if (key === 'search') {
    state.filters.search = '';
    const input = document.getElementById('search-input');
    if (input) input.value = '';
  } else if (key === 'category') {
    setCategoryFilter('all');
  } else if (key === 'brand') {
    state.filters.brand = 'all';
    const sel = document.getElementById('brand-select');
    if (sel) sel.value = 'all';
  } else if (key === 'gender') {
    state.filters.gender = 'all';
    const sel = document.getElementById('gender-select');
    if (sel) sel.value = 'all';
  } else if (key === 'maxPrice') {
    state.filters.maxPrice = 4500000;
    const slider = document.getElementById('price-range-slider');
    if (slider) slider.value = 4500000;
    const display = document.getElementById('price-slider-display');
    if (display) display.innerText = formatCOP(4500000);
  }
  applyFilters();
}

function clearAllFilters() {
  state.filters = {
    search: '',
    category: 'all',
    brand: 'all',
    gender: 'all',
    maxPrice: 4500000,
    sortBy: 'recommended'
  };

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const slider = document.getElementById('price-range-slider');
  if (slider) slider.value = 4500000;

  const display = document.getElementById('price-slider-display');
  if (display) display.innerText = formatCOP(4500000);

  const brandSel = document.getElementById('brand-select');
  if (brandSel) brandSel.value = 'all';

  const genderSel = document.getElementById('gender-select');
  if (genderSel) genderSel.value = 'all';

  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.value = 'recommended';

  setCategoryFilter('all');
}

function handleLiveSearch(event) {
  const term = event.target.value.trim().toLowerCase();
  state.filters.search = term;
  const dropdown = document.getElementById('search-autocomplete-dropdown');
  
  if (!dropdown) {
    applyFilters();
    return;
  }

  if (term.length < 2) {
    dropdown.classList.add('hidden');
    applyFilters();
    return;
  }

  const matches = state.products.filter(p => 
    p.name.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term) ||
    (p.brand && p.brand.toLowerCase().includes(term)) ||
    (p.code && p.code.toLowerCase().includes(term))
  ).slice(0, 6);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-neutral-500 text-center">No se encontraron productos</div>`;
    dropdown.classList.remove('hidden');
    applyFilters();
    return;
  }

  dropdown.innerHTML = matches.map(m => `
    <div 
      onclick="openQuickView('${m.id}'); document.getElementById('search-autocomplete-dropdown').classList.add('hidden');" 
      class="flex items-center gap-2.5 p-2 hover:bg-neutral-50 cursor-pointer rounded-lg transition-colors border-b border-neutral-50 last:border-0"
    >
      <div class="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px] font-mono border border-neutral-200 flex-shrink-0">
        ${m.code ? m.code.slice(0, 4) : 'REF'}
      </div>
      <div class="flex-grow min-w-0">
        <div class="text-xs font-semibold text-neutral-900 truncate">${m.name}</div>
        <div class="text-[11px] text-neutral-500">${m.category} • ${formatCOP(m.price)}</div>
      </div>
    </div>
  `).join('');

  dropdown.classList.remove('hidden');
  applyFilters();
}

// Calculador de Encordado
function openStringingModal() {
  const modal = document.getElementById('stringing-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeStringingModal() {
  const modal = document.getElementById('stringing-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function calculateStringingService() {
  const stringType = document.getElementById('str-cuerda')?.value || 'rpm';
  const isExpress = document.getElementById('str-express')?.checked;

  let basePrice = 20000; // Según inventario: 997TV SERVICIO DE ENCORDADO = 20000
  let stringPrice = 0;

  if (stringType === 'rpm') stringPrice = 80000;
  else if (stringType === 'alu') stringPrice = 90000;
  else if (stringType === 'sensation') stringPrice = 65000;
  else if (stringType === 'own') stringPrice = 0;

  const expressSurcharge = isExpress ? 15000 : 0;
  const total = basePrice + stringPrice + expressSurcharge;

  const totalEl = document.getElementById('stringing-calc-total');
  if (totalEl) totalEl.innerText = formatCOP(total);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid();
  updateCartCounters();
  updateWishlistCounters();
  updateResultsCount();

  const slider = document.getElementById('price-range-slider');
  const sliderDisplay = document.getElementById('price-slider-display');
  if (slider && sliderDisplay) {
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      state.filters.maxPrice = val;
      sliderDisplay.innerText = formatCOP(val);
      applyFilters();
    });
  }

  const sortSel = document.getElementById('sort-select');
  if (sortSel) {
    sortSel.addEventListener('change', (e) => {
      state.filters.sortBy = e.target.value;
      applyFilters();
    });
  }

  const brandSel = document.getElementById('brand-select');
  if (brandSel) {
    brandSel.addEventListener('change', (e) => {
      state.filters.brand = e.target.value;
      applyFilters();
    });
  }

  const genderSel = document.getElementById('gender-select');
  if (genderSel) {
    genderSel.addEventListener('change', (e) => {
      state.filters.gender = e.target.value;
      applyFilters();
    });
  }

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('search-autocomplete-dropdown');
    const searchInput = document.getElementById('search-input');
    if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleCartDrawer(false);
      toggleWishlistDrawer(false);
      closeQuickView();
      closeCheckoutModal();
      closeStringingModal();
    }
  });
});
