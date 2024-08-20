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
} = require("../controllers/userController");

const auth = require("../middleware/auth");

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Get user profile
router.get("/profile", auth, getUserProfile);

// Logout route
router.post("/logout", logoutUser);

router.get("/get-auth-token", getAuthToken);

// Get Stripe publishable key
router.get("/get-stripe-key", getStripePublishableKey);

// Payment Methods
router.post("/add-payment-method", auth, addPaymentMethod);

router.post("/set-default-payment-method", auth, setDefaultPaymentMethod);

router.get("/payment-methods", auth, getPaymentMethods);

router.delete("/payment-methods/:id", auth, deletePaymentMethod);

module.exports = router;
