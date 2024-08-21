// models/notificationModel.js
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "user_registration",
      "reset_password_otp",
      "subscription_created",
      "payment_created",
      "payment_extended",
      "payment_reminder",
    ],
    required: true,
  },
  sentAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
});

notificationSchema.pre("save", async function (next) {
  if (!this.sentAt || !this.sentAt.utc) {
    const now = new Date();
    this.sentAt = {
      utc: now, // Set UTC date
      ist: moment(now).add(5, "hours").add(30, "minutes").toDate(),
    };
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
