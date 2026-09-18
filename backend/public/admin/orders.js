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
  const itemsHtml = (order.items || [])
    .map(item => {
      const image = item.image || "";

      return `
        <div class="product-line">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="">`
              : `<div style="
                  width:65px;
                  height:65px;
                  border-radius:10px;
                  background:#eee;
                "></div>`
          }

          <div class="product-info">
            <strong>
              ${escapeHtml(item.name || "منتج")}
            </strong>

            <span>
              المقاس:
              ${escapeHtml(item.size || "بدون مقاس")}
              <br>

              الكمية:
              ${item.quantity || 1}
              <br>

              السعر:
              ${formatMoney(item.price)}
              ريال
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ar-YE")
    : "";

  const address =
    order.delivery?.address || "غير محدد";

  const latitude =
    order.delivery?.latitude;

  const longitude =
    order.delivery?.longitude;

  const mapLink =
    latitude !== undefined &&
    longitude !== undefined
      ? `
        <a
          class="map-button"
          target="_blank"
          rel="noopener"
          href="https://www.google.com/maps?q=${encodeURIComponent(
            latitude + "," + longitude
          )}"
        >
          فتح موقع العميل على الخريطة
        </a>
      `
      : "";

  const customerPhone =
    order.customer?.phone || "";

  const whatsappPhone =
    normalizeYemenPhone(customerPhone);

  const whatsappMessage = encodeURIComponent(
    `مرحباً ${order.customer?.name || ""}،\n\n` +
    `بخصوص طلبك رقم: ${order.orderNumber}\n` +
    `حالة الطلب الحالية: ${order.status}\n` +
    `الإجمالي: ${formatMoney(order.total)} ريال\n\n` +
    `شكراً لتسوقك من ديور للأزياء`
  );

  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
    : "#";

  const statusOptions = ORDER_STATUSES
    .map(status => `
      <option
        value="${escapeHtml(status)}"
        ${
          status === order.status
            ? "selected"
            : ""
        }
      >
        ${escapeHtml(status)}
      </option>
    `)
    .join("");

  return `
    <article class="order-card">

      <div class="order-top">
        <div>
          <div class="order-number">
            طلب رقم: ${escapeHtml(order.orderNumber)}
          </div>

          <div class="order-date">
            ${escapeHtml(createdAt)}
          </div>
        </div>

        <div class="order-status">
          ${escapeHtml(order.status)}
        </div>
      </div>

      <div class="order-grid">

        <section class="order-section">
          <h3>بيانات العميل</h3>

          <div class="customer-line">
            <strong>الاسم:</strong>
            ${escapeHtml(order.customer?.name || "")}
          </div>

          <div class="customer-line">
            <strong>الهاتف:</strong>
            ${escapeHtml(customerPhone)}
          </div>

          <div class="customer-line">
            <strong>العنوان:</strong>
            ${escapeHtml(address)}
          </div>

          ${
            order.delivery?.notes
              ? `
                <div class="customer-line">
                  <strong>ملاحظات:</strong>
                  ${escapeHtml(order.delivery.notes)}
                </div>
              `
              : ""
          }

          ${mapLink}

          ${
            whatsappPhone
              ? `
                <a
                  class="map-button whatsapp-button"
                  target="_blank"
                  rel="noopener"
                  href="${whatsappLink}"
                >
                  مراسلة العميل واتساب
                </a>
              `
              : ""
          }
        </section>

        <section class="order-section">
          <h3>تفاصيل الدفع</h3>

          <div class="customer-line">
            <strong>طريقة الدفع:</strong>
            ${escapeHtml(order.paymentMethod || "")}
          </div>

          <div class="summary-line">
            <span>المجموع الفرعي</span>
            <span>
              ${formatMoney(order.subtotal)} ريال
            </span>
          </div>

          <div class="summary-line">
            <span>رسوم التوصيل</span>
            <span>
              ${formatMoney(order.deliveryFee)} ريال
            </span>
          </div>

          <div class="summary-line summary-total">
            <span>الإجمالي</span>
            <span>
              ${formatMoney(order.total)} ريال
            </span>
          </div>
        </section>

      </div>

      <section class="order-section" style="margin-top:18px;">
        <h3>المنتجات</h3>

        <div class="products-list">
          ${itemsHtml}
        </div>
      </section>

      <div class="status-controls">

        <select
          id="status-${escapeHtml(order._id)}"
        >
          ${statusOptions}
        </select>

        <button
          type="button"
          onclick="updateOrderStatus('${escapeJs(order._id)}')"
        >
          حفظ حالة الطلب
        </button>

      </div>

    </article>
  `;
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
