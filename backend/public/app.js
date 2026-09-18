const API_URL = "/api/products";

let allProducts = [];
let filteredProducts = [];

let cart = JSON.parse(
  localStorage.getItem("dior_cart") || "[]"
);


// تحميل المنتجات

async function loadProducts() {

  const grid =
    document.getElementById("productsGrid");

  try {

    const response =
      await fetch(API_URL);

    const data =
      await response.json();

    if (!data.success) {
      throw new Error("Failed to load products");
    }

    allProducts = data.products;

    filteredProducts = [...allProducts];

    renderProducts(filteredProducts);

  } catch (error) {

    console.error(error);

    grid.innerHTML = `
      <div class="loading">
        تعذر تحميل المنتجات
      </div>
    `;
  }
}


// عرض المنتجات

function renderProducts(products) {

  const grid =
    document.getElementById("productsGrid");

  if (!products.length) {

    grid.innerHTML = `
      <div class="loading">
        لا توجد منتجات حالياً
      </div>
    `;

    return;
  }

  grid.innerHTML = products.map(product => {

    const image =
      product.images &&
      product.images.length
        ? product.images[0]
        : "images/logo.jpg";

    const oldPrice =
      product.oldPrice
        ? `
          <span class="product-old-price">
            ${formatPrice(product.oldPrice)}
          </span>
        `
        : "";

    return `
      <article
        class="product-card"
        onclick="openProduct('${product._id}')"
      >

        <img
          class="product-image"
          src="${escapeHtml(image)}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          onerror="this.src='images/logo.jpg'"
        >

        <div class="product-info">

          <div class="product-name">
            ${escapeHtml(product.name)}
          </div>

          <div class="product-category">
            ${escapeHtml(product.category || "")}
          </div>

          <div class="product-price">
            ${formatPrice(product.price)}
            ${oldPrice}
          </div>

          <button
            class="add-cart"
            onclick="
              event.stopPropagation();
              addToCart('${product._id}')
            "
          >
            🛒 إضافة إلى السلة
          </button>

        </div>

      </article>
    `;

  }).join("");
}

// البحث

function searchProducts() {

  const value =
    document
      .getElementById("searchInput")
      .value
      .trim()
      .toLowerCase();

  filteredProducts =
    allProducts.filter(product => {

      return (
        product.name
          .toLowerCase()
          .includes(value) ||

        (product.category || "")
          .toLowerCase()
          .includes(value)
      );

    });

  document.getElementById("productsTitle")
    .textContent =
      value
        ? "نتائج البحث"
        : "أحدث المنتجات";

  renderProducts(filteredProducts);
}


// التصنيف

function filterCategory(category) {

  filteredProducts =
    allProducts.filter(
      product =>
        product.category === category
    );

  document.getElementById("productsTitle")
    .textContent = category;

  renderProducts(filteredProducts);

  scrollToProducts();
}


// عرض الكل

function showAllProducts() {

  filteredProducts = [...allProducts];

  document.getElementById("productsTitle")
    .textContent = "أحدث المنتجات";

  renderProducts(filteredProducts);
}


// السلة

function addToCart(productId) {

  const product =
    allProducts.find(
      p => p._id === productId
    );

  if (!product) return;

  const existing =
    cart.find(
      item => item.productId === productId
    );

  if (existing) {

    existing.quantity++;

  } else {

    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image:
        product.images &&
        product.images.length
          ? product.images[0]
          : "images/logo.jpg",
      quantity: 1
    });

  }

  saveCart();

  updateCartCount();

  alert("تمت إضافة المنتج إلى السلة 🛒");
}


// حفظ السلة

function saveCart() {

  localStorage.setItem(
    "dior_cart",
    JSON.stringify(cart)
  );

}


// عدد المنتجات

function updateCartCount() {

  const count =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  document.getElementById(
    "cartCount"
  ).textContent = count;
}


// فتح السلة

function openCart() {

  renderCart();

  document
    .getElementById("cartOverlay")
    .classList.add("active");

}


// إغلاق السلة

function closeCart(event) {

  if (
    !event ||
    event.target.id === "cartOverlay"
  ) {

    document
      .getElementById("cartOverlay")
      .classList.remove("active");

  }

}


// عرض السلة

function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!cart.length) {

    container.innerHTML = `
      <div class="loading">
        السلة فارغة 🛒
      </div>
    `;

    document.getElementById(
      "cartTotal"
    ).textContent = "0 ريال";

    return;
  }

  container.innerHTML =
    cart.map(item => {

      return `
        <div class="cart-item">

          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            onerror="this.src='images/logo.jpg'"
          >

          <div class="cart-item-info">

            <strong>
              ${escapeHtml(item.name)}
            </strong>

            <div>
              ${formatPrice(item.price)}
            </div>

            <div class="quantity-controls">

              <button
                onclick="changeQuantity('${item.productId}', 1)"
              >
                +
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                onclick="changeQuantity('${item.productId}', -1)"
              >
                −
              </button>

              <button
                onclick="removeFromCart('${item.productId}')"
              >
                🗑️
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );

  document.getElementById(
    "cartTotal"
  ).textContent =
    formatPrice(total);
}


// تغيير الكمية

function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      item =>
        item.productId === productId
    );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        item =>
          item.productId !== productId
      );

  }

  saveCart();

  updateCartCount();

  renderCart();
}


// حذف

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        item.productId !== productId
    );

  saveCart();

  updateCartCount();

  renderCart();
}


// إتمام الطلب

function checkout() {

  if (!cart.length) {

    alert("السلة فارغة");

    return;
  }

  alert(
    "سنضيف صفحة إتمام الطلب والخريطة في المرحلة القادمة."
  );
}


// الانتقال للمنتجات

function scrollToProducts() {

  document
    .getElementById("productsSection")
    .scrollIntoView({
      behavior: "smooth"
    });

}


// تنسيق السعر

function formatPrice(price) {

  return Number(price)
    .toLocaleString("ar-YE")
    + " ريال";
}


// حماية النص

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// تشغيل

loadProducts();

updateCartCount();
