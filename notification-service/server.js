// server.js
const express = require("express");
const connectDB = require("./config/db");
const notificationRoutes = require("./routes/notificationRoutes");
const consumeMessages = require("./utils/rabbitmq");
const sendMailNotification = require("./controllers/notificationController")
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5003;

const startServer = async () => {

  // Consume Messages
  consumeMessages("payment_queue", async (paymentData) => {
    await sendMailNotification(paymentData);
  });

  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
};

startServer();
