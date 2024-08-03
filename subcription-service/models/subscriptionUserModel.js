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
  }
};

module.exports = mongoose.model("SubscriptionUser", UserSchema);
