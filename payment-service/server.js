// server.js
const express = require("express");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const consumeMessages = require("./utils/rabbitmq").consumeMessages;
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
  consumeMessages("user_registration_queue", async (user) => {
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

      logger.info("PaymentUser saved successfully", { userId: user._id });
    } catch (error) {
      console.error("Failed to store user data in payment service:", error);
    }
  });

  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
};

startServer();