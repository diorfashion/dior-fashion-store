const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();


// إنشاء طلب

router.post("/", async (req, res) => {
  try {

    const {
      customer,
      delivery,
      paymentMethod,
      items,
      deliveryFee = 0
    } = req.body;


    // التحقق الأساسي

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


    if (
      !delivery ||
      !delivery.address
    ) {
      return res.status(400).json({
        success: false,
        message: "عنوان التوصيل مطلوب"
      });
    }


    if (
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "طريقة الدفع مطلوبة"
      });
    }


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
      نستخدم transaction حتى لا يحدث
      خصم جزئي إذا فشل أحد المنتجات.
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


        // المنتج لديه مقاسات

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


          // خصم كمية المقاس

          selectedSize.quantity -=
            quantity;

        } else {

          // للمنتجات القديمة التي
          // ليس لديها مقاسات

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


        // إذا انتهت جميع المقاسات
        // يصبح المنتج غير متوفر

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


      const fee =
        Number(deliveryFee) || 0;


      const total =
        subtotal + fee;


      const orderNumber =
        "DF-" +
        Date.now() +
        "-" +
        Math.floor(
          Math.random() * 1000
        );


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


module.exports = router;
