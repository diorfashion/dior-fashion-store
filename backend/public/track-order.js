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

  const statusIndex =
    ORDER_STATUSES.indexOf(
      order.status
    );


  const timeline =
    ORDER_STATUSES
      .map((status, index) => {

        let className = "";

        if (index < statusIndex) {
          className = "completed";
        }

        if (index === statusIndex) {
          className = "current";
        }

        return `
          <div class="status-step ${className}">

            <div class="status-icon">
              ${
                index <= statusIndex
                  ? "✓"
                  : index + 1
              }
            </div>

            <span>
              ${escapeHtml(status)}
            </span>

          </div>
        `;

      })
      .join("");


  const products =
    (order.items || [])
      .map(item => {

        return `
          <div class="order-product">

            ${
              item.image
                ? `
                  <img
                    src="${escapeHtml(item.image)}"
                    alt=""
                  >
                `
                : `
                  <div
                    style="
                      width:70px;
                      height:70px;
                      border-radius:10px;
                      background:#eee;
                    "
                  ></div>
                `
            }

            <div class="product-info">

              <div class="product-name">
                ${escapeHtml(
                  item.name || "منتج"
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
                ${item.quantity || 1}
              </div>

              <div class="product-detail">
                السعر:
                ${formatMoney(item.price)}
                ريال
              </div>

            </div>

          </div>
        `;

      })
      .join("");


  const createdAt =
    order.createdAt
      ? new Date(
          order.createdAt
        ).toLocaleString("ar-YE")
      : "";


  return `
    <article class="order-card">

      <div class="order-header">

        <div>

          <div class="order-number">
            طلب رقم:
            ${escapeHtml(
              order.orderNumber
            )}
          </div>

          <div class="order-date">
            ${escapeHtml(createdAt)}
          </div>

        </div>

        <div class="status-badge">
          ${escapeHtml(
            order.status
          )}
        </div>

      </div>


      <div class="status-timeline">

        ${timeline}

      </div>


      <h3 class="products-title">
        🛍️ المنتجات
      </h3>


      <div>
        ${products}
      </div>


      <div class="payment-info">

        <strong>
          طريقة الدفع:
        </strong>

        ${escapeHtml(
          order.paymentMethod || ""
        )}

      </div>


      <div class="summary">

        <div class="summary-row">

          <span>
            المجموع الفرعي
          </span>

          <span>
            ${formatMoney(
              order.subtotal
            )}
            ريال
          </span>

        </div>


        <div class="summary-row">

          <span>
            رسوم التوصيل
          </span>

          <span>
            ${formatMoney(
              order.deliveryFee
            )}
            ريال
          </span>

        </div>


        <div class="summary-row summary-total">

          <span>
            الإجمالي
          </span>

          <span>
            ${formatMoney(
              order.total
            )}
            ريال
          </span>

        </div>

      </div>

    </article>
  `;
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
