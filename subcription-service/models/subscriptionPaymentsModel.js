const mongoose = require("mongoose");
const moment = require("moment-timezone");
const subscriptionPaymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
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
    enum: ["pending", "processing", "paid", "overdue"],
    default: "pending",
  },
  createdAt: {
    utc: { type: Date},
    ist: { type: Date},
  },
});

subscriptionPaymentSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("createdAt") || this.isModified("createdAt.utc")) {
    const now = new Date();
    this.createdAt = {
      utc: now, // Set UTC date
      ist: moment(now).add(5, "hours").add(30, "minutes").toDate(),
    };
  }
  next();
});

module.exports = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
