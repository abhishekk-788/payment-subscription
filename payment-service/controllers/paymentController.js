const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
require("dotenv").config();

// Create a new payment
const createPayment = async (req, res) => {
  const { userId, amount, dueDate } = req.body;
  try {
    const payment = new Payment({ userId, amount, dueDate });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Extend payment due date
const extendPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { extensionDays, extensionCharge } = req.body;

  try {
    let payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ msg: "Payment not found" });

    const extendedDueDate = moment(payment.dueDate);
    payment.extendedDueDate = extendedDueDate
      .add(extensionDays, "days")
      .toDate();

    await payment.save();
    res.json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;

  try {
    let payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ msg: "Payment not found" });

    res.json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

module.exports = { createPayment, extendPayment, getPaymentById };
