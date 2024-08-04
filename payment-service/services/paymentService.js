const Payment = require("../models/paymentModel");
const PaymentUser = require("../models/paymentUserModel");
const sendToQueue = require("../utils/rabbitmq").sendToQueue;
const logger = require("../utils/logger");
const moment = require("moment-timezone");

const createPaymentFromSubscriptionQueue = async (
  payment,
  subscriptionPaymentId
) => {
  const { userId, subscriptionId, amount, priority } = payment;
  const dueDate = payment.dueDate;

  console.log(payment.dueDate.utc, payment.dueDate.ist, payment.subscriptionId);
  
  try {
    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) return res.status(404).json({ msg: "User not found" });

    const newPayment = new Payment({
      userId,
      subscriptionId,
      subscriptionPaymentId,
      amount,
      dueDate: {
        utc: dueDate.utc,
        ist: dueDate.ist,
      },
      priority,
    });
    
    await newPayment.save();

    const dataToQueue = {
      type: "payment_created",
      userId: paymentUser._id,
      subscriptionId: newPayment.subscriptionId,
      name: paymentUser.name,
      email: paymentUser.email,
      paymentId: newPayment._id,
      amount: newPayment.amount,
      dueDate: {
        utc: newPayment.dueDate.utc,
        ist: newPayment.dueDate.ist,
      },
    };

    // Send message to the queue
    // sendToQueue("notification_queue", dataToQueue);

    logger.info({
      message: "Payment has been processed",
      paymentId: newPayment._id,
    });
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

module.exports = createPaymentFromSubscriptionQueue;
