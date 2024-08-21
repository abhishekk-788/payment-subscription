// controllers/userController.js
const User = require("../models/userModel");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtr, redisClient } = require("../middleware/jwt-redis");
const sendToQueue = require("../utils/rabbitmq");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
const mongoose = require("mongoose");

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

    // Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    logger.info("User password hashed", { email, password });

    const user = new User({
      name,
      email,
      password,
    });

    await user.save();
    logger.info("User saved successfully", { userId: user._id });

    const dataToQueue = {
      type: "user_registration",
      userId: user._id,
      name: user.name,
      email: user.email,
      createdAt: {
        utc: user.createdAt.utc,
        ist: user.createdAt.ist,
      }
    }

    await sendToQueue("payment_user_queue", dataToQueue);
    await sendToQueue("subscription_user_queue", dataToQueue);
    await sendToQueue("notification_queue", dataToQueue);

    res.status(201).json({ "message": "User registration successful" });
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
  logger.info("Login request received", { email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.info("Invalid Email credentials", { email });
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.info("Invalid Password credentials", { email });
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = await jwtr.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    logger.info("JWT token generated", { token: token });

    await redisClient.set(`authToken:${user._id}`, token, "EX", 3600);

    res.json({ msg: "Login Done Successfully", userId: user._id });
    logger.info("User logged in successfully", { userId: user._id });
  } catch (err) {
    logger.error("Error during login", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const forgotPassword = async (req, res) => { 
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with expiration (e.g., 15 minutes)
    await redisClient.set(`resetPasswordOtp:${email}`, otp, {
      EX: 15 * 60,
    });

    // Send OTP via notification-service
    await sendToQueue("notification_queue", {
      type: "reset_password_otp",
      userId: user._id,
      email: user.email,
      otp: otp,
    });
    logger.info(`OTP: ${otp} sent to ${email} via notification service`);
    
    res.json({ success: true, message: 'OTP has been sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Retrieve the OTP from Redis
    const storedOtp = await redisClient.get(`resetPasswordOtp:${email}`);
    logger.info(`Retrieved OTP from Redis: ${storedOtp}`);
    logger.info(`OTP received: ${otp}`);

    if (!storedOtp || storedOtp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // OTP is valid; allow password reset
    res.json({
      success: true,
      message: "OTP verified. You may now reset your password.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  logger.info("Reset password request received", { email, newPassword });

  try {
    // Check if the OTP is still valid in Redis
    const storedOtp = await redisClient.get(`resetPasswordOtp:${email}`);

    if (!storedOtp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired or user not found" });
    }

    // Find the user in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    logger.info("New password hashed successfully", { userId: user._id, password: user.password });

    // Save the new password
    await user.save();

    // Clear the OTP from Redis
    redisClient.del(`resetPasswordOtp:${email}`);

    logger.info("Password reset successfully", { userId: user._id });

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get authenticated user's profile
const getUserProfile = async (req, res) => {
  const { userId } = req.query;
  logger.info("Get user profile request received", { userId: userId });

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "User not found" });
  }

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.json("User not found");
      return;
    }
    res.json(user);
    logger.info("User profile retrieved successfully", { userId: userId });
  } catch (err) {
    logger.error("Error retrieving user profile", { error: err.message });
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


const getAuthToken = async (req, res) => {
  const { userId } = req.query;
  logger.info('Get Auth Token userId', userId);

  try {
    const token = await redisClient.get(`authToken:${userId}`);
    if (!token) {
      return res.status(401).json({ msg: "Token not found or expired" });
    }
    res.json({ token });
  } catch (err) {
    console.error("Error retrieving token from Redis", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Log out user
const logoutUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ msg: "No token provided" });
  }

  try {
    // Decode the JWT to get the user's ID
    const decoded = await jwtr.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await jwtr.destroy(token, process.env.JWT_SECRET);

    // Remove the token from Redis for the specific user
    await redisClient.del(`authToken:${userId}`);

    logger.info("User logged out successfully", { userId });

    res.status(200).json({ msg: "User logged out successfully" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Handle the case where the token has expired
      logger.error("Token has already expired", { token });
      return res.status(401).json({ msg: "Token has already expired" });
    }

    logger.error("Error during logout", { error: err.message });
    res.status(500).json({ msg: "Server error" });
  }
};

const addPaymentMethod = async (req, res) => {
  const { paymentMethodId, userId } = req.body;

  logger.info("Add payment method request received", {
    userId,
    paymentMethodId,
  });

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    logger.info("User Found", { user });

    // Check if the user has a Stripe Customer ID
    if (!user.stripeCustomerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });

      user.stripeCustomerId = customer.id;
      await user.save();
      logger.info("Stripe customer created", { customerId: customer.id });
    }

    // Attach the payment method to the Stripe Customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    logger.info("Payment method attached to customer", {
      customerId: user.stripeCustomerId,
      paymentMethodId,
    });

    // Set the payment method as the default for the customer
    if (user.paymentMethods.length === 0) {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      logger.info("Set as default payment method", {
        customerId: user.stripeCustomerId,
        paymentMethodId,
      });
    }

    // Add the payment method to the user's local database
    user.paymentMethods.push({
      id: paymentMethodId,
      isDefault: user.paymentMethods.length === 0,
    });

    await user.save();

    const dataToQueue = {
      type: "user_payment_method_added",
      userId: user._id,
      paymentMethods: user.paymentMethods,
      stripeCustomerId: user.stripeCustomerId,
    };

    await sendToQueue("payment_user_queue", dataToQueue);
    await sendToQueue("subscription_user_queue", dataToQueue);

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  const { paymentMethodId, userId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "User not found" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
       .status(404)
       .json({ success: false, message: "User not found" });
    }
    logger.info("User found", { user });

    // Ensure the payment method exists in the user's account
    const paymentMethodExists = user.paymentMethods.find(
      (method) => method.id == paymentMethodId
    );

    if (!paymentMethodExists) {
      return res
        .status(400)
        .json({ success: false, message: "Payment method not found" });
    }

    logger.info("Payment method found", { paymentMethodExists });

    if (paymentMethodExists && paymentMethodExists.isDefault) { 
      return res
       .status(400)
       .json({ success: false, message: "Payment method is already default" });
    }

    // Update the default payment method on Stripe
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    logger.info("Default payment method updated on Stripe", {
      customerId: user.stripeCustomerId,
      paymentMethodId,
    });

    // Update the default payment method in the local database
    user.paymentMethods.forEach((method) => {
      if (method.id === paymentMethodId) {
        method.isDefault = true;
      } else {
        method.isDefault = false;
      }
    });

    await user.save();

    const dataToQueue = {
      type: "user_payment_method_updated",
      userId: user._id,
      paymentMethods: user.paymentMethods,
      stripeCustomerId: user.stripeCustomerId,
    };

    await sendToQueue("payment_user_queue", dataToQueue);
    await sendToQueue("subscription_user_queue", dataToQueue);

    res.json({ success: true });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPaymentMethods = async (req, res) => {
  const userId = req.query.userId;

  logger.info("Get payment methods request received", { userId });
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "User not found" });
  }

  try {
    const user = await User.findById(userId).select("paymentMethods");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    logger.info("User found", { user });

    res.json(user.paymentMethods);
  } catch (error) {
    console.error("Error retrieving payment methods:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deletePaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.body;
  const userId = req.query.userId;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the payment method to be deleted is in the user's payment methods
    const paymentMethod = user.paymentMethods.find(
      (method) => method.id === paymentMethodId
    );

    if (!paymentMethod) {
      return res
        .status(404)
        .json({ success: false, message: "Payment method not found" });
    }

    // Ensure that the payment method to be deleted is not the default one
    if (paymentMethod.isDefault) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the default payment method. Please set another payment method as default first.",
      });
    }

    // Detach the payment method from Stripe Customer
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove the payment method from the user's paymentMethods array in the local database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { paymentMethods: { id: paymentMethodId } } },
      { new: true } // Returns the updated user document
    );

    // Fetch the updated payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    // Update the user's payment methods in MongoDB
    const updatedUserWithStripeMethods = await User.findByIdAndUpdate(
      userId,
      { paymentMethods: paymentMethods.data },
      { new: true } // Returns the updated user document
    );

    const dataToQueue = {
      type: "user_payment_method_updated",
      userId: updatedUserWithStripeMethods._id,
      paymentMethods: updatedUserWithStripeMethods.paymentMethods,
      stripeCustomerId: updatedUserWithStripeMethods.stripeCustomerId,
    };

    await sendToQueue("payment_user_queue", dataToQueue);
    await sendToQueue("subscription_user_queue", dataToQueue);

    res.json({
      success: true,
      message: "Payment method deleted successfully",
      paymentMethods: updatedUserWithStripeMethods.paymentMethods,
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getStripePublishableKey = (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};


module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getUserProfile,
  logoutUser,
  addPaymentMethod,
  setDefaultPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  getStripePublishableKey,
  getAuthToken
};
