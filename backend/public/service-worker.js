// ==========================================
// Service Worker - ديور للأزياء
// Web Push Notifications
// ==========================================


// ==========================================
// استقبال الإشعار
// ==========================================

self.addEventListener("push", function (event) {

  let data = {};

  try {

    data = event.data
      ? event.data.json()
      : {};

  } catch (error) {

    console.error(
      "Push data parse error:",
      error
    );

    data = {};
  }


  const title =
    data.title ||
    "ديور للأزياء";


  const options = {

    body:
      data.body ||
      "لديك تحديث جديد",


    icon:
      data.icon ||
      "/images/logo.jpg",


    badge:
      data.badge ||
      "/images/logo.jpg",


    dir:
      "rtl",


    lang:
      "ar",


    requireInteraction:
      true,


    vibrate: [
      200,
      100,
      200
    ],


    timestamp:
      Date.now(),


    data: {

      url:
        data.url ||
        "/track-order.html"

    }

  };


  event.waitUntil(

    self.registration.showNotification(
      title,
      options
    )

  );

});


// ==========================================
// الضغط على الإشعار
// ==========================================

self.addEventListener(
  "notificationclick",
  function (event) {

    event.notification.close();


    const url =
      event.notification &&
      event.notification.data &&
      event.notification.data.url
        ? event.notification.data.url
        : "/track-order.html";


    event.waitUntil(

      clients.matchAll({

        type:
          "window",

        includeUncontrolled:
          true

      })

      .then(function (clientList) {


        // ==================================
        // إذا كان الموقع مفتوحًا
        // ==================================

        for (
          const client
          of clientList
        ) {

          if (
            "focus" in client
          ) {

            return client
              .focus()
              .then(function () {

                if (
                  "navigate" in client
                ) {

                  return client.navigate(
                    url
                  );

                }

              });

          }

        }


        // ==================================
        // إذا لم يكن الموقع مفتوحًا
        // ==================================

        if (
          "openWindow" in clients
        ) {

          return clients.openWindow(
            url
          );

        }

      })

    );

  }
);


// ==========================================
// تثبيت Service Worker
// ==========================================

self.addEventListener(
  "install",
  function () {

    self.skipWaiting();

  }
);


// ==========================================
// تفعيل Service Worker
// ==========================================

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(
      self.clients.claim()
    );

  }
);
