// utils/rabbitmq.js
const amqp = require("amqplib");
require("dotenv").config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:15672";

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    process.exit(1);
  }
};

const consumeMessages = async (queue, callback) => {
  const channel = await connectRabbitMQ();
  channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      await callback(JSON.parse(msg.content.toString()));
      channel.ack(msg);
      logger.info("Message acknowledged", {
        messageId: msg.properties.messageId,
      });
    }
  });
};

module.exports = consumeMessages;
