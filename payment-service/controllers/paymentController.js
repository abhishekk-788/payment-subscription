const moment = require("moment-timezone");
const Payment = require("../models/paymentModel");
const connectRabbitMQ = require("./utils/rabbitmq");
require("dotenv").config();

let channel;

const init = async () => {
  channel = await connectRabbitMQ();
  channel.assertQueue("payment_queue", { durable: true });
};

// Create a new payment
const createPayment = async (req, res) => {
  const { userId, amount, dueDate } = req.body;
  try {
    const payment = new Payment({ userId, amount, dueDate });
    await payment.save();

    // Send message to the queue
    channel.sendToQueue(
      "payment_queue",
      Buffer.from(JSON.stringify(paymentData)),
      { persistent: true }
    );

    res.status(200).send("Payment processed and message sent to queue");
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
    
    // Send message to the queue
    channel.sendToQueue(
      "payment_queue",
      Buffer.from(JSON.stringify(paymentData)),
      { persistent: true }
    );
    res.status(200).send("EMI extension processed and message sent to queue");
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

module.exports = { init, createPayment, extendPayment, getPaymentById };
