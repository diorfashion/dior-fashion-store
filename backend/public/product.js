const API_URL = "/api/products";

let product = null;
let selectedSize = null;
let selectedQuantity = 1;


// الحصول على معرف المنتج

const params =
  new URLSearchParams(
    window.location.search
  );

const productId =
  params.get("id");


// تحميل المنتج

async function loadProduct() {

  const container =
    document.getElementById(
      "productDetails"
    );

  if (!productId) {

    container.innerHTML = `
      <p>المنتج غير موجود</p>
    `;

    return;
  }

  try {

    const response =
      await fetch(
        `${API_URL}/${productId}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success ||
      !data.product
    ) {
      throw new Error(
        "المنتج غير موجود"
      );
    }

    product = data.product;

    document.title =
      `${product.name} | ديور للأزياء`;

    renderProduct();

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="loading-details">
        تعذر تحميل المنتج
      </div>
    `;
  }
}


// عرض المنتج

function renderProduct() {

  const container =
    document.getElementById(
      "productDetails"
    );

  const images =
    product.images &&
    product.images.length
      ? product.images
      : ["images/logo.jpg"];

  const oldPrice =
    product.oldPrice
      ? `
        <span class="details-old-price">
          ${formatPrice(product.oldPrice)}
        </span>
      `
      : "";

  const sizes =
    product.sizes || [];

  container.className =
    "details-layout";

  container.innerHTML = `

    <div>

      <img
        id="mainProductImage"
        class="main-product-image"
        src="${escapeHtml(images[0])}"
        alt="${escapeHtml(product.name)}"
        onerror="this.src='images/logo.jpg'"
      >

      <div class="product-thumbnails">

        ${images.map((image, index) => `
          <img
            class="product-thumbnail ${index === 0 ? "active" : ""}"
            src="${escapeHtml(image)}"
            alt=""
            onclick="changeMainImage(
              '${escapeHtml(image)}',
              this
            )"
            onerror="this.src='images/logo.jpg'"
          >
        `).join("")}

      </div>

    </div>


    <div>

      <h1 class="details-name">
        ${escapeHtml(product.name)}
      </h1>

      <div class="details-category">
        ${escapeHtml(product.category || "")}
      </div>

      <div class="details-price">
        ${formatPrice(product.price)}
        ${oldPrice}
      </div>


      <div class="details-description">
        ${
          escapeHtml(
            product.description ||
            "لا يوجد وصف لهذا المنتج."
          )
        }
      </div>


      <div class="sizes-title">
        اختر المقاس
      </div>

      <div class="sizes-list">

        ${
          sizes.length
            ? sizes.map((size, index) => `
                <button
                  class="size-button"
                  ${size.quantity <= 0 ? "disabled" : ""}
                  onclick="selectSize(${index})"
                  id="size-${index}"
                >
                  ${escapeHtml(size.name)}
                </button>
              `).join("")
            : `
              <span>
                لا توجد مقاسات محددة لهذا المنتج
              </span>
            `
        }

      </div>


      <div
        id="selectedSizeInfo"
        class="selected-size-info"
      >
        اختر المقاس أولاً
      </div>


      <div class="quantity-box">

        <button
          onclick="changeProductQuantity(-1)"
        >
          −
        </button>

        <span id="productQuantity">
          1
        </span>

        <button
          onclick="changeProductQuantity(1)"
        >
          +
        </button>

      </div>


      <button
        id="addProductButton"
        class="details-add-cart"
        onclick="addProductToCart()"
        disabled
      >
        🛒 إضافة إلى السلة
      </button>

    </div>
  `;
}


// اختيار المقاس

function selectSize(index) {

  if (!product.sizes[index]) return;

  const size =
    product.sizes[index];

  if (size.quantity <= 0) return;

  selectedSize = size;
  selectedQuantity = 1;

  document
    .querySelectorAll(".size-button")
    .forEach(button => {
      button.classList.remove(
        "selected"
      );
    });

  document
    .getElementById(`size-${index}`)
    .classList.add("selected");

  document.getElementById(
    "productQuantity"
  ).textContent = "1";

  document.getElementById(
    "selectedSizeInfo"
  ).textContent =
    `المقاس: ${size.name} — المتوفر: ${size.quantity}`;

  document.getElementById(
    "addProductButton"
  ).disabled = false;
}


// تغيير الكمية

function changeProductQuantity(amount) {

  if (!selectedSize) {

    alert("اختر المقاس أولاً");

    return;
  }

  selectedQuantity += amount;

  if (selectedQuantity < 1) {
    selectedQuantity = 1;
  }

  if (
    selectedQuantity >
    selectedSize.quantity
  ) {
    selectedQuantity =
      selectedSize.quantity;

    alert(
      "لا توجد كمية إضافية من هذا المقاس"
    );
  }

  document.getElementById(
    "productQuantity"
  ).textContent =
    selectedQuantity;
}


// إضافة للسلة

function addProductToCart() {

  if (!selectedSize) {

    alert("اختر المقاس أولاً");

    return;
  }

  let cart =
    JSON.parse(
      localStorage.getItem(
        "dior_cart"
      ) || "[]"
    );

  const cartKey =
    `${product._id}_${selectedSize.name}`;

  const existing =
    cart.find(
      item =>
        item.cartKey === cartKey
    );

  if (existing) {

    const newQuantity =
      existing.quantity +
      selectedQuantity;

    if (
      newQuantity >
      selectedSize.quantity
    ) {
      alert(
        "الكمية المطلوبة أكبر من المتوفر"
      );
      return;
    }

    existing.quantity =
      newQuantity;

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
        selectedSize.name,

      quantity:
        selectedQuantity

    });

  }

  localStorage.setItem(
    "dior_cart",
    JSON.stringify(cart)
  );

  alert(
    "تمت إضافة المنتج إلى السلة 🛒"
  );
}


// تغيير الصورة الرئيسية

function changeMainImage(
  image,
  element
) {

  document.getElementById(
    "mainProductImage"
  ).src = image;

  document
    .querySelectorAll(
      ".product-thumbnail"
    )
    .forEach(
      thumbnail =>
        thumbnail.classList.remove(
          "active"
        )
    );

  element.classList.add(
    "active"
  );
}


// السعر

function formatPrice(price) {

  return Number(price)
    .toLocaleString("ar-YE")
    + " ريال";
}


// حماية HTML

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


loadProduct();
