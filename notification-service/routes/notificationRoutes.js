// routes/notificationRoutes.js
const express = require("express");
const { sendNotification } = require("../controllers/notificationController");

const router = express.Router();

const notificationRoutes = async () => {
  // Send a notification
  router.post("/send", () => {
    sendNotification();
  });
  return router;
};

module.exports = notificationRoutes;
