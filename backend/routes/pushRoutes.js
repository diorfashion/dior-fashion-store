const express = require("express");
const webpush = require("web-push");

const PushSubscription =
  require("../models/PushSubscription");

const AdminPushSubscription =
  require("../models/AdminPushSubscription");

const requireAdmin =
  require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// إعداد Web Push
// ==========================================

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


// ==========================================
// إرجاع المفتاح العام للمتصفح
// ==========================================

router.get(
  "/public-key",
  (req, res) => {

    res.json({

      success: true,

      publicKey:
        process.env.VAPID_PUBLIC_KEY

    });

  }
);


// ==========================================
// حفظ اشتراك العميل
// ==========================================

router.post(
  "/subscribe",
  async (req, res) => {

    try {

      const {
        phone,
        subscription
      } = req.body;


      if (!phone) {

        return res.status(400).json({

          success: false,

          message:
            "رقم الهاتف مطلوب"

        });

      }


      if (
        !subscription ||
        !subscription.endpoint
      ) {

        return res.status(400).json({

          success: false,

          message:
            "بيانات الاشتراك غير صحيحة"

        });

      }


      await PushSubscription.findOneAndUpdate(

        {
          phone:
            String(phone).trim(),

          "subscription.endpoint":
            subscription.endpoint
        },

        {
          phone:
            String(phone).trim(),

          subscription
        },

        {
          upsert: true,

          new: true
        }

      );


      res.json({

        success: true,

        message:
          "تم تفعيل إشعارات الطلبات"

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

  }
);


// ==========================================
// تسجيل اشتراك إشعارات الأدمن
// ==========================================

router.post(
  "/admin/subscribe",
  requireAdmin,
  async (req, res) => {

    try {

      const subscription =
        req.body?.subscription;


      // =====================================
      // التحقق من وجود الاشتراك
      // =====================================

      if (
        !subscription ||
        typeof subscription !== "object"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "بيانات اشتراك الادمن غير صحيحة"

        });

      }


      // =====================================
      // التحقق من Endpoint
      // =====================================

      if (
        typeof subscription.endpoint !== "string" ||
        !subscription.endpoint.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "بيانات اشتراك الادمن غير صحيحة"

        });

      }


      // =====================================
      // التحقق من Keys
      // =====================================

      if (
        !subscription.keys ||
        typeof subscription.keys !== "object" ||
        typeof subscription.keys.p256dh !== "string" ||
        typeof subscription.keys.auth !== "string" ||
        !subscription.keys.p256dh ||
        !subscription.keys.auth
      ) {

        return res.status(400).json({

          success: false,

          message:
            "بيانات اشتراك الادمن غير صحيحة"

        });

      }


      // =====================================
      // تنظيف البيانات
      // =====================================

      const cleanSubscription = {

        endpoint:
          subscription.endpoint,

        expirationTime:
          subscription.expirationTime ?? null,

        keys: {

          p256dh:
            subscription.keys.p256dh,

          auth:
            subscription.keys.auth

        }

      };


      // =====================================
      // البحث عن الجهاز
      // =====================================

      const existing =
        await AdminPushSubscription.findOne({

          "subscription.endpoint":
            cleanSubscription.endpoint

        });


      // =====================================
      // تحديث الاشتراك الموجود
      // =====================================

      if (existing) {

        existing.subscription =
          cleanSubscription;

        await existing.save();

        return res.json({

          success: true,

          message:
            "تم تحديث اشتراك إشعارات الأدمن"

        });

      }


      // =====================================
      // إنشاء اشتراك جديد
      // =====================================

      await AdminPushSubscription.create({

        subscription:
          cleanSubscription

      });


      // =====================================
      // الرد
      // =====================================

      return res.status(201).json({

        success: true,

        message:
          "تم حفظ اشتراك إشعارات الأدمن"

      });

    } catch (error) {

      console.error(
        "Admin subscribe error:",
        error
      );


      // =====================================
      // الاشتراك موجود بالفعل
      // =====================================

      if (error.code === 11000) {

        return res.json({

          success: true,

          message:
            "تم تفعيل إشعارات الأدمن بالفعل"

        });

      }


      return res.status(500).json({

        success: false,

        message:
          "تعذر حفظ اشتراك إشعارات الأدمن"

      });

    }

  }
);


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


  for (
    const item
    of subscriptions
  ) {

    try {

      await webpush.sendNotification(

        item.subscription,

        payload

      );


      console.log(
        "Admin notification sent successfully"
      );


    } catch (error) {

      console.error(

        "Admin push notification error:",

        error.statusCode,

        error.message

      );


      // --------------------------------------
      // حذف الاشتراكات المنتهية
      // --------------------------------------

      if (
        error.statusCode === 404 ||
        error.statusCode === 410
      ) {

        await AdminPushSubscription.deleteOne({

          _id:
            item._id

        });

      }

    }

  }

}


// ==========================================
// اختبار إشعار العميل
// ==========================================

router.post(
  "/send-test",
  async (req, res) => {

    try {

      const {
        phone
      } = req.body;


      if (!phone) {

        return res.status(400).json({

          success: false,

          message:
            "رقم الهاتف مطلوب"

        });

      }


      const subscriptions =
        await PushSubscription.find({

          phone:
            String(phone).trim()

        });


      if (!subscriptions.length) {

        return res.status(404).json({

          success: false,

          message:
            "لا يوجد اشتراك إشعارات لهذا الرقم"

        });

      }


      const payload =
        JSON.stringify({

          title:
            "ديور للأزياء",

          body:
            "تم تفعيل إشعارات طلباتك بنجاح 🛍️",

          url:
            "/track-order.html"

        });


      let sent = 0;


      for (
        const item
        of subscriptions
      ) {

        try {

          await webpush.sendNotification(

            item.subscription,

            payload

          );


          sent++;


        } catch (error) {

          console.error(

            "Test push error:",

            error.message

          );


          if (
            error.statusCode === 404 ||
            error.statusCode === 410
          ) {

            await PushSubscription.deleteOne({

              _id:
                item._id

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

  }
);


// ==========================================
// إتاحة دالة إرسال إشعار الأدمن
// لملف orderRoutes.js
// ==========================================

router.sendAdminNotification =
  sendAdminNotification;


// ==========================================
// تصدير Router
// ==========================================

module.exports =
  router;
