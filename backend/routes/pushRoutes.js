const express = require("express");
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const AdminPushSubscription =
  require("../models/AdminPushSubscription");
const router = express.Router();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


// ==========================================
// إرجاع المفتاح العام للمتصفح
// ==========================================

router.get("/public-key", (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// ==========================================
// إرسال إشعار لجميع أجهزة الأدمن
// ==========================================

async function sendAdminNotification({
  title,
  body,
  url = "/admin/orders.html"
}) {

  const subscriptions =
    await AdminPushSubscription.find();

  if (!subscriptions.length) {
    console.log(
      "لا توجد أجهزة أدمن مفعلة للإشعارات"
    );

    return;
  }

  const payload =
    JSON.stringify({
      title,
      body,
      url
    });

  for (const item of subscriptions) {

    try {

      await webpush.sendNotification(
        item.subscription,
        payload
      );

    } catch (error) {

      console.error(
        "Admin push notification error:",
        error.statusCode,
        error.message
      );

      // الاشتراك انتهى أو أصبح غير صالح
      if (
        error.statusCode === 404 ||
        error.statusCode === 410
      ) {
        await AdminPushSubscription.deleteOne({
          _id: item._id
        });
      }
    }
  }
}
// ==========================================
// حفظ اشتراك العميل
// ==========================================

router.post("/subscribe", async (req, res) => {
  try {
    const { phone, subscription } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف مطلوب"
      });
    }

    if (
      !subscription ||
      !subscription.endpoint
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات الاشتراك غير صحيحة"
      });
    }

    await PushSubscription.findOneAndUpdate(
      {
        phone: String(phone).trim(),
        "subscription.endpoint":
          subscription.endpoint
      },
      {
        phone: String(phone).trim(),
        subscription
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      message: "تم تفعيل إشعارات الطلبات"
    });

  } catch (error) {
    console.error(
      "Save push subscription error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "تعذر تفعيل الإشعارات"
    });
  }
});

// ==========================================
// تسجيل اشتراك إشعارات الأدمن
// ==========================================

router.post(
  "/admin/subscribe",
  requireAdmin,
  async (req, res) => {
    try {
      const { subscription } = req.body;

      if (
        !subscription ||
        !subscription.endpoint
      ) {
        return res.status(400).json({
          success: false,
          message: "اشتراك الإشعارات غير صالح"
        });
      }

      await AdminPushSubscription.findOneAndUpdate(
        {
          "subscription.endpoint":
            subscription.endpoint
        },
        {
          subscription
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      res.json({
        success: true,
        message:
          "تم تفعيل إشعارات الأدمن بنجاح"
      });

    } catch (error) {
      console.error(
        "Admin push subscribe error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "تعذر حفظ اشتراك إشعارات الأدمن"
      });
    }
  }
);

// ==========================================
// إرسال إشعار لعميل
// ==========================================

router.post("/send-test", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف مطلوب"
      });
    }

    const subscriptions =
      await PushSubscription.find({
        phone: String(phone).trim()
      });

    if (!subscriptions.length) {
      return res.status(404).json({
        success: false,
        message:
          "لا يوجد اشتراك إشعارات لهذا الرقم"
      });
    }

    const payload = JSON.stringify({
      title: "ديور للأزياء",
      body: "تم تفعيل إشعارات طلباتك بنجاح 🛍️",
      url: "/track-order.html"
    });

    let sent = 0;

    for (const item of subscriptions) {
      try {
        await webpush.sendNotification(
          item.subscription,
          payload
        );

        sent++;

      } catch (error) {

        // الاشتراك انتهت صلاحيته
        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          await PushSubscription.deleteOne({
            _id: item._id
          });
        }
      }
    }

    res.json({
      success: true,
      sent
    });

  } catch (error) {
    console.error(
      "Send test notification error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "تعذر إرسال الإشعار"
    });
  }
});


router.sendAdminNotification =
  sendAdminNotification;

module.exports = router;
