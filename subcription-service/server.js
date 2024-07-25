// server.js
const express = require("express");
const connectDB = require("./config/db");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/subscriptions", subscriptionRoutes);

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
