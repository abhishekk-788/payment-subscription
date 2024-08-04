const Subscription = require("../models/subscriptionModel");
const logger = require("../utils/logger"); // Path to your logger utility
const SubscriptionUser = require("../models/subscriptionUserModel");
const schedulePayments = require("../services/subcriptionService");
const { findNearestUpcomingPayment, getExtensionCharge } = require("../services/subcriptionExtensionService");
const { sendToQueue } = require("../utils/rabbitmq");
const SubscriptionPayment = require("../models/subscriptionPaymentsModel");
require("dotenv").config();

// Create a new subscription
const createSubscription = async (req, res) => {
  const { userId, subscriptionType, amount } = req.body;
  try {
    const subscriptionUser = await SubscriptionUser.findOne({ userId: userId });
    if (!subscriptionUser)
      return res.status(404).json({ msg: "User not found" });

    logger.info("Create subscription request received", {
      userId,
      subscriptionType,
    });

    
    const subscription = new Subscription({
      userId: userId,
      subscriptionType: subscriptionType,
      amount: amount,
    });

    await subscription.save();
    
    logger.info("Subscription created successfully", subscription);

    await schedulePayments(subscription);

    res.status(201).json(subscription);
  } catch (err) {
    logger.error("Error creating subscription", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Extends an existing subscription
const extendSubscription = async (req, res) => { 
  const { subscriptionId } = req.params;
  const { extendPaymentDays } = req.body;

  if (!extendPaymentDays || extendPaymentDays <= 0) 
    res.status(400).json({ msg: "Invalid extension days" });

  if (extendPaymentDays > 30) 
    res.status(400).json({ msg: "Maximum extension days reached" });

  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription)
      return res.status(404).json({ msg: "Subscription not found" });

    logger.info("Subscription extension request received", { subscriptionId });

    const payment = await findNearestUpcomingPayment(subscriptionId);
    if (!payment)
      return res.status(404).json({ msg: "No upcoming payment found" });

    const extensionCharges = getExtensionCharge(payment.amount, extendPaymentDays);

    let extendedDueDate = new Date(payment.dueDate);
    extendedDueDate.setDate(
      payment.dueDate.getDate() + extendPaymentDays
    );
    payment.extendedDueDate = extendedDueDate,
    payment.extensionCharges = extensionCharges;
    payment.isDateExtended = true;

    await payment.save();

    sendToQueue("update_payment_queue", payment);

    const subscriptionUser = await SubscriptionUser.findOne({
      userId: subscription.userId,
    });

    sendToQueue("notification_queue", {
      type: "payment_extended",
      userId: payment.userId,
      subscriptionId: subscriptionId,
      name: subscriptionUser.name,
      email: subscriptionUser.email,
      amount: subscription.amount,
      dueDate: payment.dueDate,
      extendedDueDate: payment.extendedDueDate,
      extensionCharges: extensionCharges
    });

    logger.info("Subscription extension processed successfully", {
      subscriptionId,
      extensionCharges,
    });

    res.json({ msg: "Subscription extended successfully" });

  } catch (err) {
    logger.error("Error extending subscription", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Get extension charges for a subscription
const getExtensionCharges = async (req, res) => { 
  const { subscriptionId } = req.params;
  const { extendPaymentDays } = req.body;

  if (!extendPaymentDays || extendPaymentDays <= 0)
    res.status(400).json({ msg: "Invalid extension days" });

  if (extendPaymentDays > 30)
    res.status(400).json({ msg: "Maximum extension days reached" });

  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription)
      return res.status(404).json({ msg: "Subscription not found" });

    const payment = await findNearestUpcomingPayment(subscriptionId);
    if (!payment)
      return res.status(404).json({ msg: "No upcoming payment found" });

    const extensionCharges = getExtensionCharge(payment.amount, extendPaymentDays);

    logger.info("Extension charges retrieved successfully", {
      subscriptionId,
      extensionCharges,
    });

    res.json({ extensionCharges });
  } catch (err) {
    logger.error("Error retrieving extension charges", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Retrieve payment history for a subscription
const getPaymentHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const payments = await SubscriptionPayment.find({
      userId: userId,
      status: "paid",
    }).sort({ dueDate: 1 });

    logger.info("Payment history retrieved successfully", {
      userId: userId,
      paymentCount: payments.length,
    });

    res.json(payments);
  } catch (err) {
    logger.error("Error retrieving payment history", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Get all subscriptions for a user
const getSubscriptionsByUser = async (req, res) => {
  logger.info("Get subscriptions request received", {
    userId: req.params.userId,
  })

  try {
    const subscriptions = await Subscription.find({
      userId: req.params.userId,
    });
    logger.info("Subscriptions retrieved successfully", {
      userId: req.params.userId,
      subscriptionCount: subscriptions.length,
    });

    const subcriptionInfos = await Promise.all(subscriptions.map(async (subscription) => { 
      let subcriptionInfo = {
        subscription: subscription,
      };
      const payment = await SubscriptionPayment.find({ subscriptionId: subscription._id }).sort({ dueDate: 1 });

      subcriptionInfo.payment = payment;
      return subcriptionInfo;
    }));
    
    console.log(subcriptionInfos);
    res.json(subcriptionInfos);

  } catch (err) {
    logger.error("Error retrieving subscriptions", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Update subscription status
const updateSubscriptionStatus = async (req, res) => {
  logger.info("Update subscription status request received", {
    subscriptionId: req.params.subscriptionId,
    status: req.body.status,
  });

  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      logger.info("Subscription not found", {
        subscriptionId: req.params.subscriptionId,
      });
      return res.status(404).json({ msg: "Subscription not found" });
    }

    subscription.status = req.body.status;
    await subscription.save();
    logger.info("Subscription status updated successfully", {
      subscriptionId: subscription._id,
      status: subscription.status,
    });

    res.json(subscription);
  } catch (err) {
    logger.error("Error updating subscription status", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Cancel a subscription
const cancelSubscription = async (req, res) => {
  logger.info("Cancel subscription request received", {
    subscriptionId: req.params.subscriptionId,
  });

  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      logger.info("Subscription not found", {
        subscriptionId: req.params.subscriptionId,
      });
      return res.status(404).json({ msg: "Subscription not found" });
    }

    subscription.status = "cancelled";
    await subscription.save();
    logger.info("Subscription cancelled successfully", {
      subscriptionId: subscription._id,
    });

    res.json(subscription);
  } catch (err) {
    logger.error("Error canceling subscription", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  createSubscription,
  extendSubscription,
  getSubscriptionsByUser,
  updateSubscriptionStatus,
  getExtensionCharges,
  getPaymentHistory,
  cancelSubscription
}
