const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true
    },

    subscription: {
      type: Object,
      required: true
    }
  },
  {
    timestamps: true
  }
);

pushSubscriptionSchema.index(
  {
    phone: 1
  }
);

module.exports =
  mongoose.model(
    "PushSubscription",
    pushSubscriptionSchema
  );
