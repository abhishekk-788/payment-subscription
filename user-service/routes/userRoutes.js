// routes/userRoutes.js
const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  addPaymentMethod,
  setDefaultPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  getStripePublishableKey,
  getAuthToken,
  forgotPassword,
  verifyOtp,
  resetPassword,  
} = require("../controllers/userController");

const auth = require("../middleware/auth");

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Forgot Password route
router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);

// Get user profile
router.get("/profile", auth, getUserProfile);

// Logout route
router.post("/logout", logoutUser);

// get auth token
router.get("/get-auth-token", getAuthToken);

// Get Stripe publishable key
router.get("/get-stripe-key", getStripePublishableKey);

// Payment Methods
router.post("/add-payment-method", auth, addPaymentMethod);

router.post("/set-default-payment-method", auth, setDefaultPaymentMethod);

router.get("/payment-methods", auth, getPaymentMethods);

router.delete("/payment-methods", auth, deletePaymentMethod);

module.exports = router;
