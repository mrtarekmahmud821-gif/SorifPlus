/**
 * SorifPlus — Cart System (LocalStorage + Firebase ready)
 */

const CART_KEY = "sorifplus_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, qty = 1) {
  const product = DEMO_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.salePrice || product.price,
      image: product.image,
      qty: qty
    });
  }

  saveCart(cart);
  showToast(`${product.name.substring(0, 30)}... added to cart`);
}

function removeFromCart(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function updateQty(productId, qty) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  if (qty <= 0) {
    removeFromCart(productId);
  } else {
    item.qty = qty;
    saveCart(cart);
  }
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  // Update badge
  document.querySelectorAll("#cartCount, #drawerCartCount").forEach(el => {
    if (el) el.textContent = count;
  });

  // Update subtotal
  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) subtotalEl.textContent = formatPrice(total);

  // Render cart items
  const container = document.getElementById("cartItems");
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="price">${formatPrice(item.price)}</div>
        <div class="cart-item-qty">
          <button onclick="updateQty('${item.id}', ${item.qty - 1})">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty('${item.id}', ${item.qty + 1})">+</button>
          <button onclick="removeFromCart('${item.id}')" style="margin-left:auto;color:#c62828;border:none;background:none;cursor:pointer;">🗑</button>
        </div>
      </div>
    </div>
  `).join("");
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 50px;
      font-size: 14px; z-index: 9999; opacity: 0; transition: opacity 0.3s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 90%;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 2500);
}

// Wishlist (simple localStorage)
const WISHLIST_KEY = "sorifplus_wishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function toggleWishlist(productId) {
  let list = getWishlist();
  if (list.includes(productId)) {
    list = list.filter(id => id !== productId);
    showToast("Removed from wishlist");
  } else {
    list.push(productId);
    showToast("Added to wishlist ❤️");
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  // Update heart icons
  document.querySelectorAll(`[data-wishlist="${productId}"]`).forEach(btn => {
    btn.classList.toggle("active", list.includes(productId));
  });
}
