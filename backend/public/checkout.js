const API_URL = "/api/orders";

let cart =
  JSON.parse(
    localStorage.getItem("dior_cart") || "[]"
  );


// تشغيل الصفحة

function initCheckout() {

  const container =
    document.getElementById(
      "checkoutContent"
    );

  if (!cart.length) {

    container.innerHTML = `
      <div class="checkout-card empty-checkout">
        <h2>السلة فارغة 🛒</h2>

        <p>
          أضف منتجات إلى السلة أولاً.
        </p>

        <button
          class="map-button"
          onclick="window.location.href='/'"
        >
          العودة للمتجر
        </button>
      </div>
    `;

    return;
  }

  renderCheckout();
}


// عرض صفحة الطلب

function renderCheckout() {

  const container =
    document.getElementById(
      "checkoutContent"
    );

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );

  const deliveryFee = 0;

  const total =
    subtotal +
    deliveryFee;


  container.innerHTML = `

    <div class="checkout-layout">

      <section class="checkout-card">

        <h2>
          بيانات التوصيل
        </h2>

        <form
          id="checkoutForm"
          class="checkout-form"
        >

          <label>
            الاسم الكامل
          </label>

          <input
            id="customerName"
            required
            placeholder="اكتب اسمك"
          >


          <label>
            رقم الهاتف
          </label>

          <input
            id="customerPhone"
            type="tel"
            required
            placeholder="مثال: 777000000"
          >


          <label>
            عنوان التوصيل
          </label>

          <textarea
            id="deliveryAddress"
            required
            placeholder="اكتب عنوان التوصيل بالتفصيل"
          ></textarea>


          <div class="map-box">

            <strong>
              📍 موقع التوصيل
            </strong>

            <p>
              يمكنك تحديد الموقع من الخريطة
              في المرحلة التالية.
            </p>

            <button
              type="button"
              class="map-button"
              onclick="selectLocation()"
            >
              📍 تحديد الموقع
            </button>

            <div
              id="locationText"
              class="location-text"
            >
              لم يتم تحديد موقع
            </div>

          </div>


          <label>
            ملاحظات الطلب
          </label>

          <textarea
            id="deliveryNotes"
            placeholder="أي ملاحظات إضافية..."
          ></textarea>


          <label>
            طريقة الدفع
          </label>

          <select
            id="paymentMethod"
            required
          >

            <option value="">
              اختر طريقة الدفع
            </option>

            <option value="الدفع عند الاستلام">
              الدفع عند الاستلام
            </option>

            <option value="تحويل بنكي">
              تحويل بنكي
            </option>

          </select>


          <button
            type="submit"
            class="submit-order"
            id="submitOrder"
          >
            تأكيد الطلب
          </button>

          <div id="checkoutMessage"></div>

        </form>

      </section>


      <section class="checkout-card">

        <h2>
          ملخص الطلب
        </h2>

        <div>
          ${
            cart.map(item => `
              <div class="order-item">

                <img
                  src="${escapeHtml(item.image)}"
                  alt="${escapeHtml(item.name)}"
                  onerror="this.src='images/logo.jpg'"
                >

                <div class="order-item-info">

                  <strong>
                    ${escapeHtml(item.name)}
                  </strong>

                  <div>
                    المقاس:
                    ${escapeHtml(item.size || "بدون مقاس")}
                  </div>

                  <div>
                    الكمية:
                    ${item.quantity}
                  </div>

                  <div>
                    ${formatPrice(
                      item.price *
                      item.quantity
                    )}
                  </div>

                </div>

              </div>
            `).join("")
          }
        </div>


        <div class="summary-row">
          <span>
            المجموع
          </span>

          <strong>
            ${formatPrice(subtotal)}
          </strong>
        </div>


        <div class="summary-row">
          <span>
            التوصيل
          </span>

          <strong>
            ${formatPrice(deliveryFee)}
          </strong>
        </div>


        <div class="summary-row summary-total">
          <span>
            الإجمالي
          </span>

          <span>
            ${formatPrice(total)}
          </span>
        </div>

      </section>

    </div>
  `;


  document
    .getElementById("checkoutForm")
    .addEventListener(
      "submit",
      submitOrder
    );
}


// تحديد الموقع

function selectLocation() {

  alert(
    "سنربط الخريطة الفعلية في الخطوة التالية."
  );
}


// إرسال الطلب

async function submitOrder(event) {

  event.preventDefault();

  const button =
    document.getElementById(
      "submitOrder"
    );

  const message =
    document.getElementById(
      "checkoutMessage"
    );


  button.disabled = true;

  button.textContent =
    "جاري إرسال الطلب...";


  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  const deliveryFee = 0;


  const payload = {

    customer: {

      name:
        document
          .getElementById(
            "customerName"
          )
          .value
          .trim(),

      phone:
        document
          .getElementById(
            "customerPhone"
          )
          .value
          .trim()
    },


    delivery: {

      address:
        document
          .getElementById(
            "deliveryAddress"
          )
          .value
          .trim(),

      notes:
        document
          .getElementById(
            "deliveryNotes"
          )
          .value
          .trim()
    },


    paymentMethod:
      document
        .getElementById(
          "paymentMethod"
        )
        .value,


    items:
      cart.map(item => ({

        productId:
          item.productId,

        size:
          item.size || "",

        quantity:
          item.quantity

      })),


    deliveryFee
  };


  try {

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "تعذر إنشاء الطلب"
      );
    }


    // الطلب نجح
    // نمسح السلة

    localStorage.removeItem(
      "dior_cart"
    );

    cart = [];


    showOrderSuccess(
      data.order
    );


  } catch (error) {

    message.textContent =
      error.message;

    message.style.color =
      "crimson";

    button.disabled = false;

    button.textContent =
      "تأكيد الطلب";
  }
}


// نجاح الطلب

function showOrderSuccess(order) {

  const container =
    document.getElementById(
      "checkoutContent"
    );

  container.innerHTML = `

    <div class="checkout-card success-box">

      <h2>
        ✅ تم استلام طلبك
      </h2>

      <p>
        شكرًا لك، تم إنشاء الطلب بنجاح.
      </p>

      <div class="order-number">
        رقم الطلب:
        ${escapeHtml(order.orderNumber)}
      </div>

      <p>
        حالة الطلب:
        <strong>
          ${escapeHtml(order.status)}
        </strong>
      </p>

      <p>
        الإجمالي:
        <strong>
          ${formatPrice(order.total)}
        </strong>
      </p>

      <button
        class="map-button"
        onclick="window.location.href='/'"
      >
        العودة للمتجر
      </button>

    </div>
  `;
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


initCheckout();
