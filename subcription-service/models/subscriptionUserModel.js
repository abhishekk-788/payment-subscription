const mongoose = require("mongoose");
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
  createdAt: {
    utc: { type: Date },
    ist: { type: Date },
  },
};

module.exports = mongoose.model("SubscriptionUser", UserSchema);
