const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
const PaymentUser = require("../models/paymentUserModel");
const sendToQueue = require("../utils/rabbitmq").sendToQueue;
const logger = require("../utils/logger");
require("dotenv").config();

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

const savePaymentMethod = async (req, res) => { 

}

const getStripePublishableKey = (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

module.exports = { getPaymentById, savePaymentMethod, getStripePublishableKey };
