// controllers/paymentController.js
const cron = require("node-cron");
const { sendToQueue } = require("../utils/rabbitmq");
const Payment = require("../models/paymentModel"); // Assuming you have a Payment model
const moment = require("moment-timezone");
const PaymentUser = require("../models/paymentUserModel");

const schedulePaymentReminders = async () => {
  cron.schedule('0 */2 * * *', async () => {
    console.log("Check for scheduled payments...");
    const todayIST = moment()
      .tz("Asia/Kolkata")
      .startOf("day")
      .add({ hours: 5, minutes: 30 });

    const tomorrowIST = moment(todayIST).add(1, "days");

    // Local Date and Time
    const filter = {
      "dueDate.ist": {
        $gte: todayIST.toDate(),
        $lt: tomorrowIST.toDate(),
      },
      status: "pending",
    };
    console.log(filter);

    const paymentsDueToday = await Payment.find(filter);

    if (paymentsDueToday.length > 0) {
      paymentsDueToday.forEach(async (payment) => {
        const paymentUser = await PaymentUser.findOne({
          userId: payment.userId,
        });
        const reminderDataToQueue = {
          type: "payment_reminder",
          userId: paymentUser._id,
          subscriptionId: payment.subscriptionId,
          name: paymentUser.name,
          email: paymentUser.email,
          paymentId: payment._id,
          amount: payment.amount,
          dueDate: {
            utc: payment.dueDate.utc,
            ist: payment.dueDate.ist,
          },
        };
        await sendToQueue("notification_queue", reminderDataToQueue);
        console.log(`Reminder sent for payment ID: ${payment._id}`);
      });
    } else {
      console.log("No payments due today.");
    }
  });
};

module.exports = {
  schedulePaymentReminders,
};
