const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
const PaymentUser = require("../models/paymentUserModel");
const sendToQueue = require("../utils/rabbitmq").sendToQueue;
const logger = require("../utils/logger");
require("dotenv").config();

// Create a new payment
const createPayment = async (req, res) => {
  const { userId, subscriptionId, amount, dueDate, priority } = req.body;
  try {
    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) return res.status(404).json({ msg: "User not found" });

    const payment = new Payment({
      userId,
      subscriptionId,
      amount,
      dueDate,
      priority,
    });
    await payment.save();

    const dataToQueue = {
      type: "payment_created",
      userId: paymentUser._id,
      subscriptionId: payment.subscriptionId,
      name: paymentUser.name,
      email: paymentUser.email,
      paymentId: payment._id,
      amount: payment.amount,
      dueDate: payment.dueDate,
    };

    // Send message to the queue
    sendToQueue("notification_queue", dataToQueue);

    res.status(200).json({
      message: "Payment has been processed",
      paymentId: payment._id,
    });
  } catch (error) {
    logger.error(error.message);
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

    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) return res.status(404).json({ msg: "User not found" });

    const dataToQueue = {
      type: "payment_extended",
      userId: paymentUser._id,
      email: paymentUser.email,
      paymentId: payment._id,
      amount: payment.amount,
      dueDate: payment.dueDate,
      extendedDueDate: payment.extendedDueDate,
      extensionDays: extensionDays,
      extensionCharge: extensionCharge,
    };

    await sendToQueue("notification_queue", dataToQueue);

    res.status(200).send("EMI extension processed");
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
