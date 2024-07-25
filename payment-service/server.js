// server.js
const express = require("express");
const connectDB = require("./config/db");
const { init, router  } = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/payments", router);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log("Payment Service running on port 5001");
  init();
});
