const moment = require("moment-timezone");
const { sendToQueue } = require("../utils/rabbitmq");
const SubscriptionUser = require("../models/subscriptionUserModel");
const logger = require("../utils/logger");
const SubscriptionPaymentModel = require("../models/subscriptionPaymentsModel");

const schedulePayments = async (subscription) => {
  const subscriptionUser = await SubscriptionUser.findOne({ userId: subscription.userId });
  if (!subscriptionUser) {
    logger.error("User not found", { userId: subscription.userId });
    throw { msg: "User not found" };
  }
  const subscriptionId = subscription._id;
  const subscriptionType = subscription.subscriptionType;
  let payments;
  switch (subscriptionType) {
    case "onetime":
      payments = scheduleOneTimePayment(subscription);
      break;
    case "3month":
      payments = scheduleNmonthPayment(3, subscription);
      break;
    case "6month":
      payments = scheduleNmonthPayment(6, subscription);
      break;
    case "12month":
      payments = scheduleNmonthPayment(12, subscription);
      break;
    case "18month":
      payments = scheduleNmonthPayment(18, subscription);
      break;
    case "24month":
      payments = scheduleNmonthPayment(24, subscription);
      break;
    default:
      logger.error("Invalid subscription type", { subscriptionType });
      return;
  }

  if (!Array.isArray(payments)) {
    logger.error("Invalid payment schedule", { subscriptionId });
    return;
  }

  payments.forEach(async (payment) => {
    
    const subscriptionPayment = new SubscriptionPaymentModel({
      userId: payment.userId,
      subscriptionId: payment.subscriptionId,
      amount: payment.amount,
      dueDate: payment.dueDate,
      priority: payment.priority
    });
    
    await subscriptionPayment.save();
    
    await sendToQueue("payment_queue", { payment: payment, subscriptionPaymentId: subscriptionPayment._id });
    logger.info("Sent payment to queue:", {
      payment: payment,
      subscriptionPaymentId: subscriptionPayment._id,
    });
  });

  const subscriptionDataToNotificationQueue = {
      type: "subscription_created",
      userId: subscription.userId,
      subscriptionId: subscription._id,
      name: subscriptionUser.name,
      email: subscriptionUser.email,
      amount: subscription.amount
  }
  await sendToQueue("notification_queue", subscriptionDataToNotificationQueue);
  
};

scheduleOneTimePayment = (subscription) => {
  const subscriptionId = subscription._id;
  const { userId, amount } = subscription;
  const currentDate = new Date();
  const dueDateUTC = calculateDueDate(currentDate);
  const dueDateIST = convertDateToIST(dueDateUTC);

  const payments = [];
  payments.push({
    userId: userId,
    subscriptionId: subscriptionId,
    amount: amount,
    dueDate: dueDateIST,
    priority: 1
  });

  return payments;
};

scheduleNmonthPayment = (n, subscription) => {
  const subscriptionId = subscription._id;
  const { userId, amount } = subscription;
  
  const currentDate = new Date();
  const dueDateUTC = calculateDueDate(currentDate);

  const payments = [];
  for (let i = 1; i <= n; i++) {
    const newDueDate = moment(dueDateUTC).add(i, "months").toDate();
    payments.push({
      userId: userId,
      subscriptionId: subscriptionId,
      amount: amount,
      dueDate: convertDateToIST(newDueDate),
      priority: i,
    });
  }
  return payments;
};

const convertDateToIST = (date) => {
  const ISTDate = moment.tz(date, "Asia/Kolkata");
  ISTDate.add(5, "hours").add(30, "minutes");
  return ISTDate.toDate();
};

const calculateDueDate = (dueDate) => {
  const dueDateMoment = moment(dueDate);
  dueDateMoment.set({
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 0,
  });
  return dueDateMoment.toDate();
};

module.exports = schedulePayments;
