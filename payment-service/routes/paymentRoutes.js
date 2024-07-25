const express = require("express");
const {
  init, 
  createPayment,
  extendPayment,
  getPaymentById,
} = require("../controllers/paymentController");

const router = express.Router();

// Create a new payment
router.post("/", createPayment);

// Extend payment due date
router.put("/extend/:paymentId", extendPayment);

// Get payment by ID
router.get("/:paymentId", getPaymentById);

module.exports = { init, router };
