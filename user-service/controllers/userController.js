// controllers/userController.js
const User = require("../models/userModel");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendToQueue = require("../utils/rabbitmq");
require("dotenv").config();

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  logger.info("Register user request received", { name, email });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info("User already exists", { email });
      return res.status(400).json({ msg: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
    });

    await user.save();
    logger.info("User saved successfully", { userId: user._id });

    const dataToQueue = {
      userId: user._id,
      name: user.name,
      email: user.email,
    }

    await sendToQueue("user_registration_queue", dataToQueue);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    logger.info("JWT token generated", { userId: user._id });

    res.status(201).json({ token });
    logger.info("User registered successfully", { userId: user._id });
  } catch (err) {
    logger.error("Error in user registration", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  logger.info("Login request received", { email });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.info("Invalid credentials", { email });
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info("Invalid credentials", { email });
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    logger.info("JWT token generated", { userId: user._id });

    res.json({ msg: "Login Done Successfully", token: token });
    logger.info("User logged in successfully", { userId: user._id });
  } catch (err) {
    logger.error("Error during login", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get authenticated user's profile
const getUserProfile = async (req, res) => {
  logger.info("Get user profile request received", { userId: req.user.id });

  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
    logger.info("User profile retrieved successfully", { userId: req.user.id });
  } catch (err) {
    logger.error("Error retrieving user profile", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
