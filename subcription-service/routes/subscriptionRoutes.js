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

// Create a new subscription
router.post("/", createSubscription);

// Extend subscription due date of nearest payment
router.post("/:subscriptionId/extend", extendSubscription);

// Get extension charges for a subscription
router.post("/:subscriptionId/extensionCharges", getExtensionCharges);

// Retrieve payment history for a subscription
router.get("/user/paymentHistory/:userId", getPaymentHistory);

// Get all subscriptions for a user
router.get("/user/:userId", getSubscriptionsByUser);

// Update subscription status
router.put("/:subscriptionId", updateSubscriptionStatus);

// Cancel a subscription
router.delete("/:subscriptionId/cancel", cancelSubscription);

module.exports = router;
