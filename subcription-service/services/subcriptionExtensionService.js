const mongoose = require("mongoose");
const SubscriptionPayment = require("../models/subscriptionPaymentsModel");
const logger = require("../utils/logger");

const findNearestUpcomingPayment = async (subscriptionId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const payments = await SubscriptionPayment
      .find({
        subscriptionId: subscriptionId,
        "dueDate.ist": { $gte: today },  // Local Date and Time
        extensionDate: null,
        isDateExtended: false,
        status: {$ne: "paid"},
      })
      .sort("dueDate.utc")
      .limit(1)
      .exec();

    if (payments.length === 0) {
      return null;
    }

    logger.info("Nearest upcoming payment found", {
      subscriptionId,
      paymentId: payments[0]._id,
      dueDate: {
        utc: payments[0].dueDate.utc,
        ist: payments[0].dueDate.ist,
      },
    });

    return payments[0];
  } catch (error) {
    console.error("Error finding payment:", error);
    throw error;
  }
};

function getExtensionCharge(amount, extendDays) {
  const BASE_FEE = 50; // Fixed fee for processing the extension
  const DAILY_RATE = 0.001; // Daily rate as a percentage of the payment amount

  // Calculate daily charge
  const dailyCharge = amount * DAILY_RATE * extendDays;

  // Total extension charge is the sum of the base fee and the daily charge
  const totalExtensionCharge = BASE_FEE + dailyCharge;

  logger.info("Extension charge calculated", {
    amount,
    extendDays,
    totalExtensionCharge,
  });

  return totalExtensionCharge;
}

module.exports = {
  findNearestUpcomingPayment,
  getExtensionCharge,
};
