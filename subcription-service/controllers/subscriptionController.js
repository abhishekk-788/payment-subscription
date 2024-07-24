// controllers/subscriptionController.js
const Subscription = require("../models/subcriptionModel");
const axios = require("axios");
require("dotenv").config();

// Create a new subscription
const createSubscription = async (req, res) => {
  const { userId, paymentId, subscriptionDate, subscriptionType } = req.body;

  try {
    const subscription = new Subscription({
      userId,
      paymentId,
      subscriptionDate,
      subscriptionType,
    });

    await subscription.save();
    res.status(201).json(subscription);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get all subscriptions for a user
const getSubscriptionsByUser = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.params.userId,
    });
    res.json(subscriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Update subscription status
const updateSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ msg: "Subscription not found" });
    }

    subscription.status = req.body.status;
    await subscription.save();

    res.json(subscription);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  createSubscription,
  getSubscriptionsByUser,
  updateSubscriptionStatus,
};
