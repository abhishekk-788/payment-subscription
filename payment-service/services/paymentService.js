const Payment = require("../models/paymentModel");
const PaymentUser = require("../models/paymentUserModel");
const sendToQueue = require("../utils/rabbitmq").sendToQueue;
const logger = require("../utils/logger");
const moment = require("moment-timezone");
const cron = require("node-cron");
const { executePaymentStripe, executePaymentStripeMock } = require("./stripeService");

const createPaymentFromSubscriptionQueue = async (
  payment,
  subscriptionPaymentId
) => {
  const {
    userId,
    subscriptionId,
    amount,
    priority,
    paymentMethodId,
    paymentType,
  } = payment;

  const dueDate = payment.dueDate;

  try {
    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) {
      logger.error({ msg: "User not found" });
      return;
    }

    const newPayment = new Payment({
      userId,
      subscriptionId,
      subscriptionPaymentId,
      amount,
      paymentType,
      paymentMethodId: paymentMethodId,
      dueDate: {
        utc: dueDate.utc,
        ist: dueDate.ist,
      },
      priority,
    });

    await newPayment.save();

    logger.info({
      message: "Payment has been scheduled",
      newPayment,
    });
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const processPayments = async () => {
  cron.schedule(
    "30 2 * * *", // 8 AM IST
    async () => {
      console.log("Processing payments scheduled for today...");

      const todayIST = moment()
        .tz("Asia/Kolkata")
        .startOf("day")
        .add({ hours: 5, minutes: 30 });

      const tomorrowIST = moment(todayIST).add(1, "days");

      const filter = {
        "dueDate.ist": {
          $gte: todayIST.toDate(),
          $lt: tomorrowIST.toDate(),
        },
        status: "pending",
      };

      const paymentsDueToday = await Payment.find(filter);

      if (paymentsDueToday.length > 0) {
        for (const payment of paymentsDueToday) {
          try {
            const paymentUser = await PaymentUser.findOne({
              userId: payment.userId,
            });

            const paymentStatus = await executePaymentStripe(
              payment.paymentMethodId,
              payment.amount
            );
            if (paymentStatus.status === "succeeded") {
              payment.status = "succeeded";
              await payment.save();

              const notificationData = {
                type: "payment_success",
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
              await sendToQueue("notification_queue", notificationData);
              console.log(`Payment succeeded for payment ID: ${payment._id}`);
            } else {
              payment.status = "failed";
              await payment.save();
              const notificationData = {
                type: "payment_failure",
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
              await sendToQueue("notification_queue", notificationData);
              console.log(`Payment failed for payment ID: ${payment._id}`);
            }
          } catch (error) {
            console.error(
              `Failed to process payment ID: ${payment._id} - ${error.message}`
            );

            payment.status = "failed";
            await payment.save();

            const paymentUser = await PaymentUser.findOne({
              userId: payment.userId,
            });

            const notificationData = {
              type: "payment_failure",
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
            await sendToQueue("notification_queue", notificationData);
            console.log(
              `Payment failure notification sent for payment ID: ${payment._id}`
            );
          }
        }
      } else {
        console.log("No payments scheduled for today.");
      }
    }
  );
};

const processOneTimePayment = async (subscriptionPaymentId) => {
  logger.info(
    `Processing one-time payment for subscription payment ID: ${subscriptionPaymentId}`
  );

  const payment = await Payment.findOne({
    subscriptionPaymentId: subscriptionPaymentId,
  });
  const { userId, amount, paymentMethodId } = payment;

  try {
    const paymentUser = await PaymentUser.findOne({ userId: userId });
    if (!paymentUser) {
      logger.error("User not found");
      return;
    }

    payment.status = "processing";
    await payment.save();

    logger.info("Payment processing started...");

    const paymentStatus = await executePaymentStripe(
      paymentMethodId,
      amount,
      paymentUser.stripeCustomerId
    );
    
    logger.info("Payment processing completed...", paymentStatus);

    if (paymentStatus.status === "success") {
      payment.status = "paid";
      await payment.save();

      const dataToQueue = {
        type: "payment_success",
        userId: paymentUser._id,
        subscriptionId: payment.subscriptionId,
        subscriptionPaymentId: subscriptionPaymentId,
        name: paymentUser.name,
        email: paymentUser.email,
        paymentId: payment._id,
        amount: payment.amount,
        status: "paid",
        error: paymentStatus?.error ?? "",
      };
      await sendToQueue("notification_queue", dataToQueue);
      await sendToQueue("update_subscription_queue", dataToQueue);

      console.log(`Payment succeeded for payment ID: ${payment._id}`);
    } else {
      payment.status = "failed";
      payment.error = paymentStatus?.error ?? "",
      
      await payment.save();

      const dataToQueue = {
        type: "payment_failed",
        userId: paymentUser._id,
        subscriptionId: payment.subscriptionId,
        subscriptionPaymentId: subscriptionPaymentId,
        name: paymentUser.name,
        email: paymentUser.email,
        paymentId: payment._id,
        amount: payment.amount,
        status: "failed",
        error: paymentStatus?.error ?? "",
      };
      
      await sendToQueue("notification_queue", dataToQueue);
      await sendToQueue("update_subscription_queue", dataToQueue);
      
      console.log(`Payment failed for payment ID: ${payment._id}`);
    }
  } catch (error) {
    console.error(
      `Failed to process payment ID: ${payment._id} - ${error.message}`
    );
    payment.status = "failed";
    await payment.save();

    const paymentUser = await PaymentUser.findOne({ userId: userId });
    
    const dataToQueue = {
      type: "payment_failed",
      userId: paymentUser._id,
      subscriptionId: payment.subscriptionId,
      subscriptionPaymentId: subscriptionPaymentId,
      name: paymentUser.name,
      email: paymentUser.email,
      paymentId: payment._id,
      amount: payment.amount,
      status: "failed",
      error: paymentStatus?.error?.message ?? "",
    };

    await sendToQueue("notification_queue", dataToQueue);
    await sendToQueue("update_subscription_queue", dataToQueue);

    console.log(
      `Payment failure notification sent for payment ID: ${payment._id}`
    );
  }
};

module.exports = {
  createPaymentFromSubscriptionQueue,
  processPayments,
  processOneTimePayment,
};
