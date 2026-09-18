const API = "/api";

let products = [];


// ==========================
// تسجيل الدخول
// ==========================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const username =
        document
          .getElementById("username")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value;

      const message =
        document
          .getElementById("loginMessage");

      try {

        const response =
          await fetch(
            `${API}/auth/login`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              credentials: "include",

              body: JSON.stringify({
                username,
                password
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
            "فشل تسجيل الدخول"
          );

        }

        window.location.href =
          "/admin";

      } catch (error) {

        message.textContent =
          error.message;

        message.style.color =
          "crimson";
      }

    }
  );

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

    const response =
      await fetch(
        `${API}/auth/me`,
        {
          credentials: "include"
        }
      );

    if (!response.ok) {

      window.location.href =
        "/admin/login.html";

      return;
    }

    await loadAdminProducts();

  } catch (error) {

    window.location.href =
      "/admin/login.html";

  }

}


// ==========================
// المنتجات
// ==========================

async function loadAdminProducts() {

  const response =
    await fetch(
      `${API}/products`
    );

  const data =
    await response.json();

  products =
    data.products || [];

  renderAdminProducts();

}


function renderAdminProducts() {

  const grid =
    document.getElementById(
      "productsGrid"
    );

  if (!grid) return;

  document.getElementById(
    "productCount"
  ).textContent =
    products.length;


  if (!products.length) {

    grid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:40px;
        color:#777;
      ">
        لا توجد منتجات حتى الآن
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
          : "../images/logo.jpg";


      return `
        <div class="admin-product">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name)}"
            onerror="this.src='../images/logo.jpg'"
          >

          <div class="admin-product-info">

            <h3>
              ${escapeHtml(product.name)}
            </h3>

            <p>
              ${escapeHtml(product.category)}
            </p>

            <strong>
              ${formatPrice(product.price)}
            </strong>

            <div class="admin-actions">

              <button
                class="edit-button"
                onclick="editProduct('${product._id}')"
              >
                تعديل
              </button>

              <button
                class="delete-button"
                onclick="deleteProduct('${product._id}')"
              >
                حذف
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");

}


// ==========================
// إضافة منتج
// ==========================

function openProductForm() {

  document.getElementById(
    "productForm"
  ).reset();

  document.getElementById(
    "productId"
  ).value = "";

  document.getElementById(
    "formTitle"
  ).textContent =
    "إضافة منتج";

  document.getElementById(
    "imageInputs"
  ).innerHTML = `
    <div class="image-input-row">

      <input
        class="image-url"
        placeholder="https://example.com/image.jpg"
        required
      >

    </div>
  `;

  document.getElementById(
    "isAvailable"
  ).checked = true;
  document.getElementById(
  "sizesInputs"
).innerHTML = "";

addSizeInput();

  document.getElementById(
    "productModal"
  ).classList.add("active");

}


function closeProductForm() {

  document.getElementById(
    "productModal"
  ).classList.remove("active");

}


// ==========================
// إضافة رابط صورة
// ==========================
function addSizeInput(name = "", quantity = 0) {
  const container =
    document.getElementById("sizesInputs");

  const row =
    document.createElement("div");

  row.className = "size-input-row";

  row.innerHTML = `
    <input
      class="size-name"
      placeholder="المقاس مثل S أو M أو 38"
      value="${escapeHtml(name)}"
    >

    <input
      class="size-quantity"
      type="number"
      min="0"
      placeholder="الكمية"
      value="${quantity}"
    >

    <button
      type="button"
      class="remove-image"
      onclick="this.parentElement.remove()"
    >
      ✕
    </button>
  `;

  container.appendChild(row);
}

function addImageInput(value = "") {

  const container =
    document.getElementById(
      "imageInputs"
    );

  const row =
    document.createElement("div");

  row.className =
    "image-input-row";

  row.innerHTML = `

    <input
      class="image-url"
      placeholder="https://example.com/image.jpg"
      value="${escapeHtml(value)}"
    >

    <button
      type="button"
      class="remove-image"
      onclick="this.parentElement.remove()"
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
  document.getElementById(
    "productForm"
  );

if (productForm) {

  productForm.addEventListener(
    "submit",
    saveProduct
  );

}


async function saveProduct(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "productId"
    ).value;


  const images =
    [
      ...document.querySelectorAll(
        ".image-url"
      )
    ]

      .map(input =>
        input.value.trim()
      )

      .filter(Boolean);


  if (!images.length) {

    alert(
      "أضف رابط صورة واحد على الأقل"
    );

    return;
  }

const sizes = [
  ...document.querySelectorAll(".size-input-row")
]
  .map(row => {
    const name =
      row.querySelector(".size-name")
        .value
        .trim();

    const quantity =
      Number(
        row.querySelector(".size-quantity")
          .value
      );

    return {
      name,
      quantity
    };
  })
  .filter(size => size.name);
  
  const product = {

    name:
      document.getElementById(
        "name"
      ).value.trim(),

    price:
      Number(
        document.getElementById(
          "price"
        ).value
      ),

    oldPrice:
      document.getElementById(
        "oldPrice"
      ).value
        ? Number(
            document.getElementById(
              "oldPrice"
            ).value
          )
        : null,

    category:
      document.getElementById(
        "category"
      ).value,

    description:
      document.getElementById(
        "description"
      ).value.trim(),

    stock:
      Number(
        document.getElementById(
          "stock"
        ).value
      ),

    images,
    sizes,

    isAvailable:
      document.getElementById(
        "isAvailable"
      ).checked

  };


  try {

    const response =
      await fetch(
        id
          ? `${API}/products/${id}`
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

          body: JSON.stringify(product)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "حدث خطأ"
      );

    }


    closeProductForm();

    await loadAdminProducts();


  } catch (error) {

    const message =
      document.getElementById(
        "formMessage"
      );

    message.textContent =
      error.message;

    message.style.color =
      "crimson";

  }

}


// ==========================
// تعديل
// ==========================

function editProduct(id) {

  const product =
    products.find(
      item => item._id === id
    );

  if (!product) return;


  document.getElementById(
    "productId"
  ).value =
    product._id;


  document.getElementById(
    "name"
  ).value =
    product.name;


  document.getElementById(
    "price"
  ).value =
    product.price;


  document.getElementById(
    "oldPrice"
  ).value =
    product.oldPrice || "";


  document.getElementById(
    "category"
  ).value =
    product.category;


  document.getElementById(
    "description"
  ).value =
    product.description || "";


  document.getElementById(
    "stock"
  ).value =
    product.stock || 0;
  const sizesContainer =
  document.getElementById("sizesInputs");

sizesContainer.innerHTML = "";

if (product.sizes && product.sizes.length) {
  product.sizes.forEach(size => {
    addSizeInput(
      size.name,
      size.quantity
    );
  });
} else {
  addSizeInput();
}


  document.getElementById(
    "isAvailable"
  ).checked =
    product.isAvailable;


  const container =
    document.getElementById(
      "imageInputs"
    );

  container.innerHTML = "";


  (product.images || [])
    .forEach(
      image =>
        addImageInput(image)
    );


  document.getElementById(
    "formTitle"
  ).textContent =
    "تعديل المنتج";


  document.getElementById(
    "productModal"
  ).classList.add("active");

}


// ==========================
// حذف
// ==========================

async function deleteProduct(id) {

  const product =
    products.find(
      item => item._id === id
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
        `${API}/products/${id}`,
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
        "فشل الحذف"
      );

    }


    await loadAdminProducts();


  } catch (error) {

    alert(error.message);

  }

}


// ==========================
// تسجيل الخروج
// ==========================

async function logout() {

  await fetch(
    `${API}/auth/logout`,
    {
      method: "POST",

      credentials: "include"
    }
  );

  window.location.href =
    "/admin/login.html";

}


// ==========================
// أدوات
// ==========================

function formatPrice(price) {

  return Number(price)
    .toLocaleString("ar-YE")
    + " ريال";

}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
