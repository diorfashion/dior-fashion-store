const API_URL = "/api/orders";

let cart = JSON.parse(
  localStorage.getItem("dior_cart") || "[]"
);

let map = null;
let marker = null;

let selectedLatitude = null;
let selectedLongitude = null;


// =========================
// إعدادات المتجر
// =========================

// رقم محفظة جيب
// يتم وضعه لاحقًا في Koyeb Environment Variables
const JEEB_WALLET_NUMBER = "773041464";

// رقم واتساب الإدارة
const ADMIN_WHATSAPP_NUMBER = "967773041464";


// =========================
// الخريطة
// =========================

function initMap() {

  const mapElement =
    document.getElementById("map");

  if (!mapElement) {
    return;
  }

  const defaultLatitude = 15.3694;
  const defaultLongitude = 44.1910;

  map = L.map("map").setView(
    [
      defaultLatitude,
      defaultLongitude
    ],
    13
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  map.on("click", function(event) {

    setDeliveryLocation(
      event.latlng.lat,
      event.latlng.lng
    );

  });
}


// =========================
// تحديد الموقع
// =========================

function setDeliveryLocation(
  latitude,
  longitude
) {

  selectedLatitude = latitude;
  selectedLongitude = longitude;

  if (!marker) {

    marker = L.marker(
      [
        latitude,
        longitude
      ],
      {
        draggable: true
      }
    ).addTo(map);

    marker.on(
      "dragend",
      function(event) {

        const position =
          event.target.getLatLng();

        setDeliveryLocation(
          position.lat,
          position.lng
        );

      }
    );

  } else {

    marker.setLatLng([
      latitude,
      longitude
    ]);

  }

  map.setView(
    [
      latitude,
      longitude
    ],
    16
  );

  const locationText =
    document.getElementById(
      "locationText"
    );

  if (locationText) {

    locationText.innerHTML = `
      <strong>
        تم تحديد موقع التوصيل 📍
      </strong>
      <br>
      خط العرض:
      ${latitude.toFixed(6)}
      <br>
      خط الطول:
      ${longitude.toFixed(6)}
    `;

  }
}


// =========================
// استخدام موقع الهاتف
// =========================

function getCurrentLocation() {

  if (!navigator.geolocation) {

    alert(
      "المتصفح لا يدعم تحديد الموقع"
    );

    return;
  }

  const locationText =
    document.getElementById(
      "locationText"
    );

  if (locationText) {

    locationText.textContent =
      "جاري تحديد موقعك...";

  }

  navigator.geolocation.getCurrentPosition(

    function(position) {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      setDeliveryLocation(
        latitude,
        longitude
      );

    },

    function(error) {

      console.error(
        "Location error:",
        error
      );

      alert(
        "لم نتمكن من الحصول على موقعك. تأكد من السماح للموقع في الهاتف."
      );

      if (locationText) {

        locationText.textContent =
          "لم يتم تحديد موقع";

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

  );
}


// =========================
// تشغيل صفحة إتمام الطلب
// =========================

function initCheckout() {

  const container =
    document.getElementById(
      "checkoutContent"
    );

  if (!container) {
    return;
  }

  if (!cart.length) {

    container.innerHTML = `
      <div class="checkout-card empty-checkout">

        <h2>
          السلة فارغة 🛒
        </h2>

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


// =========================
// عرض صفحة الطلب
// =========================

function renderCheckout() {

  const container =
    document.getElementById(
      "checkoutContent"
    );

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.quantity),
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
              📍 حدد موقع التوصيل
            </strong>

            <p>
              اضغط على الخريطة لتحديد موقعك،
              أو استخدم موقع الهاتف الحالي.
            </p>

            <button
              type="button"
              class="map-button"
              onclick="getCurrentLocation()"
            >
              📍 استخدام موقعي الحالي
            </button>

            <div
              id="map"
              style="
                height:350px;
                width:100%;
                margin-top:15px;
                border-radius:12px;
                overflow:hidden;
              "
            ></div>

            <div
              id="locationText"
              class="location-text"
            >
              لم يتم تحديد موقع بعد
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
              💵 الدفع عند الاستلام
            </option>

            <option value="تحويل بنكي">
              🏦 تحويل بنكي
            </option>

            <option value="محفظة جيب">
              📱 محفظة جيب
            </option>

          </select>


          <!-- معلومات محفظة جيب -->

          <div
            id="jeebPaymentBox"
            style="
              display:none;
              margin-top:15px;
              padding:15px;
              border-radius:12px;
              background:#f5f5f5;
              border:1px solid #ddd;
            "
          >

            <h3>
              📱 الدفع عبر محفظة جيب
            </h3>

            <p>
              يرجى تحويل المبلغ المطلوب إلى:
            </p>

            <div
              style="
                font-size:22px;
                font-weight:bold;
                margin:10px 0;
              "
            >
              ${JEEB_WALLET_NUMBER}
            </div>

            <p>
              المبلغ المطلوب:
              <strong>
                ${formatPrice(total)}
              </strong>
            </p>

            <p>
              بعد التحويل، يرجى إرسال إشعار الدفع
              إلى واتساب الإدارة.
            </p>

            <button
              type="button"
              class="map-button"
              id="jeebWhatsAppButton"
            >
              📱 إرسال إشعار الدفع عبر واتساب
            </button>

          </div>


          <button
            type="submit"
            class="submit-order"
            id="submitOrder"
          >
            تأكيد الطلب
          </button>

          <div
            id="checkoutMessage"
          ></div>

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
                  src="${escapeHtml(
                    item.image || ""
                  )}"
                  alt="${escapeHtml(
                    item.name
                  )}"
                  onerror="this.src='images/logo.jpg'"
                >

                <div class="order-item-info">

                  <strong>
                    ${escapeHtml(
                      item.name
                    )}
                  </strong>

                  <div>
                    المقاس:
                    ${escapeHtml(
                      item.size ||
                      "بدون مقاس"
                    )}
                  </div>

                  <div>
                    الكمية:
                    ${item.quantity}
                  </div>

                  <div>
                    ${formatPrice(
                      Number(item.price) *
                      Number(item.quantity)
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


        <div
          class="summary-row summary-total"
        >

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


  // =========================
  // تغيير طريقة الدفع
  // =========================

  const paymentMethod =
    document.getElementById(
      "paymentMethod"
    );

  const jeebPaymentBox =
    document.getElementById(
      "jeebPaymentBox"
    );


  paymentMethod.addEventListener(
    "change",
    function() {

      if (
        this.value === "محفظة جيب"
      ) {

        jeebPaymentBox.style.display =
          "block";

      } else {

        jeebPaymentBox.style.display =
          "none";

      }

    }
  );


  // =========================
  // زر واتساب الدفع
  // =========================

  const jeebWhatsAppButton =
    document.getElementById(
      "jeebWhatsAppButton"
    );


  jeebWhatsAppButton.addEventListener(
    "click",
    function() {

      const customerName =
        document
          .getElementById(
            "customerName"
          )
          .value
          .trim();


      const customerPhone =
        document
          .getElementById(
            "customerPhone"
          )
          .value
          .trim();


      const message =

`مرحبًا ديور للأزياء 👋

أريد الدفع عبر محفظة جيب.

الاسم: ${customerName || "غير محدد"}
رقم العميل: ${customerPhone || "غير محدد"}

المبلغ المطلوب: ${formatPrice(total)}

رقم محفظة جيب:
${JEEB_WALLET_NUMBER}

يرجى تأكيد استلام الدفع.
`;


      openWhatsApp(
        ADMIN_WHATSAPP_NUMBER,
        message
      );

    }
  );


  // ربط زر تأكيد الطلب

  document
    .getElementById("checkoutForm")
    .addEventListener(
      "submit",
      submitOrder
    );


  // تشغيل الخريطة

  setTimeout(
    () => {
      initMap();
    },
    100
  );

}


// =========================
// إرسال الطلب
// =========================

async function submitOrder(event) {

  event.preventDefault();


  if (
    selectedLatitude === null ||
    selectedLongitude === null
  ) {

    alert(
      "يرجى تحديد موقع التوصيل على الخريطة 📍"
    );

    return;
  }


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


  const deliveryFee = 0;


  const paymentMethod =
    document
      .getElementById(
        "paymentMethod"
      )
      .value;


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

      latitude:
        selectedLatitude,

      longitude:
        selectedLongitude,

      notes:
        document
          .getElementById(
            "deliveryNotes"
          )
          .value
          .trim()

    },


    paymentMethod,


    items:
      cart.map(item => ({

        productId:
          item.productId,

        size:
          item.size || "",

        quantity:
          Number(item.quantity)

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


    localStorage.removeItem(
      "dior_cart"
    );

    cart = [];


    showOrderSuccess(
      data.order,
      paymentMethod
    );


  } catch (error) {

    console.error(
      "Order error:",
      error
    );

    message.textContent =
      error.message;

    message.style.color =
      "crimson";

    button.disabled = false;

    button.textContent =
      "تأكيد الطلب";

  }

}


// =========================
// نجاح الطلب
// =========================

function showOrderSuccess(
  order,
  paymentMethod
) {

  const container =
    document.getElementById(
      "checkoutContent"
    );


  let paymentMessage = "";


  if (
    paymentMethod === "محفظة جيب"
  ) {

    paymentMessage = `

      <div
        style="
          margin-top:15px;
          padding:15px;
          border-radius:12px;
          background:#f5f5f5;
        "
      >

        <h3>
          📱 الدفع عبر محفظة جيب
        </h3>

        <p>
          رقم المحفظة:
          <strong>
            ${JEEB_WALLET_NUMBER}
          </strong>
        </p>

        <p>
          المبلغ المطلوب:
          <strong>
            ${formatPrice(order.total)}
          </strong>
        </p>

        <p>
          بعد الدفع أرسل إشعار الدفع إلى
          واتساب الإدارة.
        </p>

        <button
          class="map-button"
          onclick="sendPaymentWhatsApp(
            '${escapeHtml(order.orderNumber)}',
            '${escapeHtml(order.total)}'
          )"
        >
          📱 إرسال إشعار الدفع
        </button>

      </div>

    `;

  }


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
        ${escapeHtml(
          order.orderNumber
        )}

      </div>

      <p>

        طريقة الدفع:

        <strong>
          ${escapeHtml(
            paymentMethod
          )}
        </strong>

      </p>

      <p>

        حالة الطلب:

        <strong>
          ${escapeHtml(
            order.status
          )}
        </strong>

      </p>

      <p>

        الإجمالي:

        <strong>
          ${formatPrice(
            order.total
          )}
        </strong>

      </p>

      ${paymentMessage}


      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:20px;
        "
      >

        <button
          class="map-button"
          onclick="
            window.location.href =
            '/track-order.html?order=${encodeURIComponent(
              order.orderNumber
            )}'
          "
        >
          🔎 تتبع الطلب
        </button>


        <button
          class="map-button"
          onclick="
            sendOrderWhatsApp(
              '${escapeHtml(
                order.orderNumber
              )}',
              '${escapeHtml(
                paymentMethod
              )}',
              '${escapeHtml(
                order.status
              )}',
              '${escapeHtml(
                order.total
              )}'
            )
          "
        >
          📱 إرسال تفاصيل الطلب عبر واتساب
        </button>


        <button
          class="map-button"
          onclick="window.location.href='/'"
        >
          العودة للمتجر
        </button>

      </div>

    </div>

  `;
}


// =========================
// رسالة الطلب عبر واتساب
// =========================

function sendOrderWhatsApp(
  orderNumber,
  paymentMethod,
  status,
  total
) {

  const message =

`طلب جديد - ديور للأزياء 🛍️

رقم الطلب: ${orderNumber}

طريقة الدفع:
${paymentMethod}

حالة الطلب:
${status}

الإجمالي:
${formatPrice(total)}

يرجى مراجعة الطلب من لوحة الإدارة.
`;


  openWhatsApp(
    ADMIN_WHATSAPP_NUMBER,
    message
  );
}


// =========================
// إشعار دفع جيب
// =========================

function sendPaymentWhatsApp(
  orderNumber,
  total
) {

  const message =

`إشعار دفع - ديور للأزياء 💰

رقم الطلب:
${orderNumber}

طريقة الدفع:
محفظة جيب

المبلغ:
${formatPrice(total)}

تم إرسال المبلغ إلى محفظة جيب.

يرجى مراجعة الدفع وتأكيد الطلب.
`;


  openWhatsApp(
    ADMIN_WHATSAPP_NUMBER,
    message
  );
}


// =========================
// فتح واتساب
// =========================

function openWhatsApp(
  phone,
  message
) {

  const url =
    "https://wa.me/" +
    phone +
    "?text=" +
    encodeURIComponent(
      message
    );


  window.open(
    url,
    "_blank"
  );

}


// =========================
// تنسيق السعر
// =========================

function formatPrice(price) {

  return Number(price)
    .toLocaleString("ar-YE")
    + " ريال";

}


// =========================
// حماية HTML
// =========================

function escapeHtml(value) {

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


// تشغيل الصفحة

initCheckout();
