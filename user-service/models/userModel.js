const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

const paymentMethodSchema = new mongoose.Schema({
  id: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  paymentMethods: [paymentMethodSchema],
  stripeCustomerId: {type: String },
  createdAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
});

userSchema.pre("save", async function (next) {
  if (!this.createdAt || !this.createdAt.utc) {
    const now = new Date();
    this.createdAt = {
      utc: now, // Set UTC date
      ist: moment(now).add(5, "hours").add(30, "minutes").toDate(),
    };
  }
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
