const express = require("express");
const {
  getPaymentById,
  savePaymentMethod,
  getStripePublishableKey,
} = require("../controllers/paymentController");

const router = express.Router();

// Get payment by ID
router.get("/:paymentId", getPaymentById);

router.post("/save-payment-method", savePaymentMethod);

// Get Stripe publishable key
router.get("/get-stripe-key", getStripePublishableKey);

module.exports = router;
