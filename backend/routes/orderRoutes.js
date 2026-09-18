const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// إنشاء طلب جديد
// ==========================================

router.post("/", async (req, res) => {
  try {

    const {
      customer,
      delivery,
      paymentMethod,
      items,
      deliveryFee = 0
    } = req.body;


    // التحقق من بيانات العميل

    if (
      !customer ||
      !customer.name ||
      !customer.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات العميل ناقصة"
      });
    }


    // التحقق من العنوان

    if (
      !delivery ||
      !delivery.address
    ) {
      return res.status(400).json({
        success: false,
        message: "عنوان التوصيل مطلوب"
      });
    }


    // التحقق من الموقع

    if (
      typeof delivery.latitude !== "number" ||
      typeof delivery.longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد موقع التوصيل على الخريطة"
      });
    }


    // طرق الدفع المسموحة

    const allowedPaymentMethods = [
      "الدفع عند الاستلام",
      "تحويل بنكي",
      "محفظة جيب"
    ];


    if (
      !allowedPaymentMethods.includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "طريقة الدفع غير صحيحة"
      });
    }


    // التحقق من السلة

    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({
        success: false,
        message: "السلة فارغة"
      });
    }


    /*
      استخدام transaction
      حتى لا يتم خصم جزء من المخزون
      إذا حدث خطأ في أحد المنتجات.
    */

    const session =
      await mongoose.startSession();

    session.startTransaction();


    try {

      let subtotal = 0;

      const orderItems = [];


      for (const item of items) {

        if (
          !item.productId ||
          !mongoose.Types.ObjectId.isValid(
            item.productId
          )
        ) {
          throw new Error(
            "معرف المنتج غير صالح"
          );
        }


        const quantity =
          Number(item.quantity);


        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          throw new Error(
            "كمية المنتج غير صحيحة"
          );
        }


        const product =
          await Product.findById(
            item.productId
          ).session(session);


        if (!product) {
          throw new Error(
            "أحد المنتجات غير موجود"
          );
        }


        let selectedSize = null;


        // =====================================
        // المنتجات التي لديها مقاسات
        // =====================================

        if (
          product.sizes &&
          product.sizes.length
        ) {

          if (!item.size) {
            throw new Error(
              `يجب اختيار مقاس لـ ${product.name}`
            );
          }


          selectedSize =
            product.sizes.find(
              size =>
                size.name === item.size
            );


          if (!selectedSize) {
            throw new Error(
              `المقاس ${item.size} غير موجود للمنتج ${product.name}`
            );
          }


          if (
            selectedSize.quantity <
            quantity
          ) {
            throw new Error(
              `الكمية المتوفرة من ${product.name} بمقاس ${item.size} هي ${selectedSize.quantity}`
            );
          }


          selectedSize.quantity -=
            quantity;

        } else {

          // =====================================
          // المنتجات بدون مقاسات
          // =====================================

          if (
            product.stock <
            quantity
          ) {
            throw new Error(
              `الكمية المتوفرة من ${product.name} هي ${product.stock}`
            );
          }


          product.stock -=
            quantity;
        }


        // =====================================
        // تحديث حالة توفر المنتج
        // =====================================

        const remainingSizes =
          product.sizes &&
          product.sizes.length
            ? product.sizes.reduce(
                (sum, size) =>
                  sum + size.quantity,
                0
              )
            : product.stock;


        if (
          remainingSizes <= 0
        ) {
          product.isAvailable =
            false;
        }


        await product.save({
          session
        });


        // =====================================
        // حساب سعر المنتج
        // =====================================

        const itemSubtotal =
          product.price *
          quantity;


        subtotal +=
          itemSubtotal;


        orderItems.push({
          productId:
            product._id,

          name:
            product.name,

          price:
            product.price,

          image:
            product.images &&
            product.images.length
              ? product.images[0]
              : "",

          size:
            item.size || "",

          quantity,

          subtotal:
            itemSubtotal
        });

      }


      // =====================================
      // حساب الإجمالي
      // =====================================

      const fee =
        Number(deliveryFee) || 0;


      const total =
        subtotal + fee;


      // =====================================
      // إنشاء رقم الطلب
      // =====================================

      const orderNumber =
        "DF-" +
        Date.now() +
        "-" +
        Math.floor(
          Math.random() * 1000
        );


      // =====================================
      // إنشاء الطلب
      // =====================================

      const order =
        new Order({

          orderNumber,

          customer: {
            name:
              customer.name,

            phone:
              customer.phone
          },

          delivery: {

            address:
              delivery.address,

            latitude:
              delivery.latitude,

            longitude:
              delivery.longitude,

            notes:
              delivery.notes || ""
          },

          paymentMethod,

          items:
            orderItems,

          subtotal,

          deliveryFee:
            fee,

          total,

          status:
            "تم الطلب"
        });


      await order.save({
        session
      });


      await session.commitTransaction();

      session.endSession();


      // =====================================
      // الرد للمتجر
      // =====================================

      res.status(201).json({

        success: true,

        message:
          "تم إنشاء الطلب بنجاح",

        order: {

          id:
            order._id,

          orderNumber:
            order.orderNumber,

          status:
            order.status,

          paymentMethod:
            order.paymentMethod,

          total:
            order.total
        }

      });


    } catch (error) {

      await session.abortTransaction();

      session.endSession();

      throw error;
    }


  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    res.status(400).json({

      success: false,

      message:
        error.message ||
        "تعذر إنشاء الطلب"

    });

  }

});


// ==========================================
// جلب جميع طلبات العميل بواسطة رقم الهاتف
// ==========================================

router.get("/my-orders", async (req, res) => {

  try {

    const phone = String(
      req.query.phone || ""
    ).trim();


    if (!phone) {

      return res.status(400).json({

        success: false,

        message:
          "رقم الهاتف مطلوب"

      });

    }


    const orders =
      await Order.find({

        "customer.phone":
          phone

      })
      .sort({
        createdAt: -1
      })
      .lean();


    res.json({

      success: true,

      orders: orders.map(order => ({

        orderNumber:
          order.orderNumber,

        customer:
          order.customer,

        paymentMethod:
          order.paymentMethod,

        items:
          order.items,

        subtotal:
          order.subtotal,

        deliveryFee:
          order.deliveryFee,

        total:
          order.total,

        status:
          order.status,

        delivery:
          order.delivery,

        createdAt:
          order.createdAt

      }))

    });


  } catch (error) {

    console.error(
      "Get customer orders error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "حدث خطأ أثناء تحميل الطلبات"

    });

  }

});


// ==========================================
// جلب جميع الطلبات للإدارة
// ==========================================

router.get(
  "/admin",
  requireAdmin,
  async (req, res) => {

    try {

      const orders =
        await Order.find()
          .sort({
            createdAt: -1
          })
          .lean();


      res.json({

        success: true,

        orders

      });


    } catch (error) {

      console.error(
        "Get admin orders error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "تعذر تحميل الطلبات"

      });

    }

  }
);


// ==========================================
// تغيير حالة الطلب
// ==========================================

router.put(
  "/admin/:id/status",
  requireAdmin,
  async (req, res) => {

    try {

      const {
        status
      } = req.body;


      const allowedStatuses = [

        "تم الطلب",

        "تأكيد الدفع",

        "جاري التجهيز",

        "التوصيل",

        "تم التوصيل"

      ];


      if (
        !allowedStatuses.includes(status)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "حالة الطلب غير صحيحة"

        });

      }


      const order =
        await Order.findByIdAndUpdate(

          req.params.id,

          {
            status
          },

          {
            new: true,
            runValidators: true
          }

        ).lean();


      if (!order) {

        return res.status(404).json({

          success: false,

          message:
            "الطلب غير موجود"

        });

      }


      res.json({

        success: true,

        message:
          "تم تحديث حالة الطلب",

        order: {

          id:
            order._id,

          orderNumber:
            order.orderNumber,

          status:
            order.status

        }

      });


    } catch (error) {

      console.error(
        "Update order status error:",
        error
      );

      res.status(400).json({

        success: false,

        message:
          "تعذر تحديث حالة الطلب"

      });

    }

  }
);


module.exports = router;
