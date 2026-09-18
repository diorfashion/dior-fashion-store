const mongoose = require("mongoose");

const adminPushSubscriptionSchema = new mongoose.Schema(
  {
    subscription: {
      type: Object,
      required: true
    }
  },
  {
    timestamps: true
  }
);

adminPushSubscriptionSchema.index(
  { "subscription.endpoint": 1 },
  { unique: true }
);

module.exports =
  mongoose.model(
    "AdminPushSubscription",
    adminPushSubscriptionSchema
  );
