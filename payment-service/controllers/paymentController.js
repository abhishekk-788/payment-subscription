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
      userId: userId,
      subcriptionId: subscriptionId,
      amount: amount,
      dueDate: {
        utc: dueDate,
        ist: moment(dueDate)
         .add(5, "hours")
         .add(30, "minutes")
         .toDate(),
      },
      priority: priority,
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
      dueDate: payment.dueDate.utc,
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

module.exports = { createPayment, getPaymentById };
