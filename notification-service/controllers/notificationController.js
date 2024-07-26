const Notification = require("../models/notificationModel");
const sendEmail = require("../services/emailService");
const logger = require("../utils/logger"); // Path to your logger utility

// controllers/notificationController.js
const sendMailNotification = async (paymentData) => {
  const paymentData = JSON.parse(msg.content.toString());
  console.log("Received payment data: ", paymentData);

  let subject = "";
  let message = "";

  if (paymentData.type === "payment_created") {
    subject = `New Payment Received - Amount: ${paymentData.amount}`;
    message = `Hello ${paymentData.name},\n\nA new payment has been received with an amount of ${paymentData.amount}.\n\nPlease check the platform for more details.\n\nThank you.`;
  } else if (paymentData.type === "payment_extended") {
    subject = `EMI Extension - Amount: ${paymentData.amount}`;
    message = `Hello ${
      paymentData.name
    },\n\nYour EMI extension for the payment with ID ${
      paymentData.paymentId
    } has been processed.\n\nThe new due date is ${moment(
      paymentData.extendedDate
    ).format(
      "YYYY-MM-DD"
    )}.\n\nPlease check the platform for more details.\n\nThank you.`;
  }

  if (subject == "" || message == "") {
    logger.error("Invalid notification type", { payment: paymentData });
    return;
  }

  try {
    await sendEmail(paymentData.email, subject, message);
    logger.info("Email sent successfully", { email, subject });

    channel.ack(msg);
  } catch (error) {
    logger.error("Error sending email", { error: error.message });
    channel.nack(msg);
  }

  const notification = new Notification({
    userId,
    email,
    subject,
    message,
  });

  await notification.save();
  logger.info("Notification saved successfully", {
    notificationId: notification._id,
  });
};

// Send a notification
const sendNotification = async (req, res) => {
  const { userId, email, subject, message } = req.body;

  logger.info("Send notification request received", {
    userId,
    email,
    subject,
    message,
  });

  try {
    channel.assertQueue("payment_queue", { durable: true });
    logger.info("Queue asserted", { queue: "payment_queue" });

    // Consume messages from the queue
    channel.consume("payment_queue", async (msg) => {
      if (msg !== null) {
        const paymentData = JSON.parse(msg.content.toString());
        logger.info("Received payment data", { paymentData });

        try {
          await sendEmail(email, subject, message);
          logger.info("Email sent successfully", { email, subject });

          const notification = new Notification({
            userId,
            email,
            subject,
            message,
          });

          await notification.save();
          logger.info("Notification saved successfully", {
            notificationId: notification._id,
          });

          channel.ack(msg);
          logger.info("Message acknowledged", {
            messageId: msg.properties.messageId,
          });

          res.status(201).json(notification);
        } catch (error) {
          logger.error("Error processing message", { error: error.message });
          channel.nack(msg); // Optionally requeue the message
          res.status(500).send("Server error");
        }
      }
    });
  } catch (error) {
    logger.error("Error setting up notification", { error: error.message });
    res.status(500).send("Server error");
  }
};

module.exports = sendMailNotification;
