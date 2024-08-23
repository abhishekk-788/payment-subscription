const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(
  cors({
    origin: `http://localhost:${PORT}`,
  })
);

// Routes
app.use("/api/users", userRoutes);

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
