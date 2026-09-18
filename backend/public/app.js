const API_URL = "/api/products";

let allProducts = [];
let filteredProducts = [];

let cart = JSON.parse(
  localStorage.getItem("dior_cart") || "[]"
);

let selectedProduct = null;
let selectedSize = null;
let selectedQuantity = 1;


// =========================
// تحميل المنتجات
// =========================

async function loadProducts() {

  const grid =
    document.getElementById("productsGrid");

  try {

    const response =
      await fetch(API_URL);

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        "Failed to load products"
      );
    }

    allProducts = data.products;

    filteredProducts = [
      ...allProducts
    ];

    renderProducts(
      filteredProducts
    );

  } catch (error) {

    console.error(error);

    grid.innerHTML = `
      <div class="loading">
        تعذر تحميل المنتجات
      </div>
    `;

  }
}


// =========================
// عرض المنتجات
// =========================

function renderProducts(products) {

  const grid =
    document.getElementById(
      "productsGrid"
    );

  if (!products.length) {

    grid.innerHTML = `
      <div class="loading">
        لا توجد منتجات حالياً
      </div>
    `;

    return;
  }

  grid.innerHTML =
    products.map(product => {

      const image =
        product.images &&
        product.images.length
          ? product.images[0]
          : "images/logo.jpg";

      const oldPrice =
        product.oldPrice
          ? `
            <span class="product-old-price">
              ${formatPrice(
                product.oldPrice
              )}
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
              ${escapeHtml(
                product.name
              )}
            </div>

            <div class="product-category">
              ${escapeHtml(
                product.category || ""
              )}
            </div>

            <div class="product-price">
              ${formatPrice(
                product.price
              )}

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


// =========================
// فتح تفاصيل المنتج
// =========================

function openProduct(productId) {

  window.location.href =
    `/product.html?id=${encodeURIComponent(
      productId
    )}`;

}


// =========================
// إضافة للسلة
// =========================

function addToCart(productId) {

  const product =
    allProducts.find(
      p => p._id === productId
    );

  if (!product) {
    return;
  }


  // إذا كان المنتج لديه مقاسات

  if (
    product.sizes &&
    product.sizes.length > 0
  ) {

    selectedProduct = product;

    selectedSize = null;

    selectedQuantity = 1;

    showSizeSelector();

    return;
  }


  // منتج بدون مقاسات

  addProductToCart(
    product,
    "",
    1
  );

}


// =========================
// نافذة اختيار المقاس
// =========================

function showSizeSelector() {

  const availableSizes =
    selectedProduct.sizes.filter(
      size =>
        Number(size.quantity) > 0
    );


  if (!availableSizes.length) {

    alert(
      "هذا المنتج غير متوفر حالياً"
    );

    return;
  }


  let overlay =
    document.getElementById(
      "sizeSelectorOverlay"
    );


  if (!overlay) {

    overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "sizeSelectorOverlay";

    document.body.appendChild(
      overlay
    );

  }


  overlay.innerHTML = `

    <div
      class="size-selector-box"
      onclick="event.stopPropagation()"
    >

      <button
        class="size-selector-close"
        onclick="closeSizeSelector()"
      >
        ✕
      </button>

      <h2>
        اختر المقاس
      </h2>

      <p>
        ${escapeHtml(
          selectedProduct.name
        )}
      </p>

      <div class="size-options">

        ${
          selectedProduct.sizes
            .map(size => {

              const quantity =
                Number(
                  size.quantity
                );

              const disabled =
                quantity <= 0;

              return `
                <button
                  type="button"
                  class="
                    size-option
                    ${
                      disabled
                        ? "disabled"
                        : ""
                    }
                  "
                  ${
                    disabled
                      ? "disabled"
                      : ""
                  }
                  onclick="
                    selectCartSize(
                      '${escapeHtml(
                        size.name
                      )}'
                    )
                  "
                >
                  ${escapeHtml(
                    size.name
                  )}

                  ${
                    disabled
                      ? `
                        <small>
                          غير متوفر
                        </small>
                      `
                      : `
                        <small>
                          متوفر
                        </small>
                      `
                  }

                </button>
              `;

            })
            .join("")
        }

      </div>

      <div
        id="selectedSizeInfo"
        class="selected-size-info"
      >
        اختر المقاس أولاً
      </div>


      <div
        class="cart-quantity-selector"
      >

        <button
          type="button"
          onclick="changeSelectedQuantity(-1)"
        >
          −
        </button>

        <span id="selectedQuantity">
          1
        </span>

        <button
          type="button"
          onclick="changeSelectedQuantity(1)"
        >
          +
        </button>

      </div>


      <button
        type="button"
        class="confirm-size-button"
        onclick="confirmSizeSelection()"
      >
        🛒 إضافة إلى السلة
      </button>

    </div>

  `;


  overlay.style.display =
    "flex";


  overlay.onclick =
    function(event) {

      if (
        event.target === overlay
      ) {

        closeSizeSelector();

      }

    };

}


// =========================
// اختيار المقاس
// =========================

function selectCartSize(
  sizeName
) {

  const size =
    selectedProduct.sizes.find(
      s =>
        s.name === sizeName
    );

  if (!size) {
    return;
  }


  if (
    Number(size.quantity) <= 0
  ) {

    return;
  }


  selectedSize = size;

  selectedQuantity = 1;


  document
    .querySelectorAll(
      ".size-option"
    )
    .forEach(button => {

      button.classList.remove(
        "selected"
      );

    });


  document
    .querySelectorAll(
      ".size-option"
    )
    .forEach(button => {

      if (
        button.textContent
          .trim()
          .startsWith(
            size.name
          )
      ) {

        button.classList.add(
          "selected"
        );

      }

    });


  updateSelectedQuantity();


  const info =
    document.getElementById(
      "selectedSizeInfo"
    );

  if (info) {

    info.innerHTML = `
      المقاس المختار:
      <strong>
        ${escapeHtml(
          size.name
        )}
      </strong>

      <br>

      المتوفر:
      ${size.quantity}
    `;

  }

}


// =========================
// تغيير الكمية
// =========================

function changeSelectedQuantity(
  amount
) {

  if (!selectedSize) {

    alert(
      "اختر المقاس أولاً"
    );

    return;
  }


  const maxQuantity =
    Number(
      selectedSize.quantity
    );


  selectedQuantity += amount;


  if (selectedQuantity < 1) {

    selectedQuantity = 1;

  }


  if (
    selectedQuantity >
    maxQuantity
  ) {

    selectedQuantity =
      maxQuantity;

  }


  updateSelectedQuantity();

}


// =========================
// تحديث الكمية
// =========================

function updateSelectedQuantity() {

  const element =
    document.getElementById(
      "selectedQuantity"
    );

  if (element) {

    element.textContent =
      selectedQuantity;

  }

}


// =========================
// تأكيد اختيار المقاس
// =========================

function confirmSizeSelection() {

  if (!selectedSize) {

    alert(
      "يرجى اختيار المقاس أولاً"
    );

    return;
  }


  addProductToCart(
    selectedProduct,
    selectedSize.name,
    selectedQuantity
  );


  closeSizeSelector();

}


// =========================
// إضافة المنتج فعلياً للسلة
// =========================

function addProductToCart(
  product,
  sizeName,
  quantity
) {

  const cartKey =
    product._id +
    "_" +
    sizeName;


  const existing =
    cart.find(
      item =>
        item.cartKey === cartKey
    );


  if (existing) {

    let maxQuantity =
      quantity;


    if (
      product.sizes &&
      product.sizes.length
    ) {

      const size =
        product.sizes.find(
          s =>
            s.name === sizeName
        );

      if (size) {

        maxQuantity =
          Number(
            size.quantity
          );

      }

    }


    existing.quantity =
      Math.min(
        existing.quantity +
        quantity,
        maxQuantity
      );

  } else {

    cart.push({

      cartKey,

      productId:
        product._id,

      name:
        product.name,

      price:
        product.price,

      image:
        product.images &&
        product.images.length
          ? product.images[0]
          : "images/logo.jpg",

      size:
        sizeName,

      quantity

    });

  }


  saveCart();

  updateCartCount();

  alert(
    "تمت إضافة المنتج إلى السلة 🛒"
  );

}


// =========================
// إغلاق نافذة المقاس
// =========================

function closeSizeSelector() {

  const overlay =
    document.getElementById(
      "sizeSelectorOverlay"
    );

  if (overlay) {

    overlay.style.display =
      "none";

  }

}


// =========================
// البحث
// =========================

function searchProducts() {

  const value =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .trim()
      .toLowerCase();


  filteredProducts =
    allProducts.filter(
      product => {

        return (

          product.name
            .toLowerCase()
            .includes(value)

          ||

          (
            product.category ||
            ""
          )
            .toLowerCase()
            .includes(value)

        );

      }
    );


  document.getElementById(
    "productsTitle"
  ).textContent =
    value
      ? "نتائج البحث"
      : "أحدث المنتجات";


  renderProducts(
    filteredProducts
  );

}


// =========================
// التصنيف
// =========================

function filterCategory(
  category
) {

  filteredProducts =
    allProducts.filter(
      product =>
        product.category ===
        category
    );


  document.getElementById(
    "productsTitle"
  ).textContent =
    category;


  renderProducts(
    filteredProducts
  );


  scrollToProducts();

}


// =========================
// عرض الكل
// =========================

function showAllProducts() {

  filteredProducts =
    [
      ...allProducts
    ];


  document.getElementById(
    "productsTitle"
  ).textContent =
    "أحدث المنتجات";


  renderProducts(
    filteredProducts
  );

}


// =========================
// حفظ السلة
// =========================

function saveCart() {

  localStorage.setItem(
    "dior_cart",
    JSON.stringify(cart)
  );

}


// =========================
// عدد المنتجات
// =========================

function updateCartCount() {

  const count =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity),
      0
    );


  const element =
    document.getElementById(
      "cartCount"
    );


  if (element) {

    element.textContent =
      count;

  }

}


// =========================
// فتح السلة
// =========================

function openCart() {

  renderCart();

  document
    .getElementById(
      "cartOverlay"
    )
    .classList.add(
      "active"
    );

}


// =========================
// إغلاق السلة
// =========================

function closeCart(event) {

  if (
    !event ||
    event.target.id ===
      "cartOverlay"
  ) {

    document
      .getElementById(
        "cartOverlay"
      )
      .classList.remove(
        "active"
      );

  }

}


// =========================
// عرض السلة
// =========================

function renderCart() {

  const container =
    document.getElementById(
      "cartItems"
    );


  if (!cart.length) {

    container.innerHTML = `
      <div class="loading">
        السلة فارغة 🛒
      </div>
    `;


    document.getElementById(
      "cartTotal"
    ).textContent =
      "0 ريال";


    return;
  }


  container.innerHTML =
    cart.map(item => {

      return `

        <div class="cart-item">

          <img
            src="${escapeHtml(
              item.image
            )}"
            alt="${escapeHtml(
              item.name
            )}"
            onerror="this.src='images/logo.jpg'"
          >

          <div
            class="cart-item-info"
          >

            <strong>
              ${escapeHtml(
                item.name
              )}
            </strong>

            ${
              item.size
                ? `
                  <div>
                    المقاس:
                    <strong>
                      ${escapeHtml(
                        item.size
                      )}
                    </strong>
                  </div>
                `
                : ""
            }

            <div>
              ${formatPrice(
                item.price
              )}
            </div>

            <div
              class="quantity-controls"
            >

              <button
                onclick="
                  changeQuantity(
                    '${escapeHtml(
                      item.cartKey ||
                      item.productId
                    )}',
                    1
                  )
                "
              >
                +
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                onclick="
                  changeQuantity(
                    '${escapeHtml(
                      item.cartKey ||
                      item.productId
                    )}',
                    -1
                  )
                "
              >
                −
              </button>

              <button
                onclick="
                  removeFromCart(
                    '${escapeHtml(
                      item.cartKey ||
                      item.productId
                    )}'
                  )
                "
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
        Number(item.price) *
        Number(item.quantity),
      0
    );


  document.getElementById(
    "cartTotal"
  ).textContent =
    formatPrice(total);

}


// =========================
// تغيير كمية السلة
// =========================

function changeQuantity(
  cartKey,
  amount
) {

  const item =
    cart.find(
      item =>
        (
          item.cartKey ||
          item.productId
        ) === cartKey
    );


  if (!item) {
    return;
  }


  if (
    amount > 0 &&
    item.size
  ) {

    const product =
      allProducts.find(
        p =>
          p._id ===
          item.productId
      );


    if (product) {

      const size =
        product.sizes.find(
          s =>
            s.name ===
            item.size
        );


      if (
        size &&
        item.quantity >=
          Number(size.quantity)
      ) {

        alert(
          "لا توجد كمية إضافية من هذا المقاس"
        );

        return;
      }

    }

  }


  item.quantity += amount;


  if (
    item.quantity <= 0
  ) {

    cart =
      cart.filter(
        cartItem =>
          (
            cartItem.cartKey ||
            cartItem.productId
          ) !== cartKey
      );

  }


  saveCart();

  updateCartCount();

  renderCart();

}


// =========================
// حذف من السلة
// =========================

function removeFromCart(
  cartKey
) {

  cart =
    cart.filter(
      item =>
        (
          item.cartKey ||
          item.productId
        ) !== cartKey
    );


  saveCart();

  updateCartCount();

  renderCart();

}


// =========================
// إتمام الطلب
// =========================

function checkout() {

  if (!cart.length) {

    alert(
      "السلة فارغة"
    );

    return;
  }


  window.location.href =
    "/checkout.html";

}


// =========================
// الانتقال للمنتجات
// =========================

function scrollToProducts() {

  document
    .getElementById(
      "productsSection"
    )
    .scrollIntoView({
      behavior: "smooth"
    });

}


// =========================
// تنسيق السعر
// =========================

function formatPrice(
  price
) {

  return Number(price)
    .toLocaleString("ar-YE")
    + " ريال";

}


// =========================
// حماية النص
// =========================

function escapeHtml(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// =========================
// تشغيل
// =========================

loadProducts();

updateCartCount();
