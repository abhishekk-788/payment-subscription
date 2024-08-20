// middleware/auth.js
const jwt = require("jsonwebtoken");
const { jwtr } = require("../middleware/jwt-redis");
const logger = require("../utils/logger");
require("dotenv").config();

// Middleware to authenticate incoming requests
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    logger.info("No token provided, authorization denied");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Attempt to verify the token; if it's invalid or destroyed, this will fail
    const decoded = await jwtr.verify(token, process.env.JWT_SECRET);
    logger.info("Token decoded successfully");
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      logger.info("Token expired", { error: err.message });
      return res
        .status(401)
        .json({ msg: "Token expired. Please login to continue." });
    } else if (
      err.message === "jwt destroyed" ||
      err.message.includes("destroyed")
    ) {
      logger.info("Token has been revoked or destroyed", {
        error: err.message,
      });
      return res
        .status(401)
        .json({ msg: "Token has been revoked. Please login again." });
    } else {
      logger.error("Token validation failed", { error: err.message });
      return res.status(401).json({ msg: "Token is not valid" });
    }
  }
};

module.exports = auth;
