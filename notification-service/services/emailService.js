// services/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, text) => {
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

    // let transporter = nodemailer.createTransport({
    //   service: "hotmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

    let info = await transporter.sendMail({
      from: `"Subscription Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log("Email sent: %s", info.messageId);
  } catch (err) {
    console.error("Error sending email: ", err);
  }
};

module.exports = sendEmail;
