const Payment = require("../models/paymentModel");
const PaymentUser = require("../models/paymentUserModel");
const sendToQueue = require("../utils/rabbitmq").sendToQueue;
const logger = require("../utils/logger");

const createPaymentFromSubscriptionQueue = async (payment) => {
  const { userId, subscriptionId, amount, dueDate, priority } = payment;
  try {
    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) return res.status(404).json({ msg: "User not found" });

    const payment = new Payment({ userId, subscriptionId, amount, dueDate, priority });
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
    // sendToQueue("notification_queue", dataToQueue);

    logger.info({
      message: "Payment has been processed",
      paymentId: payment._id,
    });
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

module.exports = createPaymentFromSubscriptionQueue;
