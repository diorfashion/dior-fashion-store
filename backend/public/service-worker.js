self.addEventListener("push", function (event) {

  let data = {};

  try {

    data = event.data
      ? event.data.json()
      : {};

  } catch (error) {

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
      "/images/logo.jpg",


    badge:
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
// عند الضغط على الإشعار
// ==========================================

self.addEventListener(
  "notificationclick",
  function (event) {

    event.notification.close();


    const url =
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


        // إذا كانت الصفحة مفتوحة
        for (
          const client
          of clientList
        ) {

          if (
            "focus" in client
          ) {

            client.navigate(url);

            return client.focus();

          }

        }


        // إذا لم تكن الصفحة مفتوحة
        if (
          clients.openWindow
        ) {

          return clients.openWindow(
            url
          );

        }

      })

    );

  }
);
