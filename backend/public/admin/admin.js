const API = "/api";

let products = [];
let filteredProducts = [];


// ==========================
// تسجيل الدخول
// ==========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
      document.getElementById("username")?.value.trim();

    const password =
      document.getElementById("password")?.value || "";

    const message =
      document.getElementById("loginMessage");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "فشل تسجيل الدخول"
        );
      }

      window.location.href = "/admin";

    } catch (error) {
      if (message) {
        message.textContent = error.message;
        message.style.color = "crimson";
      }
    }
  });
}


// ==========================
// لوحة الإدارة
// ==========================

if (
  window.location.pathname === "/admin" ||
  window.location.pathname === "/admin/"
) {
  checkAdmin();
}


async function checkAdmin() {
  try {
    const response = await fetch(`${API}/auth/me`, {
      credentials: "include"
    });

    if (!response.ok) {
      window.location.href = "/admin/login.html";
      return;
    }

    await loadAdminProducts();
    await loadOrderCount();

  } catch (error) {
    console.error("Admin authentication error:", error);
    window.location.href = "/admin/login.html";
  }
}


// ==========================
// تحميل المنتجات
// ==========================

async function loadAdminProducts() {
  try {
    const response = await fetch(`${API}/products`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("تعذر تحميل المنتجات");
    }

    const data = await response.json();

    products = data.products || [];
    filteredProducts = [...products];

    updateCategoryFilter();
    renderAdminProducts();

  } catch (error) {
    console.error("Load products error:", error);

    const grid =
      document.getElementById("productsGrid");

    if (grid) {
      grid.innerHTML = `
        <div class="admin-empty">
          <div class="empty-icon">⚠️</div>
          <h3>تعذر تحميل المنتجات</h3>
          <p>${escapeHtml(error.message)}</p>
          <button
            type="button"
            class="primary-button"
            onclick="loadAdminProducts()"
          >
            إعادة المحاولة
          </button>
        </div>
      `;
    }
  }
}


// ==========================
// البحث
// ==========================

const productSearch =
  document.getElementById("productSearch");

if (productSearch) {
  productSearch.addEventListener("input", applyProductFilters);
}


// ==========================
// فلترة التصنيف
// ==========================

const categoryFilter =
  document.getElementById("categoryFilter");

if (categoryFilter) {
  categoryFilter.addEventListener(
    "change",
    applyProductFilters
  );
}


function applyProductFilters() {
  const search =
    document
      .getElementById("productSearch")
      ?.value
      .trim()
      .toLowerCase() || "";

  const category =
    document
      .getElementById("categoryFilter")
      ?.value || "";

  filteredProducts = products.filter(product => {

    const name =
      String(product.name || "").toLowerCase();

    const productCategory =
      String(product.category || "");

    const matchesSearch =
      !search ||
      name.includes(search) ||
      productCategory.toLowerCase().includes(search);

    const matchesCategory =
      !category ||
      productCategory === category;

    return matchesSearch && matchesCategory;
  });

  renderAdminProducts();
}


// ==========================
// تحديث قائمة التصنيفات
// ==========================

function updateCategoryFilter() {
  const select =
    document.getElementById("categoryFilter");

  if (!select) return;

  const currentValue = select.value;

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    String(a).localeCompare(
      String(b),
      "ar"
    )
  );

  select.innerHTML = `
    <option value="">كل التصنيفات</option>
    ${categories
      .map(category => `
        <option value="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </option>
      `)
      .join("")}
  `;

  if (
    categories.includes(currentValue)
  ) {
    select.value = currentValue;
  }
}


// ==========================
// عرض المنتجات
// ==========================

function renderAdminProducts() {
  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;

  const productCount =
    document.getElementById("productCount");

  if (productCount) {
    productCount.textContent =
      products.length;
  }

  const visibleCount =
    document.getElementById("visibleProductCount");

  if (visibleCount) {
    visibleCount.textContent =
      filteredProducts.length;
  }

  if (!filteredProducts.length) {

    const hasFilters =
      document
        .getElementById("productSearch")
        ?.value.trim() ||
      document
        .getElementById("categoryFilter")
        ?.value;

    grid.innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">
          ${hasFilters ? "🔎" : "📦"}
        </div>

        <h3>
          ${
            hasFilters
              ? "لا توجد نتائج"
              : "لا توجد منتجات حتى الآن"
          }
        </h3>

        <p>
          ${
            hasFilters
              ? "جرّب تغيير كلمة البحث أو التصنيف."
              : "ابدأ بإضافة أول منتج إلى المتجر."
          }
        </p>

        ${
          hasFilters
            ? `
              <button
                type="button"
                class="secondary-button"
                onclick="clearProductFilters()"
              >
                مسح الفلاتر
              </button>
            `
            : ""
        }
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filteredProducts
      .map(renderProductCard)
      .join("");
}


// ==========================
// بطاقة المنتج
// ==========================

function renderProductCard(product) {

  const image =
    product.images &&
    product.images.length
      ? product.images[0]
      : "/images/logo.jpg";

  const price =
    Number(product.price || 0);

  const oldPrice =
    Number(product.oldPrice || 0);

  const hasOldPrice =
    oldPrice > price;

  const sizes =
    Array.isArray(product.sizes)
      ? product.sizes
      : [];

  const totalSizeStock =
    sizes.reduce(
      (sum, size) =>
        sum + Number(size.quantity || 0),
      0
    );

  const stock =
    sizes.length
      ? totalSizeStock
      : Number(product.stock || 0);

  const available =
    product.isAvailable !== false &&
    stock > 0;

  const availabilityClass =
    available
      ? "available"
      : "unavailable";

  const availabilityText =
    available
      ? "متوفر"
      : "غير متوفر";

  const sizesText =
    sizes.length
      ? sizes
          .map(size =>
            `${escapeHtml(size.name)} (${Number(size.quantity || 0)})`
          )
          .join(" • ")
      : "";

  return `
    <article class="admin-product-card">

      <div class="admin-product-image">

        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(product.name || "منتج")}"
          loading="lazy"
          onerror="this.onerror=null;this.src='/images/logo.jpg';"
        >

        <span class="product-status ${availabilityClass}">
          ${availabilityText}
        </span>

      </div>

      <div class="admin-product-info">

        <div class="product-category">
          ${escapeHtml(product.category || "بدون تصنيف")}
        </div>

        <h3>
          ${escapeHtml(product.name || "منتج بدون اسم")}
        </h3>

        ${
          product.description
            ? `
              <p class="product-description">
                ${escapeHtml(
                  truncateText(product.description, 90)
                )}
              </p>
            `
            : ""
        }

        <div class="product-price-row">

          <strong class="product-price">
            ${formatPrice(price)}
          </strong>

          ${
            hasOldPrice
              ? `
                <span class="product-old-price">
                  ${formatPrice(oldPrice)}
                </span>
              `
              : ""
          }

        </div>

        <div class="product-stock">
          <span>المخزون:</span>
          <strong>${stock}</strong>
        </div>

        ${
          sizes.length
            ? `
              <div class="product-sizes">
                <span>المقاسات:</span>
                <div>${sizesText}</div>
              </div>
            `
            : ""
        }

        <div class="product-actions">

          <button
            type="button"
            class="edit-button"
            onclick="editProduct('${escapeJs(product._id)}')"
          >
            ✏️ تعديل
          </button>

          <button
            type="button"
            class="delete-button"
            onclick="deleteProduct('${escapeJs(product._id)}')"
          >
            🗑️ حذف
          </button>

        </div>

      </div>

    </article>
  `;
}


// ==========================
// مسح الفلاتر
// ==========================

function clearProductFilters() {

  const search =
    document.getElementById("productSearch");

  const category =
    document.getElementById("categoryFilter");

  if (search) {
    search.value = "";
  }

  if (category) {
    category.value = "";
  }

  filteredProducts = [...products];

  renderAdminProducts();
}


// ==========================
// إضافة منتج
// ==========================

function openProductForm() {

  const form =
    document.getElementById("productForm");

  if (!form) return;

  form.reset();

  const productId =
    document.getElementById("productId");

  if (productId) {
    productId.value = "";
  }

  const formTitle =
    document.getElementById("formTitle");

  if (formTitle) {
    formTitle.textContent =
      "إضافة منتج جديد";
  }

  const formMessage =
    document.getElementById("formMessage");

  if (formMessage) {
    formMessage.textContent = "";
  }

  const imageInputs =
    document.getElementById("imageInputs");

  if (imageInputs) {
    imageInputs.innerHTML = `
      <div class="image-input-row">

        <input
          class="image-url"
          type="url"
          placeholder="https://example.com/image.jpg"
          required
        >

      </div>
    `;
  }

  const sizesInputs =
    document.getElementById("sizesInputs");

  if (sizesInputs) {
    sizesInputs.innerHTML = "";
    addSizeInput();
  }

  const available =
    document.getElementById("isAvailable");

  if (available) {
    available.checked = true;
  }

  const modal =
    document.getElementById("productModal");

  if (modal) {
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
}


// ==========================
// إغلاق نموذج المنتج
// ==========================

function closeProductForm() {

  const modal =
    document.getElementById("productModal");

  if (!modal) return;

  modal.classList.remove("active");
  document.body.classList.remove("modal-open");
}


// ==========================
// إغلاق عند الضغط خارج النافذة
// ==========================

const productModal =
  document.getElementById("productModal");

if (productModal) {

  productModal.addEventListener(
    "click",
    event => {

      if (
        event.target === productModal
      ) {
        closeProductForm();
      }

    }
  );
}


// ==========================
// إضافة مقاس
// ==========================

function addSizeInput(
  name = "",
  quantity = 0
) {

  const container =
    document.getElementById("sizesInputs");

  if (!container) return;

  const row =
    document.createElement("div");

  row.className =
    "size-input-row";

  row.innerHTML = `
    <input
      class="size-name"
      type="text"
      placeholder="المقاس مثل S أو M أو 38"
      value="${escapeHtml(name)}"
    >

    <input
      class="size-quantity"
      type="number"
      min="0"
      placeholder="الكمية"
      value="${Number(quantity) || 0}"
    >

    <button
      type="button"
      class="remove-image"
      onclick="this.parentElement.remove()"
      aria-label="حذف المقاس"
    >
      ✕
    </button>
  `;

  container.appendChild(row);
}


// ==========================
// إضافة رابط صورة
// ==========================

function addImageInput(value = "") {

  const container =
    document.getElementById("imageInputs");

  if (!container) return;

  const row =
    document.createElement("div");

  row.className =
    "image-input-row";

  row.innerHTML = `
    <input
      class="image-url"
      type="url"
      placeholder="https://example.com/image.jpg"
      value="${escapeHtml(value)}"
    >

    <button
      type="button"
      class="remove-image"
      onclick="this.parentElement.remove()"
      aria-label="حذف الصورة"
    >
      ✕
    </button>
  `;

  container.appendChild(row);
}


// ==========================
// حفظ المنتج
// ==========================

const productForm =
  document.getElementById("productForm");

if (productForm) {
  productForm.addEventListener(
    "submit",
    saveProduct
  );
}


async function saveProduct(event) {

  event.preventDefault();

  const id =
    document.getElementById("productId")
      ?.value.trim();

  const formMessage =
    document.getElementById("formMessage");

  if (formMessage) {
    formMessage.textContent =
      "جاري حفظ المنتج...";
    formMessage.style.color = "";
  }

  // الصور
  const images =
    [
      ...document.querySelectorAll(".image-url")
    ]
      .map(input =>
        input.value.trim()
      )
      .filter(Boolean);

  if (!images.length) {

    if (formMessage) {
      formMessage.textContent =
        "أضف رابط صورة واحد على الأقل";
      formMessage.style.color =
        "crimson";
    }

    return;
  }

  // المقاسات
  const sizes =
    [
      ...document.querySelectorAll(
        ".size-input-row"
      )
    ]
      .map(row => {

        const name =
          row
            .querySelector(".size-name")
            ?.value
            .trim() || "";

        const quantity =
          Number(
            row
              .querySelector(".size-quantity")
              ?.value || 0
          );

        return {
          name,
          quantity:
            Number.isFinite(quantity) &&
            quantity >= 0
              ? quantity
              : 0
        };

      })
      .filter(size => size.name);

  const price =
    Number(
      document.getElementById("price")
        ?.value || 0
    );

  const oldPriceValue =
    document.getElementById("oldPrice")
      ?.value;

  const stock =
    Number(
      document.getElementById("stock")
        ?.value || 0
    );

  const product = {

    name:
      document.getElementById("name")
        ?.value
        .trim() || "",

    price,

    oldPrice:
      oldPriceValue
        ? Number(oldPriceValue)
        : null,

    category:
      document.getElementById("category")
        ?.value || "",

    description:
      document.getElementById("description")
        ?.value
        .trim() || "",

    stock:
      Number.isFinite(stock) && stock >= 0
        ? stock
        : 0,

    images,

    sizes,

    isAvailable:
      document.getElementById("isAvailable")
        ?.checked !== false

  };

  // تحقق أساسي
  if (!product.name) {
    showFormError("اكتب اسم المنتج");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    showFormError("أدخل سعرًا صحيحًا");
    return;
  }

  if (!product.category) {
    showFormError("اختر تصنيف المنتج");
    return;
  }

  try {

    const response =
      await fetch(
        id
          ? `${API}/products/${encodeURIComponent(id)}`
          : `${API}/products`,
        {
          method: id
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "include",

          body:
            JSON.stringify(product)
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "حدث خطأ أثناء حفظ المنتج"
      );
    }

    closeProductForm();

    await loadAdminProducts();

  } catch (error) {

    console.error(
      "Save product error:",
      error
    );

    showFormError(
      error.message ||
      "تعذر حفظ المنتج"
    );
  }
}


function showFormError(message) {

  const formMessage =
    document.getElementById("formMessage");

  if (!formMessage) {
    alert(message);
    return;
  }

  formMessage.textContent =
    message;

  formMessage.style.color =
    "crimson";
}


// ==========================
// تعديل المنتج
// ==========================

function editProduct(id) {

  const product =
    products.find(
      item => String(item._id) === String(id)
    );

  if (!product) return;

  document.getElementById("productId").value =
    product._id;

  document.getElementById("name").value =
    product.name || "";

  document.getElementById("price").value =
    product.price ?? "";

  document.getElementById("oldPrice").value =
    product.oldPrice ?? "";

  document.getElementById("category").value =
    product.category || "";

  document.getElementById("description").value =
    product.description || "";

  document.getElementById("stock").value =
    product.stock ?? 0;

  // المقاسات
  const sizesContainer =
    document.getElementById("sizesInputs");

  if (sizesContainer) {

    sizesContainer.innerHTML = "";

    if (
      Array.isArray(product.sizes) &&
      product.sizes.length
    ) {

      product.sizes.forEach(size => {
        addSizeInput(
          size.name || "",
          size.quantity || 0
        );
      });

    } else {

      addSizeInput();
    }
  }

  // التوفر
  const available =
    document.getElementById("isAvailable");

  if (available) {
    available.checked =
      product.isAvailable !== false;
  }

  // الصور
  const imageContainer =
    document.getElementById("imageInputs");

  if (imageContainer) {

    imageContainer.innerHTML = "";

    if (
      Array.isArray(product.images) &&
      product.images.length
    ) {

      product.images.forEach(image => {
        addImageInput(image);
      });

    } else {

      addImageInput();
    }
  }

  const formTitle =
    document.getElementById("formTitle");

  if (formTitle) {
    formTitle.textContent =
      "تعديل المنتج";
  }

  const formMessage =
    document.getElementById("formMessage");

  if (formMessage) {
    formMessage.textContent = "";
  }

  const modal =
    document.getElementById("productModal");

  if (modal) {
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
}


// ==========================
// حذف المنتج
// ==========================

async function deleteProduct(id) {

  const product =
    products.find(
      item => String(item._id) === String(id)
    );

  if (!product) return;

  const confirmed =
    confirm(
      `هل تريد حذف "${product.name}"؟`
    );

  if (!confirmed) return;

  try {

    const response =
      await fetch(
        `${API}/products/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "فشل حذف المنتج"
      );
    }

    await loadAdminProducts();

  } catch (error) {

    console.error(
      "Delete product error:",
      error
    );

    alert(
      error.message ||
      "تعذر حذف المنتج"
    );
  }
}


// ==========================
// تسجيل الخروج
// ==========================

async function logout() {

  try {

    await fetch(
      `${API}/auth/logout`,
      {
        method: "POST",
        credentials: "include"
      }
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  } finally {

    window.location.href =
      "/admin/login.html";
  }
}


// ==========================
// عدد الطلبات
// ==========================

async function loadOrderCount() {

  try {

    const response =
      await fetch(
        `${API}/orders/admin`,
        {
          credentials: "include"
        }
      );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    const orders =
      data.orders || [];

    const orderCount =
      document.getElementById("orderCount");

    if (orderCount) {
      orderCount.textContent =
        orders.length;
    }

    // إحصائيات إضافية إن كانت موجودة في HTML
    updateOrderStats(orders);

  } catch (error) {

    console.error(
      "تعذر تحميل عدد الطلبات:",
      error
    );
  }
}


function updateOrderStats(orders) {

  const totalOrders =
    orders.length;

  const activeOrders =
    orders.filter(order =>
      order.status !== "تم التوصيل"
    ).length;

  const deliveredOrders =
    orders.filter(order =>
      order.status === "تم التوصيل"
    ).length;

  const totalSales =
    orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

  const elements = {
    totalOrders:
      document.getElementById("totalOrders"),

    activeOrders:
      document.getElementById("activeOrders"),

    deliveredOrders:
      document.getElementById("deliveredOrders"),

    totalSales:
      document.getElementById("totalSales")
  };

  if (elements.totalOrders) {
    elements.totalOrders.textContent =
      totalOrders;
  }

  if (elements.activeOrders) {
    elements.activeOrders.textContent =
      activeOrders;
  }

  if (elements.deliveredOrders) {
    elements.deliveredOrders.textContent =
      deliveredOrders;
  }

  if (elements.totalSales) {
    elements.totalSales.textContent =
      formatPrice(totalSales);
  }
}


// ==========================
// أدوات
// ==========================

function formatPrice(price) {

  const number =
    Number(price || 0);

  return (
    number.toLocaleString("ar-YE") +
    " ريال"
  );
}


function truncateText(text, maxLength) {

  const value =
    String(text || "");

  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.substring(0, maxLength) +
    "…"
  );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJs(value) {

  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}


// ==========================
// جعل الدوال متاحة للأزرار
// ==========================

window.openProductForm =
  openProductForm;

window.closeProductForm =
  closeProductForm;

window.addSizeInput =
  addSizeInput;

window.addImageInput =
  addImageInput;

window.editProduct =
  editProduct;

window.deleteProduct =
  deleteProduct;

window.logout =
  logout;

window.loadAdminProducts =
  loadAdminProducts;

window.clearProductFilters =
  clearProductFilters;
