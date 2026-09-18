const API_URL = "/api/orders/track";


// =========================
// حالات الطلب
// =========================

const ORDER_STATUSES = [
  "تم الطلب",
  "تأكيد الدفع",
  "جاري التجهيز",
  "التوصيل",
  "تم التوصيل"
];


// =========================
// تشغيل الصفحة
// =========================

document
  .getElementById("trackForm")
  .addEventListener(
    "submit",
    trackOrder
  );


// =========================
// البحث عن الطلب
// =========================

async function trackOrder(event) {

  event.preventDefault();


  const orderNumber =
    document
      .getElementById("orderNumber")
      .value
      .trim();


  const phone =
    document
      .getElementById("customerPhone")
      .value
      .trim();


  const button =
    document.getElementById(
      "trackButton"
    );


  const message =
    document.getElementById(
      "trackMessage"
    );


  const result =
    document.getElementById(
      "orderResult"
    );


  if (!orderNumber || !phone) {

    message.textContent =
      "يرجى إدخال رقم الطلب ورقم الهاتف";

    return;
  }


  button.disabled = true;

  button.textContent =
    "جاري البحث...";

  message.textContent = "";

  result.classList.add("hidden");


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
            JSON.stringify({

              orderNumber,

              phone

            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "لم يتم العثور على الطلب"
      );

    }


    renderOrder(
      data.order
    );


  } catch (error) {

    console.error(
      "Track order error:",
      error
    );

    message.textContent =
      error.message ||
      "حدث خطأ أثناء البحث";


  } finally {

    button.disabled = false;

    button.textContent =
      "🔎 البحث عن الطلب";

  }

}


// =========================
// عرض الطلب
// =========================

function renderOrder(order) {

  const result =
    document.getElementById(
      "orderResult"
    );


  result.classList.remove(
    "hidden"
  );


  result.innerHTML = `

    <section class="track-card">

      <div class="order-header">

        <h2>
          تفاصيل الطلب
        </h2>

        <div class="order-number">
          ${escapeHtml(
            order.orderNumber
          )}
        </div>

        <div class="order-date">
          تاريخ الطلب:
          ${formatDate(
            order.createdAt
          )}
        </div>

      </div>


      <!-- حالة الطلب -->

      <div class="status-timeline">

        ${renderStatusTimeline(
          order.status
        )}

      </div>


      <!-- المنتجات -->

      <h2 class="products-title">
        🛍️ المنتجات
      </h2>

      <div>

        ${
          order.items &&
          order.items.length
            ? order.items
                .map(
                  item =>
                    renderProduct(item)
                )
                .join("")
            : `
              <p>
                لا توجد منتجات في الطلب.
              </p>
            `
        }

      </div>


      <!-- الدفع -->

      <div class="payment-info">

        <strong>
          طريقة الدفع:
        </strong>

        <span>
          ${escapeHtml(
            order.paymentMethod
          )}
        </span>

      </div>


      <!-- المبلغ -->

      <div
        style="margin-top:20px;"
      >

        <div class="summary-row">

          <span>
            المجموع
          </span>

          <strong>
            ${formatPrice(
              order.subtotal
            )}
          </strong>

        </div>


        <div class="summary-row">

          <span>
            التوصيل
          </span>

          <strong>
            ${formatPrice(
              order.deliveryFee
            )}
          </strong>

        </div>


        <div
          class="summary-row summary-total"
        >

          <span>
            الإجمالي
          </span>

          <span>
            ${formatPrice(
              order.total
            )}
          </span>

        </div>

      </div>


      <a
        href="/"
        class="back-button"
      >
        🏠 العودة إلى المتجر
      </a>

    </section>

  `;


  result.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


// =========================
// عرض مراحل الطلب
// =========================

function renderStatusTimeline(
  currentStatus
) {

  const currentIndex =
    ORDER_STATUSES.indexOf(
      currentStatus
    );


  return ORDER_STATUSES
    .map(
      (status, index) => {

        let className =
          "status-step";


        if (
          index < currentIndex
        ) {

          className +=
            " completed";

        }


        if (
          index === currentIndex
        ) {

          className +=
            " current";

        }


        const icon =
          index <= currentIndex
            ? "✓"
            : "○";


        return `

          <div
            class="${className}"
          >

            <div class="status-icon">
              ${icon}
            </div>

            <div>
              ${escapeHtml(status)}
            </div>

          </div>

        `;

      }
    )
    .join("");

}


// =========================
// عرض المنتج
// =========================

function renderProduct(item) {

  const subtotal =
    Number(item.subtotal) ||
    Number(item.price) *
    Number(item.quantity);


  const image =
    item.image ||
    "images/logo.jpg";


  return `

    <div class="order-product">

      <img
        src="${escapeHtml(image)}"
        alt="${escapeHtml(item.name)}"
        onerror="
          this.src='images/logo.jpg'
        "
      >


      <div class="product-info">

        <div class="product-name">
          ${escapeHtml(
            item.name
          )}
        </div>


        <div class="product-detail">
          المقاس:
          ${escapeHtml(
            item.size ||
            "بدون مقاس"
          )}
        </div>


        <div class="product-detail">
          الكمية:
          ${Number(
            item.quantity
          )}
        </div>


        <div class="product-detail">
          السعر:
          ${formatPrice(
            item.price
          )}
        </div>


        <div class="product-detail">

          الإجمالي:
          <strong>
            ${formatPrice(
              subtotal
            )}
          </strong>

        </div>

      </div>

    </div>

  `;

}


// =========================
// تنسيق التاريخ
// =========================

function formatDate(
  date
) {

  if (!date) {
    return "غير معروف";
  }


  try {

    return new Date(
      date
    ).toLocaleString(
      "ar-YE",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  } catch (error) {

    return "غير معروف";

  }

}


// =========================
// تنسيق السعر
// =========================

function formatPrice(
  price
) {

  return Number(price || 0)
    .toLocaleString("ar-YE")
    + " ريال";

}


// =========================
// حماية HTML
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
// قراءة رقم الطلب من الرابط
// =========================
//
// مثال:
// /track-order.html?order=DF-123-456
//

const params =
  new URLSearchParams(
    window.location.search
  );


const orderFromUrl =
  params.get("order");


if (orderFromUrl) {

  document
    .getElementById(
      "orderNumber"
    )
    .value =
      orderFromUrl;

}
