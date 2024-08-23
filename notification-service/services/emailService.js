// services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger"); 
require("dotenv").config();

const sendEmail = async (to, subject, text) => {
  logger.info("Sending email", { to, subject, text });
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: `"Subscription Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    logger.info("Email sent successfully", { to, subject, text, messageId: info.messageId });
  } catch (err) {
    console.error("Error sending email: ", err);
  }
};

module.exports = sendEmail;
