// controllers/notificationController.js
const Notification = require("../models/notificationModel");
const sendEmail = require("../services/emailService");

// Send a notification
const sendNotification = async (channel) => async (req, res) => {
  const { userId, email, subject, message } = req.body;

  channel.assertQueue("payment_queue", { durable: true });

  // Consume messages from the queue
  channel.consume("payment_queue", async (msg) => {
    if (msg !== null) {
      
      const paymentData = JSON.parse(msg.content.toString());
      console.log("Received payment data:", paymentData);

      await sendEmail(email, subject, message);

      const notification = new Notification({
        userId,
        email,
        subject,
        message,
      });

      await notification.save();

      channel.ack(msg);
      
      res.status(201).json(notification);
    }
  });
};

module.exports = {
  sendNotification,
};
