const Subscription = require("../models/subscriptionModel");
const axios = require("axios");
const logger = require("../utils/logger"); // Path to your logger utility
require("dotenv").config();

// Create a new subscription
const createSubscription = async (req, res) => {
  const { userId, paymentId, subscriptionDate, subscriptionType } = req.body;
  logger.info("Create subscription request received", {
    userId,
    paymentId,
    subscriptionDate,
    subscriptionType,
  });

  try {
    const subscription = new Subscription({
      userId,
      paymentId,
      subscriptionDate,
      subscriptionType,
    });

    await subscription.save();
    logger.info("Subscription created successfully", {
      subscriptionId: subscription._id,
    });
    res.status(201).json(subscription);
  } catch (err) {
    logger.error("Error creating subscription", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

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
    res.json(subscriptions);
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

module.exports = {
  createSubscription,
  getSubscriptionsByUser,
  updateSubscriptionStatus,
};
