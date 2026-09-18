const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  {
    _id: false
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    oldPrice: {
      type: Number,
      default: null,
      min: 0
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    images: {
      type: [String],
      default: []
    },

    sizes: {
      type: [sizeSchema],
      default: []
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("Product", productSchema);
