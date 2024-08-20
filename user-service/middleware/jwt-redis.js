const redis = require("redis");
const JWTR = require("jwt-redis").default;
const jwt = require("jsonwebtoken");

// Create and connect the Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient
  .connect()
  .catch((err) => console.error("Redis connection error", err));

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const jwtr = new JWTR(redisClient);

module.exports = { redisClient, jwtr };
