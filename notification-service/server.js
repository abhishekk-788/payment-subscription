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

const PORT = process.env.PORT || 3000;

const startServer = async () => {

  // Consume Messages
  consumeMessages("notification_queue", async (data) => {
    await sendMailNotification(data);
  });

  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
};

startServer();
