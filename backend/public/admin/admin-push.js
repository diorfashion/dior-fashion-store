// ==========================================
// إشعارات الأدمن
// ==========================================

const adminNotificationButton =
  document.getElementById(
    "enableAdminNotificationsButton"
  );

const adminNotificationMessage =
  document.getElementById(
    "adminNotificationMessage"
  );


// ==========================================
// تحويل VAPID Base64 URL
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
// رسالة
// ==========================================

function showAdminNotificationMessage(
  text,
  type = ""
) {

  if (!adminNotificationMessage) {
    return;
  }

  adminNotificationMessage.textContent =
    text;

  adminNotificationMessage.className =
    "admin-notification-message";

  if (type) {
    adminNotificationMessage.classList.add(
      type
    );
  }
}


// ==========================================
// تفعيل إشعارات الأدمن
// ==========================================

async function enableAdminNotifications() {

  try {

    // --------------------------------------
    // Service Worker
    // --------------------------------------

    if (!("serviceWorker" in navigator)) {

      showAdminNotificationMessage(
        "متصفحك لا يدعم إشعارات الطلبات.",
        "error"
      );

      return;
    }


    // --------------------------------------
    // Push API
    // --------------------------------------

    if (!("PushManager" in window)) {

      showAdminNotificationMessage(
        "متصفحك لا يدعم إشعارات Push.",
        "error"
      );

      return;
    }


    // --------------------------------------
    // Notification API
    // --------------------------------------

    if (!("Notification" in window)) {

      showAdminNotificationMessage(
        "متصفحك لا يدعم إشعارات المتصفح.",
        "error"
      );

      return;
    }


    showAdminNotificationMessage(
      "جاري تجهيز الإشعارات..."
    );


    // --------------------------------------
    // تسجيل Service Worker
    // --------------------------------------

    const registration =
      await navigator.serviceWorker.register(
        "/service-worker.js"
      );


    await navigator.serviceWorker.ready;


    // --------------------------------------
    // طلب الإذن
    // --------------------------------------

    let permission =
      Notification.permission;


    if (permission === "default") {

      permission =
        await Notification.requestPermission();

    }


    if (permission !== "granted") {

      showAdminNotificationMessage(
        "لم يتم السماح بالإشعارات. اسمح بها من إعدادات المتصفح.",
        "error"
      );

      return;
    }


    // --------------------------------------
    // الحصول على VAPID Public Key
    // --------------------------------------

    const keyResponse =
      await fetch(
        "/api/push/public-key",
        {
          credentials: "include"
        }
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
    // الحصول على الاشتراك الحالي
    // --------------------------------------

    let subscription =
      await registration.pushManager
        .getSubscription();


    // --------------------------------------
    // إنشاء اشتراك جديد
    // --------------------------------------

    if (!subscription) {

      subscription =
        await registration.pushManager.subscribe({

          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              keyData.publicKey
            )

        });

    }


    // --------------------------------------
    // حفظ اشتراك الأدمن
    // --------------------------------------

    const saveResponse =
  await fetch(
    "/api/push/admin/subscribe",
    {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        subscription: subscription.toJSON()
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
        "تعذر حفظ اشتراك الأدمن"
      );

    }


    // --------------------------------------
    // نجاح
    // --------------------------------------

    showAdminNotificationMessage(
      "✅ تم تفعيل إشعارات الطلبات بنجاح.",
      "success"
    );


    if (adminNotificationButton) {

      adminNotificationButton.textContent =
        "✅ إشعارات الطلبات مفعّلة";

      adminNotificationButton.disabled =
        true;

    }

  } catch (error) {

    console.error(
      "Admin notification error:",
      error
    );

    showAdminNotificationMessage(
      error.message ||
      "تعذر تفعيل إشعارات الطلبات.",
      "error"
    );

  }

}


// ==========================================
// زر التفعيل
// ==========================================

if (adminNotificationButton) {

  adminNotificationButton.addEventListener(
    "click",
    enableAdminNotifications
  );

}
