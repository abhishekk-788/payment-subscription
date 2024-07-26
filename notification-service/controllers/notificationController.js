const Notification = require("../models/notificationModel");
const sendEmail = require("../services/emailService");
const logger = require("../utils/logger"); // Path to your logger utility

// controllers/notificationController.js
const sendMailNotification = async (paymentData) => {
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

  await sendEmail(paymentData.email, subject, message);
  logger.info("Email sent successfully", paymentData.email, subject );

  const notification = new Notification({
    userId: paymentData.userId,
    email: paymentData.email,
    subject: subject,
    message: message,
  });

  await notification.save();
  logger.info("Notification saved successfully", {
    notification: notification,
  });
};

module.exports = sendMailNotification;
