const ORDER_STATUSES = [
  "تم الطلب",
  "تأكيد الدفع",
  "جاري التجهيز",
  "التوصيل",
  "تم التوصيل"
];

const ordersMessage =
  document.getElementById("ordersMessage");

const ordersList =
  document.getElementById("ordersList");

async function loadOrders() {
  ordersMessage.style.display = "block";
  ordersMessage.textContent = "جاري تحميل الطلبات...";
  ordersList.innerHTML = "";

  try {
    const response = await fetch(
      "/api/orders/admin",
      {
        credentials: "include"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/admin/login.html";
        return;
      }

      throw new Error(
        data.message || "تعذر تحميل الطلبات"
      );
    }

    const orders = data.orders || [];

    if (orders.length === 0) {
      ordersMessage.textContent =
        "لا توجد طلبات حتى الآن";
      return;
    }

    ordersMessage.style.display = "none";

    ordersList.innerHTML = orders
      .map(renderOrder)
      .join("");

  } catch (error) {
    ordersMessage.textContent =
      error.message || "حدث خطأ أثناء تحميل الطلبات";
  }
}

function renderOrder(order) {
  const isDelivered = order.status === "تم التوصيل";

  const itemsHtml = (order.items || [])
    .map(item => {
      const image = item.image || "/images/logo.jpg";

      return `
        <div class="product-line">
          <img
            src="${escapeHtml(image)}"
            alt=""
            onerror="this.onerror=null;this.src='/images/logo.jpg';"
            style="
              width:65px;
              height:65px;
              object-fit:cover;
              border-radius:10px;
              background:#eee;
            "
          >

          <div class="product-info">
            <strong>${escapeHtml(item.name || "منتج")}</strong>

            <span>
              المقاس: ${escapeHtml(item.size || "بدون مقاس")}<br>
              الكمية: ${item.quantity || 1}<br>
              السعر: ${formatMoney(item.price)} ريال
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ar-YE", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "";

  const customerName =
    order.customer?.name ||
    order.customerName ||
    "غير محدد";

  const customerPhone =
    order.customer?.phone ||
    order.phone ||
    "";

  const address =
    order.deliveryAddress ||
    order.address ||
    order.customer?.address ||
    "غير محدد";

  const latitude =
    order.location?.latitude ??
    order.latitude ??
    null;

  const longitude =
    order.location?.longitude ??
    order.longitude ??
    null;

  const paymentMethod =
    order.paymentMethod ||
    "غير محدد";

  const total =
    order.total ??
    order.totalAmount ??
    0;

  const orderNumber =
    order.orderNumber ||
    order._id ||
    "";

  const mapLink =
    latitude !== null &&
    longitude !== null
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${latitude},${longitude}`
        )}`
      : "";

  const whatsappPhone = normalizeYemenPhone(customerPhone);

  const whatsappMessage = encodeURIComponent(
    `مرحباً ${customerName}، بخصوص طلبك رقم ${orderNumber} من ديور للأزياء.`
  );

  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
    : "";

  /*
   * الطلبات التي تم توصيلها:
   * - تصبح أصغر
   * - يظهر عليها ✅
   * - يمكن الضغط عليها لفتح/إغلاق التفاصيل
   */
  if (isDelivered) {
    return `
      <div
        class="order-card delivered-order-card"
        id="order-${escapeHtml(String(order._id))}"
        style="
          position:relative;
          padding:12px;
          margin-bottom:12px;
          border-radius:14px;
          background:#f7f7f7;
          border:1px solid #e5e5e5;
          cursor:pointer;
          transition:all .2s ease;
        "
        onclick="toggleDeliveredOrder('${escapeJs(String(order._id))}')"
      >

        <!-- علامة الإنجاز -->
        <div
          style="
            position:absolute;
            top:8px;
            left:8px;
            width:30px;
            height:30px;
            border-radius:50%;
            background:#22c55e;
            color:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            font-weight:bold;
            box-shadow:0 2px 6px rgba(0,0,0,.15);
          "
        >
          ✓
        </div>

        <!-- الملخص المصغر -->
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            padding-left:40px;
          "
        >
          <div>
            <strong
              style="
                display:block;
                font-size:14px;
                color:#555;
              "
            >
              طلب ${escapeHtml(orderNumber)}
            </strong>

            <span
              style="
                display:block;
                margin-top:4px;
                font-size:13px;
                color:#777;
              "
            >
              ${escapeHtml(customerName)}
            </span>

            <span
              style="
                display:block;
                margin-top:3px;
                font-size:12px;
                color:#999;
              "
            >
              تم التوصيل ${orderDate ? "• " + escapeHtml(orderDate) : ""}
            </span>
          </div>

          <div
            style="
              font-size:13px;
              color:#22a447;
              font-weight:bold;
              white-space:nowrap;
            "
          >
            تم التوصيل ✓
          </div>
        </div>

        <!-- تفاصيل الطلب مخفية -->
        <div
          id="delivered-details-${escapeHtml(String(order._id))}"
          style="
            display:none;
            margin-top:14px;
            padding-top:14px;
            border-top:1px solid #ddd;
          "
        >

          <div class="order-info">
            <p>
              <strong>👤 العميل:</strong>
              ${escapeHtml(customerName)}
            </p>

            <p>
              <strong>📱 الهاتف:</strong>
              ${escapeHtml(customerPhone || "غير محدد")}
            </p>

            <p>
              <strong>💳 طريقة الدفع:</strong>
              ${escapeHtml(paymentMethod)}
            </p>

            <p>
              <strong>📍 العنوان:</strong>
              ${escapeHtml(address)}
            </p>

            ${
              mapLink
                ? `
                  <p>
                    <a
                      href="${escapeHtml(mapLink)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      onclick="event.stopPropagation()"
                    >
                      📍 فتح الموقع على الخريطة
                    </a>
                  </p>
                `
                : ""
            }

            ${
              whatsappLink
                ? `
                  <p>
                    <a
                      href="${escapeHtml(whatsappLink)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      onclick="event.stopPropagation()"
                      style="
                        display:inline-block;
                        padding:8px 12px;
                        border-radius:8px;
                        background:#25D366;
                        color:#fff;
                        text-decoration:none;
                      "
                    >
                      💬 التواصل عبر واتساب
                    </a>
                  </p>
                `
                : ""
            }
          </div>

          <div class="order-products">
            <h4>🛍️ المنتجات</h4>

            ${itemsHtml || "<p>لا توجد منتجات</p>"}
          </div>

          <div
            style="
              margin-top:12px;
              padding:12px;
              border-radius:10px;
              background:#eee;
              font-weight:bold;
            "
          >
            الإجمالي:
            ${formatMoney(total)} ريال
          </div>

          <!-- حالة الطلب -->
          <div
            style="
              margin-top:15px;
            "
            onclick="event.stopPropagation()"
          >
            <label>
              حالة الطلب:
            </label>

            <select
              id="status-${escapeHtml(String(order._id))}"
              style="
                width:100%;
                margin-top:6px;
                padding:10px;
                border-radius:8px;
                border:1px solid #ddd;
              "
            >
              ${ORDER_STATUSES.map(status => `
                <option
                  value="${escapeHtml(status)}"
                  ${order.status === status ? "selected" : ""}
                >
                  ${escapeHtml(status)}
                </option>
              `).join("")}
            </select>

            <button
              type="button"
              onclick="event.stopPropagation(); updateOrderStatus('${escapeJs(String(order._id))}')"
              style="
                width:100%;
                margin-top:8px;
                padding:10px;
                border:0;
                border-radius:8px;
                background:#111;
                color:#fff;
                cursor:pointer;
              "
            >
              حفظ حالة الطلب
            </button>
          </div>

        </div>
      </div>
    `;
  }

  /*
   * الطلبات غير المكتملة تبقى بالشكل العادي
   */
  return `
    <div
      class="order-card"
      id="order-${escapeHtml(String(order._id))}"
      style="
        padding:16px;
        margin-bottom:16px;
        border-radius:14px;
        background:#fff;
        border:1px solid #e5e5e5;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:14px;
        "
      >
        <div>
          <h3 style="margin:0;">
            طلب ${escapeHtml(orderNumber)}
          </h3>

          ${
            orderDate
              ? `
                <small style="color:#888;">
                  ${escapeHtml(orderDate)}
                </small>
              `
              : ""
          }
        </div>

        <span
          style="
            padding:6px 10px;
            border-radius:20px;
            background:#f1f1f1;
            font-size:13px;
            white-space:nowrap;
          "
        >
          ${escapeHtml(order.status || "تم الطلب")}
        </span>
      </div>

      <div class="order-info">

        <p>
          <strong>👤 العميل:</strong>
          ${escapeHtml(customerName)}
        </p>

        <p>
          <strong>📱 الهاتف:</strong>
          ${escapeHtml(customerPhone || "غير محدد")}
        </p>

        <p>
          <strong>💳 طريقة الدفع:</strong>
          ${escapeHtml(paymentMethod)}
        </p>

        <p>
          <strong>📍 العنوان:</strong>
          ${escapeHtml(address)}
        </p>

        ${
          mapLink
            ? `
              <p>
                <a
                  href="${escapeHtml(mapLink)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 فتح الموقع على الخريطة
                </a>
              </p>
            `
            : ""
        }

        ${
          whatsappLink
            ? `
              <p>
                <a
                  href="${escapeHtml(whatsappLink)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    display:inline-block;
                    padding:8px 12px;
                    border-radius:8px;
                    background:#25D366;
                    color:#fff;
                    text-decoration:none;
                  "
                >
                  💬 التواصل عبر واتساب
                </a>
              </p>
            `
            : ""
        }

      </div>

      <div class="order-products">

        <h4>🛍️ المنتجات</h4>

        ${
          itemsHtml ||
          "<p>لا توجد منتجات</p>"
        }

      </div>

      <div
        style="
          margin-top:14px;
          padding:12px;
          border-radius:10px;
          background:#f5f5f5;
          font-weight:bold;
        "
      >
        الإجمالي:
        ${formatMoney(total)} ريال
      </div>

      <div
        style="
          margin-top:15px;
        "
      >

        <label>
          حالة الطلب:
        </label>

        <select
          id="status-${escapeHtml(String(order._id))}"
          style="
            width:100%;
            margin-top:6px;
            padding:10px;
            border-radius:8px;
            border:1px solid #ddd;
          "
        >
          ${ORDER_STATUSES.map(status => `
            <option
              value="${escapeHtml(status)}"
              ${order.status === status ? "selected" : ""}
            >
              ${escapeHtml(status)}
            </option>
          `).join("")}
        </select>

        <button
          type="button"
          onclick="updateOrderStatus('${escapeJs(String(order._id))}')"
          style="
            width:100%;
            margin-top:8px;
            padding:10px;
            border:0;
            border-radius:8px;
            background:#111;
            color:#fff;
            cursor:pointer;
          "
        >
          حفظ حالة الطلب
        </button>

      </div>

    </div>
  `;
}


/*
 * فتح وإغلاق تفاصيل الطلبات التي تم توصيلها
 */
function toggleDeliveredOrder(orderId) {
  const details = document.getElementById(
    `delivered-details-${orderId}`
  );

  if (!details) return;

  if (details.style.display === "none" || !details.style.display) {
    details.style.display = "block";
  } else {
    details.style.display = "none";
  }
}

async function updateOrderStatus(orderId) {
  const select =
    document.getElementById(`status-${orderId}`);

  if (!select) {
    return;
  }

  const status = select.value;

  try {
    const response = await fetch(
      `/api/orders/admin/${orderId}/status`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify({
          status
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href =
          "/admin/login.html";
        return;
      }

      throw new Error(
        data.message || "تعذر تحديث حالة الطلب"
      );
    }

    alert("تم تحديث حالة الطلب بنجاح");

    await loadOrders();

  } catch (error) {
    alert(
      error.message ||
      "حدث خطأ أثناء تحديث حالة الطلب"
    );
  }
}

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-US");
}

function normalizeYemenPhone(phone) {
  let value = String(phone || "")
    .replace(/[^\d+]/g, "");

  if (value.startsWith("+")) {
    value = value.substring(1);
  }

  if (value.startsWith("00967")) {
    value = value.substring(2);
  }

  if (value.startsWith("967")) {
    return value;
  }

  if (value.startsWith("7")) {
    return "967" + value;
  }

  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

loadOrders();
