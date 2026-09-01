/**
 * SorifPlus — Main Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroSlider();
  initCountdown();
  renderProducts();
  updateCartUI();
  initEventListeners();
});

/* ========== HERO SLIDER ========== */
function initHeroSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dotsContainer = document.getElementById("heroDots");
  if (!slides.length) return;

  let current = 0;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  function goToSlide(index) {
    slides[current].classList.remove("active");
    dotsContainer.children[current].classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    dotsContainer.children[current].classList.add("active");
  }

  // Auto slide
  setInterval(() => {
    goToSlide((current + 1) % slides.length);
  }, 5000);
}

/* ========== COUNTDOWN ========== */
function initCountdown() {
  // Demo: ends in 2h 15m 30s from now
  const endTime = Date.now() + (2 * 3600 + 15 * 60 + 30) * 1000;

  function tick() {
    const diff = Math.max(0, endTime - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const hoursEl = document.getElementById("hours");
    const minsEl = document.getElementById("minutes");
    const secsEl = document.getElementById("seconds");

    if (hoursEl) hoursEl.textContent = String(h).padStart(2, "0");
    if (minsEl) minsEl.textContent = String(m).padStart(2, "0");
    if (secsEl) secsEl.textContent = String(s).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

/* ========== RENDER PRODUCTS ========== */
function createProductCard(product) {
  const discount = getDiscount(product.price, product.salePrice);
  const wishlist = getWishlist();
  const isWished = wishlist.includes(product.id);

  return `
    <div class="product-card" data-id="${product.id}">
      ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ""}
      <button class="product-wishlist ${isWished ? "active" : ""}" data-wishlist="${product.id}" onclick="toggleWishlist('${product.id}')">
        <svg width="18" height="18" fill="${isWished ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
      <a href="pages/product.html?id=${product.id}" class="product-img">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </a>
      <div class="product-body">
        <div class="product-brand">${product.brand}</div>
        <a href="pages/product.html?id=${product.id}" class="product-title">${product.name}</a>
        <div class="product-rating">
          ★ ${product.rating} <span>(${product.reviews})</span>
        </div>
        <div class="product-price">
          <span class="current">${formatPrice(product.salePrice || product.price)}</span>
          ${product.salePrice ? `<span class="old">${formatPrice(product.price)}</span>` : ""}
        </div>
        <div class="product-actions">
          <button class="btn btn-outline btn-sm" onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="btn btn-primary btn-sm" onclick="addToCart('${product.id}'); window.location.href='pages/checkout.html'">Buy Now</button>
        </div>
      </div>
    </div>
  `;
}

function renderProducts() {
  const flashContainer = document.getElementById("flashSaleProducts");
  const popularContainer = document.getElementById("popularProducts");

  if (flashContainer) {
    const flashProducts = DEMO_PRODUCTS.filter(p => FLASH_SALE_IDS.includes(p.id));
    flashContainer.innerHTML = flashProducts.map(createProductCard).join("");
  }

  if (popularContainer) {
    popularContainer.innerHTML = DEMO_PRODUCTS.slice(0, 8).map(createProductCard).join("");
  }
}

/* ========== EVENT LISTENERS ========== */
function initEventListeners() {
  // Cart drawer
  const cartToggle = document.getElementById("cartToggle");
  const mobileCartBtn = document.getElementById("mobileCartBtn");
  const closeCart = document.getElementById("closeCart");
  const continueShopping = document.getElementById("continueShopping");
  const cartDrawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("overlay");

  function openCart() {
    cartDrawer?.classList.add("open");
    overlay?.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    cartDrawer?.classList.remove("open");
    overlay?.classList.remove("show");
    document.body.style.overflow = "";
  }

  cartToggle?.addEventListener("click", openCart);
  mobileCartBtn?.addEventListener("click", openCart);
  closeCart?.addEventListener("click", closeCartDrawer);
  continueShopping?.addEventListener("click", closeCartDrawer);
  overlay?.addEventListener("click", () => {
    closeCartDrawer();
    closeMobileMenu();
  });

  // Mobile menu
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const closeMobileMenuBtn = document.getElementById("closeMobileMenu");
  const mobileMenu = document.getElementById("mobileMenu");

  function openMobileMenu() {
    mobileMenu?.classList.add("open");
    overlay?.classList.add("show");
  }

  function closeMobileMenu() {
    mobileMenu?.classList.remove("open");
    if (!cartDrawer?.classList.contains("open")) {
      overlay?.classList.remove("show");
    }
  }

  mobileMenuBtn?.addEventListener("click", openMobileMenu);
  closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);

  // Mobile search toggle
  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const searchBox = document.querySelector(".search-box");
  mobileSearchBtn?.addEventListener("click", () => {
    searchBox?.classList.toggle("show");
    document.getElementById("searchInput")?.focus();
  });

  // Search
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  function doSearch() {
    const q = searchInput?.value?.trim();
    if (q) {
      window.location.href = `pages/shop.html?q=${encodeURIComponent(q)}`;
    }
  }

  searchBtn?.addEventListener("click", doSearch);
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch();
  });
}
