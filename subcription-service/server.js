// server.js
const express = require("express");
const connectDB = require("./config/db");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const consumeMessages = require("./utils/rabbitmq").consumeMessages;
const SubscriptionUserModel = require("./models/subscriptionUserModel");
const logger = require("./utils/logger");
const SubscriptionPayment = require("./models/subscriptionPaymentsModel");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/subscriptions", subscriptionRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Start consuming user registration messages
  consumeMessages("subscription_user_queue", async (data) => {
    if (data.type === "user_registration") {
      const user = data;
      logger.info("User registration received in subscription service", {
        userId: user.userId,
        email: user.email,
      });
      try {
        const subscriptionUser = new SubscriptionUserModel({
          userId: user.userId,
          name: user.name,
          email: user.email,
          createdAt: {
            utc: user.createdAt.utc,
            ist: user.createdAt.ist,
          },
        });
        await subscriptionUser.save();

        logger.info("subscriptionUser saved successfully", subscriptionUser);
      } catch (error) {
        console.error(
          "Failed to store user data in subscription service:",
          error
        );
      }
    } else {
      const user = data;
      logger.info("User Updation received in subscription service", {
        userId: user.userId,
      });

      try {
        const subscriptionUser = await SubscriptionUserModel.findOne({
          userId: user.userId,
        });

        if (!subscriptionUser) {
          logger.error("User not found", { userId: user.userId });
          throw { msg: "User not found" };
        }

        subscriptionUser.paymentMethods = user.paymentMethods;
        subscriptionUser.stripeCustomerId = user.stripeCustomerId;

        subscriptionUser.save();

        logger.info("SubscriptionUser updated successfully", subscriptionUser);
      } catch (error) {
        console.error(
          "Failed to update user data in subscription service:",
          error
        );
      }
    }
  });

  consumeMessages("update_subscription_queue", async (data) => {
    if (data.type === "payment_success" || data.type === "payment_failed") {
      const payment = data;
      logger.info("Payment received in subscription service", {
        subscriptionId: payment.subscriptionId,
        subscriptionPaymentId: payment.subscriptionPaymentId,
        userId: payment.userId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status,
        error: payment.error,
      });

      try {
        const subscriptionPayment = await SubscriptionPayment.findOne({
          _id: payment.subscriptionPaymentId,
        });

        logger.info("subscriptionPayment found successfully", subscriptionPayment);
        if (!subscriptionPayment) { 
          logger.error("SubscriptionPayment not found", {
            subscriptionPaymentId: payment.subscriptionPaymentId,
          });
          throw { msg: "SubscriptionPayment not found" };
        }
        subscriptionPayment.status = payment.status;
        subscriptionPayment.error = payment.error;

        subscriptionPayment.save();

        logger.info(
          "SubscriptionPayment updated successfully",
          subscriptionPayment
        );
      } catch (error) {
        console.error(
          "Failed to update subscription payment data in subscription service:",
          error
        );
      }
    }
  });

  app.listen(PORT, () => {
    logger.info(`Subscription Service running on port ${PORT}`);
  });
};

startServer();
