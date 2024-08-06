// server.js
const express = require("express");
const connectDB = require("./config/db");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const consumeMessages = require("./utils/rabbitmq").consumeMessages;
const SubscriptionUserModel = require("./models/subscriptionUserModel");
const logger = require("./utils/logger")
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
  consumeMessages("subscription_user_registration_queue", async (user) => {
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
  });

  app.listen(PORT, () => {
    console.log(`Subscription Service running on port ${PORT}`);
  });
};

startServer();
