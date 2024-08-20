const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
  id: String,
  isDefault: { type: Boolean, default: false },
});

const UserSchema = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  paymentMethods: [paymentMethodSchema],
  stripeCustomerId: { type: String },
  createdAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
};

module.exports = mongoose.model("PaymentUser", UserSchema);
