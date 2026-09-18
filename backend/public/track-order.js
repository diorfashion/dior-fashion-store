const ORDER_STATUSES = [
  "تم الطلب",
  "تأكيد الدفع",
  "جاري التجهيز",
  "التوصيل",
  "تم التوصيل"
];

const form =
  document.getElementById("trackForm");

const phoneInput =
  document.getElementById("customerPhone");

const button =
  document.getElementById("trackButton");

const message =
  document.getElementById("trackMessage");

const ordersResult =
  document.getElementById("ordersResult");

const ordersList =
  document.getElementById("ordersList");


form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    const phone =
      phoneInput.value.trim();

    if (!phone) {
      showMessage(
        "يرجى إدخال رقم الهاتف"
      );
      return;
    }

    button.disabled = true;
    button.textContent =
      "جاري البحث...";

    message.textContent = "";
    ordersResult.classList.add("hidden");
    ordersList.innerHTML = "";

    try {

      const response =
        await fetch(
          `/api/orders/my-orders?phone=${encodeURIComponent(phone)}`
        );

      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "تعذر تحميل الطلبات"
        );
      }


      const orders =
        data.orders || [];


      if (!orders.length) {

        showMessage(
          "لا توجد طلبات مرتبطة بهذا الرقم",
          false
        );

        return;
      }


      message.textContent =
        `تم العثور على ${orders.length} طلب`;


      message.style.color = "green";


      ordersList.innerHTML =
        orders
          .map(renderOrder)
          .join("");


      ordersResult.classList.remove(
        "hidden"
      );


    } catch (error) {

      showMessage(
        error.message ||
        "حدث خطأ أثناء البحث"
      );

    } finally {

      button.disabled = false;

      button.textContent =
        "🔎 عرض طلباتي";

    }

  }
);


function renderOrder(order) {
  const isDelivered = order.status === "تم التوصيل";

  const orderNumber = order.orderNumber || order._id || "";
  const customerName = order.customer?.name || order.customerName || "";

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ar-YE", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "";

  const itemsHtml = (order.items || [])
    .map(item => {
      const image = item.image || "/images/logo.jpg";

      return `
        <div class="track-product-item">
          <img
            src="${escapeHtml(image)}"
            alt=""
            onerror="this.onerror=null;this.src='/images/logo.jpg';"
          >

          <div>
            <strong>
              ${escapeHtml(item.name || "منتج")}
            </strong>

            <span>
              المقاس:
              ${escapeHtml(item.size || "بدون مقاس")}
            </span>

            <span>
              الكمية:
              ${item.quantity || 1}
            </span>

            <span>
              السعر:
              ${formatMoney(item.price)} ريال
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  /*
   * إذا كان الطلب تم توصيله
   */
  if (isDelivered) {
    return `
      <div
        class="customer-delivered-order"
        onclick="toggleCustomerDeliveredOrder('${escapeJs(String(order._id))}')"
      >

        <div class="delivered-order-check">
          ✓
        </div>

        <div class="delivered-order-summary">

          <div>
            <strong>
              طلب ${escapeHtml(orderNumber)}
            </strong>

            <span>
              ${escapeHtml(customerName)}
            </span>

            ${
              orderDate
                ? `
                  <small>
                    ${escapeHtml(orderDate)}
                  </small>
                `
                : ""
            }
          </div>

          <div class="delivered-status">
            تم التوصيل ✓
          </div>

        </div>

        <div
          id="customer-delivered-details-${escapeHtml(String(order._id))}"
          class="customer-delivered-details"
        >

          <div class="track-order-details">

            <p>
              <strong>حالة الطلب:</strong>
              تم التوصيل ✓
            </p>

            ${
              order.paymentMethod
                ? `
                  <p>
                    <strong>طريقة الدفع:</strong>
                    ${escapeHtml(order.paymentMethod)}
                  </p>
                `
                : ""
            }

            ${
              order.deliveryAddress
                ? `
                  <p>
                    <strong>العنوان:</strong>
                    ${escapeHtml(order.deliveryAddress)}
                  </p>
                `
                : ""
            }

          </div>

          <div class="track-products">
            ${itemsHtml}
          </div>

          <div class="track-total">
            الإجمالي:
            ${formatMoney(order.total || 0)}
            ريال
          </div>

        </div>

      </div>
    `;
  }

  /*
   * الطلبات التي لم يتم توصيلها
   */
  return `
    <div class="customer-order-card">

      <div class="customer-order-header">

        <div>
          <strong>
            طلب ${escapeHtml(orderNumber)}
          </strong>

          ${
            orderDate
              ? `
                <small>
                  ${escapeHtml(orderDate)}
                </small>
              `
              : ""
          }
        </div>

        <span class="customer-order-status">
          ${escapeHtml(order.status || "تم الطلب")}
        </span>

      </div>

      <div class="track-products">
        ${itemsHtml}
      </div>

      <div class="track-total">
        الإجمالي:
        ${formatMoney(order.total || 0)}
        ريال
      </div>

    </div>
  `;
}


/*
 * فتح وإغلاق تفاصيل الطلب الذي تم توصيله
 */
function toggleCustomerDeliveredOrder(orderId) {
  const details = document.getElementById(
    `customer-delivered-details-${orderId}`
  );

  if (!details) return;

  if (details.style.display === "block") {
    details.style.display = "none";
  } else {
    details.style.display = "block";
  }
}

function escapeJs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}
function formatMoney(value) {

  return Number(
    value || 0
  ).toLocaleString("en-US");

}


function showMessage(
  text,
  isError = true
) {

  message.textContent = text;

  message.style.color =
    isError
      ? "crimson"
      : "#555";

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
// ==========================================
// تفعيل إشعارات الطلب
// ==========================================

const enableNotificationsButton =
  document.getElementById(
    "enableNotificationsButton"
  );

const notificationMessage =
  document.getElementById(
    "notificationMessage"
  );


// ==========================================
// تحويل مفتاح VAPID من Base64 URL
// إلى Uint8Array
// ==========================================

function urlBase64ToUint8Array(
  base64String
) {

  const padding =
    "=".repeat(
      (4 - base64String.length % 4) % 4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");


  const rawData =
    window.atob(base64);


  return Uint8Array.from(
    [...rawData].map(
      char => char.charCodeAt(0)
    )
  );

}


// ==========================================
// رسالة للمستخدم
// ==========================================

function showNotificationMessage(
  message,
  type = ""
) {

  if (!notificationMessage) {
    return;
  }


  notificationMessage.textContent =
    message;


  notificationMessage.className =
    "notification-message";


  if (type) {
    notificationMessage.classList.add(
      type
    );
  }

}


// ==========================================
// تفعيل الإشعارات
// ==========================================

async function enableOrderNotifications() {

  try {

    // --------------------------------------
    // التأكد من دعم المتصفح
    // --------------------------------------

    if (!("serviceWorker" in navigator)) {
  showNotificationMessage(
    "❌ Service Worker غير مدعوم في هذه الصفحة.",
    "error"
  );
  return;
}

if (!("PushManager" in window)) {
  showNotificationMessage(
    "❌ PushManager غير مدعوم في هذه الصفحة.",
    "error"
  );
  return;
}

if (!("Notification" in window)) {
  showNotificationMessage(
    "❌ Notification غير مدعوم في هذه الصفحة.",
    "error"
  );
  return;
}


    // --------------------------------------
    // الحصول على رقم الهاتف
    // --------------------------------------

    const phoneInput =
      document.getElementById(
        "customerPhone"
      );


    const phone =
      phoneInput
        ? String(
            phoneInput.value || ""
          ).trim()
        : "";


    if (!phone) {

      showNotificationMessage(
        "أدخل رقم هاتفك أولاً ثم فعّل الإشعارات.",
        "error"
      );

      if (phoneInput) {
        phoneInput.focus();
      }

      return;
    }


    // --------------------------------------
    // تسجيل Service Worker
    // --------------------------------------

    showNotificationMessage(
      "جاري تجهيز الإشعارات..."
    );


    const registration =
  await navigator.serviceWorker.register(
    "/service-worker.js",
    {
      scope: "/"
    }
  );

await registration.update();
await navigator.serviceWorker.ready;


    // --------------------------------------
    // طلب إذن الإشعارات
    // --------------------------------------

    let permission =
      Notification.permission;


    if (
      permission === "default"
    ) {

      permission =
        await Notification.requestPermission();

    }


    if (
      permission !== "granted"
    ) {

      showNotificationMessage(
        "لم يتم السماح بإشعارات الطلبات. يمكنك السماح بها من إعدادات المتصفح.",
        "error"
      );

      return;
    }


    // --------------------------------------
    // الحصول على مفتاح VAPID العام
    // --------------------------------------

    const keyResponse =
      await fetch(
        "/api/push/public-key"
      );


    const keyData =
      await keyResponse.json();


    if (
      !keyResponse.ok ||
      !keyData.success ||
      !keyData.publicKey
    ) {

      throw new Error(
        "تعذر الحصول على مفتاح الإشعارات"
      );

    }


    // --------------------------------------
    // التحقق من وجود اشتراك سابق
    // --------------------------------------

    let subscription =
      await registration.pushManager.getSubscription();


    // --------------------------------------
    // إنشاء اشتراك جديد
    // --------------------------------------

    if (!subscription) {

      subscription =
        await registration.pushManager.subscribe({

          userVisibleOnly:
            true,

          applicationServerKey:
            urlBase64ToUint8Array(
              keyData.publicKey
            )

        });

    }


 // --------------------------------------
// حفظ الاشتراك في السيرفر
// --------------------------------------

const subscriptionData =
  subscription.toJSON();

const saveResponse =
  await fetch(
    "/api/push/subscribe",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        phone,
        subscription: subscriptionData
      })
    }
  );


const saveData =
  await saveResponse.json();


if (
  !saveResponse.ok ||
  !saveData.success
) {

  throw new Error(
    saveData.message ||
    "تعذر حفظ اشتراك الإشعارات"
  );

}


// --------------------------------------
// نجاح
// --------------------------------------

showNotificationMessage(
  "✅ تم تفعيل إشعارات طلباتك بنجاح.",
  "success"
);


enableNotificationsButton.textContent =
  "✅ إشعارات الطلب مفعّلة";


enableNotificationsButton.disabled =
  true;


  } catch (error) {

    console.error(
      "Enable notifications error:",
      error
    );


    showNotificationMessage(
      "تعذر تفعيل الإشعارات. حاول مرة أخرى.",
      "error"
    );

  }

}


// ==========================================
// زر تفعيل الإشعارات
// ==========================================

if (
  enableNotificationsButton
) {

  enableNotificationsButton.addEventListener(
    "click",
    enableOrderNotifications
  );

}
