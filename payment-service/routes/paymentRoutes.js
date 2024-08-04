const express = require("express");
const {
  createPayment,
  extendPayment,
  getPaymentById,
} = require("../controllers/paymentController");

const router = express.Router();

// Create a new payment
router.post("/", createPayment);

// Get payment by ID
router.get("/:paymentId", getPaymentById);

module.exports = router;
