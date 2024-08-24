// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const moment = require("moment-timezone");
const cron = require("node-cron");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const consumeMessages = require("./utils/rabbitmq").consumeMessages;
const PaymentUser = require("./models/paymentUserModel");
const logger = require("./utils/logger");
const {
  createPaymentFromSubscriptionQueue,
  processPayments,
  processOneTimePayment,
} = require("./services/paymentService");
const { schedulePaymentReminders } = require("./services/paymentReminders");
require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("./models/paymentModel");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/payments", paymentRoutes);

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(
  cors({
    origin: `http://localhost:${PORT}`,
  })
);

const startServer = async () => {
  // Start consuming user registration messages
  consumeMessages("payment_user_queue", async (data) => {
    if (data.type === "user_registration") {
      const user = data;
      logger.info("User registration received in payment service", {
        userId: user.userId,
        email: user.email,
      });
      try {
        const paymentUser = new PaymentUser({
          userId: user.userId,
          name: user.name,
          email: user.email,
          createdAt: {
            utc: user.createdAt.utc,
            ist: user.createdAt.ist,
          },
        });
        await paymentUser.save();

        logger.info("PaymentUser saved successfully", paymentUser);
      } catch (error) {
        console.error("Failed to store user data in payment service:", error);
      }
    } else {
      const user = data;
      logger.info("User Updation received in payment service", {
        userId: user.userId,
      });

      try {
        const paymentUser = await PaymentUser.findOne({ userId: user.userId });
        if (!paymentUser) {
          logger.error("User not found", { userId: user.userId });
          throw { msg: "User not found" };
        }

        paymentUser.paymentMethods = user.paymentMethods;
        paymentUser.stripeCustomerId = user.stripeCustomerId;
        await paymentUser.save();

        logger.info("PaymentUser updated successfully", paymentUser);
      } catch (error) {
        console.error("Failed to update user data in payment service:", error);
      }
    }
  });

  consumeMessages("payment_queue", async (data) => {
    const { payment, subscriptionPaymentId } = data;
    logger.info("Payment received in payment service", {
      subscriptionId: payment.subscriptionId,
      userId: payment.userId,
      amount: payment.amount,
      paymentMethodId: payment.paymentMethodId,
      dueDate: payment.dueDate,
      priority: payment.priority,
      paymantType: payment.paymentType,
      subscriptionPaymentId: subscriptionPaymentId,
    });

    await createPaymentFromSubscriptionQueue(payment, subscriptionPaymentId);

    if (payment.paymentType === "one_time") {
      await processOneTimePayment(subscriptionPaymentId);
    }
  });

  consumeMessages("update_payment_queue", async (payment) => {
    logger.info("Payment received in payment service", {
      subscriptionPaymentId: payment._id,
      subscriptionId: payment.subscriptionId,
      userId: payment.userId,
      amount: payment.amount,
      dueDate: payment.dueDate,
      priority: payment.priority,
      extendedDueDate: payment.extendedDueDate,
      extensionCharges: payment.extensionCharges,
      isDateExtended: payment.isDateExtended,
    });

    const result = await Payment.updateOne(
      { subscriptionPaymentId: payment._id },
      {
        $set: {
          extendedDueDate: payment.extendedDueDate,
          extensionCharges: payment.extensionCharges,
          isDateExtended: payment.isDateExtended,
        },
      }
    );
    logger.info("Payment updated successfully", result, payment);
  });

  cron.schedule("0 8 * * *", async () => {
    const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    logger.info(`Cron job started at ${now} IST`);

    try {
      await processPayments();
      logger.info("processPayments() executed successfully");
    } catch (error) {
      logger.error("Error executing processPayments()", {
        error: error.message,
      });
    }
  });

  await schedulePaymentReminders();

  app.listen(PORT, () => {
    logger.info(`Payment service running on port ${PORT}`);
  });
};

startServer();
