const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
const connectRabbitMQ = require("../utils/rabbitmq");
const logger = require("../utils/logger"); // Path to your logger utility
require("dotenv").config();

let channel;

const init = async () => {
  try {
    channel = await connectRabbitMQ();
    channel.assertQueue("payment_queue", { durable: true });
    logger.info("RabbitMQ channel and queue initialized");
  } catch (error) {
    logger.error("Error initializing RabbitMQ", { error: error.message });
  }
};

// Create a new payment
const createPayment = async (req, res) => {
  const { userId, amount, dueDate } = req.body;
  logger.info("Create payment request received", { userId, amount, dueDate });

  try {
    const payment = new Payment({ userId, amount, dueDate });
    await payment.save();
    logger.info("Payment created successfully", { paymentId: payment._id });

    // Send message to the queue
    channel.sendToQueue("payment_queue", Buffer.from(JSON.stringify(payment)), {
      persistent: true,
    });
    logger.info("Payment message sent to queue", { paymentId: payment._id });

    res.status(200).send("Payment processed and message sent to queue");
  } catch (error) {
    logger.error("Error creating payment", { error: error.message });
    res.status(500).send("Server error");
  }
};

// Extend payment due date
const extendPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { extensionDays, extensionCharge } = req.body;
  logger.info("Extend payment request received", {
    paymentId,
    extensionDays,
    extensionCharge,
  });

  try {
    let payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.info("Payment not found", { paymentId });
      return res.status(404).json({ msg: "Payment not found" });
    }

    const extendedDueDate = moment(payment.dueDate);
    payment.extendedDueDate = extendedDueDate
      .add(extensionDays, "days")
      .toDate();
    await payment.save();
    logger.info("Payment extended successfully", {
      paymentId: payment._id,
      extendedDueDate: payment.extendedDueDate,
    });

    // Send message to the queue
    channel.sendToQueue("payment_queue", Buffer.from(JSON.stringify(payment)), {
      persistent: true,
    });
    logger.info("EMI extension message sent to queue", {
      paymentId: payment._id,
    });

    res.status(200).send("EMI extension processed and message sent to queue");
  } catch (error) {
    logger.error("Error extending payment", { error: error.message });
    res.status(500).send("Server error");
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;
  logger.info("Get payment by ID request received", { paymentId });

  try {
    let payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.info("Payment not found", { paymentId });
      return res.status(404).json({ msg: "Payment not found" });
    }

    logger.info("Payment retrieved successfully", { paymentId: payment._id });
    res.json(payment);
  } catch (error) {
    logger.error("Error retrieving payment", { error: error.message });
    res.status(500).send("Server error");
  }
};

module.exports = { init, createPayment, extendPayment, getPaymentById };
