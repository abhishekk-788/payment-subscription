// middleware/auth.js
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
require("dotenv").config();

const auth = (req, res, next) => {
  const token = req.header("Authorization");
  logger.info("Authorization request received");

  if (!token) {
    logger.info("No token provided, authorization denied");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info("Token verified successfully", { userId: decoded.id });
    next();
  } catch (err) {
    logger.error("Token validation failed", { error: err.message });
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
