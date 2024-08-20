// utils/rabbitmq.js
const amqp = require("amqplib");
const logger = require("./logger"); // Path to your logger utility
require("dotenv").config();

// const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const RABBITMQ_URL = "amqp://localhost:5672";

const MAX_RETRIES = 10;
const RETRY_INTERVAL = 5000; // in milliseconds

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectRabbitMQ = async (retries = MAX_RETRIES) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    if (retries === 0) {
      console.error("Failed to connect to RabbitMQ:", error);
      process.exit(1);
    } else {
      console.error(
        `Retrying connection to RabbitMQ (${
          MAX_RETRIES - retries + 1
        }/${MAX_RETRIES})...`
      );
      await sleep(RETRY_INTERVAL);
      return connectRabbitMQ(retries - 1);
    }
  }
};


const sendToQueue = async (queue, message) => {
  const channel = await connectRabbitMQ();
  channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
  logger.info("Message sent to queue", { queue, message });
};

const consumeMessages = async (queue, callback) => {
  const channel = await connectRabbitMQ();
  channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      await callback(JSON.parse(msg.content.toString()));
      logger.info("Message acknowledged", {
        messageId: msg.properties.messageId,
      });
      channel.ack(msg);
    }
  });
};

module.exports = {
  sendToQueue,
  consumeMessages,
};
