// utils/logger.js
const moment = require("moment-timezone");

const logger = {
  info: (message, meta) => {
    const timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    console.log(`INFO [${timestamp} IST]: ${message}`, meta || "");
  },
  error: (message, meta) => {
    const timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    console.error(`ERROR [${timestamp} IST]: ${message}`, meta || "");
  },
};

module.exports = logger;
