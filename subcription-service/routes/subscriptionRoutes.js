// routes/subscriptionRoutes.js
const express = require("express");
const {
  createSubscription,
  getSubscriptionsByUser,
  updateSubscriptionStatus,
} = require("../controllers/subscriptionController");

const router = express.Router();

// Create a new subscription
router.post("/", createSubscription);

// Get all subscriptions for a user
router.get("/user/:userId", getSubscriptionsByUser);

// Update subscription status
router.put("/:subscriptionId", updateSubscriptionStatus);

module.exports = router;
