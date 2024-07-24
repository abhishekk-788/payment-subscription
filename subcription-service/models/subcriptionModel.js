// models/subscriptionModel.js
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Payment",
  },
  subscriptionDate: {
    type: Date,
    required: true,
  },
  subscriptionType: {
    type: String,
    enum: ["monthly", "quarterly", "halfyearly", "annually"],
    required: true,
    default: "annually"
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
