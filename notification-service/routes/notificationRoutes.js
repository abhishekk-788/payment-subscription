// routes/notificationRoutes.js
const express = require("express");
const { sendNotification } = require("../controllers/notificationController");

const router = express.Router();

// Send a notification
router.post("/send", sendNotification);

module.exports = router;
