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


/* ==========================================
   تحميل الطلبات
========================================== */

async function loadOrders() {

  if (!ordersMessage || !ordersList) {
    console.error("عناصر صفحة الطلبات غير موجودة");
    return;
  }

  ordersMessage.style.display = "block";
  ordersMessage.textContent =
    "جاري تحميل الطلبات...";

  ordersList.innerHTML = "";

  try {

    const response = await fetch(
      "/api/orders/admin",
      {
        credentials: "include",
        cache: "no-store"
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch (e) {
      throw new Error(
        "الخادم لم يُرجع بيانات صحيحة"
      );
    }

    if (!response.ok) {

      if (response.status === 401) {
        window.location.href =
          "/admin/login.html";
        return;
      }

      throw new Error(
        data.message ||
        "تعذر تحميل الطلبات"
      );
    }

    const orders =
      Array.isArray(data.orders)
        ? data.orders
        : [];

    if (!orders.length) {

      ordersMessage.textContent =
        "لا توجد طلبات حتى الآن";

      return;
    }

    ordersMessage.style.display = "none";

    ordersList.innerHTML =
      orders.map(renderOrder).join("");

  } catch (error) {

    console.error(
      "Load orders error:",
      error
    );

    ordersMessage.style.display = "block";

    ordersMessage.textContent =
      error.message ||
      "حدث خطأ أثناء تحميل الطلبات";
  }
}


/* ==========================================
   عرض الطلب
========================================== */

function renderOrder(order) {

  const orderId =
    String(order._id || "");

  const isDelivered =
    order.status === "تم التوصيل";


  /* ----------------------------------------
     بيانات العميل
  ---------------------------------------- */

  const customerName =
    order.customer?.name ||
    order.customerName ||
    "غير محدد";

  const customerPhone =
    order.customer?.phone ||
    order.phone ||
    "";


  /* ----------------------------------------
     بيانات التوصيل
  ---------------------------------------- */

  const address =
    order.delivery?.address ||
    order.deliveryAddress ||
    order.address ||
    order.customer?.address ||
    "غير محدد";

  const latitude =
    order.delivery?.latitude ??
    order.location?.latitude ??
    order.latitude ??
    null;

  const longitude =
    order.delivery?.longitude ??
    order.location?.longitude ??
    order.longitude ??
    null;

  const deliveryNotes =
    order.delivery?.notes ||
    order.deliveryNotes ||
    "";


  /* ----------------------------------------
     الدفع
  ---------------------------------------- */

  const paymentMethod =
    order.paymentMethod ||
    "غير محدد";


  /* ----------------------------------------
     المبالغ
  ---------------------------------------- */

  const subtotal =
    order.subtotal ??
    0;

  const deliveryFee =
    order.deliveryFee ??
    0;

  const total =
    order.total ??
    order.totalAmount ??
    0;


  /* ----------------------------------------
     رقم الطلب
  ---------------------------------------- */

  const orderNumber =
    order.orderNumber ||
    order._id ||
    "غير محدد";


  /* ----------------------------------------
     التاريخ
  ---------------------------------------- */

  const orderDate =
    order.createdAt
      ? new Date(
          order.createdAt
        ).toLocaleString(
          "ar-YE",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        )
      : "";


  /* ----------------------------------------
     الخريطة
  ---------------------------------------- */

  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    latitude !== "" &&
    longitude !== "";

  const mapLink =
    hasLocation
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${latitude},${longitude}`
        )}`
      : "";


  /* ----------------------------------------
     واتساب
  ---------------------------------------- */

  const whatsappPhone =
    normalizeYemenPhone(
      customerPhone
    );

  const whatsappMessage =
    encodeURIComponent(
      `مرحباً ${customerName}، بخصوص طلبك رقم ${orderNumber} من ديور للأزياء.`
    );

  const whatsappLink =
    whatsappPhone
      ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
      : "";


  /* ----------------------------------------
     المنتجات
  ---------------------------------------- */

  const itemsHtml =
    (order.items || [])
      .map(item => {

        const image =
          item.image ||
          "/images/logo.jpg";

        const quantity =
          Number(item.quantity || 1);

        const price =
          Number(item.price || 0);

        const itemSubtotal =
          item.subtotal ??
          price * quantity;

        return `
          <div
            style="
              display:flex;
              gap:14px;
              align-items:flex-start;
              padding:14px 0;
              border-bottom:1px solid #eee;
            "
          >

            <img
              src="${escapeHtml(image)}"
              alt=""
              onerror="
                this.onerror=null;
                this.src='/images/logo.jpg';
              "
              style="
                width:85px;
                height:85px;
                object-fit:cover;
                border-radius:12px;
                background:#eee;
                flex-shrink:0;
              "
            >

            <div
              style="
                flex:1;
                min-width:0;
              "
            >

              <strong
                style="
                  display:block;
                  font-size:16px;
                  margin-bottom:8px;
                "
              >
                ${escapeHtml(
                  item.name || "منتج"
                )}
              </strong>

              <div
                style="
                  display:grid;
                  gap:5px;
                  color:#555;
                  font-size:14px;
                  line-height:1.7;
                "
              >

                <div>
                  📏
                  <strong>المقاس:</strong>
                  ${escapeHtml(
                    item.size ||
                    "بدون مقاس"
                  )}
                </div>

                <div>
                  🔢
                  <strong>الكمية:</strong>
                  ${quantity}
                </div>

                <div>
                  💵
                  <strong>سعر القطعة:</strong>
                  ${formatMoney(price)}
                  ريال
                </div>

                <div>
                  🧾
                  <strong>إجمالي المنتج:</strong>
                  ${formatMoney(itemSubtotal)}
                  ريال
                </div>

              </div>

            </div>

          </div>
        `;
      })
      .join("");


  /* ========================================
     الطلبات التي تم توصيلها
  ======================================== */

  if (isDelivered) {

    return `
      <div
        class="order-card delivered-order-card"
        id="order-${escapeHtml(orderId)}"
        onclick="
          toggleDeliveredOrder(
            '${escapeJs(orderId)}'
          )
        "
        style="
          position:relative;
          padding:14px;
          margin-bottom:14px;
          border-radius:16px;
          background:#f7f7f7;
          border:1px solid #e2e2e2;
          cursor:pointer;
        "
      >

        <div
          style="
            position:absolute;
            top:10px;
            left:10px;
            width:32px;
            height:32px;
            border-radius:50%;
            background:#22c55e;
            color:white;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            font-weight:bold;
          "
        >
          ✓
        </div>


        <div
          style="
            padding-left:45px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
          "
        >

          <div>

            <strong
              style="
                display:block;
                font-size:15px;
              "
            >
              طلب ${escapeHtml(
                orderNumber
              )}
            </strong>

            <span
              style="
                display:block;
                margin-top:5px;
                color:#666;
              "
            >
              ${escapeHtml(
                customerName
              )}
            </span>

            <small
              style="
                display:block;
                margin-top:4px;
                color:#999;
              "
            >
              ${orderDate
                ? "تم التوصيل • " +
                  escapeHtml(orderDate)
                : "تم التوصيل"}
            </small>

          </div>


          <strong
            style="
              color:#22a447;
              white-space:nowrap;
            "
          >
            تم التوصيل ✓
          </strong>

        </div>


        <div
          id="delivered-details-${escapeHtml(orderId)}"
          style="
            display:none;
            margin-top:16px;
            padding-top:16px;
            border-top:1px solid #ddd;
          "
        >

          ${renderFullOrderDetails({
            order,
            orderId,
            customerName,
            customerPhone,
            address,
            latitude,
            longitude,
            deliveryNotes,
            paymentMethod,
            subtotal,
            deliveryFee,
            total,
            orderNumber,
            orderDate,
            mapLink,
            whatsappLink,
            itemsHtml
          })}

        </div>

      </div>
    `;
  }


  /* ========================================
     الطلبات الحالية
  ======================================== */

  return `
    <div
      class="order-card"
      id="order-${escapeHtml(orderId)}"
      style="
        padding:18px;
        margin-bottom:18px;
        border-radius:16px;
        background:#fff;
        border:1px solid #e5e5e5;
        box-shadow:
          0 4px 15px rgba(0,0,0,.05);
      "
    >

      ${renderFullOrderDetails({
        order,
        orderId,
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        deliveryNotes,
        paymentMethod,
        subtotal,
        deliveryFee,
        total,
        orderNumber,
        orderDate,
        mapLink,
        whatsappLink,
        itemsHtml
      })}

    </div>
  `;
}


/* ==========================================
   تفاصيل الطلب كاملة
========================================== */

function renderFullOrderDetails(data) {

  const {
    order,
    orderId,
    customerName,
    customerPhone,
    address,
    latitude,
    longitude,
    deliveryNotes,
    paymentMethod,
    subtotal,
    deliveryFee,
    total,
    orderNumber,
    orderDate,
    mapLink,
    whatsappLink,
    itemsHtml
  } = data;


  return `

    <!-- رأس الطلب -->

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        flex-wrap:wrap;
        margin-bottom:18px;
        padding-bottom:15px;
        border-bottom:1px solid #eee;
      "
    >

      <div>

        <h3
          style="
            margin:0;
            font-size:20px;
          "
        >
          📦 طلب ${escapeHtml(
            orderNumber
          )}
        </h3>

        ${
          orderDate
            ? `
              <div
                style="
                  margin-top:6px;
                  color:#888;
                  font-size:13px;
                "
              >
                📅 ${escapeHtml(orderDate)}
              </div>
            `
            : ""
        }

      </div>


      <div
        style="
          padding:8px 14px;
          border-radius:20px;
          background:#f1f1f1;
          font-weight:bold;
        "
      >
        ${escapeHtml(
          order.status ||
          "تم الطلب"
        )}
      </div>

    </div>


    <!-- معلومات العميل والتوصيل -->

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(280px, 1fr)
          );
        gap:15px;
      "
    >

      <!-- العميل -->

      <div
        style="
          border:1px solid #eee;
          border-radius:12px;
          padding:15px;
        "
      >

        <h4>👤 بيانات العميل</h4>

        <p>
          <strong>الاسم:</strong>
          ${escapeHtml(
            customerName
          )}
        </p>

        <p>
          <strong>الهاتف:</strong>
          ${escapeHtml(
            customerPhone ||
            "غير محدد"
          )}
        </p>

        ${
          whatsappLink
            ? `
              <a
                href="${escapeHtml(
                  whatsappLink
                )}"
                target="_blank"
                rel="noopener noreferrer"
                onclick="
                  event.stopPropagation()
                "
                style="
                  display:inline-block;
                  margin-top:5px;
                  padding:9px 14px;
                  border-radius:9px;
                  background:#25D366;
                  color:white;
                  text-decoration:none;
                "
              >
                💬 التواصل عبر واتساب
              </a>
            `
            : ""
        }

      </div>


      <!-- التوصيل -->

      <div
        style="
          border:1px solid #eee;
          border-radius:12px;
          padding:15px;
        "
      >

        <h4>📍 بيانات التوصيل</h4>

        <p>
          <strong>العنوان:</strong>
          ${escapeHtml(address)}
        </p>

        ${
          hasCoordinates(
            latitude,
            longitude
          )
            ? `
              <p>
                <strong>خط العرض:</strong>
                ${escapeHtml(latitude)}
              </p>

              <p>
                <strong>خط الطول:</strong>
                ${escapeHtml(longitude)}
              </p>

              <a
                href="${escapeHtml(mapLink)}"
                target="_blank"
                rel="noopener noreferrer"
                onclick="
                  event.stopPropagation()
                "
                style="
                  display:inline-block;
                  margin-top:5px;
                  padding:9px 14px;
                  border-radius:9px;
                  background:#111;
                  color:white;
                  text-decoration:none;
                "
              >
                🗺️ فتح موقع العميل على الخريطة
              </a>
            `
            : `
              <p
                style="
                  color:#999;
                "
              >
                📍 لم يتم حفظ موقع العميل
              </p>
            `
        }

        ${
          deliveryNotes
            ? `
              <p>
                <strong>📝 ملاحظات التوصيل:</strong><br>
                ${escapeHtml(
                  deliveryNotes
                )}
              </p>
            `
            : `
              <p
                style="
                  color:#999;
                "
              >
                لا توجد ملاحظات توصيل
              </p>
            `
        }

      </div>


      <!-- الدفع -->

      <div
        style="
          border:1px solid #eee;
          border-radius:12px;
          padding:15px;
        "
      >

        <h4>💳 الدفع</h4>

        <p>
          <strong>طريقة الدفع:</strong>
          ${escapeHtml(
            paymentMethod
          )}
        </p>

      </div>

    </div>


    <!-- المنتجات -->

    <div
      style="
        margin-top:18px;
        border:1px solid #eee;
        border-radius:12px;
        padding:15px;
      "
    >

      <h4
        style="
          margin-top:0;
        "
      >
        🛍️ منتجات الطلب
      </h4>

      ${
        itemsHtml ||
        "<p>لا توجد منتجات في الطلب</p>"
      }

    </div>


    <!-- الحساب -->

    <div
      style="
        margin-top:18px;
        border:1px solid #eee;
        border-radius:12px;
        padding:15px;
      "
    >

      <h4
        style="
          margin-top:0;
        "
      >
        🧾 ملخص الحساب
      </h4>


      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:8px 0;
        "
      >
        <span>
          المجموع الفرعي
        </span>

        <strong>
          ${formatMoney(subtotal)}
          ريال
        </strong>
      </div>


      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:8px 0;
        "
      >
        <span>
          🚚 رسوم التوصيل
        </span>

        <strong>
          ${formatMoney(deliveryFee)}
          ريال
        </strong>
      </div>


      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:13px 0 0;
          margin-top:8px;
          border-top:1px solid #ddd;
          font-size:20px;
        "
      >

        <strong>
          الإجمالي النهائي
        </strong>

        <strong>
          ${formatMoney(total)}
          ريال
        </strong>

      </div>

    </div>


    <!-- تغيير الحالة -->

    <div
      style="
        margin-top:18px;
        padding-top:18px;
        border-top:1px solid #eee;
      "
      onclick="
        event.stopPropagation()
      "
    >

      <label>
        <strong>
          🔄 حالة الطلب
        </strong>
      </label>


      <select
        id="status-${escapeHtml(orderId)}"
        style="
          width:100%;
          margin-top:8px;
          padding:12px;
          border:1px solid #ddd;
          border-radius:10px;
          background:white;
          font-family:inherit;
        "
      >

        ${ORDER_STATUSES
          .map(status => `
            <option
              value="${escapeHtml(status)}"
              ${
                order.status === status
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(status)}
            </option>
          `)
          .join("")}

      </select>


      <button
        type="button"
        onclick="
          event.stopPropagation();
          updateOrderStatus(
            '${escapeJs(orderId)}'
          )
        "
        style="
          width:100%;
          margin-top:8px;
          padding:12px;
          border:0;
          border-radius:10px;
          background:#111;
          color:white;
          cursor:pointer;
          font-family:inherit;
        "
      >
        💾 حفظ حالة الطلب
      </button>

    </div>

  `;
}


/* ==========================================
   فتح وإغلاق الطلب المكتمل
========================================== */

function toggleDeliveredOrder(orderId) {

  const details =
    document.getElementById(
      `delivered-details-${orderId}`
    );

  if (!details) return;

  details.style.display =
    details.style.display === "block"
      ? "none"
      : "block";
}


/* ==========================================
   تحديث حالة الطلب
========================================== */

async function updateOrderStatus(orderId) {

  const select =
    document.getElementById(
      `status-${orderId}`
    );

  if (!select) {
    return;
  }

  const status =
    select.value;

  try {

    const response =
      await fetch(
        `/api/orders/admin/${orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "include",

          body: JSON.stringify({
            status
          })
        }
      );

    let data = {};

    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok) {

      if (response.status === 401) {

        window.location.href =
          "/admin/login.html";

        return;
      }

      throw new Error(
        data.message ||
        "تعذر تحديث حالة الطلب"
      );
    }

    alert(
      "تم تحديث حالة الطلب بنجاح"
    );

    await loadOrders();

  } catch (error) {

    console.error(
      "Update order status error:",
      error
    );

    alert(
      error.message ||
      "حدث خطأ أثناء تحديث حالة الطلب"
    );
  }
}


/* ==========================================
   التحقق من الإحداثيات
========================================== */

function hasCoordinates(
  latitude,
  longitude
) {

  return (
    latitude !== null &&
    latitude !== undefined &&
    latitude !== "" &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== ""
  );
}


/* ==========================================
   تنسيق المبالغ
========================================== */

function formatMoney(value) {

  return Number(
    value || 0
  ).toLocaleString("en-US");
}


/* ==========================================
   تحويل رقم اليمن لواتساب
========================================== */

function normalizeYemenPhone(phone) {

  let value =
    String(phone || "")
      .replace(/[^\d+]/g, "");

  if (
    value.startsWith("+")
  ) {
    value =
      value.substring(1);
  }

  if (
    value.startsWith("00967")
  ) {
    value =
      value.substring(2);
  }

  if (
    value.startsWith("967")
  ) {
    return value;
  }

  if (
    value.startsWith("7")
  ) {
    return "967" + value;
  }

  return value;
}


/* ==========================================
   حماية HTML
========================================== */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
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


/* ==========================================
   حماية JavaScript
========================================== */

function escapeJs(value) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );
}


/* ==========================================
   تشغيل الصفحة
========================================== */

loadOrders();
