// models/subscriptionModel.js
const mongoose = require("mongoose");
const moment = require("moment-timezone");


const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  subscriptionType: {
    type: String,
    enum: ["onetime", "3month", "6month", "12month", "18month", "24month"],
    required: true,
    default: "onetime",
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "cancelled"],
    default: "active",
  },
  createdAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
});

subscriptionSchema.pre("save", function (next) {
  if (!this.createdAt) {
    const now = new Date();
    this.createdAt = {}; // Ensure the createdAt object exists
    this.createdAt.utc = now; // Set UTC date
    this.createdAt.ist = moment.tz(now, "Asia/Kolkata").toDate(); // Convert to IST and set
  }
  next();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
