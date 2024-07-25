// server.js
const express = require("express");
const connectDB = require("./config/db");
const notificationRoutes = require("./routes/notificationRoutes");
const connectRabbitMQ = require("./utils/rabbitmq");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  const channel = await connectRabbitMQ();

  // Routes
  app.use("/api/notifications", notificationRoutes(channel));

  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
};

startServer();
