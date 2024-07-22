// routes/userRoutes.js
const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/userController");

const auth = require("../middleware/auth");

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Get user profile
router.get("/profile", auth, getUserProfile);

module.exports = router;
