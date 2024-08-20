// controllers/paymentController.js
const cron = require("node-cron");
const { sendToQueue } = require("../utils/rabbitmq");
const Payment = require("../models/paymentModel"); // Assuming you have a Payment model
const moment = require("moment-timezone");
const PaymentUser = require("../models/paymentUserModel");

const schedulePaymentReminders = async () => {
  cron.schedule("30 5 * * *", async () => {
    console.log("Checking for scheduled payments...");

    // Get the current date in IST
    const todayIST = moment()
      .tz("Asia/Kolkata")
      .startOf("day")
      .add({ hours: 5, minutes: 30 });

    // Calculate tomorrow's and the day after tomorrow's date in IST
    const tomorrowIST = moment(todayIST).add(1, "days");
    const dayAfterTomorrowIST = moment(todayIST).add(2, "days");

    // Filter to find payments due the day after tomorrow
    const filter = {
      "dueDate.ist": {
        $gte: tomorrowIST.toDate(),
        $lt: dayAfterTomorrowIST.toDate(),
      },
      status: "pending",
    };
    console.log(filter);

    // Find payments due the day after tomorrow
    const paymentsDueTomorrow = await Payment.find(filter);

    if (paymentsDueTomorrow.length > 0) {
      paymentsDueTomorrow.forEach(async (payment) => {
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
          message: `Your payment of amount ${payment.amount} will be debited tomorrow. Please maintain sufficient balance.`,
        };
        await sendToQueue("notification_queue", reminderDataToQueue);
        console.log(`Reminder sent for payment ID: ${payment._id}`);
      });
    } else {
      console.log("No payments due tomorrow.");
    }
  });
};


module.exports = {
  schedulePaymentReminders,
};
