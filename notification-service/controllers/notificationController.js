const Notification = require("../models/notificationModel");
const sendEmail = require("../services/emailService");
const logger = require("../utils/logger");
const moment = require("moment-timezone");

const sendMailNotification = async (data) => {
  let subject = "";
  let message = "";
  let email = data.email;
  let userId = data.userId;
  let name = data.name;

  logger.info("Received notification data:", data);
  
  // Local Date and Time
  switch (data.type) {
    case "subscription_created":
      subject = `New Subscription Created - Amount: ${data.amount}`;
      message = `Hello ${name},\n\nA new subscription has been created with an amount of ${data.amount}.\n\nPlease check the platform for more details.\n\nThank you.`;
      break;
    case "payment_created":
      subject = `New Payment Received - Amount: ${data.amount}`;
      message = `Hello ${name},\n\nA new payment has been received with an amount of ${data.amount}.\n\nPlease check the platform for more details.\n\nThank you.`;
      break;
    case "payment_extended":
      subject = `EMI Extension - Amount: ${data.amount}`;
      message = `Hello ${name},\n\nYour EMI extension for the subscription with ID ${
        data.subscriptionId
      } has been processed successfully.\n\nThe payment was originally due on ${moment(
        data.dueDate.ist
      ).format("YYYY-MM-DD")}, and it has now been extended to ${moment(
        data.extendedDueDate.ist
      ).format("YYYY-MM-DD")}. The extension amount is ${
        data.amount
      }\n\nPlease check the platform for more details.\n\nThank you.`;
      break;
    case "payment_reminder":
      subject = `Payment Reminder - Amount: ${data.amount}`;
      message = `Hello ${name},\n\nYour payment with ID ${data.paymentId} is due on ${moment(
        data.dueDate.ist
      ).format(
        "YYYY-MM-DD"
      )}.\n\nPlease check the platform for more details.\n\nThank you.`;
      break;
    default:
      logger.error("Invalid notification type", { data });
      return;
  }

  // Send email if subject and message are set
  if (subject && message) {
    await sendEmail(email, subject, message);
    logger.info("Email sent successfully", { email, subject });

    // Save notification to database
    const notification = new Notification({
      userId,
      email,
      subject,
      message,
      type: data.type
    });

    await notification.save();
    logger.info("Notification saved successfully", { notification });
  } else {
    logger.error("Email not sent due to missing subject or message", { data });
  }
};

module.exports = sendMailNotification;
