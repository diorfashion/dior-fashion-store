const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ""
    },

    size: {
      type: String,
      default: ""
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    customer: {
      name: {
        type: String,
        required: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        trim: true
      }
    },

    delivery: {
      address: {
        type: String,
        required: true,
        trim: true
      },

      notes: {
        type: String,
        default: ""
      }
    },

    paymentMethod: {
      type: String,
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "تم الطلب",
        "تأكيد الدفع",
        "جاري التجهيز",
        "التوصيل",
        "تم التوصيل"
      ],
      default: "تم الطلب"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("Order", orderSchema);
