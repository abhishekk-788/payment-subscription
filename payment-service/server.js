// server.js
const express = require("express");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const consumeMessages = require("./utils/rabbitmq").consumeMessages;
const PaymentUser = require("./models/paymentUserModel")
const logger = require("./utils/logger");
const createPaymentFromSubscriptionQueue = require("./services/paymentService");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  // Start consuming user registration messages
  consumeMessages("payment_user_registration_queue", async (user) => {
    logger.info("User registration received in payment service", {
      userId: user.userId,
      email: user.email,
    });
    try {
      const paymentUser = new PaymentUser({
        userId: user.userId,
        name: user.name,
        email: user.email,
      });
      await paymentUser.save();

      logger.info("PaymentUser saved successfully", paymentUser);
    } catch (error) {
      console.error("Failed to store user data in payment service:", error);
    }
  });

  consumeMessages("payment_queue", async (payment) => { 
    logger.info("Payment received in payment service", {
      subscriptionId: payment.subscriptionId,
      userId: payment.userId,
      amount: payment.amount,
      dueDate: payment.dueDate,
      priority: payment.priority
    });

    await createPaymentFromSubscriptionQueue(payment);

  })

  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
};

startServer();