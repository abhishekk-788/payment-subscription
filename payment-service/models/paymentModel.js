const mongoose = require("mongoose");
const moment = require("moment-timezone");
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  subscriptionPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPayment",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ["one_time", "recurring"],
    required: true,
  },
  paymentMethodId: {
    type: String,
    required: true,  
  },
  dueDate: {
    utc: { type: Date, required: true },
    ist: { type: Date, required: true },
  },
  priority: {
    type: Number,
    required: true,
  },
  extendedDueDate: {
    utc: { type: Date },
    ist: { type: Date },
  },
  extensionCharges: {
    type: Number,
  },
  isDateExtended: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "paid", "overdue", "failed"],
    default: "pending",
  },
  createdAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
});

paymentSchema.pre("save", function (next) {
  if (
    this.isNew ||
    this.isModified("createdAt") ||
    this.isModified("createdAt.utc")
  ) {
    const now = new Date();
    this.createdAt = {
      utc: now, // Set UTC date
      ist: moment(now).add(5, "hours").add(30, "minutes").toDate(),
    };
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
