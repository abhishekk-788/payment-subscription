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
    type: Date,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
  },
  extendedDueDate: {
    type: Date,
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
    type: Date,
    default: Date.now,
  },
});

const convertDateToIST = (date) => {
  const ISTDate = moment.tz(date, "Asia/Kolkata");
  ISTDate.add(5, "hours").add(30, "minutes");
  return ISTDate.toDate();
};

const calculateDueDate = (dueDate) => {
  const dueDateMoment = moment(dueDate);
  dueDateMoment.set({
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 0,
  });
  return dueDateMoment.toDate();
};

subscriptionPaymentSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("createdAt")) {
    this.createdAt = convertDateToIST(this.createdAt);
  }
  if (this.isModified("dueDate")) {
    this.dueDate = calculateDueDate(this.dueDate);
    this.dueDate = convertDateToIST(this.dueDate);
  }
  next();
});

module.exports = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
