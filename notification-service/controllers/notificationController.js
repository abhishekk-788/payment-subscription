// controllers/notificationController.js
const Notification = require("../models/notificationModel");
const sendEmail = require("../services/emailService");

// Send a notification
const sendNotification = async (req, res) => {
  const { userId, email, subject, message } = req.body;

  try {
    await sendEmail(email, subject, message);

    const notification = new Notification({
      userId,
      email,
      subject,
      message,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  sendNotification,
};
