// routes/notificationRoutes.js
const express = require("express");
const { sendNotification } = require("../controllers/notificationController");

const router = express.Router();

const notificationRoutes = (channel) => {
  // Send a notification
    router.post("/send", sendNotification(channel));
    return router;
};

module.exports = notificationRoutes;
