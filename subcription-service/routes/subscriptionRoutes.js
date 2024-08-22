// routes/subscriptionRoutes.js
const express = require("express");
const {
  createSubscription,
  getSubscriptionsByUser,
  updateSubscriptionStatus,
  extendSubscription,
  getExtensionCharges,
  getPaymentHistory,
  cancelSubscription,
} = require("../controllers/subscriptionController");

const router = express.Router();
const auth = require("../middleware/auth");

// Create a new subscription
router.post("/", auth, createSubscription);

// Extend subscription due date of nearest payment
router.post("/:subscriptionId/extend", auth, extendSubscription);

// Get extension charges for a subscription
router.post("/:subscriptionId/extensionCharges", auth, getExtensionCharges);

// Retrieve payment history for a subscription
router.get("/user/paymentHistory/:userId", auth, getPaymentHistory);

// Get all subscriptions for a user
router.get("/user/:userId", auth, getSubscriptionsByUser);

// Update subscription status
router.put("/:subscriptionId", auth, updateSubscriptionStatus);

// Cancel a subscription
router.delete("/:subscriptionId/cancel", auth, cancelSubscription);

module.exports = router;
